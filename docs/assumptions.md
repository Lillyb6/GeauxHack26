# Model scope and equations — 0.2.0

Exploratory resource-balance model. Every result contains provenance. A sourced parameter does not validate a cross-environment engineering model.

## Evidence categories
- reference_baseline: NASA nominal crew inputs.
- derived_ideal: rounded electrolysis stoichiometry.
- derived_technology_proxy: DOE terrestrial electrolysis status converted to O2 basis; linear scaling assumed.
- transferred_reference: ISS recovery and recycler power transferred to this model without off-Earth calibration.
- design_setpoint / unvalidated_design_input: explicit example design values with no claim of published hardware performance.
- scenario_input: crew, duration, supplies and capacities selected by the user.
- user_override: a user replaces a reference default; the original citation remains context only.

## Balance equations (one Earth hour per step)
Let N=crew, q=oxygen capacity kg/day, r=effective potable-water recovery.
O2_next = O2 + q/24 - N*0.895/24.
Water_next = water - N*3.217*(1-r)/24 - q*1.125/24.
Thermal_electric_kW = UA*abs(T_set - T_exterior)/COP.
Recycler_kW = configured load if r>0, otherwise 0.
Demand_kW = other_load + recycler + thermal_electric + q*specific_electrolyzer_energy/24.
Battery_next = min(capacity, battery + generation - demand).

UA and COP are unvalidated inputs, not NASA measurements. This envelope proxy omits convection/radiation, solar input, internal/metabolic heat, thermal inertia, materials and heat rejection. Optional thermal-capacity screening now exists; it does not validate the omitted physics. In particular, a viable Venus cooling system cannot be inferred from this calculation.

Recovery is instantaneous and applied to potable intake as an effective loss factor. Food/metabolic water, hygiene, waste-stream flows and recovery delays are omitted: this is not a full human mass balance or a reproduction of ISS ECLSS. Electrolysis hydrogen is vented; no Sabatier loop. The 1.125 ratio is rounded ideal net chemistry, not circulating water flow.

The battery begins full, with ideal charge/discharge and no rate limit or degradation. Generation is continuous external power, with no solar/fuel/infrastructure model. Oxygen storage has no upper bound or leakage. Crew load is constant, not an activity schedule.

Stop at the first attempted hourly inventory below -1e-9. Record all deficits in that hour. Display clamps to zero; failed-hour balances are diagnostic, not evidence that equipment operated without water/electricity. Exact zero is allowed if that hour's demand was covered. Failure time is an hourly resource shortage, not a medical survival deadline.

## Default audit example
4 crew / 30 days / 30 kg O2 / 300 kg water / 100 kWh battery / 8 kW generation / 4 kg O2/day / 0.93 recovery.
Mars: -59 C -> 3.2 kW assumed thermal load. Total demand about 8.073 kW. Initial battery covers the approximately 52.44 kWh mission shortfall. Final O2 42.6 kg; water 137.9772 kg. This changed from v0.1; old demo numbers are historical.

## Not evaluated
Pressure vessel and atmosphere regulation; CO2 scrubbing; radiation; food; reliability; equipment mass; medical effects; resource extraction; power plant fuel and temperature operating envelopes. Pressure and gravity are reference context only. All three environments remain exploratory even if resource balances complete.


## Catalog mode extension — 2026-10-24
When an oxygen equipment ID is selected, q = catalog output * unit count and oxygen electrical demand = catalog power * count. This directly replaces the custom q*specific_energy/24 term. Feedwater uses q*1.125 as before. Published hardware mass is reported separately; it is not total mission mass. Unknown mass remains null; missing required output/power causes an error. Zero installed units has zero oxygen-system output/power. Multiple units are independent copies running at the published design point; no turndown, outages or redundancy benefit is simulated. Source values do not establish planetary compatibility.


## Water equipment extension — 0.3.0
Catalog water mode limits processed feed to a historical external-feed design budget times unit count. It stores excess in an ideal unbounded queue, returns processed*assumed_yield to usable water, and records the remainder as brine/losses. All modeled potable crew use becomes immediate feed as a boundary simplification; it is not a physiological wastewater model or demonstrated feed compatibility. Initial queue is zero, with no overflow/storage model. Recovery yield 0.90 is explicitly unvalidated. Installed historical mechanical/control power is constant, not duty-cycle optimized. Zero units recover nothing. Custom mode keeps its old effective unbounded-throughput recovery. See water-recovery-walkthrough.md for equations and unresolved research.


