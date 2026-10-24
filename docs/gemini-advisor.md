# Gemini mission advisor and planned agent

The advisor explains the saved manual/optimized comparison. It cannot edit a design or invent simulator results. Click Optimize and compare, then Explain this comparison with Gemini. Changes to inputs disable advice until you optimize again.

## Configure locally
Get a key from https://aistudio.google.com/apikey. Do not paste the key into chat, frontend code or Git. In the PowerShell terminal that starts the backend:

```powershell
$env:GEMINI_API_KEY = Read-Host 'Paste your Gemini API key' -MaskInput
$env:GEMINI_MODEL = 'gemini-3.8-flash'
cd C:\Users\lbarke9\Documents\GitHub\GeauxHack26\backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Stop the existing backend server first if port 8000 is already occupied. The model identifier is configurable because availability can change. Use a model available to your Google project that supports structured output through generateContent. backend/.env.example is only a template; .env files are ignored by Git and are not automatically loaded. The environment belongs to the terminal process; restart the backend after setting it.

Without a key or if the provider times out, rejects the request or returns invalid output, the advisor displays clearly labeled computed fallback guidance. Optimization and charts still work. The user subsequently verified a live advisor response with gemini-3.8-flash. The new agent tool loop has been tested with mocked provider decisions; live verification is pending. Mocked tests exercise the request and response handling.

## Implementation
POST /explain accepts the existing OptimizationRequest, not browser-supplied results. The backend recalculates the comparison, packages final inventories, configuration, events, equipment evidence and source records, and sends that compact JSON to Gemini. Hourly arrays and candidate arrays are omitted to reduce payload size. HTTP calls have a timeout and no automatic retries. The secret is transmitted in a header to the fixed Google API host, never in the URL or frontend. Raw provider errors are not returned.

Gemini is asked for summary, tradeoffs, next_steps and source_ids. Pydantic validates the structure and checks citations against the supplied source register. The interface renders plain text and resolves citation links from server source records. It labels AI output and keeps the computed summary and limitations available. Structural checks and valid citation IDs do not prove that every generated claim is scientifically correct; review the original evidence and comparison.

frontend/src/MissionAdvisor.jsx handles loading, fallback, errors, stale inputs and ignores responses belonging to replaced comparisons. backend/app/advisor.py handles computation, evidence packing, provider transport and validation. backend/tests/test_advisor.py uses mocked provider responses; it does not consume a key or call Google.

## Tool-using mission agent — implemented
The custom bounded mission-design agent is now available. See mission-agent.md for goals, tool contracts, review/apply behavior, verification and limitations. It uses the same Gemini API and adds no external provider.

## API references
- https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
- https://ai.google.dev/gemini-api/docs/function-calling
