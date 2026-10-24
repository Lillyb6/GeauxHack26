# Current validation — thermal integration, model 0.6.0

- 203 backend tests passed, including 15 thermal integration cases plus the existing standalone helper tests. Coverage includes unchanged default balances, initial-state failures, exact/sufficient capacity, COP/battery accounting, planetary heating/cooling selection, API input bounds, source attribution, fixed optimizer constraints, and agent schema/compact evidence.
- 28 frontend mission-storage tests passed, including explicit 0.5.0-to-0.6.0 input migration. Missing or forged legacy fields remain rejected.
- Production frontend build passed. Existing chart bundle-size and Starlette/httpx advisories remain.
- Browser verified one-day Mars with thermal screening enabled: 2 kW heating reports a 1.2 kW shortfall and zero hours; 3.2 kW heating completes 24 hours. Plain labels and technical subtitles render. No live Gemini request was made.
- Capacity and COP are explicit design assumptions; conduction-only capacity screening is not a complete thermal model or planetary hardware qualification.

## Prior validation records

# Current validation — local mission save/load, 2026-10-24

- Frontend: **27 persistence tests passed**, covering complete input snapshots, canonical key order, invalid values/versions/IDs, missing/extra fields, file-size limits, library corruption, storage/quota errors, unique names, deletion, list freshness and save limits. Production build passed; existing chart bundle-size advisory remains.
- Backend: **177 tests passed**, including a frontend fixture/API contract alignment check; existing Starlette/httpx deprecation warning remains.
- Browser: named save persisted after refresh; loading restored saved inputs and cleared prior results/agent state. Duplicate created a separate snapshot; deleting the test duplicate required confirmation and preserved current inputs. A portable six-person JSON snapshot was validated, imported, loaded with both screening systems/equipment/search settings intact, and rerun to produce fresh 720-hour / 12.334 kW results without a false stale-input warning.
- JSON serialization/export round-trip is covered by tests; browser download action was exercised but the browser-managed output location was not independently inspected. File import and pasted JSON use the same validator; browser import was verified via pasted JSON.
- No backend production routes, scientific equations or external API integrations changed. Saves contain input settings, not computed results or credentials. Browser origin/profile storage scope and unsupported cross-model migration are documented in mission-save-load.md.

## Previous atmosphere validation

# Current validation — atmosphere screening, 2026-10-24

- Backend: **176 tests passed**, including 32 atmosphere cases for dry/inspired equations, strict pressure bounds and nominal target endpoints, inert diluent, low-pressure null handling, hour-zero events, unchanged resource balances, source provenance, input validation, optimizer constraints and agent integration.
- Frontend build passed; existing bundle advisory and Starlette/httpx warning remain.
- Browser: 101.325 kPa / 20.9% passed the nominal screen (21.176925 kPa dry ppO2, approximately 149.017 mmHg inspired PIO2). At 50 kPa / 20.9%, inspired pressure was approximately 68.558 mmHg and the run stopped at hour zero.
- Live Gemini gemini-3.8-flash: one simulate_habitat call evaluated the nominal atmosphere request over 720 hours, preserving four crew, default supplies/equipment and CO2 disabled. The proposal changed atmosphere_enabled only. Apply updated Manual Mode and showed the evaluated atmosphere result.
- Screening uses pinned NASA references and static setpoint assumptions; it does not validate a regulator, coupled gas mixture, exposure safety or full standards compliance. No new external API was added.

## Previous CO2/live agent validation

# Live CO2 agent verification — 2026-10-24

- Confirmed running backend model 0.4.0 after the user restarted their keyed terminal.
- Used the real Gemini gemini-3.8-flash connection through the browser; no secret was read or copied.
- Submitted the built-in CO2 goal: six crew, 30 days on Mars, 100 m3 cabin, 0.4 mmHg initial CO2, 14 kW generation, 400 kg water, no ending wastewater backlog.
- Gemini made one optimize_habitat call. The real optimizer evaluated 405 candidates, found four feasible and selected 2 oxygen + 2 water + 2 CO2 units: 1044.233133 kg known hardware, 12.334 kW, 720 completed hours, 1.564904 mmHg ending/hour-average CO2 and zero ending wastewater backlog.
- Checked that the proposal table included enabling CO2, installing two scrubbers and the requested mission changes. Before Apply, manual inputs remained at the baseline values.
- Clicked Apply in the verification tab: manual controls updated to six crew, 400 kg water, 14 kW, CO2 enabled, two scrubbers, two oxygen and two water units, and no-backlog checked. Result charts displayed the evaluated 720-hour / 12.334 kW design.
- Gemini's explanation correctly noted overlapping constraint counts and the unvalidated water/scrubber response assumptions. AI prose remains subject to review; model completion is not survival certification.
- The existing 144-test suite/build verification remains applicable. This run adds live integration evidence, not scientific validation. No additional external provider was used.

# Current validation — CO2 screening, 2026-10-24

