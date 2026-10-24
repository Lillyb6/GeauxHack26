# Equipment walkthrough — steps 7–10

## What you had already implemented
The catalog JSON stores a historical equipment design and its source. `equipment.py` loads it and resolves an equipment ID plus quantity into total output, demand and known hardware mass. Pydantic accepts the selection in `HabitatRequest`. The engine uses the resolved totals, and FastAPI maps selection errors to HTTP 422. The inventory initialization you restored supplies hour zero. Those are steps 1–6.

## Step 7: evidence describes what actually ran
Before this change, `evidence_for` always reported the custom oxygen capacity and DOE specific-energy proxy. After equipment selection, those fields no longer drive the engine, so reporting them would misattribute the outcome.

`research.py` now accepts the resolved equipment summary. In catalog mode it removes those two unused evidence fields, adds actual total oxygen output, actual equipment power, known hardware mass and selected quantity, and links the equipment entries to the historical source. Ideal feedwater chemistry remains because it is still used.

`sources_for` creates a fresh source dictionary for each run and filters it to evidence/environment references. It never modifies global source data. Thus custom mode still cites DOE, while catalog mode cites the selected equipment instead. Every result embeds its own evidence and source records.

The engine merges equipment limitations into the run's limitations. This makes unknown planetary conditions visible with the simulation, not just hidden in the catalog. A source-backed historical design remains exploratory.

## Step 8: choose equipment in React
`App.jsx` fetches `/equipment` when it loads the environment and model references. The dropdown sends the equipment ID; quantity sends an integer count. The backend remains authoritative for calculations. The frontend preview multiplies published values only for display; those display totals are not submitted as trusted specifications.

Custom mode uses a null ID. Switching to catalog mode disables the two custom oxygen fields, retaining their values so switching back is convenient. Quantity zero means no units installed, not missing data. Empty or invalid count cannot be submitted through the validated form.

`EquipmentSummary.jsx` is shared by the live preview and completed result. It displays output, power, known hardware mass, evidence status, source, and limitations. Unknown mass displays as Unknown, rather than zero. Hardware mass excludes the rest of the habitat. The environmental operating envelope is explicitly not validated.

The live preview uses current inputs; completed results use `result.equipment_summary` returned by the backend. Changing quantity does not silently relabel earlier results: their summary stays unchanged, and the stale-input message asks for another run.

`EvidenceList.jsx` renders evidence in both the live assumptions panel and the exact-run evidence disclosure. The live panel hides the unused DOE proxy in catalog mode; the selected-equipment preview supplies its source. Result evidence comes exclusively from the returned calculation record.

## Step 9: verification
`test_equipment.py` adds 13 cases, bringing the full backend suite to 39. They cover 0/1/2 units, daily oxygen and water balances, direct electrical demand, known hardware mass, preservation of null mass, missing required specs, invalid IDs/counts, correct evidence/source links and custom-mode behavior. A separation test changes the ignored custom fields and verifies that catalog-mode readings/demand/evidence stay the same.

Expected one-unit / four-crew / one-day Mars result with defaults: oxygen 30.62 kg; water 294.37424 kg; total demand 8.027 kW; hardware mass 75 kg. Feedwater is an ideal chemistry estimate, not equipment-measured losses. General existing simulator assumptions still apply.

Tests verify implementation against declared equations. They do not prove hardware works on Mars, Venus or Titan. Browser checks verify selection, disabled fields, simulation, source reporting and stale-result behavior. A frontend build checks that production assets compile.

## Step 10: documentation and attribution
README records the feature, demo, remaining scope and AI contribution. sources.md adds the historical NASA record and exact locator. assumptions.md explains catalog equations and exclusions; architecture.md records the data flow; validation.md records checks.

## Try it yourself
1. Start backend and frontend using README instructions.
2. Select the historical oxygen design; quantity 1.
3. Set mission duration to 1 day and run.
4. Inspect Equipment evaluated and Evidence used for this simulation.
5. Change quantity to 2. The preview changes immediately; the previous run stays at 1 until you rerun.
6. Switch to custom mode. Custom controls re-enable and DOE-based evidence returns for custom simulations.

## Next milestone
Expand the catalog only with compatible data for each equipment configuration. Water recovery needs throughput/recovery/power together; thermal equipment needs validated operating/heat-rejection constraints. Complete those before building mass optimization or making mission-feasibility claims.
