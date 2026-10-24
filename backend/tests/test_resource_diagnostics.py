import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine import simulate
from app.models import HabitatRequest
from app.advisor import compact_run


def event_for(result, resource):
    return next(event for event in result.events if event.resource == resource)


def test_oxygen_failure_explains_zero_inventory_and_production():
    result = simulate(HabitatRequest(duration_days=1, oxygen_kg=0, oxygen_capacity_kg_day=0))
    event = event_for(result,"oxygen")
    assert event.hour == 1
    assert "0.149167 kg required by the crew" in event.message
    assert "0.000000 kg modeled production" in event.message
    assert "0.000000 kg stored oxygen available at the start of the hour" in event.message
    assert "0.149167 kg shortfall" in event.message


def test_oxygen_failure_uses_remaining_inventory_in_later_hour():
    result = simulate(HabitatRequest(duration_days=1, generation_kw=100, oxygen_kg=.2, oxygen_capacity_kg_day=1.2))
    event = event_for(result,"oxygen")
    assert event.hour == 3
    assert "0.050000 kg modeled production" in event.message
    assert "0.001667 kg stored oxygen available at the start of the hour" in event.message
    assert "0.097500 kg shortfall" in event.message
    assert result.readings[2].oxygen_kg == pytest.approx(.001667)


def test_oxygen_catalog_message_ignores_unused_custom_rate():
    settings=dict(duration_days=1,generation_kw=100,crew_size=12,oxygen_kg=.1,
        oxygen_equipment_id="static_feed_electrolyzer_1978",oxygen_equipment_quantity=1)
    a=simulate(HabitatRequest(**settings))
    b=simulate(HabitatRequest(**settings,oxygen_capacity_kg_day=30,electrolyzer_kwh_kg_oxygen=99))
    assert event_for(a,"oxygen") == event_for(b,"oxygen")
    message=event_for(a,"oxygen").message
    assert "0.447500 kg required by the crew" in message
    assert "0.175000 kg modeled production" in message
    assert "0.172500 kg shortfall" in message


def test_water_failure_separates_crew_use_recovery_and_electrolysis():
    result=simulate(HabitatRequest(duration_days=1,water_kg=0))
    event=event_for(result,"water")
    assert event.hour == 1
    assert "0.536167 kg crew use" in event.message
    assert "0.498635 kg modeled recovery" in event.message
    assert "0.187500 kg electrolysis feedwater required" in event.message
    assert "0.000000 kg usable water available at the start of the hour" in event.message
    assert "0.225032 kg shortfall" in event.message


def test_water_failure_uses_remaining_inventory_in_later_hour():
    result=simulate(HabitatRequest(duration_days=1,generation_kw=100,water_kg=1,
        recycling_fraction=0,oxygen_capacity_kg_day=0))
    event=event_for(result,"water")
    assert event.hour == 2
    assert "0.463833 kg usable water available at the start of the hour" in event.message
    assert "0.000000 kg modeled recovery" in event.message
    assert "0.000000 kg electrolysis feedwater required" in event.message
    assert "0.072333 kg shortfall" in event.message


def test_water_catalog_recovery_is_throughput_limited_and_queue_is_not_usable():
    settings=dict(duration_days=1,generation_kw=100,crew_size=12,water_kg=0,
        water_equipment_id="vcds_1979_reference",water_equipment_quantity=1)
    a=simulate(HabitatRequest(**settings))
    b=simulate(HabitatRequest(**settings,recycling_fraction=.98,recycler_power_kw=99))
    assert event_for(a,"water") == event_for(b,"water")
    event=event_for(a,"water")
    assert "1.608500 kg crew use" in event.message
    assert "0.645000 kg modeled recovery" in event.message
    assert "1.151000 kg shortfall" in event.message
    assert "Wastewater waiting for processing is not usable water" in event.message
    assert a.readings[-1].wastewater_kg == pytest.approx(.891833)


def test_no_oxygen_production_means_no_electrolysis_feedwater_requirement():
    result=simulate(HabitatRequest(duration_days=1,generation_kw=100,water_kg=0,oxygen_capacity_kg_day=0))
    message=event_for(result,"water").message
    assert "0.000000 kg electrolysis feedwater required" in message
    assert "0.037532 kg shortfall" in message


def test_simultaneous_shortages_keep_each_diagnostic_without_changing_stop_time():
    result=simulate(HabitatRequest(duration_days=1,oxygen_kg=0,oxygen_capacity_kg_day=0,
        water_kg=0,generation_kw=0,battery_kwh=0))
    assert result.evaluated_hours == 1
    assert {event.resource for event in result.events} == {"oxygen","water","power"}
    assert "0.149167 kg shortfall" in event_for(result,"oxygen").message
    assert "0.037532 kg shortfall" in event_for(result,"water").message
    assert "kWh shortfall" in event_for(result,"power").message
    assert (result.readings[-1].oxygen_kg,result.readings[-1].water_kg,result.readings[-1].battery_kwh) == (0,0,0)


def test_exact_oxygen_balance_is_not_reported_as_shortage():
    result=simulate(HabitatRequest(duration_days=1,generation_kw=100,oxygen_kg=0,oxygen_capacity_kg_day=3.58))
    assert result.resource_balance_complete
    assert not result.events
    assert result.readings[-1].oxygen_kg == 0


def test_exact_water_inventory_is_not_reported_as_shortage():
    result=simulate(HabitatRequest(duration_days=1,generation_kw=100,crew_size=1,
        water_kg=3.217,recycling_fraction=0,oxygen_capacity_kg_day=0))
    assert result.resource_balance_complete
    assert result.readings[-1].water_kg == 0
    assert not result.events


def test_api_and_compact_ai_summary_keep_the_same_messages():
    settings=dict(duration_days=1,oxygen_kg=0,oxygen_capacity_kg_day=0,water_kg=0)
    run=simulate(HabitatRequest(**settings))
    response=TestClient(app).post("/simulate",json=settings)
    assert response.status_code == 200
    expected=[event.model_dump() for event in run.events]
    assert response.json()["events"] == expected
    assert compact_run(run)["events"] == expected
    assert "modeled production" in response.json()["events"][0]["message"]
