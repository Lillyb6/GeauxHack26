# Vercel deployment and code explanation

## What I added
I added a deployment entrypoint that serves the existing Python API under /api and the built React interface on the same origin. The simulation equations and normal localhost workflow are unchanged. The deployment does not need the developer's computer to remain running.

## Files
- main.py mounts the existing FastAPI app at /api and registers frontend/dist as the React frontend. The frontend fallback supports direct navigation and refresh on /simulation, /tutorial and /help. Missing API routes remain JSON 404s rather than returning the home page.
- vercel.json selects the FastAPI framework and builds the Vite frontend with its lockfile. The Python function has a 120-second maximum to leave room for the agent's existing bounded execution.
- requirements.txt reuses the existing pinned backend dependency list; .python-version selects Python 3.13.
- .vercelignore excludes local secrets, dependencies and generated output from uploads.
- backend/tests/test_deployment.py checks prefixed API routes, catalog loading, an actual simulation, SPA fallback and missing assets.

## Deploy from Vercel
1. Sign in to Vercel using the authorized GitHub account and import Lillyb6/GeauxHack26. If Vercel cannot see this repository, the repository owner may need to grant the Vercel GitHub integration access. Do not grant all-repository access unless intended.
2. Use the repository ROOT as Root Directory, not frontend. The checked-in vercel.json configures the build. The new deployment files and Supabase integration are currently on google-signin-cloud-missions, not main. Deploy the tested branch for review; do not assume importing main includes unmerged changes.
3. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel Environment Variables. These are public frontend credentials. Add GEMINI_API_KEY as a backend-only secret and GEMINI_MODEL as the backend model setting. Never use a VITE_ prefix for Gemini or Google secrets. Enter secret values directly in Vercel. Without a Gemini key, manual simulation and optimization remain available.
4. Deploy and verify /api/health, Home, /tutorial and /simulation. Run a mission and test Apply.
5. Copy the stable deployed origin, for example https://YOUR_PROJECT.vercel.app. In Supabase Authentication URL Configuration, add https://YOUR_PROJECT.vercel.app/simulation as an allowed redirect and set the production Site URL. Keep the exact localhost return URLs for local testing. Avoid broad wildcards for untrusted previews.
6. Add the deployed origin to the beyondearth Google OAuth client's Authorized JavaScript origins. Its Google Authorized redirect URI remains the same Supabase /auth/v1/callback URL, not the Vercel /simulation URL.
7. Complete the private missions migration and Google provider setup from google-cloud-missions.md. Test sign-in, save, reload, another-account isolation, sign-out and guest JSON export before declaring the account flow live.

## Deployment status
The deployment configuration is prepared locally and tested below. Account access, project import, environment setup and a live deployment still require verification. No production URL is claimed until Vercel reports a successful deployment and the public API responds.

## Official references
- https://vercel.com/docs/frameworks/backend/fastapi
- https://vercel.com/docs/functions/runtimes/python
- https://vercel.com/docs/project-configuration
