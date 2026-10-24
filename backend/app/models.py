from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

class HabitatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    environment_id: Literal["mars", "venus", "titan"] = "mars"
    crew_size: int = Field(default=4, ge=1, le=12)
    duration_days: int = Field(default=30, ge=1, le=180)
    oxygen_kg: float = Field(default=30, ge=0, le=10000)
    water_kg: float = Field(default=300, ge=0, le=100000)
    battery_kwh: float = Field(default=100, ge=0, le=10000)
    generation_kw: float = Field(default=8, ge=0, le=100)
    oxygen_capacity_kg_day: float = Field(default=4, ge=0, le=30)
    recycling_fraction: float = Field(default=0.9, ge=0, le=0.98)

class Reading(BaseModel):
    hour: int
    oxygen_kg: float
    water_kg: float
    battery_kwh: float

class Event(BaseModel):
    hour: int
    resource: str
    message: str

class SimulationResult(BaseModel):
    assumptions_version: str = "0.1.0"
    request: HabitatRequest
    resource_balance_complete: bool
    evaluated_hours: int
    demand_kw: float
    thermal_load_kw: float
    events: list[Event]
    readings: list[Reading]
    limitations: list[str]
