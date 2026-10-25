# Feature: Simulation Constraint Audit

## Purpose
I audited the reported CO2 and cabin-pressure failures and checked every currently modeled constraint on Mars, Venus, and Titan. I worked on simulation-constraint-audit without changing main.

## What I found
The existing thermal model already changes by destination. With an indoor target of 21 °C and conductance of 0.04 kW/K, Mars requires 3.2 kW heating, Venus requires 17.72 kW cooling, and Titan requires 8.04 kW heating. The same installed 4 kW heating/cooling design passes the thermal screen on Mars and fails it on Venus and Titan.

Cabin pressure, inspired oxygen, inert gas balance, and the cabin CO2 limit describe the environment inside a sealed habitat. They do not change automatically to match exterior atmospheric composition or pressure. Pressure-vessel strength, leaks, planetary cooling feasibility, radiation, and solar generation performance are not simulated. I did not invent limits to make a destination fail.

## Why CO2 can fail with the default unit count
Four crew generate 4.34 kg/day of CO2 using the existing baseline. One reference scrubber removes at most 4.16 kg/day under the modeled capped response. With sufficient water, oxygen, and power, zero scrubbers fail in hour 4, one fails in hour 41, and two pass a 72-hour mission. These are model scenarios, not real equipment certification. Two scrubbers add 2 kW of electrical load; adding removal capacity can expose a power shortage.

## Backend diagnostics
I added crew_generation_kg_day, installed_capacity_kg_day, and capacity_margin_kg_day to co2_balance. They report existing calculated requirements and equipment capacity. When crew production exceeds reference removal capacity, I add a warning explaining the deficit. The warning does not force immediate failure; the actual hourly CO2 average still decides the outcome. I left the CO2 differential equation, physiological criteria, and resource accounting unchanged because the independent checks passed.

## Display fixes
I fixed the resource-chart selection so selecting CO2 and then running with CO2 disabled falls back to Water. I kept the 3 mmHg reference line visible by allowing it to extend the chart domain. I changed the CO2 chart caption from end-of-hour inventory to hourly average. When a setup check stops the simulation at hour zero, I show the initial CO2 value and explain that no hourly average was calculated instead of showing a blank chart or inventing readings. A real zero remains a valid reading.

## Cabin and CO2 explanations
I clarified that cabin pressure is the internal habitat setpoint, not the planet's exterior pressure. I show a nominal example of 101.325 kPa and 20.9% oxygen. I added readable result names for cabin-pressure, inspired-oxygen, and inert-gas failures. The CO2 details show crew production versus installed reference capacity. I corrected Last complete-hour average to Last evaluated-hour average because a deficient hour can still appear in the recorded results.

## Tests
I added 70 backend checks. They cover a passing all-enabled design on every world; individual oxygen, water, power, thermal, cabin-pressure, inspired-oxygen, inert-gas, and CO2 failures; crew/scrubber sweeps; identical isolated cabin CO2 behavior across destinations; lower-pressure cabins with an adjusted oxygen mix; simultaneous before-launch failures; API responses; capacity diagnostics; and partitioning one analytical CO2 hour into sixty substeps while preserving pressure, average, and removed mass.

All 316 backend tests pass. There is one existing Starlette/httpx deprecation warning. All 44 frontend tests pass, including three new chart-state regressions. The production build passes with the existing bundle-size advisory.

## Running app checks
I verified the running API with zero, one, and two scrubbers and nominal cabin pressure. I ran a three-day mission through the UI with four crew, two scrubbers, sufficient generation, and the nominal atmosphere: both CO2 and atmosphere checks passed. The CO2 chart showed its 3 mmHg limit. Setting cabin pressure to 150 kPa correctly produced hour-zero pressure and inspired-oxygen failures and an initial-only CO2 message. Turning CO2 off on the next run correctly selected the Water chart.

