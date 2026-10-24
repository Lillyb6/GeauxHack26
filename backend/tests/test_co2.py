from math import isclose
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import HabitatRequest, OptimizationRequest
from app.engine import simulate
from app.optimizer import optimize
from app.co2 import advance_pressure,pressure_per_kg,CREW_CO2_KG_DAY,CO2_LIMIT_MMHG
from app import mission_agent


def scenario(**overrides):
    values=dict(co2_enabled=True,generation_kw=100,oxygen_kg=1000,water_kg=10000,
        duration_days=2,co2_equipment_quantity=2)
    values.update(overrides)
    return HabitatRequest(**values)


def search(s=None,**overrides):
    args=dict(scenario=s or scenario(),oxygen_equipment_id="static_feed_electrolyzer_1978",
        water_equipment_id="vcds_1979_reference",max_oxygen_units=0,max_water_units=0,max_co2_units=2)
    args.update(overrides)
    return OptimizationRequest(**args)


def test_no_scrubber_matches_ideal_gas_accumulation():
    alpha=pressure_per_kg(100,21)
    end,average,removed=advance_pressure(.4,4*CREW_CO2_KG_DAY/24,0,alpha)
    assert end==pytest.approx(.4+alpha*4*CREW_CO2_KG_DAY/24)
    assert average==pytest.approx((.4+end)/2)
    assert removed==0


@pytest.mark.parametrize("p,g,cap",[(.1,.2,.3),(1.9,.3,.2),(3,.1,.4),(2,.3,.2),(0,0,.2),(3,.2,.2)])
def test_analytical_hour_matches_small_step_midpoint(p,g,cap):
    alpha=pressure_per_kg(100,21)
    end,average,removed=advance_pressure(p,g,cap,alpha)
    numerical=p;integral=0;dt=1/10000
    for _ in range(10000):
        slope=alpha*(g-cap*min(numerical/2,1))
        middle=numerical+slope*dt/2
        integral+=middle*dt
        numerical+=alpha*(g-cap*min(middle/2,1))*dt
    assert end==pytest.approx(numerical,abs=1e-7)
    assert average==pytest.approx(integral,abs=1e-7)
    assert removed==pytest.approx(g-(end-p)/alpha,abs=1e-9)
    assert end>=0


def test_one_hour_average_not_endpoint_controls_failure():
    r=simulate(scenario(initial_co2_mmhg=2.5,co2_equipment_quantity=0))
    assert r.readings[1].co2_mmhg>3
    assert r.readings[1].co2_hour_average_mmhg<3
    assert r.events[0].resource=="co2"
    assert r.events[0].hour==2


def test_initial_above_limit_stops_at_hour_zero_without_division_error():
    r=simulate(scenario(initial_co2_mmhg=3.1))
    assert r.evaluated_hours==0
    assert len(r.readings)==1
    assert r.events[0].resource=="co2"
    assert r.water_balance["effective_recovery_fraction"]==0
    assert r.co2_balance["generated_kg"]==0


def test_initial_exact_limit_is_not_automatically_failure():
    r=simulate(scenario(initial_co2_mmhg=3))
    assert r.evaluated_hours>0
    assert r.resource_balance_complete


def test_volume_changes_transient_pressure_but_not_crew_production():
    a=simulate(scenario(habitat_volume_m3=100,co2_equipment_quantity=0))
    b=simulate(scenario(habitat_volume_m3=200,co2_equipment_quantity=0))
    assert b.evaluated_hours>a.evaluated_hours
    assert b.readings[1].co2_mmhg-.4==pytest.approx((a.readings[1].co2_mmhg-.4)/2,abs=1e-6)


def test_mass_conservation_and_nonnegative_inventory_every_hour():
    r=simulate(scenario())
    alpha=pressure_per_kg(r.request.habitat_volume_m3,r.request.interior_temperature_c)
    initial=r.request.initial_co2_mmhg/alpha
    for reading in r.readings:
        generated=reading.hour*r.request.crew_size*CREW_CO2_KG_DAY/24
        assert reading.co2_mmhg/alpha+reading.co2_removed_kg==pytest.approx(initial+generated,abs=2e-6)
    balance=r.co2_balance
    assert balance["initial_kg"]+balance["generated_kg"]==pytest.approx(balance["end_kg"]+balance["removed_kg"])


