# Cabin CO2 screening — model 0.4.0

## Try it
Restart the backend in the VS Code terminal containing your Gemini environment key, then refresh the app. Existing configurations leave CO2 screening OFF for compatibility and explicitly say it was not evaluated.

In Manual Configuration, check **Evaluate cabin CO2 and scrubber load**. Choose a free cabin volume (default 100 m3), initial partial pressure (default 0.4 mmHg) and historical CDRA unit count. Zero units means no CO2 removal. This models the interior cabin, not the planet's exterior atmosphere. There is no full cabin pressure or oxygen partial-pressure simulation.

For a failure example: Mars, four crew, 30 days, 14 kW generation, default supplies, 100 m3, initial 0.4 mmHg and zero scrubbers. The one-hour average exceeds 3 mmHg in hour 4. With six crew and zero scrubbers, it exceeds the limit in hour 3. These are screening outcomes, not lethal times.

For an optimization demo: Mars, six crew, 30 days, 400 kg initial water, 14 kW generation, otherwise defaults; enable CO2 screening and Require no wastewater waiting at mission end. Leave oxygen/water maxima at eight and scrubber maximum at four. The search evaluates 405 candidates, four pass, and the lightest has two oxygen units, two water units and two scrubbers. Known combined hardware mass is 1044.233133 kg; modeled electrical demand is 12.334 kW. It completes 720 hours, ending at approximately 1.564904 mmHg CO2 and 58.594 kg potable water. This is not total mission mass or proof of survival.

In the agent panel, **Try a CO2 screening goal** fills an explicit request for the same conditions. The new fields are available in its validated tool schemas. Review proposed changes before applying. The new extension introduces no external API: calculations and reference data are local; Gemini remains the existing external integration.

## Exact documents used
1. NASA Life Support Baseline Values and Assumptions Document, NASA/TP-2015-218570 Rev 2, February 2022, Table 3-31, printed p.58 / PDF p.72: https://ntrs.nasa.gov/api/citations/20210024855/downloads/BVAD_2.15.22-final.pdf . Nominal CO2 production is 1.085 kg/person/Earth-day for the stated 82 kg crew/exercise profile, matching the profile already used for oxygen consumption. It is not the different HIDH 1.04 kg/day profile or BVAD Table 4-1 rounded value.
2. NASA OCHMO-TB-004 Carbon Dioxide, Relevant NASA-STD-3001 V2 6004 / Reference Information: https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/ . Nominal cabin CO2 partial pressure must average no more than 3 mmHg over one hour. This is used as a design screen, not a toxicity prediction or certification.
3. Darrell Jan, NASA Ames Research Center, NASA CO2 Removal, July 24 2019, slide 36 / PDF p.36: https://usea.org/sites/default/files/event-/JAN_NASA%20DCA%207-24-2019sW2.pdf . NASA-authored presentation hosted by USEA; states historical CDRA performance of 4.16 kg/day at 2 mmHg, 1000 W and 450 lb. The model converts that mass to 204.1165665 kg per unit using 0.45359237 kg/lb. These figures are a historical operating-point reference, not a complete performance curve or planetary qualification.
4. NASA Glenn, Equation of State (Ideal Gas): https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/equation-of-state-ideal-gas-2/ . Supports pV=nRT, not the perfect-mixing assumptions.
5. NIST Chemistry WebBook, carbon dioxide: https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Mask=8004 . Molecular weight 44.0095 g/mol.
6. NIST CODATA molar gas constant: https://physics.nist.gov/cgi-bin/cuu/Value?r . R=8.31446261815324 J/(mol K).

Research also inspected NASA's Life Support CO2 Removal technology-gap sheet at https://www.nasa.gov/wp-content/uploads/2024/09/19-life-support-co2-removal-spec-sheet-508.pdf . Its <=500 W and <=100 kg values are sought technology goals. They were **not used as demonstrated equipment specifications**.

