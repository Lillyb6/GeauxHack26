# Feature: Home, preparation and mission control

## Purpose
I gave the app a clear sequence: Home, Build your mission, Run mission, then mission control. I kept the monitor workspace and moved the setup wizard into a full-page preparation screen.

## Home and resume — Experience.jsx
I changed the Home action to Build your mission. After Run mission, it becomes Resume mission. Visiting Home or Help preserves the configured inputs and results in the same browser session because App stays mounted. A page refresh starts preparation again; previously saved missions remain available through Open saved missions.

## Configuration — MissionSetup.jsx
I reused the existing six-step wizard and its equipment, supplies and optional checks. The final Run mission opens mission control and immediately runs the build through the existing backend. Editing a configured mission opens the destination/crew step inside the Mission brief monitor without clearing inputs. I removed the results shortcut from preparation because results belong to the monitor workspace.

## Workspace state — App.jsx
stationReady selects preparation or mission control. hasPoweredOn remembers whether the station has been opened. booting controls a short first power-on transition. New mission resets that transition; returning from Home skips it. Run simulation and Optimize & compare live in the Mission brief monitor and still use the existing API and automatic-save functions. Hidden charts pause while their results remain in memory.

## AI and monitor placement — OperatorStation.jsx and style.css
After preparation, AI assistance is on the left side monitor, Systems & results is on the right, and Surface observation stays central. The Mission brief is above the surface. Navigation buttons reach each monitor directly. AI is also optional during preparation. Existing request, review and Apply behavior is unchanged. Only the visible workspace mounts its AI panel, so switching between first-time preparation and mission control resets the panel response history; applied inputs and evaluated results remain in App.

## Smoother, more responsive drift — OperatorStation.jsx
I increased the maximum camera speeds from 420 to 650 horizontal pixels per second and from 330 to 520 vertical pixels per second. Movement begins within the outer 28 percent of the viewport instead of the outer 20 percent, so the pointer does not need to reach as far toward an edge.

The camera approaches its target speed with blend = 1 - exp(-dt / responseTime). dt is the time between animation frames. The response time is 0.14 seconds while moving and 0.28 seconds when the pointer leaves. This makes steering respond sooner while keeping a softer coast to a stop. Animation stops once idle. Clicking a monitor locks the camera; Escape or clicking outside releases it. Gentle drift can be disabled. Mobile and reduced-motion users get a static camera.

## Power-on and appearance — style.css
I added preparation styling matching the existing app and a staggered fade from dark on the first Run mission. Monitor content is inert during the transition. Reduced-motion preferences disable the visual animation. I reused existing artwork and added no generated images.

## Verification
The initial flow passed the production build and all 30 existing frontend tests. Browser checks covered all six steps, opening the station before a separate run in the initial version, a real local-backend run, results navigation, Home/Resume, and preserving inputs when editing. That run created a browser-local mission titled Flow check and returned a 720-hour result. Gemini was not called. The AI side-monitor placement was verified in the desktop browser. The one-click update also passed the production build: one Run mission click produced and saved the 720-hour result without pressing the monitor Run button.

## How to try it
Open http://127.0.0.1:5173/, choose Build your mission, create a title, complete the setup steps, then select Run mission to open mission control and evaluate the build. Use the monitor navigation buttons. Press Escape to unlock the camera, then move toward an edge to test the glide. Run mission evaluates the build immediately; Run again is optional after a completed run. Home then Resume mission returns to the current workspace.

## Branch and scope
I developed these changes on mission-control-flow for merging into main. This does not deploy the application. The existing frontend/package-lock.json modification is unrelated and should be excluded from this feature commit. Backend equations and API contracts were not changed.

## One-click run update
I combined opening mission control and running the build into one Run mission action. launchMission opens the monitors, starts the power-on transition, clears earlier displayed results, and calls run('simulate') directly. The request is started by the button event rather than a React effect, so the power-on animation and returning Home cannot trigger additional runs. submitRun handles the optional simulation/optimization buttons in the monitor workspace and passes the selected action to the same run function. Existing error handling and automatic saving still apply. A completed, unchanged build shows Run again to make it clear that repeating it is optional. An edited build must be run to refresh its results.

## Clear Success or Failed result — MissionOutcome.jsx
I added a Mission outcome section at the top of Systems & results, before environment data and references. It displays Success when resource_balance_complete is true and Failed when a modeled check stops the mission. It also shows how much of the planned duration the build completed, in hours and days. Failure messages explain which checks stopped it.

I distinguish completed hours from evaluated hours. The backend includes the first failed hour in evaluated_hours, so I count only hours before the earliest failure event as fully completed. For example, a failure during hour 10 means 9 full hours completed; a check failing at hour 0 means the mission did not start. The display does not claim to know the exact minute of failure inside an hourly step. Success for a 30-day mission shows 720 / 720 hours.

I also added explicit Evaluating, Ready to run, request-error and previous-build states. A failed API request is not called a failed habitat simulation. Changing inputs labels an older outcome as belonging to the previous build. View results now focuses this summary first. These are frontend explanations of the existing backend response; I did not change simulation equations.

## Editing inside the monitor workspace
I kept full-page preparation for the first build only. After a mission has run, Edit mission configuration switches the Mission brief monitor from its summary to the existing configuration wizard. The other monitors remain powered and available. The camera focuses and locks onto the editing monitor, so it stays steady while changing controls.

editingMission chooses between the brief and the editor; it no longer turns stationReady off. Run mission closes the editor and evaluates the updated build without replaying the first power-on animation. Back to mission brief closes the editor without running; any changed inputs remain and the old result is marked as stale. Home and Resume preserve the current workspace, including an open editor. Create new mission remains the intentional way to return to first-time setup.

## Faster and easier drift adjustment
I increased maximum drift speed to 1,050 pixels per second horizontally and 840 vertically, about 62 percent faster than the previous setting. I expanded the active area to the outer 40 percent on each side, leaving only the middle 20 percent still. This means moving the cursor a little away from the center starts the camera sooner. I shortened the steering response time from 0.14 to 0.08 seconds and kept a 0.24-second stopping response for a smooth coast. Monitor focus locking, Escape to unlock, the drift switch, mobile behavior and reduced-motion support remain in place. These are camera settings only; simulation results are unaffected.

## Drift speed fine-tuning
I lowered the maximum camera speed from 1,050 to 900 pixels per second horizontally and from 840 to 720 vertically, about 14 percent slower. I kept the wider movement area, quick steering response and smooth stopping behavior so it remains easy to move around.

## Second drift speed adjustment
I reduced maximum drift speed from 900 to 780 pixels per second horizontally and from 720 to 624 vertically, another 13 percent slower. Steering sensitivity and smooth stopping remain unchanged.

## Third drift speed adjustment
I reduced maximum drift speed to 650 pixels per second horizontally and 520 vertically, about 17 percent slower than the previous setting. The wider steering area, quick response and smooth coast remain unchanged.

## Slight drift speed reduction
I lowered maximum drift speed from 650 to 600 pixels per second horizontally and from 520 to 480 vertically, about 8 percent slower. Steering sensitivity and the smooth coast remain unchanged.

## Final validation before commit and merge
All 30 existing frontend tests passed, the production build passed, and git diff --check found no whitespace errors. I verified success and failure outcomes, one-click running, monitor-based editing, Home/Resume and AI side-monitor placement in the browser. Final drift limits are 600 horizontal and 480 vertical pixels per second. The unrelated package-lock.json change is excluded from this feature commit.
