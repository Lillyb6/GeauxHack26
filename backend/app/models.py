from typing import Literal
from pydantic import BaseModel, Field, ConfigDict
from .research import PARAMETERS

class HabitatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    environment_id: Literal["mars", "venus", "titan"] = "mars"
    oxygen_equipment_id: str | None = None

    oxygen_equipment_quantity: int = Field(
        default=1,
        ge=0,
        le=8,
    )
    water_equipment_id: str | None = None
    water_equipment_quantity: int = Field(default=1, ge=0, le=8)
    crew_size: int = Field(default=4, ge=1, le=12)
    duration_days: int = Field(default=30, ge=1, le=180)
    oxygen_kg: float = Field(default=30, ge=0, le=10000)
    water_kg: float = Field(default=300, ge=0, le=100000)
    battery_kwh: float = Field(default=100, ge=0, le=10000)
    generation_kw: float = Field(default=8, ge=0, le=100)
    oxygen_capacity_kg_day: float = Field(default=4, ge=0, le=30)
    recycling_fraction: float = Field(default=PARAMETERS["recycling_fraction"]["value"], ge=0, le=0.98)

    other_load_kw: float = Field(default=PARAMETERS["other_load_kw"]["value"], ge=0, le=100)
    recycler_power_kw: float = Field(default=PARAMETERS["recycler_power_kw"]["value"], ge=0, le=100)
    electrolyzer_kwh_kg_oxygen: float = Field(default=PARAMETERS["electrolyzer_kwh_kg_oxygen"]["value"], gt=0, le=100)
    heat_loss_kw_k: float = Field(default=PARAMETERS["heat_loss_kw_k"]["value"], gt=0, le=10)
    interior_temperature_c: float = Field(default=PARAMETERS["interior_temperature_c"]["value"], ge=10, le=30)
    hvac_cop: float = Field(default=PARAMETERS["hvac_cop"]["value"], gt=0, le=10)

class Reading(BaseModel):
    hour: int
    oxygen_kg: float
    water_kg: float
    battery_kwh: float
    wastewater_kg: float = 0
    recovered_water_kg: float = 0
    brine_water_kg: float = 0

class Event(BaseModel):
    hour: int
    resource: str
    message: str

class SimulationResult(BaseModel):
    assumptions_version: str = "0.3.0"
    request: HabitatRequest
    resource_balance_complete: bool
    evaluated_hours: int
    demand_kw: float
    thermal_load_kw: float
    events: list[Event]
    readings: list[Reading]
    limitations: list[str]
    scientific_status: str = "Exploratory: contains unvalidated design inputs and transferred reference data"
    evidence: dict
    sources: dict
    environment_reference: dict
    equipment_summary: dict | None = None
    water_equipment_summary: dict | None = None
    water_balance: dict
    warnings: list[str] = Field(default_factory=list)
