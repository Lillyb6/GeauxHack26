from app.models import HabitatRequest, OptimizationRequest
from app.improvement import improve
from app.engine import simulate


def request(**changes):
    return OptimizationRequest(scenario=HabitatRequest(**changes),oxygen_equipment_id="static_feed_electrolyzer_1978",water_equipment_id="vcds_1979_reference",max_oxygen_units=2,max_water_units=2,max_co2_units=2)


def test_power_repair_is_verified_and_preserves_original_inputs():
    original=request(co2_enabled=True, generation_kw=8)
    before=original.model_dump()
    result=improve(original)
    assert original.model_dump()==before
    assert result.recovery_attempted
    assert result.optimized is not None
    assert result.manual.request.generation_kw==8
    assert result.search_request==original
    assert 8 < result.suggested_generation_kw <= 100
    selected=result.optimized.request
    allowed={"generation_kw","oxygen_equipment_id","oxygen_equipment_quantity","water_equipment_id","water_equipment_quantity","co2_equipment_quantity"}
    for key,value in original.scenario.model_dump().items():
        if key not in allowed:
            assert selected.model_dump()[key]==value
    assert simulate(selected).resource_balance_complete
    assert result.optimized.request.generation_kw==result.suggested_generation_kw


def test_valid_fixed_design_does_not_increase_power():
    original=request(generation_kw=20)
    result=improve(original)
    assert result.optimized is not None
    assert not result.recovery_attempted
    assert result.optimized.request.generation_kw==20


def test_invalid_atmosphere_is_not_silently_repaired():
    result=improve(request(atmosphere_enabled=True,cabin_pressure_kpa=10))
    assert result.optimized is None
    assert result.recovery_attempted
    assert result.manual.request.cabin_pressure_kpa==10


def test_equipment_bounds_are_not_silently_expanded():
    original=request(oxygen_kg=0,water_kg=0).model_copy(update={"max_oxygen_units":0,"max_water_units":0})
    result=improve(original)
    assert result.optimized is None
    assert all(candidate.oxygen_units==candidate.water_units==0 for candidate in result.candidates)


def test_repair_obeys_no_backlog_and_api_preserves_manual():
    from fastapi.testclient import TestClient
    from app.main import app
    original=request(co2_enabled=True,generation_kw=8).model_copy(update={"require_no_wastewater_backlog":True})
    response=TestClient(app).post("/improve",json=original.model_dump())
    assert response.status_code==200
    data=response.json()
    assert data["manual"]["request"]["generation_kw"]==8
    assert data["optimized"]["resource_balance_complete"]
    assert data["optimized"]["readings"][-1]["wastewater_kg"] <= 1e-6
    assert data["recovery_search_generation_kw"]==100


def test_seven_crew_water_and_power_repair_is_verified():
    original=request(crew_size=7)
    result=improve(original)
    assert result.optimized is not None
    assert result.manual.evaluated_hours==318
    assert result.optimized.evaluated_hours==720
    assert result.optimized.request.water_kg>300
    assert result.optimized.request.generation_kw>8
    assert result.recovery_search_water_kg==100000
    assert result.optimized.request.crew_size==7
    assert result.optimized.request.oxygen_kg==original.scenario.oxygen_kg
    checked=simulate(result.optimized.request)
    assert checked.resource_balance_complete
    assert checked.readings[-1].water_kg>=0
    assert result.optimized.request.water_kg<400


def test_water_repair_cannot_disable_screenings():
    result=improve(request(crew_size=7,atmosphere_enabled=True,cabin_pressure_kpa=10))
    assert result.optimized is None
    assert result.manual.request.atmosphere_enabled


def test_recovery_also_runs_when_original_power_is_already_at_ceiling():
    result=improve(request(crew_size=7,generation_kw=100))
    assert result.optimized is not None
    assert result.optimized.request.generation_kw==100
    assert result.optimized.request.water_kg>300


import pytest

@pytest.mark.parametrize("planet,field,minimum", [
    ("mars", "heating_capacity_kw", 3.2),
    ("venus", "cooling_capacity_kw", 17.72),
    ("titan", "heating_capacity_kw", 8.04),
])
def test_planet_thermal_repair_is_verified_without_disabling_checks(planet, field, minimum):
    original = request(environment_id=planet, generation_kw=12,
        thermal_capacity_enabled=True, heating_capacity_kw=0, cooling_capacity_kw=0,
        co2_enabled=True, co2_equipment_quantity=2,
        atmosphere_enabled=True, cabin_pressure_kpa=101.325, cabin_oxygen_percent=20.9)
    before = original.model_dump()
    result = improve(original)
    assert original.model_dump() == before
    assert result.optimized is not None
    proposed = result.optimized.request
    assert getattr(proposed, field) >= minimum
    assert proposed.environment_id == planet
    assert proposed.thermal_capacity_enabled and proposed.co2_enabled and proposed.atmosphere_enabled
    assert proposed.crew_size == original.scenario.crew_size
    assert proposed.duration_days == original.scenario.duration_days
    assert result.manual.evaluated_hours == 0
    assert simulate(proposed).resource_balance_complete
    assert result.optimized.evaluated_hours == 720


def test_thermal_repair_respects_capacity_bound():
    result = improve(request(environment_id="venus", thermal_capacity_enabled=True,
        heat_loss_kw_k=10))
    assert result.optimized is None
    assert result.manual.request.thermal_capacity_enabled
