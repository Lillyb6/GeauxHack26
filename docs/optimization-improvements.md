# Tested optimization proposals

Optimize & compare calls `/improve`. The original `/optimize` endpoint and mission-agent equipment tools retain fixed-constraint semantics.

1. Search equipment at the original power budget.
2. If no eligible design exists, repeat the same equipment bounds at 100 kW (the existing model upper bound).
3. If power alone is insufficient, run the water-limited recovery phase below. Otherwise take the lowest known hardware mass candidate and re-simulate with generation set to its rounded continuous demand plus 0.001 kW, never below original generation or above 100 kW.
4. Recommend only if this verification completes the resource checks and any selected no-backlog check.

Crew, duration, planet, starting oxygen, battery and screening settings never change. Starting water can increase during the water-repair phase described below. Power is a proposed design input, not a sized solar/nuclear system. Its infrastructure mass is unknown and excluded. No minimum-power or global-optimum claim is made. Infeasible atmosphere, thermal capacity, supplies or equipment bounds can still prevent a recommendation.

The response retains original manual results and search_request; optimized.request holds the proposed inputs. Recovery candidate counts/audit describe the 100 kW search, not the final proposed power. The selected run is verified separately. Apply updates the full optimized request, including generation; comparison-state guards continue to reject edited or stale inputs. The plain-language before/after comparison is calculated directly from these runs. Optional Gemini explanation recomputes the same workflow through `/explain-improvement`.

Backend restart required for new routes. No new external API. Changes assisted by Codex.


## Water-limited recovery
If a power-only search fails, the same equipment combinations are simulated at the 100 kW / 100000 kg water search envelope. Each completed trajectory gives peak net water consumption. The proposal adds only the amount needed to cover that trajectory (rounded upward to 0.01 kg plus 0.01 kg numerical slack, never decreasing existing supplies) and is re-simulated at that water and its proposed power. This slack is not an operational reserve. Verified water repairs rank by least added water, then equipment mass/power/counts. Starting oxygen, battery and screening settings remain fixed. Zero or insufficient equipment bounds and invalid atmosphere/thermal settings can still prevent repair. The full habitat, tank and generation-system mass is not modeled.

Regression: seven crew / 30 days / Mars / 8 kW / 300 kg water produces 2 oxygen + 2 water units, 10.335 kW proposed generation and 351.07 kg initial water. Re-simulation completes 720 hours, versus 318 manual hours. Disabled CO2/atmosphere/thermal checks remain disabled; this result does not certify survival.

## AI mission designer
Gemini may call `improve_habitat` when resource adjustments are enabled and the goal allows them. The backend rejects that tool when `allow_resource_adjustments` is false. The existing three-tool/four-turn budgets remain. The AI receives computed resource rows, exact stopping events and verified repair results; it interprets the goal and explains tradeoffs rather than inventing outcomes. The advisor exposes separate why-manual-failed and why-optimized-worked sections, plus authoritative resource comparisons with evaluated-hour context.
