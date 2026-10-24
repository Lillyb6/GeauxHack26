# Tutorial page implementation

## What I added
I filled the existing TutorialPage placeholder with a six-chapter Mission Lab guide. The tutorial covers the overview, mission setup, supplies and equipment, cabin/temperature checks, interpreting results, optimization, AI proposals and saving/loading. I used text, native controls and CSS transitions. No images, image generation, decorative planet illustration or new artwork is included in the tutorial.

## Files and code logic
- frontend/src/tutorialContent.js stores the authored content as objects: chapter name, heading, introduction, next-button label and content blocks. Blocks are steps, notes or expandable sections containing paragraphs and field definitions. Keeping copy separate makes it easier to edit explanations without changing navigation.
- frontend/src/TutorialPage.jsx uses useState to track the selected chapter. Chapter buttons and Previous/Next change that index; the last Next calls onComplete. Skip is always available and calls onSkip. GuideBlock renders structured content as normal React elements, including native details/summary sections and definition lists. No HTML strings are inserted into the page. requestAnimationFrame moves focus to the newly rendered chapter heading for keyboard/screen-reader users.
- HeatingExample is local to TutorialPage. Buttons choose 2 or 4 kW available capacity against a fixed illustrative 3.2 kW requirement. The capacity bar transitions and a status message reports -1.2 or +0.8 kW margin. It never calls the simulation API or edits mission inputs.
- frontend/src/Experience.jsx retains the existing /, /tutorial and /simulation routes. The home page gains an explicit How to use Mission Lab link. History state remembers whether the guide was opened from home or Mission Lab so the Back button returns appropriately. After the first Mission Lab visit, App remains mounted in a hidden wrapper while another page is visible. This preserves configuration, results, comparison and agent state through help navigation. Direct home/tutorial visits do not mount App or require a working backend.
- frontend/src/App.jsx accepts onHelp alongside onHome. Its top navigation now has Home and Help links. Help is also available during initial API loading/failure. Links use real href destinations and intercept normal clicks through the existing navigation callbacks.
- frontend/src/style.css adds scoped tutorial layout, expandable sections, chapter navigation, progress and the heating example. It uses the current home-page palette and typography. Chapter transitions and capacity-bar motion respect prefers-reduced-motion. Responsive layouts stack at smaller widths and controls keep usable touch targets. A hidden rule ensures the retained Mission Lab does not appear on the tutorial.

## User flow
Home -> Start simulation or How to use Mission Lab -> optional tutorial -> finish or skip -> Mission Lab. Mission Lab -> top Help -> guide -> Back to Mission Lab/finish/skip -> the same mission inputs and results. Browser Back/Forward use the existing route handler.

## Scope and ownership
The tutorial uses no new backend endpoints, dependencies, image assets, analytics or external API calls. Existing team home/mission artwork is not modified by this tutorial change. The pre-existing package-lock edit remains excluded. No collaborator or co-author is added. Tutorial changes are saved on mission-tutorial for testing before merging into main.

## Verification and a short entry for my project notes
Production frontend build passed and all 28 existing frontend tests passed. Browser checks verified direct tutorial access, chapter navigation, expandable explanations, the heater example, Skip, Finish, the home link and Mission Lab Help. A completed mission with five crew, one day and 380 kg water retained its inputs and result after Help -> Back and after Finish. Phone (390 px) and tablet (900 px) checks found no horizontal overflow. The tutorial has zero image elements. No live Gemini calls were made. Existing chart bundle-size advice remains.

Project notes: I pulled the latest origin/main and completed the existing tutorial placeholder on mission-tutorial. I added a six-chapter guide, expandable field explanations, a local heating example, always-available Skip, a home-page guide link and top Mission Lab Help navigation. Help preserves mission inputs and results during navigation. The guide uses the current styling and reduced-motion-aware transitions, with no images or illustrations. The changes are saved on mission-tutorial for review and have not been merged into main.

## Hidden-chart rendering
Experience passes an active flag to App. Trend skips rendering its chart while the lab is hidden. DesignComparison keeps its selected metric and other state mounted but only renders its chart when active. This prevents Recharts from measuring hidden zero-sized containers while preserving mission inputs, results and comparison settings. Charts render again when the user returns. No calculation changes are involved.
