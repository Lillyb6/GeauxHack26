# Current validation — water equipment, model 0.3.0, 2026-10-24

- Backend: **61 tests passed** (22 new water cases). Checks include per-hour water conservation within the declared boundary, backlog, overload warnings, unit scaling, missing specs/unknown mass, source attribution, invalid selections, zero equipment and resource failures.
- Frontend production build passed; existing chart bundle-size advisory remains.
- Browser: water selection loaded, custom recovery/power fields disabled, reference derivations displayed. At 12 crew / one day / 100 kW generation, one unit recovered 15.48 kg and left 21.404 kg waiting. Three units recovered 34.7436 kg with zero queue and no capacity warning. Oxygen/custom compatibility remains covered by tests.
- Final data audit excludes 0.9 kg/day internal recirculation from maximum design flow, giving 17.2 kg/day external-feed budget. The 90% recovery yield remains explicitly unvalidated and has no NASA source ID.
- Starlette/httpx deprecation warning remains; no test failures. No hardware/planetary qualification implied.

## Previous equipment validation (2026-10-24)


- Backend: **39 tests passed**, including 13 equipment tests for quantity balances, custom/catalog separation, evidence/source consistency, unknown mass, missing specifications and invalid IDs/counts.
- Frontend: `npm run build` passed. Existing chart bundle-size advisory remains.
- Browser: catalog loaded; selecting equipment disabled custom oxygen/energy fields; one-unit run completed 720 hours with 8.027 kW demand; two-unit preview showed 8.4 kg/day, 2.2 kW and 150 kg. A one-day two-unit run completed with 9.127 kW total demand.
- Changing quantity retained the previous result and displayed the stale-input warning. Switching to custom mode re-enabled custom controls. Exact-run evidence cited historical equipment and omitted the unused DOE oxygen-energy proxy.
- Starlette/httpx TestClient deprecation warning remains; no failed tests.
- Tests verify declared accounting, not scientific qualification. Equipment operating envelope and the general thermal/pressure/radiation gaps remain unresolved.

## Previous research audit (0.2.0, 2026-10-23)


- Backend: **26 tests passed**. Includes nominal crew balances, source-ID resolution, parameter override labeling, environment unit conversions, model-default consistency and engineering input validation.
- Frontend: production build passed. Existing bundle-size advisory remains.
- Browser: NASA Mars references loaded; model defaults fetched from API; revised Mars simulation completed 720 hours with 8.073 kW demand; source panel displayed nominal crew values, source links and unvalidated input labels.
- Existing Starlette/httpx TestClient deprecation warning remains; no failed tests.
- Passing software checks confirms the code implements the stated model, not scientific calibration. See research-audit.md for unresolved gaps.

## Historical initial milestone checks (v0.1.0)


- Python 3.12: `python -m pytest -q` from backend — **17 passed**.
- One upstream Starlette warning about httpx TestClient deprecation; no failed tests.
- Node 24.11 / Vite 8.3.5: `npm run build` — **passed**.
- Vite notes the initial bundle exceeds 500 kB due to charts; future code splitting is optional.
- `npm install` audit — zero reported vulnerabilities at installation time.
- Live browser through Vite proxy: all environment cards load; default Mars completes 720 hours; changing environment flags stale results; Venus power deficit at hour 8; Titan power deficit at hour 22. Charts render from API results.
- Frontend observed at a narrow ~600px panel width; mobile stacking renders. Full desktop/device/accessibility audit remains team work.
- Python dependency snapshot: backend/requirements.lock.txt; npm lockfile: frontend/package-lock.json.
- Scientific calibration, full pressure/thermal/radiation validation and designer review are pending. This does not establish mission feasibility.
