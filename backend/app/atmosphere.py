"""Static nominal cabin atmosphere screening, separate from consumable inventories."""
from .co2 import PA_PER_MMHG

STANDARD_URL = "https://ntrs.nasa.gov/api/citations/20250004555/downloads/NASA-STD-3001%20Vol%202%20Rev%20E%20FINAL_05022025.pdf"
BRIEF_URL = "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-003-habitable-atmosphere.pdf"
ATMOSPHERE_SOURCES = {
    "atmosphere_standard":{"title":"NASA-STD-3001 Volume 2, Rev E (May 2 2025), V2 6002/6003/6006", "url":STANDARD_URL,
        "context":"PDF pp.49–51; Table 6.2-1. Total pressure >34.5 and <=103 kPa; nominal inspired O2 target 145–155 mmHg; at least 30% inert diluent assuming balance oxygen. Pinned revision, not a complete compliance assessment."},
    "inspired_oxygen":{"title":"NASA OCHMO-TB-003 Habitable Atmosphere, Rev A (Nov 30 2023), PDF p.4", "url":BRIEF_URL,
        "context":"Dry ppO2=PB*FiO2; inspired PIO2=(PB-47)*FiO2 with PB in mmHg. 47 mmHg is airway water vapor at body temperature, not cabin humidity or interior temperature."},
}
PRESSURE_LOW_KPA = 34.5  # exclusive lower bound
PRESSURE_HIGH_KPA = 103.0
PIO2_LOW_MMHG = 145.0
PIO2_HIGH_MMHG = 155.0
AIRWAY_WATER_MMHG = 47.0
MIN_DILUENT_PERCENT = 30.0


def screen_atmosphere(req):
    if not req.atmosphere_enabled:
        return None
    pressure=req.cabin_pressure_kpa
    fraction=req.cabin_oxygen_percent/100
    pressure_mmhg=pressure*1000/PA_PER_MMHG
    # Below the airway vapor pressure this expression is outside its useful domain;
    # do not present a negative inspired oxygen partial pressure as a physical result.
    inspired=(pressure_mmhg-AIRWAY_WATER_MMHG)*fraction if pressure_mmhg>=AIRWAY_WATER_MMHG else None
    diluent=100-req.cabin_oxygen_percent
    checks=[
        {"id":"cabin_pressure","label":"Total cabin pressure","passed":PRESSURE_LOW_KPA<pressure<=PRESSURE_HIGH_KPA,
         "value":pressure,"unit":"kPa","criterion":">34.5 and <=103 kPa (V2 6006)",
         "message":"Cabin total-pressure setting is outside the selected NASA indefinite-exposure reference range."},
        {"id":"inspired_oxygen","label":"Inspired oxygen nominal target","passed":inspired is not None and PIO2_LOW_MMHG-1e-9<=inspired<=PIO2_HIGH_MMHG+1e-9,
         "value":inspired,"unit":"mmHg","criterion":"145–155 mmHg normoxia target (Table 6.2-1)",
         "message":"Inspired oxygen setting is outside this prototype's nominal 145–155 mmHg design target, or is undefined at this pressure. Other NASA exposure categories are not evaluated."},
        {"id":"inert_diluent","label":"Assumed inert diluent balance","passed":diluent>=MIN_DILUENT_PERCENT,
         "value":diluent,"unit":"%","criterion":">=30% diluent, assuming balance oxygen (V2 6002)",
         "message":"Assumed inert diluent is below the 30% reference requirement. Gas composition and flammability require separate qualification."},
    ]
    return {"status":"within_nominal_screen" if all(c["passed"] for c in checks) else "outside_nominal_screen",
        "basis":"Static setpoint screen; pressure and dry O2/N2 mixture are assumed maintained, not simulated.",
        "cabin_pressure_kpa":pressure,"cabin_oxygen_percent":req.cabin_oxygen_percent,
        "dry_oxygen_partial_pressure_kpa":pressure*fraction,
        "dry_oxygen_partial_pressure_mmhg":pressure_mmhg*fraction,
        "inspired_oxygen_partial_pressure_mmhg":inspired,
        "assumed_diluent_percent":diluent,"checks":checks,
        "limitations":[
            "145–155 mmHg is the selected normoxia design target, not the full NASA allowable exposure envelope, a lethal threshold or a medical diagnosis.",
            "Total pressure and O2 percentage are static user-selected settings. Oxygen supply inventory is not cabin gas mass; no regulator, leak, makeup-gas or pressure-control calculation is performed.",
            "Dry mixture is assumed O2 plus inert diluent (nominally nitrogen); trace CO2 and humidity are screened separately, not solved in a coupled gas-mixture balance.",
            "47 mmHg represents airway humidification at body temperature; it is independent of the chosen cabin temperature. No alveolar oxygen or individual physiology is modeled.",
            "No decompression-sickness, EVA transition, pressure-vessel, ignition, material-flammability or full standards-compliance evaluation is performed.",
        ]}


def atmosphere_evidence(req,summary):
    return {
        "cabin_pressure_kpa":{"value":req.cabin_pressure_kpa,"unit":"kPa absolute","classification":"scenario_setpoint","source_ids":[],"note":"User-selected interior pressure; not measured or inferred from the planet or stored oxygen. Assumed constant, without regulator power/mass."},
        "cabin_oxygen_percent":{"value":req.cabin_oxygen_percent,"unit":"% dry-gas O2","classification":"scenario_setpoint","source_ids":[],"note":"User-selected fixed dry O2 fraction; remainder assumed inert diluent. Not a dynamic gas-mixture simulation."},
        "atmosphere_criteria":{"value":">34.5 to <=103 kPa; inspired O2 nominal 145–155 mmHg; diluent >=30%","classification":"reference_criteria_with_selected_nominal_target","source_ids":["atmosphere_standard"],"note":"Pinned NASA-STD-3001 Vol 2 Rev E, V2 6002/6003/6006 and Table 6.2-1. Non-nominal exposure categories, EVA and full qualification are not evaluated."},
        "inspired_oxygen_equation":{"value":summary["inspired_oxygen_partial_pressure_mmhg"],"unit":"mmHg","classification":"derived_static_screen","source_ids":["inspired_oxygen"],"note":"PIO2=(PB-47)*FiO2; ambient dry ppO2=PB*FiO2 is a different value. At pressure below the 47 mmHg airway vapor correction, PIO2 is null rather than a negative physical pressure."},
    }
