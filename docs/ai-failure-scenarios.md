# Applying intentionally failing AI scenarios

## Problem
I found that the AI could calculate a failing mission but the backend only returned proposals for passing missions. A second check in the frontend also rejected failed results. This prevented educational scenarios such as deliberately running out of water from being applied.

## Change
I made direct simulation proposals available whether they pass or fail. The existing outcome, first failure and events remain unchanged. Optimization still requires a feasible candidate. Applying a scenario still requires validated settings that match the evaluated simulation. Missing or malformed outcomes are rejected.

## Verification
I added tests that generate water failures for Mars, Venus and Titan, apply the returned settings and reproduce the same failure through the simulation endpoint. I also tested frontend acceptance of an evaluated failure and rejection of mismatched settings. All 370 backend tests and 58 frontend tests passed, and the production frontend build passed.
