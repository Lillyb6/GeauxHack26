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

UA and COP are unvalidated inputs, not NASA measurements. This envelope proxy omits convection/radiation, solar input, internal/metabolic heat, thermal inertia, materials and heat rejection. No thermal control capacity check exists. In particular, a viable Venus cooling system cannot be inferred from this calculation.

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
