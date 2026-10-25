from copy import deepcopy
import json
import httpx
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import mission_agent as agent
from app.models import HabitatRequest, OptimizationRequest


def request():
    return agent.AgentRequest(goal="Find the lightest design for six crew with no ending wastewater backlog.",
        baseline=OptimizationRequest(scenario=HabitatRequest(generation_kw=12,water_kg=400),
            oxygen_equipment_id="static_feed_electrolyzer_1978",water_equipment_id="vcds_1979_reference",
            max_oxygen_units=2,max_water_units=2))


def call(name="optimize_habitat",args=None):
    return {"role":"model","parts":[{"functionCall":{"id":"call1","name":name,"args":args or {}},"thoughtSignature":"opaque-signature"}]}


def answer(text="The calculated design completes the resource checks."):
    return {"role":"model","parts":[{"text":text}]}


@pytest.fixture(autouse=True)
def key(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","private-secret")
    monkeypatch.delenv("GEMINI_MODEL",raising=False)


def sequence(monkeypatch,steps):
    seen=[]
    def fake(contents,key,model,remaining,enabled):
        seen.append(deepcopy(contents))
        assert model=="gemini-3.8-flash"
        return steps.pop(0)
    monkeypatch.setattr(agent,"model_turn",fake)
    return seen


def test_real_optimizer_runs_from_tool_and_preserves_baseline(monkeypatch):
    req=request();before=req.model_dump()
    seen=sequence(monkeypatch,[call(args={"scenario_changes":{"crew_size":6},"search_changes":{"require_no_wastewater_backlog":True}}),answer()])
    result=agent.run_agent(req)
    assert req.model_dump()==before
    assert result["status"]=="completed"
    assert result["comparison"]["candidate_count"]==9
    assert result["proposed_scenario"]["crew_size"]==6
    assert result["proposed_scenario"]["generation_kw"]==12
    assert result["proposed_search"]["require_no_wastewater_backlog"]
    assert result["audit"][0]["status"]=="evaluated"
    assert seen[1][1]["parts"][0]["thoughtSignature"]=="opaque-signature"
    reply=seen[1][2]["parts"][0]["functionResponse"]
    assert reply["id"]=="call1"
    assert reply["response"]["optimized"]["evidence"]
    assert "private-secret" not in json.dumps(result)


def test_simulation_tool_and_every_patch_relative_to_original(monkeypatch):
    sequence(monkeypatch,[call("simulate_habitat",{"scenario_changes":{"crew_size":6}}),
        call("simulate_habitat",{"scenario_changes":{"duration_days":1}}),answer()])
    result=agent.run_agent(request())
    assert result["audit"][0]["inputs"]["scenario"]["crew_size"]==6
    assert result["simulation"]["request"]["crew_size"]==4
    assert result["simulation"]["request"]["duration_days"]==1


def test_later_infeasible_search_removes_earlier_proposal(monkeypatch):
    sequence(monkeypatch,[call(),call(args={"scenario_changes":{"generation_kw":0,"battery_kwh":0}}),answer()])
    result=agent.run_agent(request())
    assert result["proposed_scenario"] is None
    assert result["comparison"]["status"]=="no_feasible_candidate"


@pytest.mark.parametrize("name,args",[
    ("run_shell",{}),
    ("optimize_habitat",{"scenario_changes":{"crew_size":99}}),
    ("optimize_habitat",{"scenario_changes":{"generation_kw":float("inf")}}),
    ("optimize_habitat",{"scenario_changes":{"fake":1}}),
    ("optimize_habitat",{"search_changes":{"max_water_units":9}}),
    ("optimize_habitat",{"search_changes":{"scenario":{}}}),
    ("optimize_habitat",{"search_changes":{"oxygen_equipment_id":"unknown"}}),
    ("optimize_habitat",{"search_changes":{"water_equipment_id":"static_feed_electrolyzer_1978"}}),
    ("optimize_habitat",{"injected":"private-secret"}),
])
def test_invalid_tool_calls_are_rejected_and_redacted(monkeypatch,name,args):
    sequence(monkeypatch,[call(name,args),answer("Please clarify the goal.")])
    result=agent.run_agent(request())
    assert result["audit"][0]["status"]=="rejected"
    assert result["proposed_scenario"] is None
    assert "private-secret" not in json.dumps(result)


def test_too_many_parallel_tools_execute_none(monkeypatch):
    content=call();content["parts"]*=4
    sequence(monkeypatch,[content])
    result=agent.run_agent(request())
    assert result["status"]=="limited"
    assert not result["audit"]


def test_three_tool_limit_and_final_disabled_turn(monkeypatch):
    enabled=[]
    def fake(contents,key,model,remaining,tools):
        enabled.append(tools)
        return call("simulate_habitat",{"scenario_changes":{"duration_days":1}})
    monkeypatch.setattr(agent,"model_turn",fake)
    result=agent.run_agent(request())
    assert enabled==[True,True,True,False]
    assert len(result["audit"])==3
    assert result["status"]=="limited"


def test_no_key_does_not_claim_to_interpret_goal(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY")
    monkeypatch.setattr(agent,"model_turn",lambda *args: pytest.fail("No external call"))
    result=agent.run_agent(request())
    assert result["status"]=="unavailable"
    assert not result["audit"]
    assert result["proposed_scenario"] is None


def test_no_tool_reply_is_clarification_not_calculated_design(monkeypatch):
    sequence(monkeypatch,[answer("What generation capacity should I use?")])
    result=agent.run_agent(request())
    assert result["status"]=="needs_clarification"
    assert result["proposed_scenario"] is None


def test_late_provider_error_keeps_tool_evidence(monkeypatch):
    attempts=0
    def fake(*args):
        nonlocal attempts
        attempts+=1
        if attempts==1:return call()
        raise httpx.ReadTimeout("private-secret")
    monkeypatch.setattr(agent,"model_turn",fake)
    result=agent.run_agent(request())
    assert result["status"]=="partial"
    assert result["comparison"]
    assert "private-secret" not in json.dumps(result)


def test_no_backlog_constraint_applies_to_simulation_proposal(monkeypatch):
    req=request();req.baseline.require_no_wastewater_backlog=True
    sequence(monkeypatch,[call("simulate_habitat",{"scenario_changes":{"duration_days":1,
        "water_equipment_id":"vcds_1979_reference","water_equipment_quantity":0}}),answer()])
    result=agent.run_agent(req)
    assert result["simulation"]["resource_balance_complete"]
    assert result["proposed_scenario"] is None


def test_transport_only_google_and_preserves_tool_declarations(monkeypatch):
    captured={}
    def transport(req):
        captured["req"]=req
        return httpx.Response(200,json={"candidates":[{"finishReason":"STOP","content":answer()}]})
    real=httpx.Client
    monkeypatch.setattr(agent.httpx,"Client",lambda **kwargs:real(transport=httpx.MockTransport(transport),**kwargs))
    agent.model_turn([{"role":"user","parts":[{"text":"test"}]}],"private-secret","gemini-3.8-flash",10)
    req=captured["req"]
    assert req.url.host=="generativelanguage.googleapis.com"
    assert req.headers["x-goog-api-key"]=="private-secret"
    assert "private-secret" not in str(req.url)
    tools=json.loads(req.content)["tools"][0]["functionDeclarations"]
    assert {t["name"] for t in tools}=={"simulate_habitat","optimize_habitat","improve_habitat"}


def test_endpoint_validates_goal_and_forbids_supplied_results(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY")
    client=TestClient(app)
    body=request().model_dump()
    assert client.post("/agent",json=body).json()["status"]=="unavailable"
    body["result"]={"feasible":True}
    assert client.post("/agent",json=body).status_code==422
    body.pop("result");body["goal"]="x"*1501
    assert client.post("/agent",json=body).status_code==422


def test_agent_can_request_verified_repairs_when_enabled(monkeypatch):
    req=request()
    req.goal="Find a working design; allow more power and starting water."
    req.allow_resource_adjustments=True
    req.baseline.scenario=HabitatRequest(crew_size=7)
    before=req.model_dump()
    seen=sequence(monkeypatch,[call("improve_habitat"),answer("More power and water let the verified design finish.")])
    result=agent.run_agent(req)
    assert req.model_dump()==before
    assert result["comparison"]["optimized"]["evaluated_hours"]==720
    assert result["proposed_scenario"]["water_kg"]>300
    assert result["proposed_scenario"]["generation_kw"]>8
    assert seen[1][2]["parts"][0]["functionResponse"]["response"]["resource_comparison"]


def test_agent_repair_tool_cannot_bypass_disabled_adjustments(monkeypatch):
    sequence(monkeypatch,[call("improve_habitat"),answer("Adjustments were not enabled.")])
    result=agent.run_agent(request())
    assert result["proposed_scenario"] is None
    assert result["audit"][0]["status"]=="rejected"


@pytest.mark.parametrize("planet", ["mars", "venus", "titan"])
def test_agent_constraint_proposal_matches_request_and_runs_again(monkeypatch, planet):
    patch = dict(environment_id=planet, generation_kw=30,
        thermal_capacity_enabled=True, heating_capacity_kw=10, cooling_capacity_kw=20,
        atmosphere_enabled=True, cabin_pressure_kpa=101.325, cabin_oxygen_percent=20.9,
        co2_enabled=True, co2_equipment_quantity=2, habitat_volume_m3=150, initial_co2_mmhg=0.5)
    sequence(monkeypatch, [call("simulate_habitat", {"scenario_changes":patch}), answer()])
    response = TestClient(app).post('/agent', json=request().model_dump())
    assert response.status_code == 200
    data = response.json()
    assert data['proposed_scenario'] is not None
    assert data['simulation']['request'] == data['proposed_scenario']
    for key, value in patch.items():
        assert data['proposed_scenario'][key] == value
    rerun = TestClient(app).post('/simulate', json=data['proposed_scenario'])
    assert rerun.status_code == 200
    assert rerun.json()['resource_balance_complete']
    assert rerun.json()['evaluated_hours'] == 720
