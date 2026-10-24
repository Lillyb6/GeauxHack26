# Feature Oxygen and Water Shortage Explanations

## 1. Purpose
I extended the existing resource failure messages so users can understand oxygen and water shortages. These explanations show the demand, modeled production/recovery, resource inventory available at the start of the failed hour and the remaining shortfall.

## 2. Branch and Scope
I created oxygen-water-diagnostics from the latest origin/main so this step is independent of the unmerged power-demand-breakdown branch. Only the backend messages, focused tests and documentation change. Existing frontend event rendering can show these messages without new UI. Power messages, equations, resource limits and stopping rules remain unchanged. No new API fields or scientific constants are added. The unrelated lockfile stays outside this work. No collaborator or co-author attribution is added.

## 3. Files
- backend/app/engine.py: names the existing hourly balance terms and builds oxygen/water explanations.
- backend/tests/test_resource_diagnostics.py: verifies numeric failure messages, later-hour inventories, catalog behavior, simultaneous shortages, exact balance and API output.
- docs/oxygen-water-diagnostics.md: code explanation and document entry.
- docs/assumptions.md, docs/validation.md and README.md: scope and verification notes.

## 4. Tests First
I wrote numerical diagnostic tests first. The initial oxygen and water examples failed because the old messages only stated that demand could not be met. Those failures established the missing behavior before I changed engine.py.

## 5. Named Hourly Terms
Inside the existing one-hour loop I assigned the original expressions to clear variable names:

```python
produced = oxygen_rate / 24
crew_oxygen_required = req.crew_size * PARAMETERS["oxygen_consumption_kg_person_day"]["value"] / 24
crew_water_used = crew_water_day / 24
electrolysis_feedwater = produced * PARAMETERS["electrolysis_water_ratio"]["value"]
```

Division by 24 converts daily rates into the mass for a one-hour step. The crew oxygen requirement uses the existing reference baseline. crew_water_used is the existing modeled potable-water use. electrolysis_feedwater is the existing ideal water requirement for modeled oxygen production. Naming these terms lets both the balances and explanations use the same values.

## 6. Resource Balances
The balances are still:

```python
next_oxygen = oxygen + produced - crew_oxygen_required
water_used = crew_water_used - recovered + electrolysis_feedwater
next_water = water - water_used
```

The wastewater queue still receives crew_water_used. The existing custom or catalog processing calculation determines recovered. I did not subtract crew use twice or count wastewater as usable inventory.

## 7. Oxygen Message
The resource loop already identifies a failure when the next balance is below -1e-9. For oxygen I now report crew requirement, modeled production, stored oxygen before the hourly update and -value as the positive shortfall.

For four crew, no stored oxygen and no oxygen production, the first-hour requirement and shortfall are about 0.149167 kg. With 0.2 kg starting oxygen and 1.2 kg/day production, the failure occurs in hour three: 0.001667 kg available, 0.050000 kg modeled production, 0.149167 kg required and 0.097500 kg shortfall.

The message uses modeled production rather than asserting the generator successfully operated. Water or power could fail in the same hour.

## 8. Water Message
For water I report crew use, modeled recovered water, electrolysis feedwater required, starting usable water and the positive shortfall. Recovered water comes from the actual selected processing model, not an independently recalculated percentage.

At default four-crew inputs with no starting water: 0.536167 kg crew use minus 0.498635 kg modeled recovery plus 0.187500 kg electrolysis feedwater gives about 0.225032 kg shortfall for the hour.

The message explicitly says that queued wastewater is not usable water and failed-hour balances do not establish successful equipment operation. Failed-hour processing is diagnostic, consistent with the existing simulator boundary.

## 9. Precision and Failure Timing
Mass terms use six decimal places so small hourly values remain visible. The calculation itself remains unrounded. Display rounding can make the shown components differ slightly from the shown shortfall. oxygen and water in the message are still the inventories at the start of the failed hour; the existing clamp to zero happens later. The simulator still records all resource deficits from that hour and stops at the first failed hour. Exact-zero balances remain allowed by the existing tolerance. Failure hours are not medical survival deadlines.

## 10. Catalog and Integration Behavior
Catalog oxygen output replaces the custom generation rate before the loop, so its diagnostics use selected equipment output. Catalog water recovery is limited by installed feed capacity, and unused custom recovery/power settings do not affect its message. Recovery from processed feed does not make the remaining wastewater queue available to the crew.

Events retain the same hour/resource/message structure. /simulate, optimizer runs and compact advisor/agent evidence carry these event messages through their existing paths. The frontend already displays Event.message. No live Gemini call is needed to check this behavior.

## 11. Tests
The focused tests cover zero-inventory shortages, later-hour remaining oxygen/water, catalog oxygen output, capacity-limited catalog water recovery, zero electrolysis demand, simultaneous oxygen/water/power failure, exact oxygen and water balance, and identical events through the API and compact AI evidence.

## 12. Project Document Entry
I added detailed oxygen and water shortage messages on a separate oxygen-water-diagnostics branch. The messages explain hourly crew needs, modeled production or recovery, electrolysis feedwater where applicable, starting usable inventory and shortfall. I kept the equations and stopping behavior unchanged and tested catalog modes, later-hour depletion and simultaneous shortages. Failed-hour values remain diagnostic rather than proof of successful equipment operation.

## 13. Verification Results and Status
All 11 new diagnostic tests passed. The full backend suite passed all 217 tests on this independent branch (206 existing plus 11 new). The separate power-demand-breakdown branch has 18 additional tests that are not part of this branch. The existing Starlette/httpx deprecation warning remains. /simulate returned HTTP 200 with both detailed oxygen and water messages, and compact evidence preserved the same events. No live Gemini request was made. Step 2 is maintained on oxygen-water-diagnostics, separately from the power-demand-breakdown commit; the combined integration is verified before updating main.