- Backend: **144 tests passed**, including 25 CO2 cases for analytical/numerical agreement, conservation, initial violations, hourly-mean vs endpoint screening, zero/multiple units, volume, provenance, invalid values, third-dimension optimization and agent tools.
- Frontend production build passed; existing bundle advisory and Starlette/httpx warning remain.
- Browser: opt-in controls and source links rendered; four crew / zero scrubbers exceeded the one-hour mean screen at hour 4. Six crew exceeded it at hour 3. At 14 kW, 400 kg water and no ending wastewater backlog, CO2-aware optimization evaluated 405 candidates / four feasible, selecting 2 oxygen + 2 water + 2 CDRA units, 1044.233133 kg, 12.334 kW and 720 completed hours. Ending CO2 was 1.564904 mmHg. CO2 comparison chart rendered.
- Historical CDRA reference is NASA-authored and USEA-hosted; away-from-design-point response remains an assumption. NASA technology goals were excluded from actual equipment specifications. Team scientific qualification is pending.
- Live CO2 Gemini tool use has not been verified; mocked agent decisions exercised the real optimizer. Gemini remains the only runtime external API integration.
- Agent checkpoint already existed at e9674b0; no duplicate checkpoint commit was needed.

## Previous mission agent validation

# Current validation — tool-using mission agent, 2026-10-24

- Backend: **119 tests passed**, including 20 agent cases covering real optimizer/simulation tools, canonical validation, unknown tools, fixed-baseline patch semantics, count/turn limits, signature/call-ID preservation, incomplete provider turns, no-backlog proposals and endpoint input restrictions.
- Frontend production build passed; existing bundle-size advisory and Starlette/httpx warning remain.
- Browser: isolated fixture with explicitly labeled mocked Gemini decisions and real optimizer evaluated 81 candidates, found three feasible and selected two-plus-two units for six crew / 30 days / 12 kW / 400 kg water. Manual inputs stayed unchanged until Apply. Editing crew disabled the stale proposal; explicit Apply updated settings and 720-hour result charts.
- User previously confirmed live Gemini advisor generation with gemini-3.8-flash. New agent function-calling still requires live verification with the user's local key. No secret was read or added to the repo.
- External API usage: existing Gemini integration only; local tools and bundled NASA reference data add no external provider. Multiple Gemini HTTP requests per run are bounded, not limited to two calls.

## Previous advisor validation

# Current validation — Gemini advisor, 2026-10-24

- Backend: **93 tests passed**, including 14 advisor cases for unconfigured fallback, recomputed evidence packet, provider failure redaction, unknown citations, malformed/truncated/blocked responses, model validation and rejecting browser-forged outcomes.
- Frontend production build passed; existing bundle-size advisory remains. Existing Starlette/httpx deprecation warning remains.
- Browser: advisor button rendered in the comparison; /explain returned labeled computed fallback because Gemini was not configured. The computed recommendation and limitations displayed correctly.
- No live Gemini request was verified without a supplied key. Mock transport validates the outgoing request and response parsing, not current provider availability or generated factual accuracy.
- Planned follow-up: custom Gemini-powered mission-design agent with bounded, validated simulator/optimizer tools. See gemini-advisor.md.

## Previous optimizer validation

# Current validation — optimizer extension, 2026-10-24

- Backend: **79 tests passed**, including 18 optimizer cases for complete enumeration, minimum selection, fixed inputs, determinism, mass eligibility, zero units, backlog constraints, invalid requests and API/evidence behavior.
- Frontend production build passed. Existing chart bundle-size advisory remains.
- Browser: two-plus-two manual catalog units versus one-plus-one recommendation at default Mars inputs except 10 kW generation: 636 versus 318 kg, 300 versus 720 hours, 81 evaluated / 3 feasible candidates. Stale comparison warning verified after input changes.
- Browser: zero generation and zero battery returned no recommendation and 81 observed power constraints; recommendation chart/equipment were omitted.
- Existing Starlette/httpx deprecation warning remains. Checks verify implementation under declared assumptions, not scientific qualification. Water yield and physical-model gaps remain explicit.

## Previous water equipment validation

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

### Mission-control UI — 2026-10-24
Added three interactive mission-control monitors using the user's supplied Mars, Venus, Titan and crew artwork. Planet selection updates the surface view and dashboard accent colors. Current crew inputs render one selectable sprite per member (1–12); quick crew controls share the manual configuration state. The science monitor switches between environment references and resource inputs. Surface sprites represent configuration only, not modeled surface activity. Existing simulation and agent controls are retained. Frontend production build passed. Automated browser verification was attempted but could not complete because the local browser could not connect to the development server; visual verification remains pending.

GitHub sync follow-up: updated local main to ec2d464 and resolved App.jsx/style.css overlaps by retaining upstream mission persistence, thermal controls and updated labels alongside the local mission-control monitors and planet themes. Frontend production build, all 28 frontend tests and all 203 backend tests passed. Backend tests required execution outside the sandbox after the sandboxed run stalled.

### Home and tutorial flow — 2026-10-24
Added a home page with existing Beyond Earth branding, mission/importance copy, supplied Mars artwork and a Start simulation link. The route flow is `/` → `/tutorial` → `/simulation`; both Skip tutorial and Continue to simulation open mission control. `frontend/src/TutorialPage.jsx` deliberately leaves its tutorial-content section empty for teammate implementation and exposes onComplete/onSkip callbacks. Browser Back, tutorial refresh, mobile width and both forward paths passed browser checks (the API unavailable response was mocked to isolate navigation). Frontend build and all 28 frontend tests passed. Production hosting must serve index.html for /tutorial and /simulation direct visits, as with other client-side routes.
