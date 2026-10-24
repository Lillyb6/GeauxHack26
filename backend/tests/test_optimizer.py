from copy import deepcopy
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import HabitatRequest, OptimizationRequest
from app.optimizer import optimize
from app.equipment import EQUIPMENT_BY_ID

client=TestClient(app)
OXYGEN="static_feed_electrolyzer_1978"
WATER="vcds_1979_reference"

def search(scenario=None,**kwargs):
    return OptimizationRequest(scenario=scenario or HabitatRequest(generation_kw=10),
        oxygen_equipment_id=OXYGEN,water_equipment_id=WATER,max_oxygen_units=kwargs.pop("max_oxygen_units",2),
        max_water_units=kwargs.pop("max_water_units",2),**kwargs)

def test_known_minimum_and_complete_enumeration():
    r=optimize(search())
    assert r.status=="feasible"
    assert r.candidate_count==r.evaluated_count==9
    assert {(c.oxygen_units,c.water_units) for c in r.candidates} == {(o,w) for o in range(3) for w in range(3)}
    assert r.optimized.request.oxygen_equipment_quantity==1
    assert r.optimized.request.water_equipment_quantity==1
    assert r.optimized_known_hardware_mass_kg==318
    assert r.optimized.resource_balance_complete
    assert r.optimized_known_hardware_mass_kg==min(c.known_hardware_mass_kg for c in r.candidates if c.feasible)
    assert r.manual_known_hardware_mass_kg is None
    assert r.known_hardware_mass_saving_kg is None

def test_all_non_equipment_inputs_are_fixed():
    scenario=HabitatRequest(generation_kw=10)
    before=scenario.model_dump()
    r=optimize(search(scenario))
    for key,value in before.items():
        if key not in {"oxygen_equipment_id","oxygen_equipment_quantity","water_equipment_id","water_equipment_quantity"}:
            assert getattr(r.optimized.request,key)==value
    assert scenario.model_dump()==before

def test_manual_vs_optimized_known_mass_and_failure():
    scenario=HabitatRequest(generation_kw=10,oxygen_equipment_id=OXYGEN,oxygen_equipment_quantity=2,
        water_equipment_id=WATER,water_equipment_quantity=2)
    r=optimize(search(scenario))
    assert not r.manual.resource_balance_complete
    assert r.optimized.resource_balance_complete
    assert r.manual_known_hardware_mass_kg==636
    assert r.known_hardware_mass_saving_kg==318

def test_power_infeasibility_returns_no_invented_design():
    r=optimize(search(HabitatRequest(generation_kw=0,battery_kwh=0)))
    assert r.status=="no_feasible_candidate"
    assert r.optimized is None
    assert r.optimized_known_hardware_mass_kg is None
    assert r.constraint_failure_counts["power"]==9
    assert r.feasible_count==0

def test_starting_supplies_can_legitimately_choose_zero_units():
    r=optimize(search(HabitatRequest(duration_days=1,oxygen_kg=1000,water_kg=1000,generation_kw=100)))
    assert r.optimized_known_hardware_mass_kg==0
    assert r.optimized.request.oxygen_equipment_quantity==0
    assert r.optimized.request.water_equipment_quantity==0
    assert r.optimized.warnings

def test_no_backlog_constraint_changes_selection():
    scenario=HabitatRequest(duration_days=1,oxygen_kg=1000,water_kg=1000,generation_kw=100)
    r=optimize(search(scenario,require_no_wastewater_backlog=True))
    assert r.optimized.request.oxygen_equipment_quantity==0
    assert r.optimized.request.water_equipment_quantity==1
    assert r.optimized.readings[-1].wastewater_kg==0
    assert r.optimized_known_hardware_mass_kg==243

def test_bounds_can_exclude_a_solution():
    scenario=HabitatRequest(duration_days=1,oxygen_kg=1000,water_kg=1000,generation_kw=100)
    r=optimize(search(scenario,max_oxygen_units=0,max_water_units=0,require_no_wastewater_backlog=True))
    assert r.candidate_count==1
    assert r.status=="no_feasible_candidate"
    assert r.constraint_failure_counts["wastewater_backlog"]==1

def test_unknown_mass_is_excluded_not_assumed_free(monkeypatch):
    item=deepcopy(EQUIPMENT_BY_ID[WATER]);item["hardware_mass_kg"]=None
    monkeypatch.setitem(EQUIPMENT_BY_ID,WATER,item)
    r=optimize(search())
    assert r.optimized is None
    assert r.excluded_count==6
    assert all(not c.eligible for c in r.candidates if c.water_units>0)
    assert all(c.known_hardware_mass_kg is None for c in r.candidates if c.water_units>0)

def test_deterministic_and_result_source_traceability():
    a=optimize(search());b=optimize(search())
    assert a==b
    assert "doe_pem" not in a.optimized.sources
    assert a.optimized.evidence["water_processed_feed_recovery"]["classification"]=="unvalidated_design_assumption"

@pytest.mark.parametrize("body", [
    {"max_oxygen_units":9},{"max_water_units":-1},{"max_water_units":1.5},
    {"oxygen_equipment_id":"missing"},{"water_equipment_id":OXYGEN},
    {"oxygen_equipment_id":WATER},{"scenario":{"crew_size":0}}, {"unexpected":1},
])
def test_invalid_search_input(body):
    request=search().model_dump();request.update(body)
    assert client.post("/optimize",json=request).status_code==422

def test_endpoint_contract():
    response=client.post("/optimize",json=search().model_dump())
    assert response.status_code==200
    result=response.json()
    assert result["optimized"]["request"]["generation_kw"]==10
    assert result["manual"]["request"]["generation_kw"]==10
    assert result["candidate_count"]==9
    assert result["optimized_known_hardware_mass_kg"]==318
