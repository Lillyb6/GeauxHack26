# Water-recovery equipment — model 0.3.0

## What changed
A separate water equipment selector now replaces custom recovery and recycler power when catalog mode is selected. It uses an external-feed design budget rather than allowing every crew size to recover the same percentage automatically. Oxygen and water equipment selections are independent and can run together.

## Research basis and unresolved yield
NASA-CR-160332, *Preprototype vapor compression distillation subsystem* (1979), NTRS 19800002556:
https://ntrs.nasa.gov/api/citations/19800002556/downloads/19800002556.pdf

- Table 1, printed p.7 / PDF p.14: maximum total flow 18.1 kg/day, including 0.9 kg/day internal water-quality-monitor recycle. External-feed budget = 18.1 - 0.9 = 17.2 kg/day, also the sum of the external maxima. This is a design-envelope proxy, not measured performance at all conditions.
- Table 4, printed p.17 / PDF p.24: mechanical power 171 W and dry mechanical mass 143 kg, excluding instrumentation.
- Table 9, printed p.39 / PDF p.46: separate control/monitor power 696 W and mass 100 kg.
- The model includes both parts: 0.867 kW and 243 kg per historical reference setup. These are not modern flight hardware specifications.

**Recovery yield is not established for this selected case. The 90% processed-feed yield is an explicit unvalidated model assumption.** It has no NASA source ID in the result evidence. Do not divide nominal product/feed totals to infer efficiency: the feed includes internal recycle. This unresolved value prevents describing the entire equipment entry as measured or validated.

The paper's pretreated urine/flush/brine interfaces are not equivalent to arbitrary mixed wastewater. Applying them to this simplified loop is a feed-compatibility assumption. No modern potable-water compliance, pretreatment, replacement media, startup, thermal rejection, reliability or planetary qualification is claimed.

## Hourly accounting
For this prototype only, all modeled crew potable use becomes available wastewater immediately. This replaces a full physiological waste-stream model; no additional food/metabolic water is created.

1. Add crew_use_per_hour to the wastewater queue.
2. Process min(queue, unit_count * 17.2 / 24).
3. Recover processed * 0.90 into the usable-water inventory.
4. Put processed * 0.10 into cumulative brine/loss accounting.
5. Keep unprocessed water in the queue.
6. Subtract gross crew use and electrolyzer feedwater from usable water.

The queue is unbounded and starts empty. No storage capacity or overflow is modeled. Power is a fixed installed 0.867 kW per enabled unit, with no duty-cycle saving; zero units use zero water-equipment power and recover no water. Failure rows retain the simulator's diagnostic attempted-balance semantics. Water shortages and power deficits remain mission-stopping resource events; overload alone is a warning because initial supplies may cover the mission.

Custom mode remains backward-compatible: it processes the entire hourly feed with the entered effective recovery fraction and no throughput limit. Its unresolved assumptions remain labeled. Switching modes does not silently combine both recovery models.

## Example
For 12 crew and one Earth day, gross modeled potable use is 12 * 3.217 = 38.604 kg.

| Units | Feed budget kg/day | Recovered kg | Waiting kg | Brine/loss kg | Effective recovery |
|---|---:|---:|---:|---:|---:|
| 1 | 17.2 | 15.48 | 21.404 | 1.72 | about 40.10% |
| 2 | 34.4 | 30.96 | 4.204 | 3.44 | about 80.20% |
| 3 | 51.6 | 34.7436 | 0 | 3.8604 | 90% |

Units increase processing capacity, power and mass. They do not multiply recovery efficiency. Extra capacity cannot create water without feed. Oxygen electrolysis still separately consumes ideal feedwater.

## Files and data flow
- backend/data/equipment.json: source record, values, derivations and limitations.
- backend/app/equipment.py: resolves water selection and quantities; rejects wrong categories or missing required specs; preserves unknown mass.
- backend/app/models.py: water selection inputs, queue/recovery/brine reading fields, water result summary and warnings.
- backend/app/engine.py: capacity-limited queue, usable-water balances, installed power and overload warning.
- backend/app/research.py: replaces unused custom water evidence with equipment provenance; separates the unvalidated yield.
- frontend/src/App.jsx: water selector, count, disabled custom fields, result balance, warnings and queue chart.
- frontend/src/WaterEquipmentSummary.jsx: reusable preview/result display with derivations.
- backend/tests/test_water_equipment.py: balances, overload, scaling, source attribution, validation and failure behavior.

Each run includes water_equipment_summary, water_balance, warnings and per-hour wastewater_kg/recovered_water_kg/brine_water_kg. The first is installed equipment; the balance is what was actually processed over the evaluated hours. Editing inputs changes the preview but not the previous result.

## Demo
Select the VCDS water system. Set crew to 12, duration to 1 day and power generation to 100 kW to isolate water behavior. Run with 1, then 2, then 3 units. Watch the queue shrink and effective recovery rise. Supplies may cover the mission even while overloaded. Switch back to custom mode to re-enable the old controls.

## Remaining research
Find a complete compatible performance dataset with external-feed throughput, net potable recovery, power, mass and operating limits at the same conditions. Replace the 90% assumption and simple envelope when available. Add real wastewater composition, pretreatment, timing, storage, quality and thermal constraints before optimizing for mission feasibility.
