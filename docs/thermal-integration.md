# Thermal integration and frontend handoff

The helper in backend/app/thermal.py is now used by engine.py. API model 0.6.0 adds thermal_capacity_enabled (false), heating_capacity_kw (0), cooling_capacity_kw (0), all capacities in kW thermal. The finite validated capacity range is 0–1000 kW; this is an input bound, not an equipment rating.

SimulationResult.thermal_summary contains enabled, status (not_evaluated/sufficient/insufficient), mode (heating/cooling/none), required_thermal_kw, available_thermal_kw, margin_kw, capacity_sufficient, required_electric_kw and limitations. Unchecked capacity/ margin/pass fields are null. An insufficient enabled screen stops at hour zero with an event.resource of thermal and no consumed supplies. Existing thermal_load_kw still means required electrical power. Optimizer and Gemini tools use the same simulator; capacity is fixed during equipment search. No live Gemini request is needed for these calculations.

Frontend: FieldLabel.jsx holds plain-language names above existing technical terms, units and selected helper text. ThermalPanel.jsx owns capacity controls and result explanation. App.jsx uses these components while retaining existing field IDs and submission keys. Co2Panel.jsx/AtmospherePanel.jsx have wording-only label changes. Styles are small additions; original layout remains for the frontend owner to develop. A duplicated JSX region from the earlier merged frontend was removed, keeping the compact form, mission library, agent and results as a single workflow.

Model 0.5.0 saved mission input files have an explicit migration to 0.6.0: new capacities are zero and capacity screening remains disabled. Other missing or unknown fields are rejected. Old results are not reused. Restart the backend and refresh the frontend to load the new schema.

Manual check: Mars, one day, thermal screening enabled, heating 2 kW -> hour-zero thermal shortfall (3.2 kW required); heating 3.2 kW -> thermal capacity passes. With COP=2, thermal requirement stays 3.2 kW and required electricity becomes 1.6 kW. Venus needs cooling and cannot use heating capacity. UI units distinguish kW thermal from kW electricity.

Validation: 203 backend tests and 28 frontend storage tests passed; Vite production build passed. Existing Starlette/httpx deprecation and chart-bundle-size advisories remain. Browser checks confirmed one-day Mars with 2 kW heating stops at hour zero; 3.2 kW completes 24 hours. Live Gemini was not invoked.
