import json
import httpx
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import OptimizationRequest, HabitatRequest
from app import advisor


def request():
    return OptimizationRequest(scenario=HabitatRequest(generation_kw=10),
        oxygen_equipment_id="static_feed_electrolyzer_1978", water_equipment_id="vcds_1979_reference",
        max_oxygen_units=2,max_water_units=2)


@pytest.fixture(autouse=True)
def no_live_calls(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY",raising=False)
    monkeypatch.delenv("GEMINI_MODEL",raising=False)


def test_unconfigured_fallback_is_honest(monkeypatch):
    monkeypatch.setattr(advisor,"generate_text",lambda *args: pytest.fail("No provider call expected"))
    result=advisor.explain(request())
    assert result["status"]=="unavailable"
    assert result["model"] is None
    assert "318" in result["advice"]["summary"]
    assert "unvalidated" in " ".join(result["limitations"])


def test_generated_advice_receives_computed_packet(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","test-secret")
    def fake(packet,key,model):
        assert key=="test-secret"
        assert packet["optimized_hardware_mass_kg"]==318
        assert packet["manual"]["request"]["crew_size"]==4
        assert "readings" not in packet["optimized"]
        assert packet["optimized"]["evidence"]
        return advisor.AdvisorText(summary="The smaller design completes the modeled checks.",tradeoffs=[],next_steps=[],source_ids=[])
    monkeypatch.setattr(advisor,"generate_text",fake)
    result=advisor.explain(request())
    assert result["status"]=="generated"
    assert result["search_request"]==request().model_dump()
    assert "test-secret" not in json.dumps(result)


@pytest.mark.parametrize("error",[httpx.ReadTimeout("secret"),httpx.ConnectError("secret"),ValueError("secret"),KeyError("secret")])
def test_provider_failures_are_redacted(monkeypatch,error):
    monkeypatch.setenv("GEMINI_API_KEY","secret")
    def fail(*args): raise error
    monkeypatch.setattr(advisor,"generate_text",fail)
    result=advisor.explain(request())
    assert result["status"]=="unavailable"
    assert "secret" not in json.dumps(result)
    assert result["advice"]["summary"]==result["computed_explanation"]


def test_no_feasible_design_has_no_invented_recommendation():
    req=request()
    req.scenario.generation_kw=0
    req.scenario.battery_kwh=0
    result=advisor.explain(req)
    assert "No eligible configuration" in result["advice"]["summary"]


def test_invalid_model_never_calls_provider(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","secret")
    monkeypatch.setenv("GEMINI_MODEL","../other?key=secret")
    monkeypatch.setattr(advisor,"generate_text",lambda *args: pytest.fail("No provider call expected"))
    assert advisor.explain(request())["status"]=="unavailable"


@pytest.mark.parametrize("response_kind",["valid","unknown_source","malformed","blocked","truncated"])
def test_provider_transport_and_response_validation(monkeypatch,response_kind):
    captured={}
    text={"summary":"Explanation", "tradeoffs":[], "next_steps":[], "source_ids":["made-up"] if response_kind=="unknown_source" else ["bvad"]}
    data={"candidates":[{"finishReason":"MAX_TOKENS" if response_kind=="truncated" else "STOP", "content":{"parts":[{"text":"bad json" if response_kind=="malformed" else json.dumps(text)}]}}]}
    if response_kind=="blocked": data={"promptFeedback":{"blockReason":"SAFETY"}}
    def transport(req):
        captured["request"]=req
        return httpx.Response(200,json=data)
    real_client=httpx.Client
    monkeypatch.setattr(advisor.httpx,"Client",lambda **kwargs: real_client(transport=httpx.MockTransport(transport),**kwargs))
    packet={"sources":{"bvad":{"title":"Reference"}}}
    if response_kind=="valid":
        assert advisor.generate_text(packet,"secret","gemini-2.5-flash").source_ids==["bvad"]
    else:
        with pytest.raises((ValueError,KeyError)):
            advisor.generate_text(packet,"secret","gemini-2.5-flash")
    req=captured["request"]
    assert req.headers["x-goog-api-key"]=="secret"
    assert "secret" not in str(req.url)
    assert json.loads(req.content)["generationConfig"]["responseMimeType"]=="application/json"


def test_endpoint_rejects_forged_outcomes():
    client=TestClient(app)
    body=request().model_dump()
    body["optimized"]={"mass":0}
    assert client.post("/explain",json=body).status_code==422
    body.pop("optimized")
    response=client.post("/explain",json=body)
    assert response.status_code==200
    assert response.json()["status"]=="unavailable"


@pytest.mark.parametrize("code",[400,401,403,404,429,503])
def test_safe_http_diagnostic(monkeypatch,code):
    monkeypatch.setenv("GEMINI_API_KEY","private-key")
    def fail(*args):
        response=httpx.Response(code,text="private-key provider body",request=httpx.Request("POST","https://example.com"))
        response.raise_for_status()
    monkeypatch.setattr(advisor,"generate_text",fail)
    result=advisor.explain(request())
    assert result["status"]=="unavailable"
    assert str(code) in result["message"]
    assert "private-key" not in json.dumps(result)


def test_explanation_compares_original_and_verified_resources():
    req=request()
    req.scenario=HabitatRequest(crew_size=7)
    result=advisor.explain(req,allow_improvement=True)
    rows={row["resource"]:row for row in result["resource_comparison"]}
    assert rows["Mission duration"]["manual"]=="318 / 720 hours"
    assert rows["Mission duration"]["optimized"]=="720 / 720 hours"
    assert rows["Starting water"]["manual"]=="300 kg"
    assert rows["Starting water"]["optimized"]!="300 kg"
    assert result["manual_stopping_events"][0]["resource"]=="oxygen"
    assert "why_manual_failed" in result["advice"]
