# Feature: Short animated mission tutorial

## Purpose
I replaced the long first-time tutorial with three short visual examples. Each example has one caption, and users control when to move on. The longer explanations remain available through Detailed instructions.

## Example 1: Choose your mission
The first example starts automatically when the tutorial opens. It selects Mars, then Venus, then Titan. Next, the crew changes from four to six people. Finally, mission length changes from seven to fourteen to thirty Earth days, with a moving duration bar. These are demonstration values and do not change the user's mission.

## Example 2: Run your build
The second example starts when the user presses Next. It shows Run mission turning on a monitor, followed by moving oxygen, water and battery bars. The bars are labeled illustrative resource levels rather than being presented as real calculated inventory. This teaches that one Run mission action opens the monitors and runs the build.

## Example 3: Read your outcome
The third example reveals two separate example results: a Mars build that completes 30 days, and a Venus build that completes six full hours before a power shortage during hour seven. These match previously checked local simulation examples, but the tutorial itself does not run the simulation. They are not the result of the six-person Titan setup shown in example one.

## Navigation
Next opens and plays the next example. It never advances to another example automatically. Back returns to the previous example, Replay example restarts the current animation, and Skip tutorial opens Mission Lab. The final Build my mission button uses the existing navigation into the mission workspace. Get started on Home opens the quick tutorial. Help in the monitor workspace opens the detailed instructions directly.

## Code: TutorialPage.jsx
I used the lessons array for the three titles and short captions. The step state selects the current lesson; replay changes the example component's key so its local animation starts again. The AnimatedExample component uses a frame number to select each visible state. A short set of timeouts changes that number; there are no continuous animation loops.

The timeout cleanup runs when an example unmounts, changes or is replayed. This prevents earlier animations from continuing after the user moves to a different example. The first sequence takes about 3.25 seconds; the other two use three 0.8-second steps. The motion is local to the guide and makes no backend or Gemini requests.

## Accessibility and appearance
I matched the app's existing dark background and orange accent. I reused the existing crew artwork and added no generated images. Buttons have visible labels, support keyboard navigation and use a minimum 44-pixel target. Changing examples moves focus to the new lesson heading. Screen-reader descriptions summarize each demonstration without announcing every animation frame.

When reduced motion is enabled, the examples show their final state immediately and CSS transitions are disabled. The layout stacks on narrow screens. Browser checks found no horizontal overflow at the tested phone-sized width.

## Detailed instructions: DetailedMissionGuide.jsx
I preserved the previous six-chapter tutorial in a separate component instead of deleting it. Detailed instructions opens that guide, and Back to quick tutorial returns to the short version. The existing technical copy, field definitions, heating example and references remain available on demand.

## Styles: style.css
I added styles scoped to the animated briefing: selected destination tiles, crew changes, the duration bar, the monitor power-on example, illustrative resource bars and the Success/Failed examples. The mission-control camera and simulation logic were not changed.

## Validation
All 30 existing frontend tests passed, the frontend production build passed, and git diff --check found no whitespace errors. Browser verification covered automatic first-example playback, the final Titan/six-crew/30-day state, manual Next and Back navigation, Replay, and opening Detailed instructions. No new backend or AI calls are made by the examples.

## Branch
I developed this feature on animated-mission-tutorial for merging into main. The unrelated frontend/package-lock.json change is excluded from this work.

## Help navigation and clearer detailed instructions
I changed the first-time Home button to Get started and routed it to /tutorial, which opens the short animated examples. Resume mission still returns directly to an already configured workspace. I removed the extra Home guide link so the entry point has one clear next action.

I separated the two help destinations: /tutorial is the quick introduction, and /help is the detailed guide. The monitor workspace's top Help button goes directly to /help instead of replaying the introduction. The top Help button stays hidden during first-time preparation and appears after mission control has been opened. Home has no top Help button.

On the quick tutorial, I enlarged the Detailed instructions action and added Need more detail? with the short explanation Every setting, explained. The detailed page has its own title and browser URL. Back returns to the place it was opened from, and normal browser navigation works for both destinations. The mission app remains mounted while these pages are open, preserving the active configuration and results.

## Help-route verification
The production build passed after the navigation changes. In the browser, I verified Get started opens /tutorial, Detailed instructions opens /help, first-time preparation has no top Help link, and the powered monitor workspace has a Help link directly to /help. Returning from the guide preserved the successful 720-hour mission result.

## Final checks before merge
I pulled origin/main before committing; Git reported it was already up to date. All 30 existing frontend tests and the production build passed again. I committed only the animated tutorial, its detailed guide and navigation changes, styles, and this explanation. The unrelated package-lock.json modification was left out.
