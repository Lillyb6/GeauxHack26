"""Explicit power, water and thermal-capacity proposals; the fixed-constraint optimizer stays unchanged."""
from math import ceil
from collections import Counter
from .models import CandidateSummary
from .engine import simulate
from .optimizer import optimize, known_hardware_mass


def improve(request):
    fixed = optimize(request)
    if fixed.optimized is not None or fixed.status == "insufficient_catalog_data":
        return fixed
    # A bounded second search asks whether power alone can unlock the same equipment bounds.
    ceiling = 100.0
    updates = {"generation_kw": ceiling}
    thermal = fixed.manual.thermal_summary
    if request.scenario.thermal_capacity_enabled and not thermal["capacity_sufficient"]:
        field = "heating_capacity_kw" if thermal["mode"] == "heating" else "cooling_capacity_kw"
        required = ceil(thermal["required_thermal_kw"] * 1000) / 1000
        # Stay inside the public input bounds. Never disable a failed check.
        if required <= 1000:
            updates[field] = max(getattr(request.scenario, field), required)
    scenario = request.scenario.model_copy(update=updates)
    expanded = optimize(request.model_copy(update={"scenario": scenario}))
    expanded.recovery_attempted = True
    expanded.recovery_search_generation_kw = ceiling
    expanded.fixed_constraint_counts = fixed.constraint_failure_counts
    expanded.search_request = request
    expanded.manual = fixed.manual
    expanded.manual_known_hardware_mass_kg = fixed.manual_known_hardware_mass_kg
    expanded.limitations = [line for line in expanded.limitations if not line.startswith(("Search changes catalog IDs/counts only", "Optional thermal screening keeps"))]
    expanded.limitations.insert(1, "A second equipment search allows up to 100 kW continuous generation. Equipment counts/IDs, proposed generation and (if needed) initial water and enabled heating/cooling capacity may change. Thermal capacity is sized to the modeled load, up to 1000 kW thermal. Planet, crew, duration, oxygen inventory, battery, target temperature, conductance, COP, atmosphere settings and check enable flags stay fixed. Counts in the audit refer to the 100 kW search; fixed-budget constraints are recorded separately.")
    expanded.limitations.append("Thermal and power-system hardware, fuel and storage are not designed or included in equipment mass. Proposed generation must be engineered separately; no minimum-power or global optimum is claimed.")
    if expanded.optimized is None:
        # Water shortfall can prevent even correctly sized life support from completing.
        # Search the same hardware envelope with ample water, derive its peak net use,
        # then verify each proposal at that water quantity and its own power budget.
        water_ceiling = 100000.0
        candidates, counts, verified = [], Counter(), []
        for item in expanded.candidates:
            trial_request = scenario.model_copy(update={
                "water_kg": water_ceiling,
                "oxygen_equipment_id": request.oxygen_equipment_id,
                "water_equipment_id": request.water_equipment_id,
                "oxygen_equipment_quantity": item.oxygen_units,
                "water_equipment_quantity": item.water_units,
                "co2_equipment_quantity": item.co2_units if item.co2_units is not None else scenario.co2_equipment_quantity,
            })
            trial = simulate(trial_request)
            mass = known_hardware_mass(trial)
            failures = sorted({event.resource for event in trial.events})
            if request.require_no_wastewater_backlog and trial.readings[-1].wastewater_kg > 1e-6:
                failures.append("wastewater_backlog")
            valid = mass is not None and trial.resource_balance_complete and not failures
            candidates.append(CandidateSummary(oxygen_units=item.oxygen_units, water_units=item.water_units, co2_units=item.co2_units,
                eligible=mass is not None, feasible=valid, known_hardware_mass_kg=mass, demand_kw=trial.demand_kw,
                evaluated_hours=trial.evaluated_hours, constraints_failed=failures))
            counts.update(failures)
            if not valid:
                continue
            water_needed = max(request.scenario.water_kg, ceil(max(water_ceiling-reading.water_kg for reading in trial.readings)*100)/100 + .01)
            water_needed = min(water_ceiling,round(water_needed,2))
            power_needed = max(request.scenario.generation_kw,min(ceiling,round(trial.demand_kw+.001,3)))
            checked_trial = simulate(trial_request.model_copy(update={"water_kg":water_needed,"generation_kw":power_needed}))
            if checked_trial.resource_balance_complete and (not request.require_no_wastewater_backlog or checked_trial.readings[-1].wastewater_kg<=1e-6):
                verified.append(((round(water_needed-request.scenario.water_kg,2),mass,power_needed,item.oxygen_units,item.water_units,item.co2_units or 0),checked_trial))
        expanded.candidates = candidates
        expanded.constraint_failure_counts = dict(sorted(counts.items()))
        expanded.feasible_count = sum(item.feasible for item in candidates)
        expanded.excluded_count = sum(not item.eligible for item in candidates)
        expanded.recovery_search_water_kg = water_ceiling
        expanded.limitations.append("Water-repair audit candidates use 100 kW and 100000 kg initial water as search ceilings. Final proposed inputs are independently verified. Rank verified repairs by least added starting water, then known equipment mass, power and counts. Supplies and power-system mass are not part of equipment mass; no global optimum is claimed.")
        if not verified:
            expanded.explanation = "No verified proposal passed even after testing higher power, starting water and enabled thermal capacity within the model bounds. Fixed atmosphere settings or equipment and model bounds may still prevent completion. No check was disabled."
            return expanded
        expanded.optimized = min(verified,key=lambda entry:entry[0])[1]
        expanded.status = "feasible"
        expanded.objective = "Least additional starting water among verified bounded repair proposals, then lowest known equipment mass; not total mission mass"

    candidate = expanded.optimized
    # demand_kw is rounded to .001; add .001 so the recheck does not under-supply exact demand.
    proposed_power = max(request.scenario.generation_kw, min(ceiling, ceil(candidate.demand_kw * 1000) / 1000 + .001))
    checked = simulate(candidate.request.model_copy(update={"generation_kw": round(proposed_power, 3)}))
    backlog_ok = not request.require_no_wastewater_backlog or checked.readings[-1].wastewater_kg <= 1e-6
    if not checked.resource_balance_complete or not backlog_ok:
        # Never expose a repair as successful without checking it at its proposed power.
        fixed.recovery_attempted = True
        fixed.fixed_constraint_counts = fixed.constraint_failure_counts
        fixed.explanation += " A higher-power candidate did not pass its final verification; no repair is recommended."
        return fixed
    expanded.optimized = checked
    expanded.suggested_generation_kw = checked.request.generation_kw
    expanded.suggested_water_kg = checked.request.water_kg
    mass = known_hardware_mass(checked)
    expanded.optimized_known_hardware_mass_kg = mass
    expanded.known_hardware_mass_saving_kg = None if fixed.manual_known_hardware_mass_kg is None else round(fixed.manual_known_hardware_mass_kg - mass, 6)
    expanded.explanation = (f"Your manual design evaluated {fixed.manual.evaluated_hours} of {request.scenario.duration_days*24} hours. "
        f"No equipment combination passed at {request.scenario.generation_kw:g} kW. "
        f"The proposed design uses {checked.request.oxygen_equipment_quantity} oxygen units, {checked.request.water_equipment_quantity} water recyclers"
        + (f" and {checked.request.co2_equipment_quantity} CO2 scrubbers" if checked.request.co2_enabled else "")
        + f", and proposes {checked.request.generation_kw:g} kW continuous generation (was {request.scenario.generation_kw:g}). "
        f"Starting water: {request.scenario.water_kg:g} to {checked.request.water_kg:g} kg. "
        f"It was re-simulated at those inputs and completed {checked.evaluated_hours} hours with {checked.demand_kw:g} kW demand. "
        f"Heating capacity: {request.scenario.heating_capacity_kw:g} to {checked.request.heating_capacity_kw:g} kW thermal. "
        f"Cooling capacity: {request.scenario.cooling_capacity_kw:g} to {checked.request.cooling_capacity_kw:g} kW thermal. "
        "Planet, crew, duration, starting oxygen, battery, atmosphere settings and check enable flags are unchanged. This is a tested model result, not a survival certification.")
    return expanded
