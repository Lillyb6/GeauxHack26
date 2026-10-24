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


## Initial oxygen catalog entry — added 2026-10-24

[NASA NTRS 19790028539](https://ntrs.nasa.gov/citations/19790028539), *Water electrolysis system - H2 and O2 generation*, ASME PAPER 78-ENAS-3, published July 1, 1978. Locator: abstract, first two paragraphs. Reported design values: 4.20 kg O2/day, 1.1 kW, 75 kg fixed hardware, 0.11 m3. Evidence classification: published historical design. Not a measured operating curve, current product, or validated planetary installation. Operating temperature limits remain null. No downloadable full paper is available in that record. Do not transfer limits from a different version of the equipment.

In catalog mode, direct equipment power replaces the DOE energy proxy, and unused custom capacity/energy entries are omitted from result evidence. Sources are packaged with each result so a changed current selection cannot rewrite the previous run's provenance.


## Initial water reference case — 2026-10-24

[NASA-CR-160332, Ellis, Wynveen & Schubert (1979)](https://ntrs.nasa.gov/api/citations/19800002556/downloads/19800002556.pdf), NTRS 19800002556. Table 1 p.7 (PDF p.14), Table 4 p.17 (PDF p.24), Table 9 p.39 (PDF p.46). Derived external-feed budget: maximum total 18.1 minus internal quality-monitor recycle 0.9 = 17.2 kg/day. Combined historical mechanical/control power: (171 + 696)/1000 = 0.867 kW. Combined known dry setup mass: 143 + 100 = 243 kg. Design data and component sums are not universal measured operating curves.

**No net recovery efficiency was established from this source for the chosen case. The model's 90% yield is an explicit unvalidated assumption.** Nominal product/feed division is not valid because internal recycle is included. Do not cite NASA for this yield. See water-recovery-walkthrough.md for interface restrictions and model limits. Other documents investigated (ISS UPA/WPA and VPCAR studies) were not used as numerical specifications for this catalog entry.


## CO2 extension sources
See co2-walkthrough.md for exact document titles, locations and links. BVAD Table 3-31 supports the 1.085 kg/person/day nominal load; OCHMO supports a 3 mmHg one-hour mean design screen. The NASA-authored Jan 2019 presentation, hosted by USEA, supports the historical CDRA operating point, power and mass. NASA Glenn/NIST support ideal-gas conversion constants. Cabin conditions and the piecewise scrubber response are explicitly unvalidated. Technology-gap aspirational limits were excluded from equipment specifications.
