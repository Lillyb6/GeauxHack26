# Validation — 2026-10-23

- Python 3.12: `python -m pytest -q` from backend — **17 passed**.
- One upstream Starlette warning about httpx TestClient deprecation; no failed tests.
- Node 24.11 / Vite 8.3.5: `npm run build` — **passed**.
- Vite notes the initial bundle exceeds 500 kB due to charts; future code splitting is optional.
- `npm install` audit — zero reported vulnerabilities at installation time.
- Live browser through Vite proxy: all environment cards load; default Mars completes 720 hours; changing environment flags stale results; Venus power deficit at hour 8; Titan power deficit at hour 22. Charts render from API results.
- Frontend observed at a narrow ~600px panel width; mobile stacking renders. Full desktop/device/accessibility audit remains team work.
- Python dependency snapshot: backend/requirements.lock.txt; npm lockfile: frontend/package-lock.json.
- Scientific calibration, full pressure/thermal/radiation validation and designer review are pending. This does not establish mission feasibility.
