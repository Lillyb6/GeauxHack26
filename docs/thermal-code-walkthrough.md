# My thermal integration and mission-label changes

## 1. What I changed

I connected the thermal-capacity helper to the main mission simulation. The simulator already calculated electricity for heating and cooling. My change also checks whether the selected system can deliver enough heating or cooling to maintain the target temperature under the simplified model.

I kept this check optional so existing missions continue to work. I also changed the mission labels to use everyday wording first, with the technical term and units underneath. The frontend owner can keep developing the layout without changing the backend field names.

## 2. Physics and units

Required thermal output = conductance * abs(indoor temperature - outdoor temperature).
Required electricity = required thermal output / COP.
Capacity margin = available thermal output - required thermal output.

Thermal output is in kW thermal. Electricity is in kW electrical. They are different quantities even though both describe power. COP connects them. Raising COP reduces the electricity needed; it does not change the heat transfer through the habitat.

NASA Passive Thermal Control Engineering Guidebook Revision 5.1, section 4.2.1, supports Fourier conduction Q=(k*A/L)*(T1-T2). Our existing lumped conductance represents UA. The selected conductance, COP and available capacities are still design assumptions. The source does not establish equipment ratings or whole-habitat performance.

For the Mars reference: 21 - (-59) = 80 degrees difference; 0.04 * 80 = 3.2 kW thermal. A 2 kW heater has a margin of -1.2 kW and fails the capacity screen. A 3.2 kW heater meets it. With COP 2, required electricity is 1.6 kW.

## 3. Existing helper: backend/app/thermal.py

The existing helper remains unchanged in this integration. It rejects nonfinite numbers, negative conductance/capacity and nonpositive COP. The sign of indoor minus outdoor temperature selects heating or cooling. Equal temperatures produce no conductive requirement. The helper subtracts required output from available output and uses a 1e-9 kW tolerance for rounding. It returns a dictionary containing mode, required/available thermal output, margin, pass/fail and required electricity.

Required electricity describes the target requirement. It is not a claim that undersized equipment actually operates at that output.

## 4. Input and output contracts: backend/app/models.py

I added three mission inputs:

- thermal_capacity_enabled: false by default; controls whether installed output is checked.
- heating_capacity_kw: total installed heating output, default zero.
- cooling_capacity_kw: total installed cooling output, default zero.

Capacities must be finite and between 0 and 1000 kW thermal. The upper value is an input bound, not a sourced hardware specification. These are totals, not per-unit ratings.

SimulationResult now includes thermal_summary. The model version is 0.6.0. Existing thermal_load_kw remains the electrical requirement for compatibility, despite its historical name.

## 5. Simulation flow: backend/app/engine.py

### 5.1 Calculate the thermal requirement

I import check_thermal_capacity and call it after selecting the environment. It uses the indoor temperature, the environment reference temperature, conductance, the two capacities and COP.

The helper's required_electric_kw becomes the thermal contribution to total electrical demand. This replaces the old inline expression with the same equation, so default resource balances stay the same.

### 5.2 Describe the screening status

The summary adds enabled and status. Status is not_evaluated, sufficient or insufficient. When screening is off, available capacity, margin and pass/fail become null. This avoids presenting an unused zero capacity as a failure. Required heat transfer and required electricity are still calculated.

### 5.3 Check before the hourly loop

If screening is enabled and capacity is insufficient, I add an Event with resource=thermal and hour=0. Its message includes required capacity, selected capacity and the shortfall.

The existing loop skips simulation when initial events exist. Therefore, an insufficient thermal design does not consume oxygen, water or battery energy, or generate crew CO2. It reports an inability to maintain the target; it does not invent a cabin temperature or survival deadline.

When screening is disabled, I add a warning explaining that electrical demand assumes the target can be maintained.

### 5.4 Return the explanation

I attach thermal_summary and its limitations to the result. This keeps the evaluated values tied to that run, even if the user edits the form afterward.

## 6. Scientific evidence: backend/app/research.py

I updated the conduction source to NASA Revision 5.1 and added an equation evidence entry. Capacity inputs are labeled unvalidated_design_input and have no NASA source attached to their chosen values. Disabled capacities are excluded from the run evidence because they did not affect its checks.

The equation entry explains UA=k*A/L for a uniform slab and the W/K-to-kW/K conversion. It also states that using exterior reference temperature as the boundary is a simplification.

## 7. Optimizer and AI compatibility

### backend/app/optimizer.py

The optimizer already calls simulate for every candidate, so it now automatically respects thermal failure events. I added a limitation explaining that it keeps thermal capacities fixed and excludes thermal hardware mass. More oxygen or water units cannot fix insufficient heating or cooling.

