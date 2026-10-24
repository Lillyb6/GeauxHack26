# Feature Power Demand Breakdown

## 1. Purpose
I added a backend breakdown showing which systems contribute to a mission's electrical demand. Previously, the API returned total demand but did not provide one consistent list of all component loads. This makes it easier to explain why equipment choices affect the power balance.

## 2. Scope
This is step 1 only. I changed backend output and tests. I did not add frontend controls or a chart, change the oxygen/water failure messages, add scientific constants, or change the physical equations. The existing frontend can continue using demand_kw. No collaborator or co-author attribution is added.

## 3. Files Changed
- backend/app/models.py: defines the typed output structure.
- backend/app/engine.py: builds the component loads and uses their sum in the existing balance.
- backend/app/advisor.py: includes the computed breakdown in compact backend evidence used by the advisor and agent.
- backend/tests/test_power_breakdown.py: checks calculations, mode selection, API output and downstream integration.
- docs/power-demand-breakdown.md: this explanation and frontend handoff.
- docs/assumptions.md and README.md: describe the new output and its limits.

## 4. Tests First
I first added a default-scenario test expecting power_breakdown. It failed because SimulationResult did not yet contain that field. I then added the implementation and ran focused and full backend checks.

## 5. Output Model in models.py
PowerDemandBreakdown is a Pydantic model. It has five component fields and total_kw:

| Field | Meaning |
|---|---|
| other_habitat_kw | Configured total load for other equipment |
| water_recycling_kw | Selected custom or catalog recycler load |
| thermal_control_kw | Required HVAC electrical input, not heating/cooling output |
| oxygen_generation_kw | Selected custom or catalog oxygen equipment load |
| co2_removal_kw | Installed scrubber load, zero when screening is off |
| total_kw | Unrounded sum of the five component requirements |

Each value must be finite and nonnegative. extra="forbid" rejects undeclared fields in this output model. The model's descriptions appear in FastAPI's generated API documentation. SimulationResult now contains power_breakdown as an additional response field. HabitatRequest is unchanged, so saved mission inputs and their model version stay compatible.

## 6. Calculation in engine.py
I build power_components after the existing code has resolved oxygen, water and CO2 equipment selection:

```python
power_components = {
    "other_habitat_kw": req.other_load_kw,
    "water_recycling_kw": recycler,
    "thermal_control_kw": thermal,
    "oxygen_generation_kw": oxygen_power,
    "co2_removal_kw": co2_summary["electrical_power_kw"] if co2_summary else 0,
}
demand = sum(power_components.values())
power_breakdown = PowerDemandBreakdown(**power_components, total_kw=demand)
```

The dictionary gives each existing load a consistent name. sum adds the values. The ** syntax passes the dictionary entries as named arguments into the validated model. The same unrounded demand is used in battery accounting and shortage calculations, so reporting and simulation cannot use separate lists of loads.

Catalog equipment already replaces custom settings before this block. I reuse those resolved values rather than adding custom and catalog power together. Zero installed catalog units contribute zero equipment power. Disabled custom recovery also contributes zero recycler power. Enabled CO2 uses installed scrubber power even if the cabin needs less removal, following the existing fixed-load assumption.

## 7. Units and Precision
All breakdown fields are electrical power in kW. Battery energy remains kWh. A one-hour step converts a constant load of 1 kW into 1 kWh required for that step. Generation is supply and is not subtracted inside this demand-only breakdown.

The breakdown retains full calculation precision. Existing demand_kw remains rounded to three decimal places. Frontend display rounding can create tiny apparent differences between displayed components and the displayed total; calculations must use unrounded values.

Default Mars example: other 3.2 + recycler 0.527 + HVAC 3.2 + oxygen (4*6.875/24) + disabled CO2 0 = 8.072833333333333 kW, displayed as 8.073 kW. The one-day default battery still ends at 98.252 kWh.

## 8. Failure Semantics
The breakdown describes the power required by the selected design. It is returned even if an initial thermal or atmosphere check stops the run at hour zero. A nonzero requirement does not mean electricity was consumed during that stopped run. The breakdown is not metered consumption, equipment dispatch or a duty-cycle model.

## 9. Optimizer and AI Compatibility
The optimizer already uses simulate, so both manual and optimized runs include their own evaluated breakdown. I added power_breakdown.model_dump() to compact_run in advisor.py. This serializes the typed values into ordinary data for existing backend explanation/agent tools. Gemini does not calculate these values. No additional API integration is introduced, and no live provider call is needed for the tests.

## 10. Tests
Tests cover default component values and independently checked battery balance; component sums across all three environments with CO2 off/on; disabled recycling; zero/one/two catalog units; unused custom values not affecting catalog results; installed scrubber scaling; COP affecting only the thermal component; hour-zero failure without battery consumption; the typed API schema; rejecting a browser-forged breakdown in a request; and optimizer/compact evidence output.

## 11. Frontend Handoff
Read result.power_breakdown and label values in kW electrical. Show the five component fields and total_kw. Keep generation and battery energy separate. Use the result from the evaluated run, not current form values if the form is stale. The same object is present under comparison.manual and comparison.optimized when a recommendation exists. State that these are requirements, especially when evaluated_hours is zero. No frontend files are changed in this step.

## 12. Limitations
The breakdown inherits the simulator's existing simplified constant equipment loads, conduction-only HVAC, fixed external generation and equipment assumptions. It does not validate hardware ratings or planetary suitability. Its purpose is to explain the existing model, not add realism unsupported by research.

## 13. Verification Results
The new focused suite passed all 18 cases. The complete backend suite passed all 224 cases. The API returned HTTP 200 with the expected default breakdown and unchanged one-day battery balance. The existing Starlette/httpx deprecation warning remains. No live Gemini call was made.

## 14. Project Document Entry
I added a typed backend power-demand breakdown showing oxygen generation, water recycling, required HVAC electricity, enabled CO2 removal and other habitat loads. The same component sum drives battery accounting and the API output. I wrote tests first, confirmed the missing field failed, then verified all 18 new cases and the complete 224-test backend suite. I kept frontend display and oxygen/water failure-message changes outside this step. I committed step 1 on power-demand-breakdown for review before merging.

## Combined Integration
Both backend improvements were integrated with the current team main. Combined verification passed 235 backend tests, 28 frontend tests and the production frontend build. The power breakdown remains backend-only; oxygen/water messages use the existing event display. The separate feature branches preserve the original scopes.
