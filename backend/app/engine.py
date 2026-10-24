from .models import HabitatRequest, SimulationResult, Reading, Event
from .environments import ENVIRONMENTS

LIMITATIONS = [
    "Resource-balance prototype; completion does not establish human survival or mission feasibility.",
    "Pressure vessels, radiation, CO2 scrubbing, food, waste, medical risks and equipment reliability are not modeled.",
    "Fixed exterior temperature, ideal thermal control, continuous external generation and immediate water recovery are assumptions.",
    "Venus surface materials and cooling feasibility are not validated; Titan is a moon, not a planet.",
]

def simulate(req: HabitatRequest) -> SimulationResult:
    env = next(e for e in ENVIRONMENTS if e["id"] == req.environment_id)
    # Simplified heat leak UA = 0.04 kW/K; ideal heater/cooler COP = 1.
    thermal = abs(21 - env["temperature_c"]) * 0.04
    # 0.8 kW/person hotel load + 0.5 kW recycler + 5 kWh/kg electrolysis.
    demand = req.crew_size * 0.8 + 0.5 + thermal + req.oxygen_capacity_kg_day * 5 / 24
    oxygen, water, battery = req.oxygen_kg, req.water_kg, req.battery_kwh
    readings = [Reading(hour=0, oxygen_kg=oxygen, water_kg=water, battery_kwh=battery)]
    events = []
    for hour in range(1, req.duration_days * 24 + 1):
        # Oxygen capacity represents water electrolysis, not free atmospheric extraction.
        produced = req.oxygen_capacity_kg_day / 24
        water_used = req.crew_size * 3.5 * (1 - req.recycling_fraction) / 24 + produced * 1.125
        next_values = {
            "oxygen": oxygen + produced - req.crew_size * 0.84 / 24,
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
    return SimulationResult(request=req, resource_balance_complete=not events,
        evaluated_hours=hour, demand_kw=round(demand,3), thermal_load_kw=round(thermal,3),
        events=events, readings=readings, limitations=LIMITATIONS)
