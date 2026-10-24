from .models import HabitatRequest, SimulationResult, Reading, Event
from .environments import ENVIRONMENTS
from .equipment import resolve_oxygen_equipment
from .research import PARAMETERS, evidence_for, sources_for

LIMITATIONS = [
    "Resource-balance prototype; completion does not establish human survival or mission feasibility.",
    "Pressure vessels, radiation, CO2 scrubbing, food, waste, medical risks and equipment reliability are not modeled.",
    "Fixed exterior temperature, simplified conduction/HVAC, ideal battery, continuous generation and instant potable-water recovery are unvalidated assumptions.",
    "ISS equipment and recovery references are transferred proxies, not validated performance in planetary environments.",
    "Venus surface materials and cooling feasibility are not validated; Titan is a moon, not a planet.",
]

def simulate(req: HabitatRequest) -> SimulationResult:
    env = next(e for e in ENVIRONMENTS if e["id"] == req.environment_id)
    # Conduction-only envelope proxy, not a validated whole-habitat thermal design.
    thermal = abs(req.interior_temperature_c - env["temperature_c"]) * req.heat_loss_kw_k / req.hvac_cop
    recycler = req.recycler_power_kw if req.recycling_fraction > 0 else 0
    equipment_summary = None

    if req.oxygen_equipment_id is not None:
        equipment_summary = resolve_oxygen_equipment(
            req.oxygen_equipment_id,
            req.oxygen_equipment_quantity,
        )

        oxygen_rate = equipment_summary["oxygen_output_kg_day"]
        oxygen_power = equipment_summary["electrical_power_kw"]

    else:
        oxygen_rate = req.oxygen_capacity_kg_day

        oxygen_power = (
            oxygen_rate
            * req.electrolyzer_kwh_kg_oxygen
            / 24
        )
    demand = (req.other_load_kw + recycler + thermal + oxygen_power)
    oxygen, water, battery = (
        req.oxygen_kg,
        req.water_kg,
        req.battery_kwh,
    )
    readings = [Reading(hour=0, oxygen_kg=oxygen, water_kg=water, battery_kwh=battery)]
    events = []
    for hour in range(1, req.duration_days * 24 + 1):
        # Oxygen capacity represents water electrolysis, not free atmospheric extraction.
        produced = oxygen_rate / 24
        water_used = req.crew_size * PARAMETERS["water_consumption_kg_person_day"]["value"] * (1 - req.recycling_fraction) / 24 + produced * PARAMETERS["electrolysis_water_ratio"]["value"]
        next_values = {
            "oxygen": oxygen + produced - req.crew_size * PARAMETERS["oxygen_consumption_kg_person_day"]["value"] / 24,
            "water": water - water_used,
            "power": battery + req.generation_kw - demand,
        }
        for resource, value in next_values.items():
            if value < -1e-9:
                events.append(Event(hour=hour, resource=resource,
                    message=f"{resource.capitalize()} demand cannot be met during hour {hour}."))
        # End-of-hour balances; stop on first deficient hour. Battery capacity is initial charge.
        oxygen = max(0, next_values["oxygen"])
        water = max(0, next_values["water"])
        battery = max(0, min(req.battery_kwh, next_values["power"]))
        readings.append(Reading(hour=hour, oxygen_kg=round(oxygen,6), water_kg=round(water,6), battery_kwh=round(battery,6)))
        if events:
            break
    evidence = evidence_for(req, equipment_summary)
    limitations = list(LIMITATIONS)
    if equipment_summary is not None:
        limitations.extend(equipment_summary["limitations"])
    return SimulationResult(equipment_summary=equipment_summary,request=req, resource_balance_complete=not events,
        evaluated_hours=hour, demand_kw=round(demand,3), thermal_load_kw=round(thermal,3),
        events=events, readings=readings, limitations=limitations,
        evidence=evidence, sources=sources_for(evidence, req.environment_id, equipment_summary), environment_reference=env)