## Optimizer boundary
The count optimizer changes only the two selected catalog systems and their counts, and evaluates each through the same engine. Fixed supplies are not optimized; the objective excludes unknown/supporting hardware and total mission mass. A zero-unit solution may be sufficient for modeled consumables over a short mission. End wastewater storage remains ideal unless the optional no-ending-backlog constraint is selected. The 90% recovery yield is still unvalidated. Bounded resource feasibility is not survival certification; see optimizer-walkthrough.md.


## Model 0.4.0: opt-in cabin CO2
CO2 is evaluated only when co2_enabled=true. A constant-temperature/volume well-mixed ideal-gas balance uses the BVAD 1.085 kg/person/day nominal load. The historical CDRA point is 4.16 kg/day at 2 mmHg, 1 kW, 450 lb. A linear-below-reference/capped-above response is unvalidated. Exact piecewise integration computes one-hour means; 3 mmHg is a nominal screen, not a lethal threshold. Initial ppCO2 above it is rejected at hour zero. Installed scrubber power and mass are counted; extra cooling/vacuum/regeneration infrastructure is not solved. Disabled runs explicitly omit CO2. See co2-walkthrough.md for all equations, source locations and scope.


## Model 0.5.0: fixed pressure and oxygen composition
Atmosphere screening is opt-in and separate from CO2. Pressure and dry O2 percentage are static setpoints, assumed maintained without a regulator/leak/gas-mixture simulation. Dry ppO2=P*F differs from inspired PIO2=(PB_mmHg-47)*F. The program selects the pinned NASA normoxia target as a design screen, rather than implementing every exposure category. At least 30% inert balance is assumed, not chemically analyzed. Stored oxygen remains a separate inventory and cannot set cabin composition. Passing is not pressure-vessel, ignition, decompression/EVA, physiological or full-standard qualification. See atmosphere-walkthrough.md for exact criteria, units, equations and source locations.

## Model 0.6.0: thermal capacity screening
Required thermal output Q = UA * abs(T_inside - T_outside), in kW thermal. NASA Passive Thermal Control Engineering Guidebook Rev.5.1 (December 19, 2024), section 4.2.1, gives Q = (k*A/L)*(T1-T2). For a uniform slab UA=k*A/L; convert W/K to kW/K. Existing UA is a lumped design assumption; exterior air temperature is used as a boundary proxy, not a solved wall surface temperature.
Required electrical input remains Q/COP, in kW electrical. The existing thermal_load_kw response is electrical demand, despite its historical name. thermal_summary separates required_thermal_kw and required_electric_kw.
thermal_capacity_enabled defaults false. When true, heating_capacity_kw or cooling_capacity_kw (total installed thermal output) is selected from the sign of T_inside-T_outside. Margin=available-required. A margin below -1e-9 kW records a thermal event at hour zero, before resource consumption. Equal temperatures require no conductive heating/cooling. Failed screens report target requirements, not actual power use or a temperature trajectory. Disabled screening still accounts for HVAC electricity and explicitly reports capacity not evaluated.
Capacities default zero and are unvalidated design inputs, not NASA hardware specifications. No thermal hardware mass is invented. Optimization keeps thermal inputs fixed and cannot repair an undersized system by adding oxygen/water units. Agent tools share these checks and expose the summary. Internal/metabolic heat, solar input, radiation, convection, thermal inertia, heat rejection and operating limits remain omitted. Passing cannot establish Venus cooling feasibility.

## Oxygen and water failure diagnostics
Oxygen shortage messages expose crew requirement, modeled production, stored oxygen before the failed hour and the positive unmet balance. Water messages expose crew use, modeled recovery, ideal electrolysis feedwater, starting usable inventory and the unmet balance. Quantities are kg per one-hour step and are formatted to six decimals without changing calculation precision. Failed-hour values are diagnostic, not evidence that processing occurred despite missing water or power; unprocessed wastewater is not usable supply. Existing tolerance, clamping and simultaneous-event behavior are unchanged.
