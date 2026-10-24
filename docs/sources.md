# Evidence register — model 0.2.0

Audited 2026-10-23. Runtime registry: `backend/app/research.py`; API: `GET /model-reference`. Each result embeds the actual parameter values, evidence classifications, environment reference and source records. Sources support their stated context, not the entire simulation.

## Primary references and exact locations

| ID | Primary source | Used value / locator | Applicability |
|---|---|---|---|
| bvad | [NASA/TP-2015-218570/REV2, February 2022](https://ntrs.nasa.gov/api/citations/20210024855/downloads/BVAD_2.15.22-final.pdf) | Table 3-31, printed p.58 / PDF p.72: oxygen 0.895 kg/person/day; potable input 3.217 kg/person/day | Reference astronaut: 82 kg with exercise profile. Not universal; potable input excludes food water/hygiene. |
| mars | [NASA Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) | Bulk parameters; Martian Atmosphere: -59 C, 6.36 mbar -> 0.636 kPa, mean gravity 3.73 m/s2; atmosphere fractions | Reference averages; site/season variability. |
| venus | [NASA Venus Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html) | Bulk parameters; Venus Atmosphere: 464 C, 92 bar -> 9200 kPa, 8.87 m/s2; CO2/N2 fractions | Surface only. |
| titan | [NASA TFAWS Dragonfly thermal analysis (2023)](https://tfaws.nasa.gov/wp-content/uploads/TFAWS23-AT-15-Presentation.pdf) | Slide 4 / PDF p.4: temperature approximately -180 C (94 K rounded), pressure 146 kPa, gravity 1.352 m/s2 | Reference landing environment; not habitat performance. [NASA Titan facts](https://science.nasa.gov/saturn/moons/titan/facts/) supplies methane/resource context. |
| doe_pem | [US DOE PEM electrolysis targets](https://www.energy.gov/cmei/fuels/technical-targets-proton-exchange-membrane-electrolysis) | System Energy Efficiency, 2022 STATUS: 55 kWh/kg H2 | Use the status column, not future targets. Derived proxy: 55/8 = 6.875 kWh/kg O2 using rounded stoichiometry. Terrestrial system, not space-qualified hardware. |
| wrm | [Chow, Nelson & Perry, IMECE2018-88119, NASA NTRS](https://ntrs.nasa.gov/api/citations/20180007962/downloads/20180007962.pdf) | Table 1 / PDF p.3: water recovery/management 0.527 kW | Historical ISS configuration analysis. Fixed load is a transfer assumption, not a universal recycler specification. |
| water_recovery | [NASA water recovery milestone, June 20, 2023](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/) | Overall ISS recovery 93–94% before BPA, 98% demonstrated with BPA | Does not validate recovery on planetary surfaces or the simplified potable-only loop here. |
| conduction | [NASA Passive Thermal Control Engineering Guidebook Rev.4](https://ntrs.nasa.gov/api/citations/20230013900/downloads/NASA%20Thermal%20Control%20Engineering%20Guidebook%20v4.pdf) | Section 4.2.1, printed p.42: Fourier conduction relation | Supports equation form only, not UA=0.04, COP=1, or cooling feasibility. |
| electrolysis | [NASA-hosted electrolysis research](https://ntrs.nasa.gov/api/citations/20180007962/downloads/20180007962.pdf) | OGA discussion, PDF p.3: water electrolysis | Balanced chemistry gives rounded ideal water/O2 mass ratio 36/32=1.125. No losses included. |

## Values that are NOT research measurements

Other habitat load (default 3.2 kW), conductance (0.04 kW/K), HVAC COP (1), cabin setpoint (21 C), equipment output, battery capacity, power supply and starting supplies are explicit scenario/design inputs. Their example defaults are **not NASA specifications**. User edits to source-based parameters are labeled overrides. No scientific source is invented for these design choices.

Continuous generation, ideal storage, instant recovery and linear equipment scaling are structural assumptions. Pressure, radiation and structural/thermal operating envelopes are missing. These gaps prevent a claim that all results are scientifically validated. See assumptions.md and research-audit.md.

## Changes from the original demo

- Replaced older 0.84 oxygen baseline with the specific 0.895 Table 3-31 baseline; not a claim that the older reference was universally wrong.
- Replaced assumed 3.5 potable-water input with 3.217.
- Replaced assumed 5 kWh/kg O2 with a documented DOE-derived proxy.
- Replaced assumed 0.5 kW recycler load with the historical 0.527 kW reference, retaining an explicit applicability warning.
- Replaced ESA environment values with internally consistent NASA reference sets. Different averages/rounding are not contradictory observations.
- Moved remaining hidden equipment/thermal constants into editable design controls with evidence classifications.

NASA, DOE and ESA do not endorse this project. No generated images/video or agency branding assets are included.
