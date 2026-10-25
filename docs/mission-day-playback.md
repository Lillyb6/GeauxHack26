# Feature: Mission Day Playback

## Purpose
I added a replay of the recorded simulation to the surface monitor. I preserved the existing planet artwork, crew characters, and crew selection controls.

## Day and timing logic
I use the backend readings to show the starting inventory, each day boundary, and the exact first failed hour. A partial final day stops on its actual failure hour. Before-launch thermal or atmosphere failures appear immediately. Playback takes at most nine seconds plus the 0.65-second outcome fade, excluding pauses and browser scheduling delays. Longer missions advance faster. Replay restarts the animation without rerunning the backend. Reduced motion shows the final state immediately.

## Resource bars
I show recorded oxygen, clean water, battery, and wastewater levels. Oxygen and water scales use the peak recorded inventory; battery uses its configured capacity. Wastewater uses peak backlog as its scale, not a failure threshold. Power generation appears beside required demand. A generation deficit does not alone mean mission failure because the battery may cover it.

## Optional constraints
I show heating/cooling demand versus capacity, the indoor temperature target, cabin pressure, inspired oxygen, inert gas percentage, and CO2 only when their checks are enabled. Temperature and cabin atmosphere are fixed settings or capacity screens, not simulated changing temperatures or pressures. CO2 uses the hourly average when available and the initial value before the first hour. Limits and units remain visible.

## Ending
I stop at the backend's earliest event and display every failed constraint at that hour. The surface fades red for failure or green for success, with a light vignette and larger outcome text. I use dramatic fictional wording, including Water depleted. Everyone died of thirst., followed by a practical improvement hint. The screen labels deaths as fictional because the backend does not model deaths. Successful completion covers only the enabled model checks.

## Code
MissionControl.jsx wraps the existing scene in SurfacePlayback.jsx. SurfacePlayback handles playback controls, resource meters, and the outcome overlay. missionPlayback.js selects daily frames, caps timing, and stores ending text. The stylesheet adds scoped playback styles. Changing configuration hides the old playback until a fresh result is available. API errors remain separate from simulated mission failures.

## Verification
I added tests for exact partial-day failure timing, before-launch failure, long-mission duration, and empty results. The feature remains on mission-day-playback for testing and is not merged into main.

I verified a real backend water-shortage run in the browser: playback stopped at day 1, hour 1, showed the red ending, and displayed zero clean water with the recorded battery and oxygen values. All 41 frontend tests and the production build passed.
