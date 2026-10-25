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


## Surface layout and resource colors
I moved the resource meters into a two-column rail beside the planet scene on desktop so all enabled systems fit without scrolling inside the monitor. On narrow screens, the scene and resources stack and the monitor grows with its content rather than creating an inner scrollbar. I removed the redundant recorded-playback heading and standardized labels, values, and supporting text into fewer font sizes. Oxygen bars are mint, clean water bars are blue, and battery bars are gold. Labels and units still identify each resource, and failed values stay red.


## Original artwork and lighter ending tint
I replaced the CSS sphere icons in the surface planet selector with thumbnails from the existing Mars, Venus, and Titan artwork. I added object-fit: cover so the surface image keeps its proportions inside the available area rather than stretching. The scene may crop at the edges as its container changes shape. I lowered the final red and green overlay opacity from 87% to 62%, including the fade keyframes, so the planet and crew remain easier to see. No new images were generated.


## Supplied planet icons
I replaced the selector thumbnails with the exact supplied images: IMG_0326.png for Mars, IMG_0325.png for Venus, and IMG_0324.png for Titan. I copied them into public/mission as mars-icon.png, venus-icon.png, and titan-icon.png. I display them without distortion and crop the white outer canvas around each circular planet. The full surface backgrounds and crew artwork remain unchanged.


## Full-width planet background
I extended the existing planet scene across the entire desktop monitor instead of limiting it to the left column. The resource meters now overlay the right side on a 72% opaque dark panel so the artwork remains visible behind them. I kept the result text and playback controls in the clear left area. The scene preserves its image proportions, and the existing narrow-screen stacking remains available.


## Compact resource overlay
I changed the translucent resource overlay into a box that fits its content, with an inset margin and a subtle border. It no longer fills the entire right side of the surface view, leaving the planet visible below and around the panel.


## Clear ending screen
I hide the resource box when the final Success or Failed overlay appears and center the ending across the full planet scene. Replay brings the resource box back while the recorded mission plays. During playback, the box background is 50% opaque so more artwork shows through; the text and bars remain fully opaque.


## Playback controls on the left
I moved the day counter and Pause/Replay controls to the upper left of the planet scene, below the planet and crew label. This separates them from the resource box on the right.
