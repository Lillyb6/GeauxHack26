import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine import simulate
from app.models import HabitatRequest, OptimizationRequest
from app.optimizer import optimize
from app.advisor import compact_run
from app.mission_agent import AgentRequest, resolve_inputs, tool_declarations

client = TestClient(app)


def test_disabled_screen_preserves_resource_balances():
    a = simulate(HabitatRequest(duration_days=1))
    b = simulate(HabitatRequest(duration_days=1, heating_capacity_kw=999, cooling_capacity_kw=999))
    assert a.readings == b.readings
    assert a.demand_kw == b.demand_kw == pytest.approx(8.073)
    assert a.readings[-1].battery_kwh == pytest.approx(98.252)
    assert a.thermal_summary["status"] == "not_evaluated"
    assert a.thermal_summary["capacity_sufficient"] is None
    assert "heating_capacity_kw" not in a.evidence
    assert any("capacity screening is disabled" in warning for warning in a.warnings)


def test_insufficient_capacity_stops_before_consumption():
    req = HabitatRequest(thermal_capacity_enabled=True, heating_capacity_kw=2, co2_enabled=True)
    r = simulate(req)
    assert not r.resource_balance_complete
    assert r.evaluated_hours == 0
    assert len(r.readings) == 1
    assert (r.readings[0].oxygen_kg, r.readings[0].water_kg, r.readings[0].battery_kwh) == (30, 300, 100)
    assert r.water_balance["recovered_water_kg"] == 0
    assert r.co2_balance["generated_kg"] == 0
    assert r.thermal_summary["margin_kw"] == pytest.approx(-1.2)
    assert r.events[0].resource == "thermal"
    assert "target indoor temperature" in r.events[0].message


@pytest.mark.parametrize("capacity", [3.2, 4])
def test_sufficient_and_exact_capacity_complete(capacity):
    r = simulate(HabitatRequest(duration_days=1, thermal_capacity_enabled=True, heating_capacity_kw=capacity))
    assert r.resource_balance_complete
    assert r.thermal_summary["status"] == "sufficient"
    assert r.thermal_summary["required_thermal_kw"] == pytest.approx(3.2)


def test_cop_changes_electricity_and_battery_not_required_capacity():
    a = simulate(HabitatRequest(duration_days=1, thermal_capacity_enabled=True, heating_capacity_kw=4))
    b = simulate(HabitatRequest(duration_days=1, thermal_capacity_enabled=True, heating_capacity_kw=4, hvac_cop=2, generation_kw=0, battery_kwh=1000))
    assert a.thermal_summary["required_thermal_kw"] == b.thermal_summary["required_thermal_kw"]
    assert b.thermal_summary["required_electric_kw"] == pytest.approx(1.6)
    assert b.thermal_load_kw == pytest.approx(1.6)
    assert b.readings[-1].battery_kwh == pytest.approx(1000 - (3.2 + .527 + 4*6.875/24 + 1.6)*24)


@pytest.mark.parametrize("environment,mode,required", [("mars","heating",3.2),("venus","cooling",17.72),("titan","heating",8.04)])
def test_environment_selects_correct_capacity(environment,mode,required):
    r = simulate(HabitatRequest(environment_id=environment, thermal_capacity_enabled=True, heating_capacity_kw=100, cooling_capacity_kw=0))
    assert r.thermal_summary["mode"] == mode
    assert r.thermal_summary["required_thermal_kw"] == pytest.approx(required)
    assert r.thermal_summary["capacity_sufficient"] == (mode == "heating")


@pytest.mark.parametrize("body", [{"heating_capacity_kw":-1},{"cooling_capacity_kw":-1},{"heating_capacity_kw":1001},{"cooling_capacity_kw":"NaN"}])
def test_api_rejects_invalid_capacity(body):
    assert client.post("/simulate",json=body).status_code == 422


def test_api_summary_provenance_and_defaults():
    defaults = client.get("/model-reference").json()
    assert defaults["version"] == "0.6.0"
    assert defaults["default_request"]["thermal_capacity_enabled"] is False
    response = client.post("/simulate",json={"thermal_capacity_enabled":True,"heating_capacity_kw":2})
    assert response.status_code == 200
    r = response.json()
    assert r["thermal_summary"]["status"] == "insufficient"
    assert r["evidence"]["heating_capacity_kw"]["source_ids"] == []
    assert r["evidence"]["heating_capacity_kw"]["classification"] == "unvalidated_design_input"
    assert "conduction" in r["sources"]
    assert "4.2.1" in r["sources"]["conduction"]["title"]


def test_optimizer_cannot_repair_fixed_insufficient_thermal_capacity():
    req = OptimizationRequest(scenario=HabitatRequest(duration_days=1, thermal_capacity_enabled=True, heating_capacity_kw=2),
        oxygen_equipment_id="static_feed_electrolyzer_1978", water_equipment_id="vcds_1979_reference",max_oxygen_units=1,max_water_units=1)
    r = optimize(req)
    assert r.optimized is None
    assert r.constraint_failure_counts["thermal"] == 4
    assert all(c.evaluated_hours == 0 for c in r.candidates)
    req.scenario.heating_capacity_kw = 4
    good = optimize(req)
    assert good.optimized is not None
    assert good.optimized.request.heating_capacity_kw == 4


def test_agent_schema_validation_and_compact_evidence_share_thermal_contract():
    baseline=OptimizationRequest(scenario=HabitatRequest(),oxygen_equipment_id="static_feed_electrolyzer_1978",water_equipment_id="vcds_1979_reference")
    request=AgentRequest(goal="Evaluate heating capacity",baseline=baseline)
    inputs=resolve_inputs(request.baseline,{"scenario_changes":{"thermal_capacity_enabled":True,"heating_capacity_kw":2}})
    summary=compact_run(simulate(inputs.scenario))
    assert summary["thermal_summary"]["status"] == "insufficient"
    assert summary["evaluated_hours"] == 0
    assert request.baseline.scenario.thermal_capacity_enabled is False
    schema=tool_declarations()[0]["parametersJsonSchema"]["properties"]["scenario_changes"]["properties"]
    assert "heating_capacity_kw" in schema
