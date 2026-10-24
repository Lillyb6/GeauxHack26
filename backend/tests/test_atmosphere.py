import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import HabitatRequest,OptimizationRequest
from app.engine import simulate
from app.optimizer import optimize
from app.atmosphere import screen_atmosphere
from app.co2 import PA_PER_MMHG
from app.advisor import compact_run
from app import mission_agent


def scenario(**patch):
    values=dict(atmosphere_enabled=True,duration_days=1,generation_kw=14,oxygen_kg=1000,water_kg=10000)
    values.update(patch)
    return HabitatRequest(**values)


def checks(summary):
    return {check["id"]:check for check in summary["checks"]}


def search(s):
    return OptimizationRequest(scenario=s,oxygen_equipment_id="static_feed_electrolyzer_1978",
        water_equipment_id="vcds_1979_reference",max_oxygen_units=2,max_water_units=2)


def oxygen_for(pio2,pressure=101.325):
    return pio2/(pressure*1000/PA_PER_MMHG-47)*100


def test_nominal_earthlike_dry_and_inspired_pressures_are_distinct():
    summary=screen_atmosphere(scenario())
    assert summary["status"]=="within_nominal_screen"
    assert summary["dry_oxygen_partial_pressure_kpa"]==pytest.approx(101.325*.209)
    assert summary["inspired_oxygen_partial_pressure_mmhg"]==pytest.approx(149.017,abs=.001)
    assert summary["dry_oxygen_partial_pressure_mmhg"]>summary["inspired_oxygen_partial_pressure_mmhg"]


@pytest.mark.parametrize("pressure,expected",[(34.5,False),(34.5001,True),(103,True),(103.0001,False),(0,False)])
def test_exact_pressure_boundary_semantics(pressure,expected):
    summary=screen_atmosphere(scenario(cabin_pressure_kpa=pressure))
    assert checks(summary)["cabin_pressure"]["passed"]==expected


@pytest.mark.parametrize("pio2,expected",[(145,True),(155,True),(144.99999,False),(155.00001,False),(130,False),(200,False)])
def test_selected_nominal_target_is_inclusive_and_not_full_exposure_envelope(pio2,expected):
    summary=screen_atmosphere(scenario(cabin_oxygen_percent=oxygen_for(pio2)))
    assert checks(summary)["inspired_oxygen"]["passed"]==expected
    assert summary["inspired_oxygen_partial_pressure_mmhg"]==pytest.approx(pio2)


def test_diluent_requirement_is_independent_of_good_inspired_oxygen():
    oxygen=71
    pressure=(154/(oxygen/100)+47)*PA_PER_MMHG/1000
    summary=screen_atmosphere(scenario(cabin_pressure_kpa=pressure,cabin_oxygen_percent=oxygen))
    assert checks(summary)["cabin_pressure"]["passed"]
    assert checks(summary)["inspired_oxygen"]["passed"]
    assert not checks(summary)["inert_diluent"]["passed"]
    assert summary["status"]=="outside_nominal_screen"


def test_exact_thirty_percent_diluent_boundary():
    assert checks(screen_atmosphere(scenario(cabin_oxygen_percent=70)))["inert_diluent"]["passed"]


def test_below_airway_pressure_is_null_not_negative_physical_pio2():
    summary=screen_atmosphere(scenario(cabin_pressure_kpa=1))
    assert summary["inspired_oxygen_partial_pressure_mmhg"] is None
    assert not checks(summary)["inspired_oxygen"]["passed"]


def test_invalid_nominal_design_stops_before_consumable_simulation():
    result=simulate(scenario(cabin_pressure_kpa=50))
    assert not result.resource_balance_complete
    assert result.evaluated_hours==0
    assert len(result.readings)==1
    assert "inspired_oxygen" in {event.resource for event in result.events}
    assert result.readings[-1].oxygen_kg==1000
    assert result.readings[-1].water_kg==10000
    assert result.water_balance["effective_recovery_fraction"]==0


def test_successful_static_screen_does_not_change_resource_accounting():
    a=simulate(scenario())
    b=simulate(scenario(atmosphere_enabled=False))
    assert a.resource_balance_complete and b.resource_balance_complete
    assert a.readings==b.readings
    assert a.demand_kw==b.demand_kw
    assert a.atmosphere_summary["status"]=="within_nominal_screen"
    assert b.atmosphere_summary is None
    assert any("atmosphere screening is disabled" in note for note in b.warnings)


