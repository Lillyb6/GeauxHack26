import json
from pathlib import Path

CATALOG_PATH = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "equipment.json"
)

with CATALOG_PATH.open(encoding="utf-8") as file:
    EQUIPMENT = json.load(file)

EQUIPMENT_BY_ID = {
    item["id"]: item
    for item in EQUIPMENT
}


def resolve_oxygen_equipment(equipment_id: str, quantity: int) -> dict:
    if isinstance(quantity, bool) or not isinstance(quantity, int) or not 0 <= quantity <= 8:
        raise ValueError("Equipment quantity must be an integer from 0 to 8.")
    item = EQUIPMENT_BY_ID.get(equipment_id)

    if item is None:
        raise ValueError(f"Unknown equipment ID: {equipment_id}")

    if item["category"] != "oxygen_generation":
        raise ValueError("Selected equipment does not generate oxygen.")

    required = (
        "oxygen_output_kg_day",
        "electrical_power_kw",
    )

    if any(item.get(field) is None for field in required):
        raise ValueError(
            "Insufficient equipment data to evaluate oxygen and power."
        )

    mass = item.get("hardware_mass_kg")

    return {
        "equipment_id": equipment_id,
        "name": item["name"],
        "quantity": quantity,
        "oxygen_output_kg_day": (
            item["oxygen_output_kg_day"] * quantity
        ),
        "electrical_power_kw": (
            item["electrical_power_kw"] * quantity
        ),
        "known_hardware_mass_kg": (
            None if mass is None else mass * quantity
        ),
        "operating_temperature_min_c": item.get("operating_temperature_min_c"),
        "operating_temperature_max_c": item.get("operating_temperature_max_c"),
        "source": item["source"],
        "limitations": item["limitations"],
        "evidence_status": item["evidence_status"],
    }