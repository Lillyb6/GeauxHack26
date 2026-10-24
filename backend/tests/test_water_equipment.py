from copy import deepcopy
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine import simulate
from app.models import HabitatRequest
from app.equipment import EQUIPMENT_BY_ID, resolve_water_equipment

client = TestClient(app)
WATER_ID = "vcds_1979_reference"

def request(**kwargs):
    return HabitatRequest(water_equipment_id=WATER_ID, duration_days=1, generation_kw=100, **kwargs)

@pytest.mark.parametrize("crew,quantity", [(4,1),(12,1),(12,2),(12,3),(4,0)])
def test_capacity_queue_and_mass_balance(crew,quantity):
    r=simulate(request(crew_size=crew,water_equipment_quantity=quantity))
    used=crew*3.217
    processed=min(used,17.2*quantity)
    recovered=processed*.90
    assert r.evaluated_hours == 24
    assert r.water_balance["recovered_water_kg"] == pytest.approx(recovered, abs=1e-6)
    assert r.readings[-1].wastewater_kg == pytest.approx(used-processed, abs=1e-6)
    assert r.readings[-1].brine_water_kg == pytest.approx(processed-recovered, abs=1e-6)
    assert r.readings[-1].water_kg == pytest.approx(300-used+recovered-4*1.125, abs=1e-6)
    assert r.water_balance["effective_recovery_fraction"] == pytest.approx(recovered/used)
    assert r.demand_kw == pytest.approx(3.2+3.2+4*6.875/24+.867*quantity, abs=.001)
    for reading in r.readings:
        # The simplified loop returns crew potable intake as feed. Only electrolysis leaves this water accounting boundary.
        total=reading.water_kg+reading.wastewater_kg+reading.brine_water_kg
        assert total == pytest.approx(300 - reading.hour*4*1.125/24, abs=2e-6)
    assert r.water_equipment_summary["known_hardware_mass_kg"] == 243*quantity

def test_overload_warns_without_pretending_to_be_immediate_failure():
    r=simulate(request(crew_size=12))
    assert r.resource_balance_complete
    assert r.warnings
    assert r.water_balance["effective_recovery_fraction"] < .5
    assert r.readings[-1].wastewater_kg > 20
    assert not any("Water processor" in warning for warning in simulate(request(crew_size=4)).warnings)

def test_more_units_improve_processing_without_multiplying_efficiency():
    a=simulate(request(crew_size=12,water_equipment_quantity=1))
    b=simulate(request(crew_size=12,water_equipment_quantity=2))
    assert b.readings[-1].water_kg > a.readings[-1].water_kg
    assert b.readings[-1].wastewater_kg < a.readings[-1].wastewater_kg
    assert a.water_equipment_summary["recovery_fraction"] == b.water_equipment_summary["recovery_fraction"]

def test_unused_custom_settings_do_not_change_catalog_result():
    a=simulate(request())
    b=simulate(request(recycling_fraction=0,recycler_power_kw=99))
    assert a.readings == b.readings
    assert a.demand_kw == b.demand_kw
    assert a.evidence == b.evidence

def test_water_evidence_replaces_unused_iss_recovery_and_power():
    r=simulate(request(oxygen_equipment_id="static_feed_electrolyzer_1978"))
    assert "recycling_fraction" not in r.evidence
    assert "recycler_power_kw" not in r.evidence
    assert "wrm" not in r.sources
    assert "water_recovery" not in r.sources
    assert r.evidence["water_feed_budget"]["value"] == 17.2
    assert "equipment:vcds_1979_reference" in r.sources
    assert "equipment:static_feed_electrolyzer_1978" in r.sources
    for value in r.evidence.values():
        for source_id in value["source_ids"]:
            assert source_id in r.sources

@pytest.mark.parametrize("field", ["feed_capacity_kg_day","recovery_fraction","electrical_power_kw"])
def test_missing_required_water_spec_returns_422(monkeypatch,field):
    item=deepcopy(EQUIPMENT_BY_ID[WATER_ID]);item[field]=None
    monkeypatch.setitem(EQUIPMENT_BY_ID,WATER_ID,item)
    response=client.post("/simulate",json={"water_equipment_id":WATER_ID})
    assert response.status_code==422
    assert "Insufficient" in response.json()["detail"]

def test_unknown_mass_stays_unknown(monkeypatch):
    item=deepcopy(EQUIPMENT_BY_ID[WATER_ID]);item["hardware_mass_kg"]=None
    monkeypatch.setitem(EQUIPMENT_BY_ID,WATER_ID,item)
    assert simulate(request()).water_equipment_summary["known_hardware_mass_kg"] is None

@pytest.mark.parametrize("body", [{"water_equipment_id":"missing"},{"water_equipment_id":"static_feed_electrolyzer_1978"},{"water_equipment_quantity":-1},{"water_equipment_quantity":9},{"water_equipment_quantity":1.5},{"oxygen_equipment_id":WATER_ID}])
def test_invalid_selection_or_quantity(body):
    assert client.post("/simulate",json=body).status_code == 422

def test_power_and_water_deficits_still_stop_mission():
    power=simulate(HabitatRequest(water_equipment_id=WATER_ID,battery_kwh=0,generation_kw=0))
    assert any(e.resource=="power" for e in power.events)
    water=simulate(HabitatRequest(water_equipment_id=WATER_ID,water_kg=0,generation_kw=100))
    assert any(e.resource=="water" for e in water.events)

def test_custom_mode_retains_old_behavior():
    r=simulate(HabitatRequest())
    assert r.water_equipment_summary is None
    assert r.readings[-1].water_kg == pytest.approx(137.9772)
    assert r.readings[-1].wastewater_kg == 0
    assert "wrm" in r.sources

def test_historical_derivations_are_recorded():
    summary=resolve_water_equipment(WATER_ID,1)
    assert summary["electrical_power_kw"] == (171+696)/1000
    assert summary["known_hardware_mass_kg"] == 143+100
    assert summary["recovery_fraction"] == .90
    assert summary["recovery_evidence_status"] == "unvalidated_design_assumption"
    assert len(summary["derivations"]) == 4
    r=simulate(request())
    assert r.evidence["water_processed_feed_recovery"]["source_ids"] == []
    assert r.evidence["water_processed_feed_recovery"]["classification"] == "unvalidated_design_assumption"
