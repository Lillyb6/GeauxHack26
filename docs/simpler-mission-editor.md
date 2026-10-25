# Feature: Simpler mission setup and editing

## Purpose
I simplified the setup and editing steps inside Mission brief. I replaced the six-step wizard with Mission, Supplies and Review. The mission summary and its actions were outside this change's scope.

## Mission step
I combined mission name, destination, crew size and mission length on one screen. Users can start entering their mission immediately instead of opening a separate introduction or title page. I removed repeated instructions and kept Saved missions and New mission available as small actions above the steps.

## Supplies step
The main view shows starting oxygen, water, power generation and battery energy, with units next to each label. What's the difference? reveals one short explanation of supplies, power and stored energy.

I moved the less frequently needed controls into Life support & advanced settings, Optional checks and Comparison settings. Custom oxygen production, reference equipment and unit counts, water recycling, habitat loads, temperature, conductance, COP, cabin checks and comparison limits remain available. Their values are not reset when their sections are closed.

## Short labels and technical explanations
I use concise labels in the form. About these settings keeps the underlying technical names, units and model qualifications available on demand. The existing atmosphere, CO2 and heating/cooling controls are reused inside Optional checks. I did not remove their criteria or assumptions.

## Water recovery percentage
The input now shows water recovery as a percentage. Users enter 93 for 93 percent, while the existing backend still receives 0.93. The form multiplies the stored fraction by 100 for display and divides the edited percentage by 100 when updating the mission. Its previous 0–0.98 bounds become 0–98 percent, and its previous 0.01 step becomes one percentage point. I updated the detailed tutorial's instructions to match.

## Review step
The review shows the mission name, destination, crew and duration, followed by oxygen, water, power and battery values. It lists which optional checks are enabled and provides direct links back to Mission or Supplies. Run mission still runs the build once through the existing App function and opens the monitor workspace.

## Validation
I keep the editor panels mounted so I can validate every relevant field before a run, including controls inside collapsed sections. Native validation still enforces the existing ranges and step sizes. Whitespace-only names are rejected.

If an invalid value is found, revealInvalid opens the enclosing details sections, switches to the correct step, and focuses the field with the browser's validation message. The form uses noValidate to prevent the browser from trying to focus a control in a hidden step before the editor can reveal it. My submit handler performs the checks before advancing or launching. A user cannot bypass earlier validation by jumping directly to Review.

## Editing inside monitors
The same editor component is used for initial preparation and later monitor editing. App supplies Close editor inside the monitor workspace and Home during initial setup. I removed the duplicate outside Back button. Closing the editor preserves changed inputs, as before; older simulation results are marked as stale until the build is run again.

New mission resets the existing App state and returns directly to the Mission step, including when started inside the monitor workspace. Saved missions still use the existing library and input validation. Loading a mission keeps its equipment, optional checks and comparison settings.

## Appearance and accessibility
I added editor-scoped styles for the three-step navigation, compact two-column fields, optional settings and review values. The existing mission-control colors remain. Narrow screens keep the important fields readable, and advanced controls stack where needed. Step changes focus the new heading, active navigation is labeled with aria-current, and inputs retain explicit labels and units.

## Files
- MissionSetup.jsx: three-step layout, concise labels, recovery conversion and validation.
- App.jsx: close behavior and reuse of the editor inside the monitor.
- style.css: editor layout and responsive styling.
- tutorialContent.js: percentage instructions matching the new input.

## Verification
All 30 existing frontend tests passed, the production build passed, and git diff --check found no whitespace errors. Browser checks covered an empty mission name, loading a saved mission, all three steps, reference equipment switching to unit counts, and an invalid heat-transfer value inside a closed section reopening for correction.

I entered 80 percent recovery and ran the real local backend. The result reported 80.00 percent effective recovery, confirming that the engine received the fraction correctly. I then edited inside the monitor, restored 93 percent and reran the original Flow check mission successfully for 720 hours. No Gemini calls were made.

## Branch
The changes are on simpler-mission-editor, separate from main. They are not committed or merged yet. The existing unrelated frontend/package-lock.json change is excluded from this feature.


## Mission brief button organization

I moved Edit configuration to the top beside the mission name. I kept Run again as the primary full-width action, then placed Optimize & compare and View results together underneath with consistent spacing. On narrow screens, these two buttons stack. I removed the extra instruction paragraph and tightened the summary so the normal mission brief fits inside the monitor without scrolling. Long names and error messages can still scroll rather than being cut off.

I kept the existing simulation and optimization handlers. View results opens the corresponding results monitor and is disabled until results are available. These changes affect presentation only; they do not change the simulation equations.


## Separate life support section

I made Life support its own visible section on the Supplies step. Oxygen maker and Water recycler appear side by side on wider screens and stack on phones. Their equipment choices, custom values, and unit quantities work the same way as before.

I moved the habitat parameters and technical explanations into a separate Advanced settings dropdown. Optional checks and Comparison settings remain in their own dropdowns. The configuration editor can scroll through these settings; the compact Mission brief summary remains separate.


## Clearer life support labels

I matched the Life support heading to Supplies & power using the same heading level, font size, spacing, and letter spacing. I renamed Oxygen maker to Oxygen supply and Water recycler to Water recycling. Smaller descriptions underneath retain the technical names: Oxygen generation system and Water recovery system. The labels changed; the calculations and equipment choices remain the same.


## Final life support headings

I changed the orange headings to Oxygen generation system and Water recovery system, using the previously smaller technical names as the main labels. I removed the duplicate text underneath and kept spacing before the equipment controls. No simulation behavior changed.
