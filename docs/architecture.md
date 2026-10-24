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

## Optimizer contract and implementation
POST /optimize takes OptimizationRequest (scenario, two chosen design IDs, inclusive quantity maxima 0–8, optional no-ending-backlog constraint) and returns OptimizationResult. optimizer.py enumerates counts and calls engine.simulate for every candidate. It minimizes known oxygen/water hardware mass, holding supplies and other scenario inputs fixed. Unknown installed mass is excluded. DesignComparison.jsx renders saved baseline/recommendation results and candidate audits. See optimizer-walkthrough.md for the full algorithm and limits.

## Next milestones, in order
1. Review and calibrate the model with the team; add typed generated API bindings.
2. Validate catalog values and environmental operating envelopes.
3. Add pressure, CO2 removal, radiation and thermal-capacity constraints before claiming mission feasibility.
4. Verify the integrated Gemini advisor with a configured key, then build the planned bounded tool-using mission agent. Keep keys outside Git and calculations in the simulator.
5. CI, accessibility checks, deployment and presentation rehearsal.

Suggested ownership tomorrow: engine/catalog/tests; frontend/design; API/optimizer/scientific documentation. Work from shared contracts and review changes together.


## Equipment integration
`backend/data/equipment.json` -> `equipment.py` resolves ID + quantity -> engine derives output/power -> `research.py` packages actual-run evidence -> API returns `equipment_summary` and readings -> React displays immutable run summary.
`GET /equipment` provides selection metadata. `oxygen_equipment_id=null` retains custom mode. Catalog mode ignores the custom oxygen-capacity and energy inputs while retaining them for switching back. Equipment errors return 422. Published design-point copies are summed; this is not a duty-cycle, reliability or environmental qualification model. Source revisions require catalog/documentation review and backend restart.


## Water-processing extension
Independent water ID/count resolves into a water_equipment_summary. Engine derives throughput and power server-side, tracks queue/recovered/brine masses hourly, returns water_balance and warnings, and replaces unused custom water evidence. Recovery yield is a separately labeled assumption. No database is used; queues reset per simulation. See water-recovery-walkthrough.md.


## Gemini advisor and agent roadmap
POST /explain accepts OptimizationRequest and recomputes results server-side before generating an explanation. advisor.py calls Gemini using a backend environment key, validates structured output/source IDs and provides labeled computed fallback guidance. MissionAdvisor.jsx renders it within the comparison. Next: the planned custom tool-using Gemini agent with bounded, validated simulate/optimize calls; see gemini-advisor.md.


## Tool-using mission agent
POST /agent accepts goal + baseline OptimizationRequest. mission_agent.py offers exactly two allowlisted local tools, validates patches against the original request, executes at most three tool calls/four Gemini turns, retains an audit and returns only calculated proposals. MissionAgent.jsx requires explicit apply and blocks stale proposals. Gemini remains the only external API integration. See mission-agent.md. Next: live agent verification, scientific review and richer supported physical constraints.


## CO2 screening extension
Model 0.4.0 adds an opt-in co2.py analytical cabin balance, reference equipment, hourly mean screen, installed power/mass and exact-run evidence. Optimization adds a third count dimension only when enabled (maximum 405). Existing agent tools expose the validated fields; no external service is added. Co2Panel.jsx and charts distinguish disabled screening and historical inputs from unvalidated response assumptions. See co2-walkthrough.md.
