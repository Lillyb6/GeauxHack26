# Optional Google sign-in and private mission saves

## What I changed
I added optional Google-only sign-in through Supabase. The simulator still works without an account. Signed-in users run their mission and explicitly press Save mission. Guests export and import the same versioned mission JSON format. I removed automatic browser mission saves from Run and Apply. Previous browser saves remain available for export or loading and are not uploaded automatically.

## What a save contains
Cloud saves contain mission names and complete validated input configurations, including equipment, optional checks and search limits. They do not store hourly results, Gemini prompts or API keys. Loading clears old results and requires a fresh Run. Failed runs can also be saved to revisit their settings. Editing settings disables Save until those settings have been run. Repeated saves of a loaded or newly saved cloud mission update its cloud record. A new mission or JSON import creates a new record.

## Files and connections
- AuthContext.jsx shares Google sign-in state across Home, the mission header and the library. Only the Google OAuth provider is exposed. The SDK handles PKCE redirects, session persistence and refresh. Sign out affects this browser.
- supabaseClient.js reads frontend public environment configuration. Missing configuration leaves guest mode available.
- cloudMissions.js validates mission documents, scopes queries to the owner and reports storage failures separately from simulations.
- MissionLibrary.jsx lists cloud missions for the current account, provides JSON import/export and leaves previous browser saves read-only.
- App.jsx provides Save after Run or Apply, prevents stale settings being saved as a tested configuration, and ignores outdated save responses after account or mission changes.
- A temporary validated input draft in sessionStorage restores configuration after the OAuth redirect. It expires after 15 minutes and is removed when consumed. This is not a guest saved-mission library.
- supabase/migrations/202610250001_private_missions.sql creates the private table and ownership policies.

## Supabase and Google setup required
1. Open your Supabase project and run supabase/migrations/202610250001_private_missions.sql once in SQL Editor. It creates a new missions table; it does not modify existing application tables.
2. In Supabase Authentication, open Sign In / Providers, then Google. Copy the OAuth callback URL displayed there. It should be https://YOUR_PROJECT.supabase.co/auth/v1/callback.
3. In Google Cloud Console, configure Google Auth Platform for your project. Choose the audience and fill in the required branding/contact fields. If the app is in Testing, add the Google accounts that will test it to Test users.
4. Create an OAuth client of type Web application. Add http://127.0.0.1:5173 and http://localhost:5173 to authorized JavaScript origins. Add the SUPABASE callback URL from step 2 as an authorized redirect URI. This is different from the app return URL.
5. Enter the Google client ID and client secret directly into Supabase's Google provider settings and enable it. Never put the Google client secret in frontend code, Git or chat. Disable other sign-in providers, including email sign-in, if this Supabase project is dedicated to this app. Do not disable providers used by another app in a shared project.
6. In Supabase Authentication URL Configuration, set Site URL to http://127.0.0.1:5173. Add http://127.0.0.1:5173/simulation and http://localhost:5173/simulation to Redirect URLs.
7. Copy frontend/.env.example to frontend/.env.local and fill in your Supabase URL and publishable key. Only the public URL/key belong in VITE_ variables. Restart Vite after changing environment values. The user's local public credentials have been placed in the ignored file. Teammates need their own local configuration.
8. Start backend and frontend using the README. Press Sign in with Google, finish sign-in, run a mission, press Save, and reload the cloud mission list.

## Privacy and ownership
The database enables Row Level Security, revokes anonymous access and grants authenticated access only through owner policies based on auth.uid(). SELECT, INSERT, UPDATE and DELETE are each limited to that user's rows. The public frontend key does not bypass these policies. No service-role key is used. The browser session token is managed by Supabase; it is not included in exported mission files.

## Verification
Automated frontend tests cover guest rejection, owner filters, supported save payloads, invalid input rejection, missing table and denied-write errors, zero-row updates and stale-run detection. They mock the Supabase client and do not establish that the remote SQL policies have been deployed. Run supabase/tests/private_missions.sql in SQL Editor after the migration to test actual ownership restrictions in a rolled-back transaction. Live Google sign-in and cloud round-trip testing require the Google provider and table setup above.

## Judge explanation
I added optional account persistence after the original simulation was working. Supabase handles Google authentication and stores private mission input documents in Postgres. The Python backend still performs the simulation. Guests can use the app and JSON files without an account.

## Official references
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/quickstarts/react
- https://supabase.com/docs/guides/database/postgres/row-level-security


## Verification results for this branch
- 57 frontend tests passed.
- 359 backend tests passed.
- Frontend production build passed.
- Browser check: optional Google sign-in appears on Home and in the library; guests can run missions and export a valid input-only JSON file. Guest library does not offer a new browser/cloud Save.
- Remote readiness check: Google provider is currently disabled, email provider is enabled, and the missions relation is not present. Google sign-in checks provider readiness before redirecting to avoid an error page while setup is incomplete.
- Pending: apply the SQL migration and ownership test, configure Google OAuth and verify a live sign-in/save/load/sign-out round trip with two separate accounts. No live cloud-save success is claimed yet.


## Google OAuth setup progress
The existing beyondearth Web OAuth client was found in the Google Cloud CalSync project. After user confirmation, I saved localhost JavaScript origins and the Supabase callback URL. The separate CalSync-Web-App client was not changed. Google displayed OAuth client saved. Supabase dashboard login and the Google client-secret entry are still pending. Vercel hosting is being prepared separately; the production return URL must be added after the deployment URL is known.
