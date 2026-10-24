# Deterministic optimizer walkthrough

## Try it
Start both servers using the README, then open http://127.0.0.1:5173.
Select Mars, 4 crew, 30 Earth days, 30 kg oxygen, 300 kg water, 100 kWh battery and 10 kW continuous generation. Keep the default thermal and other-load inputs.
Select the historical oxygen design with 2 units and VCDS water recovery with 2 units. Leave both search maxima at 8. Click **Optimize and compare**.

The manual baseline has 636 kg known hardware and 10.334 kW modeled demand. Its battery becomes deficient during hour 300. The optimizer evaluates 81 configurations, finds 3 completing the checks, and selects 1 oxygen unit plus 1 water unit: 318 kg hardware, 8.367 kW demand, and 720 evaluated hours. Its end inventories are 48.6 kg oxygen, 119.646 kg usable water and 100 kWh battery. These are calculations under the model, not measurements or survival predictions.

Set generation and battery to zero and optimize again to see an honest no-feasible-candidate result. Changing any input or search setting flags the previous comparison as stale.

## What the algorithm does
1. Validate the request and chosen equipment categories.
2. Simulate the manual configuration without changing it.
3. Enumerate every pair from zero through each inclusive unit maximum. Maxima of 8 produce 9 x 9 = 81 candidates.
4. Copy the scenario, changing only equipment IDs and quantities. Crew, environment, duration, supplies, generation, battery and thermal inputs remain fixed.
5. Run each candidate through the same hourly simulation used by Manual Mode. A candidate must complete the resource checks. Optionally, require its ending wastewater queue to be at most 0.000001 kg.
6. Exclude installed hardware with unknown or invalid mass from ranking. Unknown custom baseline mass is shown as unknown; it is never treated as zero.
7. Choose the feasible candidate with the smallest combined oxygen/water hardware mass. Ties use reported demand rounded to 0.001 kW, then oxygen count, then water count.
8. Return both complete simulation responses, all candidate summaries, constraint counts, evidence and limitations. If none qualify, return no optimized design.

Zero installed units legitimately contribute zero hardware mass. A short mission with abundant supplies can therefore select zero units. The UI explains that this is not a complete habitat design. Wastewater storage is ideal and unlimited unless the optional ending-backlog check is enabled.

## Which code handles each part
- backend/app/models.py: OptimizationRequest, CandidateSummary and OptimizationResult define the API contracts and bounds.
- backend/app/optimizer.py: exhaustive search, mass eligibility, constraints, stable ranking and explanations.
- backend/app/main.py: POST /optimize exposes the search and returns input errors as HTTP 422.
- backend/app/engine.py: existing deterministic resource calculations, shared by both modes.
- backend/data/equipment.json: source-attributed catalog values; the optimizer introduces no new equipment specifications.
- frontend/src/App.jsx: collects settings, submits the request and detects stale comparisons.
- frontend/src/DesignComparison.jsx: outcomes, hardware mass, demand, risks, evidence, selectable inventory chart and candidate audit.
- backend/tests/test_optimizer.py: 18 cases covering selection, fixed inputs, failures, bounds, zero units, unknown mass, determinism, evidence and API behavior.

## Read the results correctly
The objective is known hardware mass for these two categories, not total mission mass. Tanks, power generation equipment, habitat structure, spares and supporting infrastructure are omitted. The search finds the best eligible result only among the selected designs and count bounds; it does not claim a global optimum.

Manual charts stop at their failure hour. Optimized charts can continue to mission end; values are never extended beyond a failed run. Ending inventories may therefore represent different durations. Constraint counts describe observed stopping conditions and the optional backlog check, and can overlap; they do not identify every future failure cause.

Scientific attribution is preserved in each simulation response. The water design's 90% yield remains explicitly unvalidated. Pressure, radiation, CO2 control, equipment qualification and realistic HVAC remain unresolved. Resource completion does not establish safety or human survival. No Gemini call generates the recommendations or numerical results.

## Verification
On 2026-10-24: all 79 backend tests passed; frontend production build passed. Browser checks verified the 81-candidate example, stale-input warning and zero-power no-recommendation path. Existing Starlette/httpx deprecation and chart bundle-size advisories remain.
