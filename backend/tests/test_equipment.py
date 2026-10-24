from copy import deepcopy
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import HabitatRequest
from app.engine import simulate
from app.equipment import EQUIPMENT_BY_ID, resolve_oxygen_equipment

client = TestClient(app)
EQUIPMENT_ID = "static_feed_electrolyzer_1978"

def request(**changes):
    return HabitatRequest(oxygen_equipment_id=EQUIPMENT_ID, duration_days=1, generation_kw=100, **changes)

@pytest.mark.parametrize("quantity", [0, 1, 2])
def test_quantity_balances(quantity):
    r = simulate(request(oxygen_equipment_quantity=quantity))
    assert r.resource_balance_complete
    assert r.readings[-1].oxygen_kg == pytest.approx(30 + 4.2*quantity - 4*.895, abs=1e-6)
    assert r.readings[-1].water_kg == pytest.approx(300 - 4*3.217*.07 - 4.2*quantity*1.125, abs=1e-6)
    assert r.demand_kw == pytest.approx(3.2+.527+3.2+1.1*quantity, abs=.001)
    assert r.equipment_summary["known_hardware_mass_kg"] == 75*quantity

def test_catalog_ignores_custom_energy_and_output():
    a=simulate(request())
    b=simulate(request(oxygen_capacity_kg_day=29, electrolyzer_kwh_kg_oxygen=99))
    assert a.readings == b.readings
    assert a.demand_kw == b.demand_kw
    assert a.evidence == b.evidence

def test_catalog_evidence_and_sources_match_used_equipment():
    r=simulate(request())
    assert "electrolyzer_kwh_kg_oxygen" not in r.evidence
    assert "oxygen_capacity_kg_day" not in r.evidence
    assert "doe_pem" not in r.sources
    assert r.evidence["equipment_power"]["value"] == 1.1
    assert r.evidence["equipment_oxygen_output"]["value"] == 4.2
    assert r.equipment_summary["operating_temperature_min_c"] is None
    assert r.equipment_summary["operating_temperature_max_c"] is None
    for item in r.evidence.values():
        for source in item["source_ids"]:
            assert r.sources[source]["url"].startswith("https://")
    assert any("Historical design" in note for note in r.limitations)

def test_custom_mode_retains_doe_evidence():
    r=simulate(HabitatRequest())
    assert r.equipment_summary is None
    assert "doe_pem" in r.sources
    assert "electrolyzer_kwh_kg_oxygen" in r.evidence

def test_mass_unknown_is_preserved(monkeypatch):
    item=deepcopy(EQUIPMENT_BY_ID[EQUIPMENT_ID]);item["hardware_mass_kg"]=None
    monkeypatch.setitem(EQUIPMENT_BY_ID,EQUIPMENT_ID,item)
    assert resolve_oxygen_equipment(EQUIPMENT_ID,1)["known_hardware_mass_kg"] is None
    r=simulate(request())
    assert r.evidence["equipment_hardware_mass"]["value"] is None

@pytest.mark.parametrize("field", ["oxygen_output_kg_day", "electrical_power_kw"])
def test_missing_required_spec_returns_422(monkeypatch,field):
    item=deepcopy(EQUIPMENT_BY_ID[EQUIPMENT_ID]);item[field]=None
    monkeypatch.setitem(EQUIPMENT_BY_ID,EQUIPMENT_ID,item)
    response=client.post("/simulate",json={"oxygen_equipment_id":EQUIPMENT_ID})
    assert response.status_code == 422
    assert "Insufficient equipment data" in response.json()["detail"]

@pytest.mark.parametrize("quantity", [-1,9,1.5])
def test_invalid_quantity(quantity):
    assert client.post("/simulate",json={"oxygen_equipment_id":EQUIPMENT_ID,"oxygen_equipment_quantity":quantity}).status_code == 422

def test_unknown_id_and_catalog_endpoint():
    assert client.get("/equipment").json()[0]["id"] == EQUIPMENT_ID
    assert client.post("/simulate",json={"oxygen_equipment_id":"missing"}).status_code == 422
    response=client.post("/simulate",json={"oxygen_equipment_id":EQUIPMENT_ID,"duration_days":1})
    assert response.status_code == 200
    assert response.json()["equipment_summary"]["quantity"] == 1
