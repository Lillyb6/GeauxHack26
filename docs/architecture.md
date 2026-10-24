# Architecture and team handoff

React/Vite + Tailwind + Recharts -> Vite /api proxy -> FastAPI -> pure Python simulation.
The engine never calls an LLM. Environment reference data and scenario assumptions are separate.

## Contracts
- GET /health -> {status: "ok"}
- GET /environments -> reference values, units, risks and source URLs for Mars, Venus surface and Titan surface.
- GET /model-reference -> versioned sources, parameter classifications and canonical default request.
- POST /simulate -> HabitatRequest -> SimulationResult. Pydantic is the canonical contract; explore /docs and /openapi.json with the server running.
- Numeric input bounds are enforced on both sides; unsupported environments and extra fields return 422.
- Results contain the original request, assumptions_version, hourly readings, first deficient-hour events and limitations.
- Time is Earth hours/days, not local planetary days. No storage or secrets required.

## Next milestones, in order
1. Review and calibrate the model with the team; add typed generated API bindings.
2. Build an equipment catalog with mass, power, capacities, input resources and environmental operating envelopes.
3. Add pressure, CO2 removal, radiation and thermal-capacity constraints before claiming mission feasibility.
4. POST /optimize: bounded deterministic search over catalog quantities, using the same engine. Minimize equipment + supplies mass subject to completion and resource constraints. Return infeasibility rather than fabricate a design.
5. Manual vs optimized comparison from identical crew/duration/environment inputs.
6. POST /explain: Gemini server-side explanation of computed JSON only. No client API keys. Structured output, explicit unavailable state and deterministic fallback. Gemini must not produce simulation metrics.
7. CI, accessibility checks, deployment and presentation rehearsal.

Suggested ownership tomorrow: engine/catalog/tests; frontend/design; API/optimizer/scientific documentation. Work from shared contracts and review changes together.


## Equipment integration
`backend/data/equipment.json` -> `equipment.py` resolves ID + quantity -> engine derives output/power -> `research.py` packages actual-run evidence -> API returns `equipment_summary` and readings -> React displays immutable run summary.
`GET /equipment` provides selection metadata. `oxygen_equipment_id=null` retains custom mode. Catalog mode ignores the custom oxygen-capacity and energy inputs while retaining them for switching back. Equipment errors return 422. Published design-point copies are summed; this is not a duty-cycle, reliability or environmental qualification model. Source revisions require catalog/documentation review and backend restart.
