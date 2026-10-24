# Gemini mission advisor and planned agent

The advisor explains the saved manual/optimized comparison. It cannot edit a design or invent simulator results. Click Optimize and compare, then Explain this comparison with Gemini. Changes to inputs disable advice until you optimize again.

## Configure locally
Get a key from https://aistudio.google.com/apikey. Do not paste the key into chat, frontend code or Git. In the PowerShell terminal that starts the backend:

```powershell
$env:GEMINI_API_KEY = Read-Host 'Paste your Gemini API key' -MaskInput
$env:GEMINI_MODEL = 'gemini-2.5-flash'
cd C:\Users\lbarke9\Documents\GitHub\GeauxHack26\backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Stop the existing backend server first if port 8000 is already occupied. The model identifier is configurable because availability can change. Use a model available to your Google project that supports structured output through generateContent. backend/.env.example is only a template; .env files are ignored by Git and are not automatically loaded. The environment belongs to the terminal process; restart the backend after setting it.

Without a key or if the provider times out, rejects the request or returns invalid output, the advisor displays clearly labeled computed fallback guidance. Optimization and charts still work. No live provider call was verified during implementation because no key was supplied. Mocked tests exercise the request and response handling.

## Implementation
POST /explain accepts the existing OptimizationRequest, not browser-supplied results. The backend recalculates the comparison, packages final inventories, configuration, events, equipment evidence and source records, and sends that compact JSON to Gemini. Hourly arrays and candidate arrays are omitted to reduce payload size. HTTP calls have a timeout and no automatic retries. The secret is transmitted in a header to the fixed Google API host, never in the URL or frontend. Raw provider errors are not returned.

Gemini is asked for summary, tradeoffs, next_steps and source_ids. Pydantic validates the structure and checks citations against the supplied source register. The interface renders plain text and resolves citation links from server source records. It labels AI output and keeps the computed summary and limitations available. Structural checks and valid citation IDs do not prove that every generated claim is scientifically correct; review the original evidence and comparison.

frontend/src/MissionAdvisor.jsx handles loading, fallback, errors, stale inputs and ignores responses belonging to replaced comparisons. backend/app/advisor.py handles computation, evidence packing, provider transport and validation. backend/tests/test_advisor.py uses mocked provider responses; it does not consume a key or call Google.

## Planned next milestone: custom tool-using agent
The team intends to build a Beyond Earth mission-design agent powered by Gemini after the advisor is working. This is an explicit planned milestone, not yet implemented.

1. Accept a natural-language goal such as supporting six crew with no ending wastewater backlog.
2. Give Gemini a small allowlist of typed tools for simulate and optimize.
3. Validate every tool argument using the existing models; enforce equipment/count bounds and a strict maximum number of tool calls.
4. Require confirmation before applying changes to the user's manual design. Show proposed inputs and computed effects.
5. Return explanations grounded in tool results and preserve an audit of proposed inputs, calculations and source evidence.

No shell access, arbitrary URLs or autonomous background loops are needed. Keep deterministic calculations authoritative, return infeasibility honestly, and preserve the AI disclosure. Expanding the agent to shielding, pressure systems or power hardware also requires adding supported data and physical constraints to the simulator.

## API references
- https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash
- https://ai.google.dev/gemini-api/docs/function-calling
