"""Bounded exhaustive enumeration; numerical outcomes come only from simulate()."""
from collections import Counter
from math import isfinite
from .engine import simulate
from .equipment import resolve_oxygen_equipment, resolve_water_equipment
from .co2 import resolve_co2_equipment
from .models import OptimizationRequest, OptimizationResult, CandidateSummary


def known_hardware_mass(result):
    # A custom subsystem has no catalog mass: do not treat that unknown as zero.
    summaries = (result.equipment_summary, result.water_equipment_summary)
    if any(summary is None for summary in summaries):
        return None
    if result.request.co2_enabled:
        if result.co2_equipment_summary is None:
            return None
        summaries += (result.co2_equipment_summary,)
    total = 0.0
    for summary in summaries:
        if summary["quantity"] == 0:
            continue
        mass = summary["known_hardware_mass_kg"]
        if mass is None or not isfinite(mass) or mass < 0:
            return None
        total += mass
    return total


def optimize(request: OptimizationRequest) -> OptimizationResult:
    # Validate selected designs even when the bounds are zero; wrong IDs/categories are input errors.
    resolve_oxygen_equipment(request.oxygen_equipment_id, 0)
    resolve_water_equipment(request.water_equipment_id, 0)
    if request.scenario.co2_enabled:
        resolve_co2_equipment(request.scenario.co2_equipment_id,0)
    manual = simulate(request.scenario)
    manual_mass = known_hardware_mass(manual)
    summaries = []
    counts = Counter()
    best = None
    best_key = None
    feasible_count = evaluated_count = excluded_count = 0
    for oxygen_count in range(request.max_oxygen_units + 1):
        for water_count in range(request.max_water_units + 1):
            co2_counts=range(request.max_co2_units+1) if request.scenario.co2_enabled else [request.scenario.co2_equipment_quantity]
            for co2_count in co2_counts:
                scenario = request.scenario.model_copy(update={
                    "oxygen_equipment_id":request.oxygen_equipment_id,
                    "oxygen_equipment_quantity":oxygen_count,
                    "water_equipment_id":request.water_equipment_id,
                    "water_equipment_quantity":water_count,
                    "co2_equipment_quantity":co2_count,
                })
                result = simulate(scenario)
                evaluated_count += 1
                mass = known_hardware_mass(result)
                if mass is None:
                    excluded_count += 1
                    summaries.append(CandidateSummary(oxygen_units=oxygen_count, water_units=water_count, co2_units=co2_count if request.scenario.co2_enabled else None,
                        eligible=False, feasible=False, demand_kw=result.demand_kw, evaluated_hours=result.evaluated_hours,
                        exclusion_reason="Installed equipment has unknown/invalid hardware mass; cannot rank by mass."))
                    continue
                failed = sorted({event.resource for event in result.events})
                if request.require_no_wastewater_backlog and result.readings[-1].wastewater_kg > 1e-6:
                    failed.append("wastewater_backlog")
                feasible = result.resource_balance_complete and not failed
                counts.update(failed)
                summaries.append(CandidateSummary(oxygen_units=oxygen_count, water_units=water_count, co2_units=co2_count if request.scenario.co2_enabled else None,
                    eligible=True, feasible=feasible, known_hardware_mass_kg=mass,
                    demand_kw=result.demand_kw, evaluated_hours=result.evaluated_hours,
                    constraints_failed=failed))
                if feasible:
                    feasible_count += 1
                    # Exact unrounded power expression is constant per candidate; output demand is rounded to .001 kW.
                    # Tie-breaks are explicit and stable; quantity order resolves any remaining equal values.
                    key = (mass, result.demand_kw, oxygen_count, water_count, co2_count)
                    if best_key is None or key < best_key:
                        best_key, best = key, result
    if best is not None:
        status = "feasible"
        explanation = f"{feasible_count} of {len(summaries)} enumerated configurations completed the selected checks. Selected {best.request.oxygen_equipment_quantity} oxygen unit(s) and {best.request.water_equipment_quantity} water unit(s), totaling {best_key[0]:g} kg known hardware. Ties use lower modeled power, then lower oxygen count, then lower water count."
        if request.scenario.co2_enabled:
            explanation += f" CO2 screening enabled; selected {best.request.co2_equipment_quantity} scrubber unit(s), included in hardware mass and power."
        if best.request.oxygen_equipment_quantity == best.request.water_equipment_quantity == 0 and (not best.request.co2_enabled or best.request.co2_equipment_quantity==0):
            explanation += " Starting supplies cover this bounded mission without oxygen/water equipment in the model; this is not a complete habitat design."
    elif excluded_count == len(summaries):
        status = "insufficient_catalog_data"
        explanation = "All candidates lack usable mass data. No minimum-mass recommendation can be established."
    else:
        status = "no_feasible_candidate"
        failures = ", ".join(f"{name}: {count}" for name,count in sorted(counts.items()))
        explanation = f"No eligible configuration completed the selected checks within these designs/count bounds. Recorded constraints at the first deficient hour or end-of-run backlog check: {failures or 'none'}. Counts can overlap and do not establish the only possible failure causes."
    mass = None if best is None else best_key[0]
    saving = None if manual_mass is None or mass is None else round(manual_mass-mass,6)
    return OptimizationResult(objective="Minimum known installed oxygen/water hardware mass plus CO2 scrubber mass when screening is enabled; bounded search, not total mission mass", status=status, search_request=request, manual=manual, optimized=best,
        manual_known_hardware_mass_kg=manual_mass, optimized_known_hardware_mass_kg=mass,
        known_hardware_mass_saving_kg=saving, candidate_count=len(summaries),
        evaluated_count=evaluated_count, feasible_count=feasible_count, excluded_count=excluded_count,
        constraint_failure_counts=dict(sorted(counts.items())), candidates=summaries, explanation=explanation,
        limitations=[
            "Feasible under current model assumptions only; not a safety, survival or mission-feasibility certification.",
            "Search changes catalog IDs/counts only; planet, crew, duration, initial supplies, battery, generation and thermal/other-load inputs stay fixed.",
            "Only the chosen catalog design in each category is searched, from zero to each inclusive maximum (81 oxygen/water candidates; up to 405 when CO2 screening is enabled). No global optimum outside that set is claimed.",
            "Objective excludes habitat, power plant, tanks, spares, infrastructure and other unknown masses. Custom-mode baseline mass/savings cannot be established.",
            "Water recovery yield remains an unvalidated 90% assumption. Optional CO2 uses an unvalidated response curve; disabled CO2 is not evaluated. Thermal behavior, total pressure, radiation and operating envelopes remain unresolved.",
            "Optional atmosphere screening evaluates fixed pressure/O2 settings; equipment quantities cannot repair invalid atmosphere setpoints. It is not a coupled gas/pressure-control model.",
            "A resource-complete candidate may accumulate wastewater unless the no-backlog constraint is enabled; storage is otherwise ideal and unbounded.",
        ])
