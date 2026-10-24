"""Keep the frontend's persistence-test fixture aligned with the canonical API contract."""
import json
from pathlib import Path
from app.models import HabitatRequest,OptimizationRequest
from app.equipment import EQUIPMENT


def test_frontend_mission_fixture_matches_current_contract():
    root=Path(__file__).resolve().parents[2]
    fixture=json.loads((root/"frontend/test-fixtures/mission-context.json").read_text(encoding="utf-8"))
    assert fixture["defaults"]==HabitatRequest().model_dump()
    assert fixture["schemas"]["HabitatRequest"]==HabitatRequest.model_json_schema()
    assert fixture["schemas"]["OptimizationRequest"]==OptimizationRequest.model_json_schema()
    assert fixture["equipment"]==[{"id":item["id"],"category":item["category"]} for item in EQUIPMENT]
