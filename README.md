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

**Scope:** this is a resource-balance prototype, not proof of human survival. Pressure, radiation, CO2 scrubbing, food, structural protection and realistic HVAC are not yet evaluated. Scientific reference values are marked separately from assumed equipment parameters. Model 0.2 adds an in-app evidence register, NASA crew baselines and environmental references, a DOE electrolysis proxy, and explicit editable unvalidated engineering inputs. This remains research-informed rather than scientifically validated. There is no live telemetry, optimizer, Gemini integration, database, or deployment yet.

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

Next: review scientific assumptions, expand and validate the initial oxygen equipment catalog, then add constraints and a deterministic optimizer before Gemini explanations. See the architecture document for suggested ownership. No secret keys are needed for this milestone; keep future Gemini keys server-side and outside Git.

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
