# Cabin atmosphere screening — model 0.5.0

## What this milestone does
The application can now screen fixed interior total pressure and dry oxygen percentage against a selected nominal atmosphere design policy. It shows dry ambient oxygen partial pressure separately from inspired oxygen partial pressure. This is not a pressure-control simulation: leaks, regulators, makeup gases, tank depletion, structural protection and dynamic mixture composition remain unmodeled.

Screening is opt-in to preserve saved scenarios. Disabled runs explicitly say pressure and inspired oxygen were not evaluated. Enabling it does not enable CO2 screening automatically; the two features are separately controlled and labeled.

## Try it
After starting backend model 0.5.0, refresh the frontend. Enable **Screen pressure and inspired oxygen** in Manual Configuration. Start with 101.325 kPa absolute and 20.9% dry oxygen, leaving other settings at their defaults, then Run resource simulation. The static screen passes, showing dry ppO2 about 21.177 kPa and inspired PIO2 about 149.017 mmHg.

Set pressure to 50 kPa while keeping 20.9% oxygen and rerun. Total pressure still lies within the cited pressure band, but inspired oxygen becomes about 68.558 mmHg, outside the selected normoxia target. The engine stops at hour zero before consuming supplies. This demonstrates why oxygen percentage alone cannot describe the cabin oxygen condition. Do not interpret this as a time-to-injury or medical diagnosis.

For the agent, click **Try an atmosphere screening goal** and **Test mission goal with agent**. The example explicitly asks for atmosphere screening at the nominal settings and preserves all other inputs. Review and Apply its proposal. A live gemini-3.8-flash run was verified: one simulate_habitat call, 720-hour default resource completion, only atmosphere_enabled changed, and successful Apply displaying the calculated screen. CO2 remained off per the baseline.

## Exact source documents
1. NASA-STD-3001, Volume 2, Revision E, May 2 2025, sections 6.2.1.1/6.2.1.2/6.2.2.1; requirements V2 6002, V2 6003 and V2 6006; Table 6.2-1; PDF pp.49–51 (table on PDF p.50): https://ntrs.nasa.gov/api/citations/20250004555/downloads/NASA-STD-3001%20Vol%202%20Rev%20E%20FINAL_05022025.pdf . We pin this revision explicitly rather than claiming comprehensive current-standard compliance.
2. NASA OCHMO-TB-003 Habitable Atmosphere, Rev A, November 30 2023, PDF p.4, equation box and sea-level example: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-003-habitable-atmosphere.pdf . Distinguishes dry ambient, humidified inspired and alveolar oxygen; this model calculates the first two only.

NASA's HTML reference for the relevant section is https://www.nasa.gov/reference/6-0-natural-and-induced-environments-vol-2/ . The program stores source references locally; it does not make runtime NASA API calls. Gemini remains the only external API integration used here.

## Criteria and interpretation
The selected design screen requires total cabin pressure greater than 34.5 and no more than 103 kPa, inspired oxygen in the 145–155 mmHg normoxia target, and at least 30% inert diluent assuming balance oxygen. These values come from the specified requirements/table, but using the normoxia target as this prototype's pass/fail design policy is a deliberate selection. The table also contains other exposure categories; those are not implemented. Outside this nominal screen does not mean outside every NASA-permitted situation, a toxicity threshold or an immediate health outcome. Passing is not full standards compliance or survival certification.

The remaining dry gas is assumed inert diluent, nominally nitrogen. It is not analyzed for contaminants or alternative-gas qualification. Trace CO2 and water vapor are not part of a coupled dry-mixture mass balance. CO2 accumulation is separately available through the existing idealized subsystem. Pressure-vessel loads, flammability, EVA transitions, decompression sickness and physiology are not evaluated.

## Equations
Input pressure P is absolute kPa and oxygen percentage is converted to fraction F. Using 133.322387415 Pa per conventional mmHg:

    PB_mmHg = P_kPa * 1000 / 133.322387415
    dry_ppO2_kPa = P_kPa * F
    dry_ppO2_mmHg = PB_mmHg * F
    inspired_PIO2_mmHg = (PB_mmHg - 47) * F
    assumed_diluent_percent = 100 - oxygen_percent

The 47 mmHg term represents airway water vapor at body temperature in the reference equation, not cabin humidity or the habitat temperature setpoint. It is a fixed model approximation, not an individualized physiology calculation. Alveolar oxygen is not calculated. At pressure below this airway-water correction, inspired pressure is returned as null rather than a negative physical pressure, and the nominal screen fails. The total-pressure lower bound is strictly exclusive. Oxygen target endpoints are inclusive, with 1e-9 mmHg numerical comparison tolerance.

## Relationship to stored oxygen and equipment
The oxygen_kg field remains an available supply inventory. It is not the quantity of oxygen in a dynamically solved cabin gas mixture. Increasing stored oxygen or oxygen-generation units does not change the selected pressure or oxygen percentage. No regulator hardware mass, power or gas requirement is invented for maintaining these settings.

The deterministic optimizer holds atmosphere settings fixed for every candidate and uses the same simulator checks. Invalid fixed settings therefore reject all candidates; adding more equipment cannot repair them. The agent may propose different pressure/composition settings only as a visible, reviewed input change. Existing model validation bounds are 0–200 kPa and 0–100% oxygen; those are software input bounds, not operating recommendations.

## Implementation
- backend/app/atmosphere.py: source records, constants, equations, individual criteria and static summary/evidence.
- backend/app/models.py: atmosphere_enabled, cabin_pressure_kpa, cabin_oxygen_percent and atmosphere_summary; version 0.5.0.
- backend/app/engine.py: initial screen at hour zero, distinct constraint events and exact-run source evidence. Valid settings do not alter existing consumable balances.
- backend/app/research.py: registers atmosphere sources; unused sources are omitted from disabled-run evidence.
- backend/app/optimizer.py: runs the shared screen at unchanged settings and documents the fixed-setpoint boundary.
- backend/app/advisor.py: sends computed atmosphere summary and reference context to Gemini.
- backend/app/mission_agent.py: exposes new fields through canonical tool schema and instructs the model to distinguish dry/inspired oxygen, static screening and pressure regulation.
- frontend/src/AtmospherePanel.jsx: opt-in inputs, result metrics, per-criterion status, source link and equation/scope details.
- frontend/src/App.jsx: version/capability guard, controls and evaluated result integration.
- frontend/src/DesignComparison.jsx: manual/recommended screen status and result panel.
- frontend/src/MissionAgent.jsx: natural-language atmosphere example, with existing audit and explicit Apply.
- backend/tests/test_atmosphere.py: 32 cases including boundary conditions, the airway correction, invalid inputs, preservation of balances, independent CO2 scope, source attribution, optimization constraints and agent tools.

## Validation
All 176 backend tests pass; production frontend build passes. Browser checks verified nominal settings at 101.325 kPa/20.9% with 149.017 mmHg inspired oxygen, and failure at 50 kPa/20.9% with 68.558 mmHg at hour zero. The live Gemini agent made one simulation call and preserved every other baseline setting; explicit Apply enabled atmosphere screening and displayed the evaluated 720-hour result. Existing dependency/bundle advisories remain. This verifies implementation and integration, not scientific qualification.
