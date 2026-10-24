# Beyond Earth
Adaptive Planetary Habitat Intelligence System · GeauxHack26

A functional first milestone for the team's hackathon project: configure a surface habitat on **Mars, Venus or Titan**, submit it to a Python simulator, and inspect hourly oxygen, water and electricity inventories and the first modeled shortage. Titan is a moon. All charts come from API calculations, not hardcoded outcome data.

## Run locally (two terminals)
Requirements: Node.js 22.12+ (or a supported newer LTS), Python 3.11+ and npm. Commands below are for Windows PowerShell, from the repository root.

Terminal 1:
```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock.txt
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
If `py` is unavailable, replace it with your Python 3 executable. Using the executable directly avoids PowerShell activation-policy issues.

Terminal 2:
```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```
Open the localhost URL Vite prints (normally http://127.0.0.1:5173). API explorer: http://127.0.0.1:8000/docs. Keep both terminals running. Vite forwards /api to FastAPI; the backend stays on port 8000.

macOS/Linux: use `python3 -m venv .venv`, `.venv/bin/python` (or `../.venv/bin/python` from backend) and `npm` instead of `npm.cmd`.

## Demo
1. Run the default Mars scenario: 4 crew, 30 Earth days. The modeled balances complete.
2. Set continuous power to 0 kW. The battery depletes and the engine reports a deficient hour.
3. Restore power to 8 kW and select Venus or Titan. The simplified thermal load changes and the same design fails earlier.
4. Change supplies or power and run again. Charts retain their last result until rerun; changed inputs are flagged.

**Scope:** this is a resource-balance prototype, not proof of human survival. Pressure, radiation, CO2 scrubbing, food, structural protection and realistic HVAC are not yet evaluated. Scientific reference values are marked separately from assumed equipment parameters. Model 0.2 adds an in-app evidence register, NASA crew baselines and environmental references, a DOE electrolysis proxy, and explicit editable unvalidated engineering inputs. This remains research-informed rather than scientifically validated. A bounded deterministic equipment-count optimizer is available. A Gemini explanation advisor is integrated and requires backend configuration. There is no live telemetry, database, or deployment yet.

## Checks
```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest -q
cd ../frontend
npm.cmd run build
```
Backend tests cover balances, conservation of electrolysis feedwater, empty resources, power failure, battery limits, deterministic behavior, all three environments and API validation. Production frontend deployment will need an /api reverse proxy; Vite's proxy is development-only.

## Architecture and team handoff
- `frontend/`: React, Vite, Tailwind CSS, Recharts; CSS-only placeholder planet circles for designer replacement.
- `backend/app/`: FastAPI contracts, environment references, deterministic engine.
- `backend/tests/`: engine and API tests.
- [Architecture and next milestones](docs/architecture.md)
- [Model equations and limitations](docs/assumptions.md)
- [Scientific source attribution](docs/sources.md)
- [Research audit and remaining validation gaps](docs/research-audit.md)
- [Equipment implementation walkthrough](docs/equipment-walkthrough.md)

Next: review scientific assumptions, validate the equipment catalog and expand physical constraints before Gemini explanations. See the architecture document for suggested ownership. No secret keys are needed for this milestone; keep future Gemini keys server-side and outside Git.

## AI usage disclosure
Update this log with every substantial AI contribution. Team review remains pending; generated code is not represented as independently validated science.

| Date | Tool/model | Contribution | Files | Validation |
|---|---|---|---|---|
| 2026-10-23 | OpenAI Codex (GPT-6 family assistant) | Proposed architecture; generated starter API, simulator, UI, tests, and documentation | frontend/, backend/, docs/, README.md, .gitignore | Automated test/build results recorded in docs/validation.md; team scientific and visual review pending |

Original visual direction and final artwork will be supplied by the team. No generative image/video assets are included. Scientific references are attributed above. Add team names and the final demo/deployment links before submission; confirm all event-specific README requirements against the official rubric.


### AI assistance update — 2026-10-23
Codex researched primary NASA/DOE sources, revised constants and provenance, exposed unsupported design assumptions, updated the evidence UI/docs, and added research regression tests. Changes are AI-assisted; team scientific review is pending. Sources support individual inputs in their stated contexts, not full mission feasibility. See docs/validation.md for verification.


## Oxygen equipment catalog

Choose **Oxygen system** in Manual Configuration. Custom mode retains the existing capacity/DOE energy proxy. Catalog mode uses the selected published historical design and unit count instead; unused custom controls are disabled. Its source, totals, unknown planetary operating envelope and hardware-only mass are visible before and after a run.

The initial entry uses [NASA NTRS record 19790028539](https://ntrs.nasa.gov/citations/19790028539), *Water electrolysis system - H2 and O2 generation* (1978), abstract: a historical design with 4.2 kg O2/day output, 1.1 kW power, 75 kg fixed hardware mass and 0.11 m3 volume. It is not a claim of current flight qualification or planetary suitability. Ideal electrolysis feedwater remains a separate chemistry-derived assumption. No new water/power/thermal equipment catalog entries have been invented.

Example: one unit on default Mars inputs uses 8.027 kW total modeled demand. For a one-day mission, oxygen ends at 30.62 kg, water at 294.37424 kg, and battery at 99.352 kWh. Two units double equipment output/power/hardware mass, not human consumption. The response includes `equipment_summary`, exact-run evidence and only the source records used by that evidence/environment. The current-input preview and previous result remain separate when inputs change.

### AI assistance update — 2026-10-24
The user implemented the initial catalog, loader, API/model additions and simulation integration, including restoring initial inventories. Codex completed equipment-aware evidence reporting, React selection/quantity/summary controls, source display, regression tests and documentation. Added backend tests cover known/unknown specifications, quantity scaling, custom-mode separation, error responses and provenance. Full validation is recorded in docs/validation.md; independent scientific/hardware review remains pending.


## Capacity-limited water recovery (model 0.3.0)
Select **Water recovery system → VCDS water recovery — 1979 reference case** and choose a unit count. Catalog mode disables custom recovery/recycler-power fields, tracks wastewater waiting for processing, and displays effective recovery, brine/losses and overload warnings. Custom mode retains the previous unbounded-throughput assumption. Oxygen and water units can be selected together.

The initial water entry uses a [historical NASA contractor report](https://ntrs.nasa.gov/api/citations/19800002556/downloads/19800002556.pdf) for a derived external-feed design budget and combined mechanical/instrumentation mass and power. **The 90% processed-feed recovery yield is an explicit unvalidated assumption, not a NASA measurement.** This case is a planning proxy, not qualified planetary equipment. See [the water-recovery walkthrough](docs/water-recovery-walkthrough.md) for derivations, equations, scope and a 12-person overload demo.

### AI assistance update — water recovery, 2026-10-24
Codex researched primary NASA references; implemented the water equipment resolver, capacity-limited queue and mass accounting, selection UI, provenance, regression tests and documentation. Source review excluded internal monitor recirculation from the external-feed budget and rejected an unsupported efficiency inference. The unresolved recovery yield remains clearly labeled. Team scientific review is pending; see docs/validation.md.


## Deterministic optimization and comparison
Select equipment designs and click **Optimize and compare**. The search evaluates up to 81 oxygen/water count combinations using the same simulation engine, keeping supplies, crew, duration, power generation and thermal inputs fixed. It minimizes known hardware mass within that bounded set and returns no recommendation when no eligible configuration works. Optional ending-wastewater constraints, candidate audit, evidence and inventory comparison charts are included.

Try Mars / 4 crew / 30 days / 10 kW generation with two units of each catalog design and other defaults. Manual hardware is 636 kg and reaches a power constraint at hour 300; the selected one-plus-one configuration is 318 kg and completes 720 modeled hours. This is resource feasibility under assumptions, not mission certification. See [the optimizer walkthrough](docs/optimizer-walkthrough.md) for implementation and interpretation.

### AI assistance update — optimizer, 2026-10-24
Codex implemented deterministic bounded enumeration, API contracts/endpoint, manual-versus-optimized UI, 18 regression cases and documentation. No LLM produces simulation metrics. Existing NASA-attributed catalog evidence and explicitly unvalidated water yield are retained. All 79 backend tests and the frontend build pass; browser checks are recorded in docs/validation.md. Team scientific review remains pending.


## Gemini mission advisor
After optimizing, click **Explain this comparison with Gemini**. The backend recomputes outcomes, sends compact results and source evidence to Gemini, and validates the structured explanation. Without configuration or on failure, the UI labels computed fallback guidance honestly. Keep GEMINI_API_KEY server-side. See [setup and implementation](docs/gemini-advisor.md). AI prose requires review against authoritative calculated results and source documents.

**Mission-design agent:** a custom Gemini-powered agent with bounded calls to local simulate/optimize tools, validated inputs and explicit proposal review/apply. See docs/mission-agent.md.

### AI assistance update — Gemini advisor, 2026-10-24
Codex implemented the backend explanation endpoint, compact evidence payload, structured provider response validation, redacted fallback handling, advisor UI, mocked regression tests and setup documentation. The integration uses Google's documented generateContent API; no live Gemini response has been verified without a supplied API key. The simulator remains authoritative. Team review is pending.

Advisor diagnostics follow-up: Codex added static HTTP-status, timeout and connection hints without returning provider bodies or credentials; regression tests cover redaction.


## Mission-design agent and external API budget
Use **Ask your mission designer** to describe a goal. The agent can call local simulation and optimization tools, show an audit and present all proposed changes for explicit application to Manual Mode. It uses the existing Gemini integration only: one runtime external API provider, within the stated two-integration limit. NASA references are bundled and attributed; there are no runtime NASA API requests. A run may make multiple Gemini requests. See [the agent guide](docs/mission-agent.md).

### AI assistance update — mission agent, 2026-10-24
Codex implemented the bounded Gemini function-calling loop, canonical input validation, local tool audit, proposal review/apply UI, regression tests and documentation. Default model updated to gemini-3.8-flash after the user's successful advisor test. All 119 backend tests and frontend production build pass. Browser checks used clearly labeled mocked Gemini decisions with the real optimizer; live agent function-calling verification remains pending. No additional external provider or generative visual assets were added. Scientific assumptions remain unvalidated; team review is pending.


## Cabin CO2 screening — model 0.4.0
Enable **Evaluate cabin CO2 and scrubber load** to model a well-mixed interior cabin, NASA BVAD crew CO2 generation, historical CDRA units, power and hardware mass, and a NASA-referenced 3 mmHg one-hour-average design screen. Screening is off for existing scenarios and explicitly labeled not evaluated. Enabled optimization includes scrubber quantities (up to 405 candidates); the agent has a CO2 goal example. Historical operating-point data is distinguished from the unvalidated response curve and cabin assumptions. [Full sources, equations and demo](docs/co2-walkthrough.md). No additional external API is introduced.

### AI assistance update — CO2 extension, 2026-10-24
Codex researched NASA/NIST primary references, excluded technology targets from equipment-performance claims, implemented analytical CO2 balances, explicit opt-in controls, source-attributed equipment, optimizer/agent integration, charts, 25 regression cases and documentation. All 144 backend tests and frontend build pass; browser simulation and optimization checks passed. Live CO2 agent verification and team scientific review remain pending. The existing agent checkpoint was already committed as e9674b0 before this extension.

Compatibility follow-up: Codex added a startup capability check that identifies an older running backend missing CO2 fields/catalog support and displays restart instructions, preventing the updated frontend from silently using an incomplete contract. Frontend production build verified.

Live integration follow-up — 2026-10-24: Codex verified the real Gemini CO2 mission goal and explicit Apply workflow after the user restarted backend 0.4.0. The live agent made one optimizer call and returned the expected 405-candidate, two-plus-two-plus-two result. Validation evidence is recorded in docs/validation.md; no credential was read or added to Git. Scientific qualification remains pending.


## Fixed cabin atmosphere screening — model 0.5.0
Enable **Screen pressure and inspired oxygen** to evaluate static interior pressure and dry oxygen percentage, distinguish dry oxygen partial pressure from inspired oxygen, and check the selected NASA-referenced nominal criteria. The feature does not model leaks, regulators, gas replenishment, pressure-vessel protection or a dynamically coupled gas mixture. CO2 screening remains separate and opt-in. Invalid atmosphere settings stop at hour zero, and optimization cannot fix them by adding equipment. Try the new agent atmosphere goal, inspect the audit and Apply. [Sources, equations, interpretation and demo](docs/atmosphere-walkthrough.md). No additional external API.

### AI assistance update — atmosphere screening, 2026-10-24
Codex researched pinned NASA-STD-3001 Vol 2 Rev E and OCHMO-TB-003 references; implemented the static screen, explicit dry/inspired oxygen distinction, source evidence, UI, optimizer/agent integration and 32 regression cases. All 176 tests and frontend build pass. Manual browser checks and a live gemini-3.8-flash simulation/Apply run passed; no credential was read or stored. Scientific and standards-compliance qualification remain outside the prototype.


## Save, load and share missions
The mission library stores named input snapshots in browser local storage, with load, duplicate, confirmed deletion and JSON export/import. Loading clears old results and proposals and requires a fresh run. Files include all mission/screening/equipment/search settings and model version, not results or credentials. Browser storage is specific to the site origin/profile; export JSON to share with teammates or back up data. No new external API or cloud service. [Usage, format and frontend handoff](docs/mission-save-load.md).

Frontend persistence checks: run `npm.cmd test` from frontend, then `npm.cmd run build`. Backend checks include a fixture-contract test to keep frontend validation tests aligned with the canonical models.

### AI assistance update — mission save/load, 2026-10-24
Codex implemented the standalone local mission library, versioned input-only files, schema/catalog validation, import preview, safe storage failures and stale-result invalidation; added 27 frontend tests and a backend contract-fixture test, and documented the handoff for the console redesign. Browser save/refresh/load/duplicate/delete/import/rerun workflows were verified. No new dependency, scientific model or external API integration was added.