### backend/app/advisor.py

I included thermal_summary in compact_run, the reduced result sent for explanations. I added guidance distinguishing target electricity from actual operation in a failed run.

### backend/app/mission_agent.py

The tool input schema already comes from HabitatRequest, so the new fields become available through the existing validated tools. I added instructions to enable screening only when requested and to treat capacities as fixed design inputs. I did not add another external API or call live Gemini during verification.

### backend/app/main.py

I updated the API and model-reference version to 0.6.0. Existing endpoints remain unchanged.

## 8. Simple mission labels: frontend/src/FieldLabel.jsx

I created a label component with a map from existing field IDs to simple names. For example, generation_kw displays Power available, with Continuous external power - kW underneath. The field IDs and request keys stay unchanged.

The component also explains that 0.93 means 93% water recovery, higher conductance means more heat transfer, and COP describes output per electrical input.

## 9. Thermal interface: frontend/src/ThermalPanel.jsx

### ThermalControls

This adds an optional checkbox and two numeric inputs. onChange copies the current form and updates one field. Empty numeric inputs stay empty while editing so the browser can require a value rather than silently converting an empty field to zero.

Inputs use the same 0-1000 bounds as the API, but the backend still validates requests independently. The explanation distinguishes output capacity from electricity consumption.

### ThermalResult

This reads the previous simulation's thermal_summary. It shows required heat transfer, required electricity, whether capacity was checked, and either spare capacity or a shortfall. Values use up to three decimal places. Details expose the calculation and limits.

## 10. Main page wiring: frontend/src/App.jsx

I imported FieldLabel, ThermalControls and ThermalResult. Existing mapped numeric controls now use simple labels plus their technical subtitles. ThermalControls sits inside the mission form and ThermalResult appears in the computed results.

The startup compatibility check now detects a backend missing thermal fields and asks for a restart. The displayed model version comes from the backend rather than a hardcoded badge.

I removed a pre-existing duplicated JSX section that repeated forms and result flows and prevented a build. I kept a single compact mission form, mission library, agent, comparison and result section. I added the intended Equipment & cabin checks details wrapper around the retained result details.

## 11. Cabin label changes

In AtmospherePanel.jsx I changed pressure and oxygen input wording while keeping technical subtitles. In Co2Panel.jsx I changed volume, starting CO2 and scrubber wording. These changes do not alter cabin equations, field IDs or request values.

## 12. Styling: frontend/src/style.css

I added small styles for technical subtitles, helper explanations and the thermal result section. I also allowed the existing grid's result children to shrink and wrap, preventing long result text from forcing horizontal overflow. I did not redesign the page.

## 13. Saved mission compatibility: frontend/src/missionStorage.js

Model 0.5.0 snapshots do not contain thermal fields. I added a specific migration to 0.6.0 that verifies the previous input shape, adds both capacities as zero and keeps screening disabled. It preserves supplies and existing choices and does not modify the original saved object.

Other missing or unsupported fields still fail validation. A legacy file already containing unexpected thermal fields is rejected. Stored results are not migrated or reused.

## 14. Tests

### backend/tests/test_thermal_integration.py

I added tests for unchanged default inventories, disabled-screen status, initial failure without consumption, exact/sufficient capacity, COP and battery accounting, Mars/Venus/Titan heating or cooling, invalid API capacities, evidence attribution, optimizer rejection of insufficient fixed capacity, and agent-schema/compact-result compatibility.

### backend/tests/test_simulation.py

I updated the expected model version to 0.6.0. Existing resource tests remain in place.

### frontend/test-fixtures/mission-context.json

I refreshed the defaults and schemas from the Python models so storage tests use the actual API contract.

### frontend/src/missionStorage.test.js

I added a migration test that checks supplies are preserved and screening stays off. It also checks missing inputs and forged thermal fields are rejected.

Verification: 203 backend tests passed; 28 frontend tests passed; the production build passed. Browser checks confirmed a 2 kW heater fails at hour zero and 3.2 kW completes a one-day Mars run. Existing deprecation and bundle-size advisories remain.

## 15. Documentation and handoff

I updated assumptions.md, validation.md and README.md, and added thermal-integration.md for the frontend handoff. This walkthrough explains each integration change. The existing frontend/package-lock.json edit was present before this work and was left untouched.

No collaborator or co-author attribution was added. This integration is saved on the thermal-integration branch for testing before merging.

## 16. Remaining limits

This is a steady conduction screen, not a temperature-over-time simulation. Internal/metabolic heat, solar heating, convection, radiation, thermal inertia, heat rejection, materials and operating envelopes remain unresolved. Capacities and COP are design inputs. Passing does not establish a viable Venus cooling system or human survival.