## References and assumptions
The audit uses the repository's existing reference criteria and equipment data. The 3 mmHg hourly CO2 screen is linked to NASA OCHMO TB-004. Cabin criteria remain the pinned NASA-STD-3001 Volume 2 Rev E reference. The pressure-dependent removal curve and planetary thermal conductance remain unvalidated model assumptions.

- [NASA CO2 technical brief](https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/)
- [Pinned cabin atmosphere standard](https://ntrs.nasa.gov/api/citations/20250004555/downloads/NASA-STD-3001%20Vol%202%20Rev%20E%20FINAL_05022025.pdf)
- [NASA Venus facts](https://science.nasa.gov/venus/venus-facts/)
- [NASA Titan facts](https://science.nasa.gov/saturn/moons/titan/facts/)


## Apply button discovery
I found that optimizing from Mission brief left the user on that monitor while Apply lived in AI assistance or the comparison. I changed the brief's Optimize & compare button to Apply optimized design when a fresh passing proposal is available. Its neighbor opens the comparison for review. Optimization also focuses the comparison automatically. After applying, the brief confirms that the optimized design is active; editing inputs makes the old proposal stale and requires another optimization. When no passing candidate exists, the brief explicitly says so instead of hiding the reason. The existing apply handler updates the form and the evaluated result, which drives the planet's surface playback. Gemini explanation and deterministic optimization remain separate operations.

I verified this flow in the running UI with a 30-day Mars build: Optimize & compare exposed Apply optimized design directly in Mission brief; applying changed generation from 8 to 8.368 kW and displayed the verified 720-hour passing result. Apply uses a non-submit button so it cannot accidentally launch a second optimization when its label changes.


## Planet-specific optimization repair

### What I changed
I extended the repair search so it can increase heating or cooling capacity when that check is enabled. Previously it only changed equipment, power and starting water, so a Venus build with insufficient cooling could never pass. I now size the relevant capacity to the modeled thermal load, preserve the selected planet and mission, and re-run the proposed design before offering Apply. The comparison shows both original and proposed thermal capacities.

### Code logic
I use the existing thermal calculation, Q = UA times the temperature difference. A cold environment needs heating; a hot environment needs cooling. I round the required capacity upward to 0.001 kW and keep it within the 1000 kW input limit. The search then finds equipment and sufficient electrical generation. No enabled check is switched off. Invalid cabin settings and searches beyond the model bounds can still return no feasible design. Thermal hardware is a modeled capacity input, not a verified hardware design or part of the reported equipment mass.

### Verification
I added regression tests for Mars, Venus and Titan with thermal, cabin atmosphere and CO2 checks enabled, plus a case beyond the thermal capacity bound. Each successful proposal is simulated again and must complete all 720 hours.


## Automated failure scenarios for every planet

### What I added
I added 36 API regression cases: 11 deliberately failing configurations and one passing 30-day configuration for each of Mars, Venus and Titan. Every case starts with thermal, cabin atmosphere and CO2 checks enabled.

### Constraints tested
I tested oxygen depletion, water depletion, unavailable power, insufficient heating or cooling, low and high cabin pressure, low and high inspired oxygen, insufficient inert gas, missing CO2 removal, and excessive initial CO2. Some gas checks are coupled: low pressure also lowers inspired oxygen, and an 80 percent oxygen mixture fails both inspired oxygen and inert gas requirements. I assert all expected failures rather than hiding those relationships.

### What the tests verify
I send each configuration through /simulate, the endpoint used by the app. I check the exact failure types, failure hour, readable event message, retained planet and enabled checks. Setup failures occur at hour 0; empty supplies or unavailable power fail at hour 1; missing CO2 removal fails at hour 4 for this four-person configuration. The evaluated-hours field includes the failed hour. Passing builds must complete 720 hours with no events. These tests cover modeled checks; they do not add radiation, food, structural-pressure or crew-health simulation. Wastewater backlog is a separate optional optimization requirement, not a direct survival failure.
