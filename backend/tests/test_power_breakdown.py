import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine import simulate
from app.models import HabitatRequest, OptimizationRequest
from app.optimizer import optimize
from app.advisor import compact_run

client = TestClient(app)
OXYGEN = "static_feed_electrolyzer_1978"
WATER = "vcds_1979_reference"
COMPONENTS = {"other_habitat_kw", "water_recycling_kw", "thermal_control_kw", "oxygen_generation_kw", "co2_removal_kw"}


def test_default_breakdown_matches_independent_one_day_balance():
    result = simulate(HabitatRequest(duration_days=1))
    breakdown = result.power_breakdown.model_dump()
    assert set(breakdown) == COMPONENTS | {"total_kw"}
    assert breakdown["other_habitat_kw"] == pytest.approx(3.2)
    assert breakdown["water_recycling_kw"] == pytest.approx(.527)
    assert breakdown["oxygen_generation_kw"] == pytest.approx(4 * 6.875 / 24)
    assert breakdown["thermal_control_kw"] == pytest.approx(.04 * (21 - (-59)))
    assert breakdown["co2_removal_kw"] == 0
    assert breakdown["total_kw"] == pytest.approx(8.072833333333333)
    assert result.demand_kw == round(breakdown["total_kw"], 3)
    assert result.readings[-1].battery_kwh == pytest.approx(98.252)


@pytest.mark.parametrize("environment", ["mars", "venus", "titan"])
@pytest.mark.parametrize("co2_enabled", [False, True])
def test_components_sum_to_exact_total_for_each_environment(environment, co2_enabled):
    result = simulate(HabitatRequest(environment_id=environment, duration_days=1, co2_enabled=co2_enabled))
    breakdown = result.power_breakdown.model_dump()
    assert sum(breakdown[key] for key in COMPONENTS) == pytest.approx(breakdown["total_kw"], abs=1e-12)
    assert all(value >= 0 for value in breakdown.values())
    assert abs(result.demand_kw - breakdown["total_kw"]) <= .0005


def test_disabled_custom_recycler_draws_no_power():
    result = simulate(HabitatRequest(duration_days=1, recycling_fraction=0, recycler_power_kw=99))
    assert result.power_breakdown.water_recycling_kw == 0


@pytest.mark.parametrize("quantity", [0, 1, 2])
def test_catalog_units_replace_custom_loads_without_double_counting(quantity):
    settings = dict(duration_days=1, generation_kw=100, oxygen_equipment_id=OXYGEN,
        water_equipment_id=WATER, oxygen_equipment_quantity=quantity, water_equipment_quantity=quantity)
    first = simulate(HabitatRequest(**settings))
    second = simulate(HabitatRequest(**settings, oxygen_capacity_kg_day=30,
        electrolyzer_kwh_kg_oxygen=99, recycler_power_kw=99, recycling_fraction=0))
    assert first.power_breakdown == second.power_breakdown
    assert first.readings == second.readings
    assert first.power_breakdown.oxygen_generation_kw == pytest.approx(1.1 * quantity)
    assert first.power_breakdown.water_recycling_kw == pytest.approx(.867 * quantity)


@pytest.mark.parametrize("quantity", [0, 1, 2])
def test_enabled_co2_load_scales_with_installed_units(quantity):
    result = simulate(HabitatRequest(duration_days=1, co2_enabled=True, co2_equipment_quantity=quantity))
    assert result.power_breakdown.co2_removal_kw == pytest.approx(quantity)


def test_cop_changes_only_the_thermal_component():
    first = simulate(HabitatRequest(duration_days=1))
    second = simulate(HabitatRequest(duration_days=1, hvac_cop=2))
    a, b = first.power_breakdown.model_dump(), second.power_breakdown.model_dump()
    assert b["thermal_control_kw"] == pytest.approx(a["thermal_control_kw"] / 2)
    for key in COMPONENTS - {"thermal_control_kw"}:
        assert b[key] == a[key]
    assert a["total_kw"] - b["total_kw"] == pytest.approx(1.6)


def test_hour_zero_failure_reports_requirements_without_claiming_energy_use():
    result = simulate(HabitatRequest(thermal_capacity_enabled=True, heating_capacity_kw=2))
    assert result.evaluated_hours == 0
    assert result.power_breakdown.thermal_control_kw == pytest.approx(3.2)
    assert result.readings[-1].battery_kwh == 100
    assert result.power_breakdown.total_kw > 0


def test_api_exposes_typed_breakdown_and_rejects_forged_request_values():
    response = client.post("/simulate", json={"duration_days":1})
    assert response.status_code == 200
    assert set(response.json()["power_breakdown"]) == COMPONENTS | {"total_kw"}
    schemas = client.get("/openapi.json").json()["components"]["schemas"]
    assert schemas["SimulationResult"]["properties"]["power_breakdown"]["$ref"].endswith("/PowerDemandBreakdown")
    assert "electrical" in schemas["PowerDemandBreakdown"]["properties"]["total_kw"]["description"].lower()
    assert client.post("/simulate",json={"power_breakdown":{"total_kw":0}}).status_code == 422


def test_optimizer_and_ai_summaries_retain_the_evaluated_breakdown():
    result = optimize(OptimizationRequest(scenario=HabitatRequest(duration_days=1,generation_kw=100),
        oxygen_equipment_id=OXYGEN, water_equipment_id=WATER, max_oxygen_units=1, max_water_units=1))
    assert result.optimized is not None
    for run in (result.manual, result.optimized):
        assert compact_run(run)["power_breakdown"] == run.power_breakdown.model_dump()
        assert run.demand_kw == round(run.power_breakdown.total_kw,3)
    assert "power_breakdown" in result.model_dump()["optimized"]