## Equations and assumptions
The cabin is treated as well mixed, with constant user-selected free volume V and temperature T taken from the interior setpoint in kelvin. Cabin CO2 mass m maps to partial pressure p by:

    p_mmHg = m * R * T / (M * V * 133.322387415)

M is 0.0440095 kg/mol. Every crew member generates 1.085/24 kg per Earth hour. This load is constant, without within-day exercise peaks. The finite oxygen supply inventory is not treated as a solved cabin gas mixture.

Scrubber removal is modeled as:

    removal_kg_hour = units * (4.16/24) * min(p_mmHg/2, 1)
    dm/dt = crew_generation - removal

The pressure-dependent linear segment below 2 mmHg and the cap above it are **unvalidated response assumptions**. They prevent removing CO2 that is not present while using the published point at 2 mmHg. Actual sorbent performance, humidity response, throughput control and regeneration cycles are not represented. Installed units each add a fixed 1 kW even at low removal load; no duty-cycle power credit is invented.

co2.py analytically integrates the piecewise differential equation, including crossing the 2 mmHg response boundary. It returns the exact hour-end pressure and time-average pressure for this assumed curve. The engine stops when the one-hour mean exceeds 3 mmHg; an hour-end value alone does not trigger that requirement. Initial pressure above 3 mmHg is separately rejected at hour zero as a conservative initial-state screen. The hour-zero reading has no completed-hour average.

Removed mass leaves the modeled cabin boundary; no extra oxygen/water recovery credit is assigned. There is no finite CO2 storage tank, waste-vent infrastructure, vacuum-pump or thermal-rejection design. Pressure control, spatial mixing, local breathing pockets, leakage, humidity, reliability, consumables, startup and realistic planetary operating envelopes remain outside the model. The historical source itself reports additional heat rejection; it is not added as a new HVAC load because a consistent integrated thermal model is not available. The UI and exact-run evidence disclose this limitation.

## Optimizer and agent integration
CO2-disabled runs retain the two-dimensional oxygen/water search (at most 81 candidates). CO2-enabled runs add quantities zero through the selected scrubber maximum (up to four), yielding at most 405 candidates. Combined known mass includes installed scrubbers when enabled; zero units contribute zero mass. Unknown installed mass excludes a candidate from ranking. All mission, cabin and supply settings remain fixed within the deterministic search. The agent can propose explicit input changes before invoking it, which remain visible for review.

Optimization checks the same hourly engine as Manual Mode. Candidate audit rows include CO2 unit counts and observed CO2 constraint failures. These counts may overlap other failure conditions. When disabled, CO2 fields/readings are null and the run includes an explicit not-evaluated warning. Neither completion state certifies a safe habitat.

## Files and verification
- backend/app/co2.py: source records, constants, historical resolver and analytical pressure integration.
- backend/data/equipment.json: source-attributed CDRA reference with modeled-response caveats.
- backend/app/models.py: opt-in CO2 fields, reading/balance results and search quantity bounds.
- backend/app/engine.py: CO2 accumulation/removal, one-hour limit, installed power and evidence.
- backend/app/optimizer.py: third count dimension and hardware mass.
- backend/app/advisor.py and mission_agent.py: computed CO2 summaries, schemas and explicit limitations; overlap-aware explanation instructions.
- frontend/src/Co2Panel.jsx: controls, reference link and calculated results.
- frontend/src/App.jsx and DesignComparison.jsx: CO2 trend/comparison charts with a 3 mmHg screen line and equipment audit.
- frontend/src/MissionAgent.jsx: CO2 goal example and existing review/apply workflow.
- backend/tests/test_co2.py: 25 cases covering analytical vs numerical integration, mass conservation, volume effects, one-hour averages, initial violations, power/mass, provenance, bounded optimization, invalid inputs and agent tool integration.

144 backend tests pass, production build passes. Browser verified four-person/no-scrubber failure at hour 4, six-person failure at hour 3, full 405-candidate optimization and CO2 chart. Agent tool integration used mocked model choices with real optimization; live CO2 agent verification remains to be done using the user's local key. Existing dependency/bundle warnings remain. Team scientific review is pending.
