# Mission saving, loading and sharing

## Using the feature
The standalone **Save and share a mission** panel is above the mission agent. Enter a name and click **Save current inputs**. This creates a new snapshot in this browser, rather than overwriting a previous save. Duplicate names receive a numeric suffix. Select a saved mission and click **Load selected mission** to restore it; loading replaces current inputs and clears old simulation results, comparisons and agent proposals. Run a fresh simulation or optimization before interpreting results.

**Duplicate selected** makes an independent copy of the saved snapshot, not of unsaved changes on screen. **Delete selected** asks for inline confirmation and removes only that saved snapshot; current controls/results are not changed. The library supports up to 50 named snapshots, storage permitting.

**Export current inputs** creates a JSON download from the current controls and name. **Export selected** exports the saved snapshot, even if the current controls have been edited. To import, expand **Import a mission JSON file or paste JSON**, choose a file or paste the exported text, and review the preview. **Import as new saved mission** adds a new library entry without changing current controls. **Load imported inputs** replaces controls and clears old results without requiring browser storage. No simulation or Gemini call runs automatically.

Browser saves survive refreshes but stay with the exact site origin and browser profile. localhost and 127.0.0.1, different ports, different browsers and teammates' computers have separate storage. Clearing site data removes local saves. JSON files are the portable backup and sharing mechanism; no account, cloud storage, Firebase or new external API was introduced. The existing backend must be available to load defaults, catalog metadata and its input schemas at startup.

## What is saved
Each document includes a format name, format version (1), simulation model version, mission name, save time, and a configuration object containing scenario and search settings. The snapshot contains every current mission input, including planet, crew, duration, supplies, custom/catalog equipment, quantities, CO2 and atmosphere toggles/settings and optimization bounds. It contains no simulation readings, old success/failure outcome, comparison, agent conversation, generated prose, source-document cache or API credentials.

An internal random identifier belongs to the browser-library entry. Imports and duplicates get new identifiers; they cannot overwrite an existing mission by supplying an ID.

## Validation and model compatibility
The frontend reads the existing local /openapi.json endpoint and uses its canonical HabitatRequest and OptimizationRequest schemas. The validator covers the schema types, nullable IDs, enums, finite numeric values, integer counts and inclusive/exclusive numeric bounds currently used by these contracts. It rejects extra/missing fields, unknown equipment and wrong equipment categories. Keys are normalized to canonical order so reordered JSON does not falsely trigger the existing stale-result comparison after rerunning.

Files must use the supported envelope/version and current model version, and be no larger than 64 KB. Cross-model migration is deliberately not automatic. Unknown format/model versions and unsupported future schema types are rejected instead of silently dropping fields or inventing defaults. Valid input does not mean a feasible habitat; scientific assumptions and engine checks still apply when rerun.

The browser library is re-read before every save/delete, reducing stale-tab overwrites; storage events refresh other open tabs' lists without changing their active controls. This is not a transaction system for truly simultaneous edits. Corrupt/unsupported library metadata is not silently cleared or overwritten. Storage denial/quota errors show a failure without reporting a successful save. Current inputs can still be exported, or valid imported inputs loaded, when browser storage is unavailable.

## Preventing stale asynchronous results
App.jsx increments a request generation counter on Load. Older in-flight manual simulation or optimizer responses are ignored. It clears result/comparison state and remounts the agent panel with a new mission key, removing old proposals and preventing a late agent response from appearing for the newly loaded mission. This does not cancel a Gemini request that already left the browser, but it cannot be automatically applied. Applying a reviewed agent design also invalidates older manual-run responses.

## Files and frontend handoff
- frontend/src/missionStorage.js: pure versioned document validation, canonicalization, serialization, naming and browser-library operations. Storage is passed in so it can be tested without a browser.
- frontend/src/MissionLibrary.jsx: independent save/select/duplicate/delete/import/export controls, storage event handling, preview and accessible status/error messages.
- frontend/src/App.jsx: loads OpenAPI schemas; provides scenario/search/context and onLoad; clears old results and invalidates prior async work.
- frontend/src/style.css: scoped .mission-library rules. The console redesign can move/restyle the component without changing its storage logic.
- frontend/src/missionStorage.test.js: 27 Node built-in tests, no new npm dependencies.
- frontend/test-fixtures/mission-context.json: test-only canonical request defaults/schemas and catalog identifiers.
- backend/tests/test_mission_storage_contract.py: ensures that fixture stays aligned with the Python contract.

To embed the panel in a redesigned console, pass scenario, search, context (defaults, searchDefaults, schemas, equipment, modelVersion) and onLoad(configuration, name). The parent owns live form state and result invalidation. Avoid nesting this panel inside the manual-configuration form. No backend route or scientific model was changed.

## Verification
Run npm.cmd test and npm.cmd run build from frontend; run ..\.venv\Scripts\python.exe -m pytest -q from backend. Browser checks confirmed saving a named snapshot, persistence after refresh, restoring controls, clearing old results, duplicating, confirming/deleting the test copy, validating/importing a full six-person JSON snapshot, preserving both screening systems and equipment/search settings, and rerunning it to produce fresh 720-hour / 12.334 kW results. JSON round-trip, invalid files/types, unsupported model versions, unknown equipment, corrupt storage, quota failures, library limits and canonical field order are covered by automated tests. The file download action was exercised; the browser-managed download location was not independently inspected.

A sample input-only file is provided as six-crew-mars-mission.json alongside this guide. Its results must be recomputed and do not certify safety or survival. The existing scientific model and its limitations are unchanged.
