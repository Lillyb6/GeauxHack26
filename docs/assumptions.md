# Scientific and mathematical scope — v0.1.0

This is a deterministic resource-balance teaching prototype, not life-support engineering software. No readiness score or survival probability is reported.

## Sourced reference values
Environment cards use representative published values, not site-specific readings or live mission telemetry. Sources and units are in sources.md. Pressure and gravity are context only in this milestone. Fixed exterior temperature affects the assumed thermal power load. Available resources are contextual; no extraction is simulated.

## Modeled assumptions (not spacecraft equipment specifications)
- One step is one Earth hour; maximum 180 Earth days, 12 people.
- Oxygen consumption: 0.84 kg/person/day, a NASA nominal reference rather than an individual prediction.
- Crew water use: 3.5 kg/person/day (team-review assumption). The selected fraction is recovered immediately; hygiene, waste storage, recovery delay, leakage and recycler throughput are omitted.
- Electrolyzer continuously produces selected kg O2/day. Feedwater = 1.125 kg per kg O2 from ideal stoichiometry. Energy = 5 kWh/kg O2 (assumed). Hydrogen vented; no recovery modeled.
- Thermal electric load = 0.04 kW/K * abs(21 C - exterior temperature). Assumed UA and ideal COP=1. No inertia, radiation heat exchange, HVAC capacity or materials validation. This is particularly inadequate for Venus surface cooling.
- Other loads: 0.8 kW/person plus 0.5 kW for recycling (even at zero recovery).
- Power supply is constant external generation, not a solar array. Fuel, hardware mass, outages and local illumination are omitted. Battery starts full; capacity equals entered initial charge. Charging/discharging are ideal without rate limits.
- Oxygen storage is ideal and unbounded in this milestone. No leaks, pressure or mixture model.

## Hourly balances
O2_next = O2 + electrolyzer_kg_day/24 - crew*0.84/24.
Water_next = water - crew*3.5*(1-recovery)/24 - electrolyzer_kg_day*1.125/24.
Battery_next = min(capacity, battery + generation_kW - demand_kW).
Demand = crew*0.8 + 0.5 + thermal + electrolyzer_kg_day*5/24.

If any next inventory is below -1e-9, record an unmet-demand event in that hour and stop. Values clamp to zero for display. An exact zero end-of-step balance is allowed; the next step must still meet demand. Failed-hour rows are diagnostic attempted balances, not evidence equipment operated without power/water. Failure timing has one-hour resolution, not a medical survival deadline.

Resource completion means only that the three simplified balances completed. Pressure vessels, CO2 scrubbing, radiation, food, medical effects, reliability, structural mass, fuel and thermal feasibility remain unevaluated. Switching to Venus or Titan changes assumed thermal demand; it does not validate habitable conditions there.
