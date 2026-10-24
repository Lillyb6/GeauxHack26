from .thermal import check_thermal_capacity
from .atmosphere import screen_atmosphere, atmosphere_evidence
from .models import HabitatRequest, SimulationResult, Reading, Event
from .environments import ENVIRONMENTS
from .equipment import resolve_oxygen_equipment, resolve_water_equipment
from .research import PARAMETERS, evidence_for, sources_for
from .co2 import resolve_co2_equipment, pressure_per_kg, advance_pressure, co2_evidence, CREW_CO2_KG_DAY, CO2_LIMIT_MMHG

LIMITATIONS = [
    "Resource-balance prototype; completion does not establish human survival or mission feasibility.",
    "Pressure vessels, radiation, food, waste, medical risks and equipment reliability are not modeled. CO2 screening is opt-in and idealized.",
    "Fixed exterior temperature, simplified conduction/HVAC, ideal battery, continuous generation and instant potable-water recovery are unvalidated assumptions.",
    "ISS equipment and recovery references are transferred proxies, not validated performance in planetary environments.",
    "Venus surface materials and cooling feasibility are not validated; Titan is a moon, not a planet.",
]

def simulate(req: HabitatRequest) -> SimulationResult:
    env = next(e for e in ENVIRONMENTS if e["id"] == req.environment_id)
    # Conduction-only envelope proxy, not a validated whole-habitat thermal design.
    thermal_summary = check_thermal_capacity(
        req.interior_temperature_c, env["temperature_c"], req.heat_loss_kw_k,
        req.heating_capacity_kw, req.cooling_capacity_kw, req.hvac_cop,
    )
    thermal = thermal_summary["required_electric_kw"]
    thermal_summary["enabled"] = req.thermal_capacity_enabled
    thermal_summary["status"] = (
        "sufficient" if thermal_summary["capacity_sufficient"] else "insufficient"
    ) if req.thermal_capacity_enabled else "not_evaluated"
    if not req.thermal_capacity_enabled:
        # Electricity is still estimated; unused capacities must not imply a failed screen.
        for key in ("available_thermal_kw", "margin_kw", "capacity_sufficient"):
            thermal_summary[key] = None
    thermal_summary["limitations"] = [
        "Steady conduction only: Q = UA * abs(T_inside - T_outside).",
        "Capacities and COP are design inputs, not NASA equipment ratings.",
        "Required electricity is a setpoint requirement, not actual operation during a failed run.",
        "No temperature trajectory, thermal inertia, internal heat, solar input, convection, radiation or heat-rejection feasibility is simulated.",
    ]
    crew_water_day = req.crew_size * PARAMETERS["water_consumption_kg_person_day"]["value"]
    water_equipment_summary = None
    warnings = []
    if req.water_equipment_id is not None:
        water_equipment_summary = resolve_water_equipment(req.water_equipment_id, req.water_equipment_quantity)
        recycler = water_equipment_summary["electrical_power_kw"]
        recovery_fraction = water_equipment_summary["recovery_fraction"]
        feed_budget_day = water_equipment_summary["feed_capacity_kg_day"]
        if crew_water_day > feed_budget_day + 1e-9:
            warnings.append(f"Water processor design feed budget ({feed_budget_day:.3f} kg/day) is below modeled wastewater generation ({crew_water_day:.3f} kg/day). Unprocessed water accumulates; this is a capacity warning, not immediate mission failure.")
    else:
        recycler = req.recycler_power_kw if req.recycling_fraction > 0 else 0
        recovery_fraction = req.recycling_fraction
        feed_budget_day = None
    wastewater = recovered_total = brine_total = 0.0
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
    co2_summary=resolve_co2_equipment(req.co2_equipment_id,req.co2_equipment_quantity) if req.co2_enabled else None
    alpha=pressure_per_kg(req.habitat_volume_m3,req.interior_temperature_c) if req.co2_enabled else None
    co2_pressure=req.initial_co2_mmhg if req.co2_enabled else None
    co2_removed=0.0
    demand = (req.other_load_kw + recycler + thermal + oxygen_power + (co2_summary["electrical_power_kw"] if co2_summary else 0))
    oxygen, water, battery = (
        req.oxygen_kg,
        req.water_kg,
        req.battery_kwh,
    )
    readings = [Reading(hour=0, oxygen_kg=oxygen, water_kg=water, battery_kwh=battery,co2_mmhg=co2_pressure,co2_removed_kg=0 if req.co2_enabled else None)]
    atmosphere_summary=screen_atmosphere(req)
    events = []
    if req.thermal_capacity_enabled and not thermal_summary["capacity_sufficient"]:
        events.append(Event(hour=0, resource="thermal", message=(
            f"Insufficient {thermal_summary['mode']} capacity: this model requires "
            f"{thermal_summary['required_thermal_kw']:.3f} kW thermal; selected capacity is "
            f"{thermal_summary['available_thermal_kw']:.3f} kW thermal "
            f"(shortfall {-thermal_summary['margin_kw']:.3f} kW). "
            "The target indoor temperature cannot be maintained under the model assumptions; no mission hours evaluated."
        )))
    elif not req.thermal_capacity_enabled:
        warnings.append("Heating/cooling capacity screening is disabled; HVAC electricity is estimated assuming the target temperature can be maintained.")
    if atmosphere_summary:
        events.extend(Event(hour=0,resource=check["id"],message=check["message"])
            for check in atmosphere_summary["checks"] if not check["passed"])
    hour=0
    if req.co2_enabled and co2_pressure>CO2_LIMIT_MMHG+1e-9:
        events.append(Event(hour=0,resource="co2",message="Initial cabin CO2 exceeds the 3 mmHg screening level; no mission hours evaluated."))
    for hour in range(1, (0 if events else req.duration_days * 24) + 1):
        # Oxygen capacity represents water electrolysis, not free atmospheric extraction.
        produced = oxygen_rate / 24
        # Simplified accounting boundary: potable crew use becomes available feed immediately.
        # Food/metabolic water and true wastewater composition/delays remain outside this model.
        wastewater += crew_water_day / 24
        processed = wastewater if feed_budget_day is None else min(wastewater, feed_budget_day / 24)
        recovered = processed * recovery_fraction
        wastewater -= processed
        recovered_total += recovered
        brine_total += processed - recovered
        water_used = crew_water_day / 24 - recovered + produced * PARAMETERS["electrolysis_water_ratio"]["value"]
        next_values = {
            "oxygen": oxygen + produced - req.crew_size * PARAMETERS["oxygen_consumption_kg_person_day"]["value"] / 24,
            "water": water - water_used,
            "power": battery + req.generation_kw - demand,
        }
        for resource, value in next_values.items():
            if value < -1e-9:
                if resource == "power":
                    message = (
                        f"Power shortage during hour {hour}: "
                        f"{demand:.3f} kWh required; "
                         f"{req.generation_kw:.3f} kWh generated; "
                         f"{battery:.3f} kWh available in the battery "
                         f"at the start of the hour; "
                         f"{-value:.3f} kWh shortfall."
                    )
                else:
                    message = (
                        f"{resource.capitalize()} demand cannot be met "
                        f"during hour {hour}."
                    )

                events.append(
                    Event(
                        hour=hour,
                        resource=resource,
                        message=message,
                    )
                )
        co2_average=None
        if req.co2_enabled:
            co2_pressure,co2_average,removed=advance_pressure(co2_pressure,req.crew_size*CREW_CO2_KG_DAY/24,
                co2_summary["co2_capacity_kg_day"]/24,alpha,co2_summary["reference_ppco2_mmhg"])
            co2_removed+=removed
            if co2_average>CO2_LIMIT_MMHG+1e-9:
                events.append(Event(hour=hour,resource="co2",message=f"Cabin CO2 one-hour average exceeds the 3 mmHg screening limit during hour {hour}."))
        # End-of-hour balances; stop on first deficient hour. Battery capacity is initial charge.
        oxygen = max(0, next_values["oxygen"])
        water = max(0, next_values["water"])
        battery = max(0, min(req.battery_kwh, next_values["power"]))
        readings.append(Reading(hour=hour, oxygen_kg=round(oxygen,6), water_kg=round(water,6), battery_kwh=round(battery,6),
            wastewater_kg=round(wastewater,6), recovered_water_kg=round(recovered_total,6), brine_water_kg=round(brine_total,6), co2_mmhg=round(co2_pressure,6) if req.co2_enabled else None,
            co2_hour_average_mmhg=round(co2_average,6) if req.co2_enabled else None,co2_removed_kg=round(co2_removed,6) if req.co2_enabled else None))
        if events:
            break
    evidence = evidence_for(req, equipment_summary, water_equipment_summary)
    if req.co2_enabled:
        evidence.update(co2_evidence(req,co2_summary))
    else:
        warnings.append("CO2 screening is disabled; cabin CO2 accumulation and scrubber power/mass are not evaluated.")
    if atmosphere_summary:
        evidence.update(atmosphere_evidence(req,atmosphere_summary))
    else:
        warnings.append("Cabin atmosphere screening is disabled; total pressure, inspired oxygen and inert diluent are not evaluated.")
    limitations = list(LIMITATIONS) + thermal_summary["limitations"]
    if atmosphere_summary:
        limitations.extend(atmosphere_summary["limitations"])
    if co2_summary:
        limitations.extend(co2_summary["limitations"])
    if equipment_summary is not None:
        limitations.extend(equipment_summary["limitations"])
    if water_equipment_summary is not None:
        limitations.extend(water_equipment_summary["limitations"])
    water_balance = {
        "mode":"catalog" if water_equipment_summary is not None else "custom_unbounded",
        "crew_water_use_kg_day":round(crew_water_day,6),
        "feed_capacity_kg_day":feed_budget_day,
        "recovery_fraction_of_processed_feed":recovery_fraction,
        "recovered_water_kg":round(recovered_total,6),
        "unprocessed_wastewater_kg":round(wastewater,6),
        "brine_water_kg":round(brine_total,6),
        "effective_recovery_fraction":recovered_total / (crew_water_day * hour / 24) if hour else 0,
    }
    return SimulationResult(equipment_summary=equipment_summary,request=req, resource_balance_complete=not events,
        evaluated_hours=hour, demand_kw=round(demand,3), thermal_load_kw=round(thermal,3), thermal_summary=thermal_summary,
        events=events, readings=readings, limitations=limitations,
        evidence=evidence, sources=sources_for(evidence, req.environment_id, equipment_summary, water_equipment_summary), environment_reference=env,
        water_equipment_summary=water_equipment_summary, water_balance=water_balance, warnings=warnings,
        atmosphere_summary=atmosphere_summary, co2_equipment_summary=co2_summary,
        co2_balance={"initial_kg":req.initial_co2_mmhg/alpha,"generated_kg":req.crew_size*CREW_CO2_KG_DAY*hour/24,
            "removed_kg":co2_removed,"end_kg":co2_pressure/alpha,"limit_mmhg":CO2_LIMIT_MMHG,
            "limit_basis":"one-hour average; initial state separately screened","response_curve":"unvalidated linear below 2 mmHg, capped above"} if req.co2_enabled else None)
