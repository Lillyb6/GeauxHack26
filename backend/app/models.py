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
    # Opt-in extension preserves previously saved oxygen/water-only scenarios.
    atmosphere_enabled: bool = False
    cabin_pressure_kpa: float = Field(default=101.325, ge=0, le=200)
    cabin_oxygen_percent: float = Field(default=20.9, ge=0, le=100)
    co2_enabled: bool = False
    co2_equipment_id: str = "cdra_2019_reference"
    co2_equipment_quantity: int = Field(default=1, ge=0, le=4)
    habitat_volume_m3: float = Field(default=100, ge=10, le=10000)
    initial_co2_mmhg: float = Field(default=0.4, ge=0, le=20)
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

    co2_mmhg: float | None = None
    co2_hour_average_mmhg: float | None = None
    co2_removed_kg: float | None = None

class Event(BaseModel):
    hour: int
    resource: str
    message: str

class SimulationResult(BaseModel):
    assumptions_version: str = "0.5.0"
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
    atmosphere_summary: dict | None = None
    co2_equipment_summary: dict | None = None
    co2_balance: dict | None = None
    water_balance: dict
    warnings: list[str] = Field(default_factory=list)


class OptimizationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scenario: HabitatRequest
    oxygen_equipment_id: str
    water_equipment_id: str
    max_oxygen_units: int = Field(default=8, ge=0, le=8)
    max_water_units: int = Field(default=8, ge=0, le=8)
    max_co2_units: int = Field(default=4, ge=0, le=4)
    require_no_wastewater_backlog: bool = False


class CandidateSummary(BaseModel):
    co2_units: int | None = None
    oxygen_units: int
    water_units: int
    eligible: bool
    feasible: bool
    known_hardware_mass_kg: float | None = None
    demand_kw: float | None = None
    evaluated_hours: int | None = None
    constraints_failed: list[str] = Field(default_factory=list)
    exclusion_reason: str | None = None


class OptimizationResult(BaseModel):
    status: Literal["feasible", "no_feasible_candidate", "insufficient_catalog_data"]
    search_request: OptimizationRequest
    manual: SimulationResult
    optimized: SimulationResult | None
    manual_known_hardware_mass_kg: float | None
    optimized_known_hardware_mass_kg: float | None
    known_hardware_mass_saving_kg: float | None
    candidate_count: int
    evaluated_count: int
    feasible_count: int
    excluded_count: int
    constraint_failure_counts: dict[str, int]
    candidates: list[CandidateSummary]
    explanation: str
    objective: str = "Minimum known oxygen + water equipment hardware mass within the enumerated design/count bounds; not total mission mass"
    limitations: list[str]
