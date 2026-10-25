# AI agent configuration and immediate playback

## Problem
The AI response included catalog IDs inside proposed search settings. Copying that object directly into the four search controls made the next Run fail mission validation. Applying a proposal also left the initial setup screen open instead of launching the evaluated mission.

## What I changed
I added a shared proposal validator and one Apply handler for both AI entry points. I preserve every scenario parameter, including thermal capacity, cabin pressure, oxygen percentage, CO2 settings and enabled checks. I copy only the four supported search controls into search state. Before changing the controls, I validate the complete mission and check that the proposed values exactly match a passing evaluated request.

## How it starts
Apply & run opens mission control immediately and starts playback of the simulation already evaluated by the backend. I do not send another request using React state before that state has updated. The displayed parameters and the next manual Run use the same validated configuration. I also save the applied configuration with the existing browser save flow and report storage errors separately from simulation errors.

## AI instructions
I updated the agent's tool guidance to describe authorized heating/cooling capacity repair correctly. The agent keeps optional checks enabled and does not change fixed cabin atmosphere settings unless requested.

## Tests
I added frontend regression cases for Mars, Venus and Titan that preserve all constraint values and validate a subsequent Run with the filtered search settings. I also reject mismatched, failed and malformed proposals. Backend tests use mocked Gemini responses with the real agent and simulator, verify the exact proposed parameters, and run each returned configuration through /simulate again. These do not use or expose an API key and do not verify live Gemini availability.


## Visible input ranges

### What I added
I added minimum and maximum input values under each numeric configuration field, including supplies, equipment counts, advanced inputs, search limits and optional cabin and thermal checks. Water recovery displays 0 to 98 percent, matching its percentage control rather than the stored fraction. I also show the mission-name character limit.

### How to interpret the labels
Allowed means the app accepts the input. It does not mean the mission will pass. Pressure, inspired oxygen, inert gas, CO2, power, supplies and thermal capacity are still evaluated by the simulator. I kept the existing passing criteria and model bounds unchanged.

### Thermal precision
I allow decimal thermal capacities throughout the existing 0 to 1000 kW range so an AI or optimizer value such as 17.72 kW does not get blocked by the editor's old 0.1 kW step restriction.


## Range placeholders
I moved numeric input ranges into placeholder text instead of separate labels below each field. Empty fields show the allowed minimum, maximum and unit, such as 0 to 200 kPa. Existing configuration values stay visible and are never cleared just to show the hint. The same range is available as a hover tooltip when a field already contains a value. Input limits and required-field validation still apply.


## Visible Apply results action on the monitors
I made Apply results a separate button beside Optimize in the AI assistance monitor and the Mission brief monitor. It stays visible before a result exists, with a disabled state until a current passing design is available. Optimize no longer changes into a differently named Apply action. The AI prompt response also puts Apply results & run directly below its status, before metrics, explanations and audit details. Failed or stale proposals cannot be applied.