def test_power_and_mass_scale_per_installed_unit():
    a=simulate(scenario(co2_equipment_quantity=1,duration_days=1))
    b=simulate(scenario(co2_equipment_quantity=2,duration_days=1))
    assert b.demand_kw-a.demand_kw==pytest.approx(1)
    assert b.co2_equipment_summary["known_hardware_mass_kg"]==pytest.approx(408.233133)


def test_disabled_extension_keeps_legacy_balances_and_labels_scope():
    r=simulate(HabitatRequest(duration_days=1))
    assert r.co2_balance is None and r.co2_equipment_summary is None
    assert r.readings[-1].co2_mmhg is None
    assert "co2_limit" not in r.sources
    assert any("CO2 screening is disabled" in warning for warning in r.warnings)


def test_evidence_separates_nominal_load_historical_spec_and_unvalidated_curve():
    r=simulate(scenario())
    assert r.evidence["co2_crew_generation"]["value"]==1.085
    assert r.evidence["co2_crew_generation"]["source_ids"]==["bvad"]
    assert "unvalidated" in r.evidence["co2_scrubber"]["note"]
    assert r.evidence["habitat_volume_m3"]["source_ids"]==[]
    for item in r.evidence.values():
        for sid in item["source_ids"]: assert sid in r.sources


def test_optimizer_includes_scrubber_counts_in_mass_and_constraints():
    r=optimize(search())
    assert r.candidate_count==3
    assert {c.co2_units for c in r.candidates}=={0,1,2}
    assert any("co2" in c.constraints_failed for c in r.candidates)
    assert r.optimized.request.co2_equipment_quantity>=1
    assert r.optimized_known_hardware_mass_kg==pytest.approx(r.optimized.request.co2_equipment_quantity*204.1165665)


def test_full_mission_scrubber_optimum_and_fixed_cabin_inputs():
    s=HabitatRequest(co2_enabled=True,generation_kw=14,water_kg=400,crew_size=6)
    r=optimize(search(s,max_oxygen_units=2,max_water_units=2,require_no_wastewater_backlog=True))
    assert r.candidate_count==27
    assert r.optimized.request.co2_equipment_quantity==2
    assert r.optimized.request.habitat_volume_m3==s.habitat_volume_m3
    assert r.optimized_known_hardware_mass_kg==pytest.approx(1044.233133)
    assert r.optimized.demand_kw==12.334
    assert r.optimized.resource_balance_complete


def test_insufficient_scrubber_bound_is_honest():
    r=optimize(search(scenario(duration_days=30),max_co2_units=0))
    assert r.status=="no_feasible_candidate"
    assert r.optimized is None
    assert r.constraint_failure_counts["co2"]==1


def test_disabled_scrubber_search_stays_81_candidates():
    r=optimize(search(HabitatRequest(),max_oxygen_units=8,max_water_units=8,max_co2_units=4))
    assert r.candidate_count==81
    assert all(c.co2_units is None for c in r.candidates)


@pytest.mark.parametrize("patch",[{"habitat_volume_m3":0},{"initial_co2_mmhg":-1},
    {"co2_equipment_quantity":5},{"habitat_volume_m3":float("nan")},{"co2_equipment_id":"missing"}])
def test_invalid_inputs_return_422(patch):
    body=scenario().model_dump();body.update(patch)
    if any(isinstance(v,float) and v!=v for v in patch.values()):
        with pytest.raises(ValueError):HabitatRequest(**body)
    else:
        assert TestClient(app).post("/simulate",json=body).status_code==422


def test_agent_can_request_co2_screening_and_returns_computed_proposal(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","fixture-only")
    steps=[{"role":"model","parts":[{"functionCall":{"name":"optimize_habitat","args":{
        "scenario_changes":{"co2_enabled":True,"crew_size":6,"water_kg":400,"generation_kw":14},
        "search_changes":{"max_co2_units":2}}}}]},
        {"role":"model","parts":[{"text":"Review the CO2 screening results and assumptions."}]}]
    monkeypatch.setattr(mission_agent,"model_turn",lambda *args:steps.pop(0))
    result=mission_agent.run_agent(mission_agent.AgentRequest(goal="Enable CO2 screening for six crew using 14 kW and 400 kg water",baseline=search(HabitatRequest(),max_oxygen_units=2,max_water_units=2)))
    assert result["proposed_scenario"]["co2_enabled"]
    assert result["proposed_scenario"]["co2_equipment_quantity"]==2
    assert result["comparison"]["optimized"]["co2_balance"]
