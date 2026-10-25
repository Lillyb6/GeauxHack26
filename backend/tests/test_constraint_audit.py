"""Independent pass/fail scenarios across all destinations and modeled constraints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine import simulate
from app.models import HabitatRequest
from app.co2 import CREW_CO2_KG_DAY, pressure_per_kg, advance_pressure, PA_PER_MMHG

PLANETS=['mars','venus','titan']
def scenario(**patch):
    values=dict(duration_days=3,oxygen_kg=1000,water_kg=10000,generation_kw=100,
                thermal_capacity_enabled=True,heating_capacity_kw=30,cooling_capacity_kw=30,
                atmosphere_enabled=True,co2_enabled=True,co2_equipment_quantity=2)
    values.update(patch)
    return HabitatRequest(**values)

@pytest.mark.parametrize('planet',PLANETS)
def test_all_enabled_constraints_can_pass_on_each_world(planet):
    result=simulate(scenario(environment_id=planet))
    assert result.resource_balance_complete and result.evaluated_hours==72
    assert all(c['passed'] for c in result.atmosphere_summary['checks'])
    assert result.thermal_summary['capacity_sufficient']
    assert all((r.co2_hour_average_mmhg or 0)<=3 for r in result.readings)

@pytest.mark.parametrize('planet,mode,required,passes',[
    ('mars','heating',3.2,True),('venus','cooling',17.72,False),('titan','heating',8.04,False)])
def test_same_thermal_design_has_different_planet_outcomes(planet,mode,required,passes):
    r=simulate(scenario(environment_id=planet,heating_capacity_kw=4,cooling_capacity_kw=4))
    assert r.thermal_summary['mode']==mode
    assert r.thermal_summary['required_thermal_kw']==pytest.approx(required)
    assert r.resource_balance_complete==passes
    if not passes:assert r.events[0].resource=='thermal' and r.events[0].hour==0

@pytest.mark.parametrize('planet',PLANETS)
@pytest.mark.parametrize('patch,resource',[
    ({'oxygen_kg':0,'oxygen_capacity_kg_day':0},'oxygen'),
    ({'water_kg':0,'recycling_fraction':0},'water'),
    ({'generation_kw':0,'battery_kwh':0},'power'),
    ({'co2_equipment_quantity':0},'co2'),
    ({'cabin_pressure_kpa':25},'cabin_pressure'),
    ({'cabin_oxygen_percent':10},'inspired_oxygen'),
    ({'cabin_oxygen_percent':80},'inert_diluent'),
    ({'heating_capacity_kw':0,'cooling_capacity_kw':0},'thermal'),
])
def test_each_constraint_can_fail_on_each_world(planet,patch,resource):
    r=simulate(scenario(environment_id=planet,**patch))
    assert not r.resource_balance_complete
    assert resource in {e.resource for e in r.events}

@pytest.mark.parametrize('planet',PLANETS)
@pytest.mark.parametrize('crew,units,passes',[(1,1,True),(4,1,False),(4,2,True),(6,1,False),(6,2,True),(12,2,False),(12,4,True)])
def test_co2_crew_and_scrubber_sweep(planet,crew,units,passes):
    r=simulate(scenario(environment_id=planet,crew_size=crew,co2_equipment_quantity=units))
    assert r.resource_balance_complete==passes
    if not passes:assert {e.resource for e in r.events}=={'co2'}

@pytest.mark.parametrize('planet',PLANETS)
def test_co2_is_cabin_based_not_external_atmosphere(planet):
    r=simulate(scenario(environment_id=planet,co2_equipment_quantity=0))
    expected=.4+pressure_per_kg(100,21)*4*CREW_CO2_KG_DAY/24
    assert r.readings[1].co2_mmhg==pytest.approx(expected,abs=1e-6)
    assert r.events[0].hour==4

@pytest.mark.parametrize('planet',PLANETS)
def test_lower_pressure_can_pass_with_an_adjusted_oxygen_mix(planet):
    oxygen=150/(35000/PA_PER_MMHG-47)*100
    r=simulate(scenario(environment_id=planet,cabin_pressure_kpa=35,cabin_oxygen_percent=oxygen))
    assert r.resource_balance_complete
    assert r.atmosphere_summary['inspired_oxygen_partial_pressure_mmhg']==pytest.approx(150)

@pytest.mark.parametrize('planet',PLANETS)
def test_zero_hour_collects_all_failed_setup_checks_without_consumption(planet):
    r=simulate(scenario(environment_id=planet,heating_capacity_kw=0,cooling_capacity_kw=0,
        cabin_pressure_kpa=150,cabin_oxygen_percent=80,initial_co2_mmhg=4))
    assert {e.resource for e in r.events}=={'thermal','cabin_pressure','inspired_oxygen','inert_diluent','co2'}
    assert all(e.hour==0 for e in r.events)
    assert r.evaluated_hours==0 and len(r.readings)==1
    assert r.co2_balance['generated_kg']==0

@pytest.mark.parametrize('planet',PLANETS)
def test_api_reports_real_co2_failure_and_disabled_scope(planet):
    client=TestClient(app)
    req=scenario(environment_id=planet,co2_equipment_quantity=0)
    body=client.post('/simulate',json=req.model_dump()).json()
    assert body['events'][0]['resource']=='co2' and body['events'][0]['hour']==4
    req.co2_enabled=False
    disabled=client.post('/simulate',json=req.model_dump()).json()
    assert disabled['resource_balance_complete']
    assert disabled['co2_balance'] is None
    assert all(r['co2_mmhg'] is None for r in disabled['readings'])

@pytest.mark.parametrize('units',[0,1,2])
def test_co2_result_explains_daily_generation_and_capacity(units):
    r=simulate(scenario(co2_equipment_quantity=units))
    assert r.co2_balance['crew_generation_kg_day']==pytest.approx(4.34)
    assert r.co2_balance['installed_capacity_kg_day']==pytest.approx(units*4.16)
    assert r.co2_balance['capacity_margin_kg_day']==pytest.approx(units*4.16-4.34)
    assert any('CO2 removal capacity' in warning for warning in r.warnings)==(units<2)

@pytest.mark.parametrize('p,generation,capacity,volume',[(0,.2,.3,10),(1.9,.3,.2,100),(3,.1,.4,100),(2,.3,.2,10000)])
def test_co2_time_step_partition_preserves_pressure_and_mass(p,generation,capacity,volume):
    alpha=pressure_per_kg(volume,21)
    end,average,removed=advance_pressure(p,generation,capacity,alpha)
    value=p;integral=removed_total=0
    for _ in range(60):
        value,part_average,part_removed=advance_pressure(value,generation,capacity,alpha,hours=1/60)
        integral+=part_average/60;removed_total+=part_removed
    assert value==pytest.approx(end,abs=1e-10)
    assert integral==pytest.approx(average,abs=1e-10)
    assert removed_total==pytest.approx(removed,abs=1e-10)


# Exercise the actual API response consumed by the mission UI. Each row starts
# from a passing 30-day build and deliberately breaks a modeled requirement.
FAILURE_CASES = [
    pytest.param({'oxygen_kg': 0, 'oxygen_capacity_kg_day': 0}, {'oxygen'}, 1, id='oxygen-depleted'),
    pytest.param({'water_kg': 0, 'recycling_fraction': 0}, {'water'}, 1, id='water-depleted'),
    pytest.param({'generation_kw': 0, 'battery_kwh': 0}, {'power'}, 1, id='power-unavailable'),
    pytest.param({'heating_capacity_kw': 0, 'cooling_capacity_kw': 0}, {'thermal'}, 0, id='temperature-control-undersized'),
    pytest.param({'cabin_pressure_kpa': 25}, {'cabin_pressure', 'inspired_oxygen'}, 0, id='cabin-pressure-low'),
    pytest.param({'cabin_pressure_kpa': 104, 'cabin_oxygen_percent': 150 / (104000 / PA_PER_MMHG - 47) * 100}, {'cabin_pressure'}, 0, id='cabin-pressure-high'),
    pytest.param({'cabin_oxygen_percent': 10}, {'inspired_oxygen'}, 0, id='inspired-oxygen-low'),
    pytest.param({'cabin_oxygen_percent': 30}, {'inspired_oxygen'}, 0, id='inspired-oxygen-high'),
    pytest.param({'cabin_oxygen_percent': 80}, {'inspired_oxygen', 'inert_diluent'}, 0, id='inert-gas-insufficient'),
    pytest.param({'co2_equipment_quantity': 0}, {'co2'}, 4, id='co2-removal-missing'),
    pytest.param({'initial_co2_mmhg': 4}, {'co2'}, 0, id='initial-co2-high'),
]

@pytest.mark.parametrize('planet', PLANETS)
@pytest.mark.parametrize('patch,expected_resources,failed_hour', FAILURE_CASES)
def test_planet_failure_scenarios_through_api(planet, patch, expected_resources, failed_hour):
    request = scenario(environment_id=planet, duration_days=30, **patch)
    response = TestClient(app).post('/simulate', json=request.model_dump())
    assert response.status_code == 200
    result = response.json()
    assert not result['resource_balance_complete']
    assert result['request']['environment_id'] == planet
    assert {event['resource'] for event in result['events']} == expected_resources
    assert {event['hour'] for event in result['events']} == {failed_hour}
    # evaluated_hours includes the hour in which a shortage was evaluated.
    assert result['evaluated_hours'] == failed_hour
    assert result['readings'][-1]['hour'] == failed_hour
    assert all(event['message'].strip() for event in result['events'])
    assert result['request']['thermal_capacity_enabled']
    assert result['request']['atmosphere_enabled']
    assert result['request']['co2_enabled']

@pytest.mark.parametrize('planet', PLANETS)
def test_thirty_day_all_checks_passing_build_through_api(planet):
    response = TestClient(app).post('/simulate', json=scenario(
        environment_id=planet, duration_days=30).model_dump())
    assert response.status_code == 200
    result = response.json()
    assert result['resource_balance_complete']
    assert result['evaluated_hours'] == 720
    assert result['events'] == []
    assert result['thermal_summary']['capacity_sufficient']
    assert all(check['passed'] for check in result['atmosphere_summary']['checks'])
    assert max(reading['co2_hour_average_mmhg'] for reading in result['readings'][1:]) <= 3
