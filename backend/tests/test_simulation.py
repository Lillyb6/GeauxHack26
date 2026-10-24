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
    assert r.readings[-1].water_kg == pytest.approx(123)

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
    r = simulate(HabitatRequest(oxygen_kg=0, oxygen_capacity_kg_day=3.36))
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
    assert response.json()["assumptions_version"] == "0.1.0"
