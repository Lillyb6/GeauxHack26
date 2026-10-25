# Feature: Mission Configuration Layout

## Purpose
I separated what the crew brings from the equipment that keeps the habitat running. The approved demo is implemented on mission-configuration-layout.

## Four steps
Mission sets the name, destination, crew size, and duration. Starting supplies contains stored oxygen, clean water, and battery charge. Life support contains power generation, oxygen generation, water recovery, and additional checks. Review groups the design under the same Starting supplies and Life support headings.

## Equipment and custom configuration
I keep the actual published catalog equipment names visible, with unit counts. Custom configuration is inside an Advanced dropdown with an explicit checkbox for each system and a note to use your own equipment specifications. Previously saved custom scenarios remain custom and open that section automatically. Turning custom mode off selects the first reference design for that category. I do not replace stored custom values or silently change loaded equipment. Water recovery still displays a percentage and sends a fraction to the backend.

## Validation
I validate all earlier steps before forward navigation and all three input steps before launching. Invalid fields inside collapsed settings open their dropdown and focus the failing field. The final Run mission uses the existing backend handler.

## Mission brief and styling
I use the mission-control heading font, regular form text, and the approved rows and spacing. MissionBuildSummary.jsx supplies the same grouped summary to Review and Mission brief. Existing Run again, Edit configuration, Optimize & compare, and View results actions remain connected. I preserve the saved mission library, thermal, atmosphere, CO2, advanced model, and comparison controls.

## Files
MissionSetup.jsx contains the four-step form. MissionBuildSummary.jsx contains the shared summary. App.jsx uses that summary in the monitor. style.css contains the scoped layout rules. The simulation equations and API contract are unchanged.


## Verification
All 41 frontend tests and the production build passed. In the browser, I checked missing-name validation, all four steps, reference equipment names, custom water settings, rejection of a 100% recovery input, restoration to reference equipment, the grouped Review, a real backend run, and reopening Edit configuration. The Mission brief fit without scrolling at 1280 by 950. The editor had no horizontal overflow at 390 pixels wide.


## Sync with team changes
I pulled origin/main and retained the incoming optimization workflow, revised outcome controls, and resource chart selector. I resolved the overlapping App.jsx edit by keeping the new team code and replacing only the old brief summary with MissionBuildSummary. My four-step form, custom configuration controls, and styling remain uncommitted on mission-configuration-layout.


## Consistent wordmark
I matched the Mission Lab BEYOND EARTH wordmark to Home and Tutorial: white bold text, the same font and letter spacing, and the mint star. I retained the existing Home/Help controls and model badge. This styling applies to setup and all mission monitors.
