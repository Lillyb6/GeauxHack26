# Beyond Earth mission-design agent

## What is implemented
The natural-language agent uses the existing Gemini API and two local tools: simulate_habitat and optimize_habitat. Gemini proposes typed input patches, Python validates and evaluates them, and Gemini receives the computed results before explaining the outcome. Nothing automatically changes Manual Mode. The interface lists every proposed input difference and requires an Apply reviewed proposal click.

This implementation adds no external provider: **Gemini is the only runtime external API integration**. The simulator, optimizer and catalog run locally. NASA references are bundled data and attribution links, not runtime NASA API calls. Multiple requests to Gemini still use one API integration. If the event instead limits the number of HTTP requests rather than integrations, confirm that interpretation before using this workflow: a run can make up to four Gemini requests.

## Run it
Keep the frontend and backend in separate VS Code terminals. In the backend terminal that already has your key, stop the server with Ctrl+C and restart:

```powershell
cd "C:\Users\lbarke9\Documents\GitHub\GeauxHack26\backend"
$env:GEMINI_MODEL = 'gemini-3.8-flash'
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Refresh http://127.0.0.1:5173. In **Ask your mission designer**, try:

> Find the lightest catalog design for six crew for 30 days on Mars, using 12 kW generation, 400 kg initial water and no wastewater backlog. Keep all other inputs unchanged.

Click **Test mission goal with agent**, inspect the tool audit, evaluated inputs, results and proposed changes, then apply if desired. Under the current model and default remaining inputs, the local optimizer selects two oxygen and two water units, 636 kg known hardware and 10.334 kW demand, completing 720 hours. Six crew need more supplies than the earlier four-person example because the fixed-output oxygen hardware also consumes electrolysis feedwater. This is a model result, not qualification or proof of survival.

For an infeasible example, explicitly ask for zero generation and zero battery with all other inputs unchanged. No qualifying recommendation should be available. Goals outside the model, such as evaluating radiation shielding, should receive a clarification or a scope explanation.

The key remains server-side. If you close its terminal, re-enter it using the setup instructions in gemini-advisor.md. Never put it in the goal field, chat, frontend or README.

## Contracts and execution
POST /agent accepts {goal, baseline}, where baseline is the existing OptimizationRequest. It rejects extra top-level fields and goals outside 5–1500 characters. The backend offers two function declarations generated from the canonical mission schema. ToolArguments permits scenario_changes and search_changes only. Every patch merges into the original baseline, never implicitly into a previous tool result. The resulting full request is validated with Pydantic and equipment resolvers. Numeric bounds, supported environments, known design IDs/categories and quantity limits are enforced by Python.

There are at most three attempted local tool calls and four model turns per request. Rejected calls count against the budget. An oversized parallel batch is not executed. The runner stops dispatching new work after its 60-second cooperative time budget; each HTTP operation has a timeout up to 20 seconds. This is not a strict wall-clock cancellation of an in-progress network operation. No automatic retries or background work are used. The full model content, including opaque thought signatures and function-call IDs, is preserved for subsequent Gemini requests; it is not exposed as a reasoning transcript to the UI.

Successful tools append an audit record with exact evaluated inputs and a computed summary. Their compact responses contain source-attributed evidence. The latest valid calculation replaces the proposal; a later infeasible result clears an earlier proposal. A successful simulation must also satisfy the optional ending-backlog condition before it can be applied. Unknown tools and invalid arguments return sanitized tool errors. Raw provider errors and credentials are not returned.

The server retains completed local calculations if a later provider response fails. Statuses distinguish completed, needs_clarification, limited, partial and unavailable. An unconfigured model does not pretend to understand a natural-language goal. There is no parser that invents an offline AI answer.

## Interface and limits
Changing the goal or baseline makes a saved proposal stale and disables applying it. The review table shows equipment, mission and search-setting changes. Applying updates Manual Mode and shows the already calculated result in its charts. The UI never applies changes solely because Gemini asked to.

Gemini is instructed to preserve inputs that the user did not request changing. Language interpretation is not a formal guarantee: review the exact diffs. A result can complete resource checks without meeting an ambiguous natural-language goal; the audit and source evidence remain authoritative. AI prose can misstate causal relationships or scientific support. The optimizer only searches oxygen/water hardware counts in the selected bounded catalog; it does not design an entire habitat. Water yield and pressure/radiation/CO2/thermal qualification gaps remain explicit.

## Files
- backend/app/mission_agent.py: request contract, tool schemas, validation, bounded execution and provider transport.
- backend/app/main.py: POST /agent route.
- backend/tests/test_mission_agent.py: mocked model decisions with real simulation/optimization and mocked HTTP transport.
- frontend/src/MissionAgent.jsx: goal input, statuses, tool audit, proposal review and explicit apply.
- frontend/src/App.jsx: connects approved proposals to Manual Mode and result charts.
- frontend/vite.config.js: optional BEYOND_EARTH_API_URL development proxy override; default remains port 8000.

## Verification
119 backend tests pass, including 20 agent cases. Frontend production build passes. Isolated browser testing used explicitly labeled mocked Gemini decisions with the real optimizer: 81 candidates / three feasible / two-plus-two recommendation, unchanged manual inputs before apply, disabled stale proposal, and successful explicit apply updating six crew, 400 kg water, 12 kW, equipment, backlog constraint and 720-hour charts. This does not constitute a live Gemini function-calling test. The user has previously verified a live Gemini advisor response with gemini-3.8-flash; the new tool loop still needs that live verification using their local key. No additional API service was introduced.

Google API references: https://ai.google.dev/api/generate-content and https://ai.google.dev/gemini-api/docs/function-calling.
