import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine import simulate
from app.models import HabitatRequest

client = TestClient(app)

def test_default_mars_completes():
    r = simulate(HabitatRequest())
    assert r.resource_balance_complete
    assert len(r.readings) == 721
    assert r.readings[-1].water_kg == pytest.approx(137.9772)

def test_deterministic():
    assert simulate(HabitatRequest()) == simulate(HabitatRequest())

def test_no_oxygen_fails_first_hour():
    r = simulate(HabitatRequest(oxygen_kg=0, oxygen_capacity_kg_day=0))
    assert r.events[0].resource == "oxygen"
    assert r.evaluated_hours == 1

def test_empty_battery_with_insufficient_generation_fails():
    r = simulate(HabitatRequest(generation_kw=0, battery_kwh=0))
    assert any(e.resource == "power" for e in r.events)

def test_exact_oxygen_balance_is_valid():
    r = simulate(HabitatRequest(oxygen_kg=0, oxygen_capacity_kg_day=3.58))
    assert r.resource_balance_complete
    assert r.readings[-1].oxygen_kg == pytest.approx(0)

def test_electrolysis_uses_water_even_with_recycling():
    r = simulate(HabitatRequest(water_kg=0, recycling_fraction=0.98))
    assert any(e.resource == "water" for e in r.events)

@pytest.mark.parametrize("planet", ["mars", "venus", "titan"])
def test_environment_changes_load(planet):
    r = simulate(HabitatRequest(environment_id=planet))
    assert r.thermal_load_kw > 0
    if planet != "mars":
        assert not r.resource_balance_complete

def test_battery_cannot_overcharge():
    r = simulate(HabitatRequest(generation_kw=100))
    assert all(0 <= p.battery_kwh <= 100 for p in r.readings)

@pytest.mark.parametrize("body", [{"crew_size":0}, {"duration_days":181}, {"recycling_fraction":1.1}, {"environment_id":"earth"}, {"water_kg":-1}, {"extra":1}])
def test_invalid_requests(body):
    assert client.post("/simulate", json=body).status_code == 422

def test_api_contract():
    assert len(client.get("/environments").json()) == 3
    response = client.post("/simulate", json={})
    assert response.status_code == 200
    assert response.json()["assumptions_version"] == "0.6.0"


def test_bvad_oxygen_rate_and_water_boundary():
    r = simulate(HabitatRequest(duration_days=1, generation_kw=100))
    assert r.readings[-1].oxygen_kg == pytest.approx(30 + 4 - 4 * 0.895, abs=1e-6)
    expected_water = 300 - 4 * 3.217 * (1 - 0.93) - 4 * 1.125
    assert r.readings[-1].water_kg == pytest.approx(expected_water, abs=1e-6)

def test_reference_data_units_and_traceability():
    envs = client.get("/environments").json()
    assert envs[0]["pressure_kpa"] == 0.636
    assert envs[1]["pressure_kpa"] == 9200
    assert envs[2]["pressure_kpa"] == 146
    for env in envs:
        for field in ("temperature_c", "pressure_kpa", "gravity_ms2", "atmosphere"):
            assert env["field_sources"][field].startswith("https://")

def test_every_evidence_source_resolves():
    r = simulate(HabitatRequest())
    for item in r.evidence.values():
        assert item["classification"]
        for source in item["source_ids"]:
            assert r.sources[source]["url"].startswith("https://")
    assert r.evidence["heat_loss_kw_k"]["classification"] == "unvalidated_design_input"

def test_override_does_not_claim_reference_status():
    r = simulate(HabitatRequest(recycler_power_kw=2))
    assert r.evidence["recycler_power_kw"]["classification"] == "user_override"
    assert r.evidence["recycler_power_kw"]["value"] == 2

def test_model_reference_defaults_match_api():
    ref = client.get("/model-reference").json()
    assert ref["default_request"] == HabitatRequest().model_dump()
    assert ref["parameters"]["electrolyzer_kwh_kg_oxygen"]["value"] == 55 / 8

def test_recycler_is_off_when_recovery_disabled():
    base = simulate(HabitatRequest(recycling_fraction=0, recycler_power_kw=100))
    assert base.demand_kw < 10

def test_power_shortage_explains_demand_supply_and_deficit():
    result = simulate(
        HabitatRequest(
            duration_days=1,
            generation_kw=0,
            battery_kwh=0,
        )
    )

    event = next(
        event for event in result.events
        if event.resource == "power"
    )

    assert event.hour == 1
    assert "required" in event.message.lower()
    assert "generated" in event.message.lower()
    assert "battery" in event.message.lower()
    assert "shortfall" in event.message.lower()

def test_power_shortage_reports_correct_energy_values():
    result = simulate(
        HabitatRequest(
            duration_days=1,
            generation_kw=2,
            battery_kwh=1,
        )
    )

    event = next(
        event for event in result.events
        if event.resource == "power"
    )

    assert event.hour == 1
    assert "8.073 kWh required" in event.message
    assert "2.000 kWh generated" in event.message
    assert "1.000 kWh available in the battery" in event.message
    assert "5.073 kWh shortfall" in event.message

def test_power_shortage_uses_remaining_battery_energy():
    result = simulate(
        HabitatRequest(
            duration_days=1,
            generation_kw=2,
            battery_kwh=10,
        )
    )

    event = next(
        event for event in result.events
        if event.resource == "power"
    )

    assert event.hour == 2
    assert "8.073 kWh required" in event.message
    assert "2.000 kWh generated" in event.message
    assert "3.927 kWh available in the battery" in event.message
    assert "2.146 kWh shortfall" in event.message
@pytest.mark.parametrize("body", [{"hvac_cop":0}, {"heat_loss_kw_k":-1}, {"recycler_power_kw":-1}])
def test_invalid_engineering_inputs(body):
    assert client.post("/simulate",json=body).status_code == 422

