"""Exercise the same prefixed API and SPA routing used by the Vercel entrypoint."""
import importlib.util
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def deployed_client(tmp_path, monkeypatch):
    root=Path(__file__).resolve().parents[2]
    monkeypatch.syspath_prepend(str(root))
    monkeypatch.chdir(tmp_path)
    dist=tmp_path/'frontend/dist'
    (dist/'assets').mkdir(parents=True)
    (dist/'index.html').write_text('<!doctype html><title>Mission test</title><div id="root">Beyond Earth</div>')
    (dist/'assets/test.js').write_text('console.log("test")')
    spec=importlib.util.spec_from_file_location('deployed_mission_entrypoint',root/'main.py')
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return TestClient(module.app)


def test_deployed_api_prefix_and_bundled_catalog(deployed_client):
    assert deployed_client.get('/api/health').json()=={'status':'ok'}
    assert len(deployed_client.get('/api/environments').json())==3
    assert any(item['category']=='oxygen_generation' for item in deployed_client.get('/api/equipment').json())
    assert 'HabitatRequest' in deployed_client.get('/api/openapi.json').json()['components']['schemas']


def test_deployed_simulation_uses_existing_engine(deployed_client):
    response=deployed_client.post('/api/simulate',json={'duration_days':1,'generation_kw':100})
    assert response.status_code==200
    assert response.json()['resource_balance_complete']
    assert response.json()['evaluated_hours']==24


@pytest.mark.parametrize('path',['/','/simulation','/tutorial','/help'])
def test_direct_spa_navigation_works_after_refresh(deployed_client,path):
    response=deployed_client.get(path,headers={'accept':'text/html'})
    assert response.status_code==200
    assert '<div id="root">' in response.text


def test_unknown_api_is_not_replaced_with_html(deployed_client):
    response=deployed_client.get('/api/unknown',headers={'accept':'text/html'})
    assert response.status_code==404
    assert response.headers['content-type'].startswith('application/json')


def test_assets_are_served_and_missing_scripts_do_not_get_html(deployed_client):
    response=deployed_client.get('/assets/test.js')
    assert response.status_code==200
    assert 'console.log' in response.text
    assert deployed_client.get('/assets/missing.js').status_code==404