def test_stored_oxygen_is_not_cabin_oxygen_fraction():
    a=screen_atmosphere(scenario(oxygen_kg=30))
    b=screen_atmosphere(scenario(oxygen_kg=10000))
    assert a==b


def test_airway_correction_is_not_cabin_temperature_dependent():
    a=screen_atmosphere(scenario(interior_temperature_c=10))
    b=screen_atmosphere(scenario(interior_temperature_c=30))
    assert a["inspired_oxygen_partial_pressure_mmhg"]==b["inspired_oxygen_partial_pressure_mmhg"]


def test_source_provenance_and_user_setpoints_are_distinct():
    result=simulate(scenario())
    assert result.evidence["cabin_pressure_kpa"]["source_ids"]==[]
    assert result.evidence["cabin_oxygen_percent"]["source_ids"]==[]
    assert "atmosphere_standard" in result.sources
    assert "inspired_oxygen" in result.sources
    assert compact_run(result)["atmosphere_summary"]==result.atmosphere_summary
    for entry in result.evidence.values():
        assert all(sid in result.sources for sid in entry["source_ids"])


def test_disabled_screen_omits_unused_sources():
    result=simulate(scenario(atmosphere_enabled=False))
    assert "atmosphere_standard" not in result.sources
    assert "inspired_oxygen" not in result.sources


def test_co2_and_atmosphere_screens_can_run_together():
    result=simulate(scenario(co2_enabled=True,co2_equipment_quantity=2))
    assert result.resource_balance_complete
    assert result.atmosphere_summary and result.co2_balance
    assert result.readings[-1].co2_mmhg is not None


def test_optimizer_cannot_fix_bad_static_settings_with_more_equipment():
    result=optimize(search(scenario(cabin_pressure_kpa=50)))
    assert result.status=="no_feasible_candidate"
    assert result.optimized is None
    assert result.candidate_count==9
    assert result.constraint_failure_counts["inspired_oxygen"]==9


def test_optimizer_holds_atmosphere_inputs_fixed():
    result=optimize(search(scenario()))
    assert result.optimized.request.cabin_pressure_kpa==101.325
    assert result.optimized.request.cabin_oxygen_percent==20.9
    assert result.optimized.atmosphere_summary["status"]=="within_nominal_screen"


@pytest.mark.parametrize("patch",[{"cabin_pressure_kpa":-1},{"cabin_pressure_kpa":201},
    {"cabin_oxygen_percent":-1},{"cabin_oxygen_percent":101},{"unexpected_atmosphere":True}])
def test_api_rejects_invalid_inputs(patch):
    body=scenario().model_dump();body.update(patch)
    assert TestClient(app).post("/simulate",json=body).status_code==422


@pytest.mark.parametrize("field,value",[("cabin_pressure_kpa",float("nan")),("cabin_oxygen_percent",float("inf"))])
def test_nonfinite_values_rejected(field,value):
    with pytest.raises(ValueError):scenario(**{field:value})


def test_agent_can_evaluate_requested_atmosphere_without_automatic_application(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","test-only")
    baseline=search(scenario(atmosphere_enabled=False))
    before=baseline.model_dump()
    replies=[{"role":"model","parts":[{"functionCall":{"name":"simulate_habitat","args":{
        "scenario_changes":{"atmosphere_enabled":True,"cabin_pressure_kpa":101.325,"cabin_oxygen_percent":20.9}}}}]},
        {"role":"model","parts":[{"text":"The fixed settings meet the selected nominal screen; pressure regulation remains unmodeled."}]}]
    monkeypatch.setattr(mission_agent,"model_turn",lambda *args:replies.pop(0))
    result=mission_agent.run_agent(mission_agent.AgentRequest(goal="Enable atmosphere screening at 101.325 kPa and 20.9 percent oxygen",baseline=baseline))
    assert baseline.model_dump()==before
    assert result["proposed_scenario"]["atmosphere_enabled"]
    assert result["simulation"]["atmosphere_summary"]["status"]=="within_nominal_screen"
