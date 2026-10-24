"""Well-mixed constant-temperature cabin CO2; analytical integration of an assumed response curve."""
from math import exp, expm1, log
from .equipment import EQUIPMENT_BY_ID

R = 8.31446261815324  # J/(mol K), NIST CODATA
MOLAR_MASS = 0.0440095  # kg/mol, NIST Chemistry WebBook
PA_PER_MMHG = 133.322387415  # conventional mmHg conversion
CREW_CO2_KG_DAY = 1.085  # BVAD Rev 2 Table 3-31, same profile as existing O2 baseline
CO2_LIMIT_MMHG = 3.0  # OCHMO TB-004 / NASA-STD-3001 V2 6004: one-hour mean
CO2_SOURCES = {
    "co2_limit":{"title":"NASA OCHMO-TB-004 Carbon Dioxide; V2 6004", "url":"https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/", "context":"Nominal one-hour average cabin CO2 partial pressure at most 3 mmHg. A design screening limit, not a lethal threshold or certification."},
    "co2_cdra":{"title":"Darrell Jan (NASA Ames), NASA CO2 Removal, July 24 2019, slide 36", "url":"https://usea.org/sites/default/files/event-/JAN_NASA%20DCA%207-24-2019sW2.pdf", "context":"NASA-authored historical presentation hosted by USEA. 4.16 kg/day at 2 mmHg; 1000 W; 450 lb converted using 0.45359237 kg/lb. Does not supply the modeled response curve."},
    "ideal_gas":{"title":"NASA Glenn — Equation of State (Ideal Gas)", "url":"https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/equation-of-state-ideal-gas-2/", "context":"pV=nRT supports the equation. Perfect mixing, fixed temperature/volume and linear scrubber response are model assumptions."},
    "co2_molar_mass":{"title":"NIST Chemistry WebBook — Carbon dioxide", "url":"https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Mask=8004", "context":"Molecular weight 44.0095 g/mol; model uses 0.0440095 kg/mol."},
    "gas_constant":{"title":"NIST CODATA — molar gas constant", "url":"https://physics.nist.gov/cgi-bin/cuu/Value?r", "context":"R = 8.31446261815324 J/(mol K)."},
}


def pressure_per_kg(volume_m3, temperature_c):
    return R*(temperature_c+273.15)/(MOLAR_MASS*volume_m3*PA_PER_MMHG)


def resolve_co2_equipment(equipment_id, quantity):
    if isinstance(quantity,bool) or not isinstance(quantity,int) or not 0<=quantity<=4:
        raise ValueError("CO2 unit count must be an integer from zero to four.")
    item=EQUIPMENT_BY_ID.get(equipment_id)
    if not item or item["category"]!="co2_removal":
        raise ValueError("Unknown CO2 removal equipment selection.")
    result=dict(item)
    result.update(equipment_id=equipment_id,quantity=quantity,
        co2_capacity_kg_day=item["co2_capacity_kg_day"]*quantity,
        electrical_power_kw=item["electrical_power_kw"]*quantity,
        known_hardware_mass_kg=None if item["hardware_mass_kg"] is None else item["hardware_mass_kg"]*quantity)
    return result


def advance_pressure(p, generated_kg_hour, capacity_kg_hour, alpha, reference=2.0, hours=1.0):
    """Return ending p, time-average p and removed mass. Exact piecewise ODE integral.

    dp/dt=alpha*(generation-capacity*min(p/reference,1)); units mmHg and Earth hours.
    The linear-then-capped removal curve is an unvalidated assumption, not NASA test data.
    """
    a=alpha*generated_kg_hour
    if capacity_kg_hour==0:
        end=p+a*hours
        return end,(p+end)/2,0.0
    b=alpha*capacity_kg_hour/reference
    equilibrium=a/b
    slope=a-alpha*capacity_kg_hour
    def low(start,dt):
        decay=exp(-b*dt)
        end=equilibrium+(start-equilibrium)*decay
        integral=equilibrium*dt+(start-equilibrium)*(-expm1(-b*dt))/b
        return end,integral
    if p>=reference:
        cross=(p-reference)/(-slope) if slope<0 else float("inf")
        if cross>=hours:
            end=p+slope*hours;integral=p*hours+slope*hours*hours/2
        else:
            end,tail=low(reference,hours-cross)
            integral=(p+reference)*cross/2+tail
    else:
        cross=-log((reference-equilibrium)/(p-equilibrium))/b if equilibrium>reference else float("inf")
        if cross>=hours:
            end,integral=low(p,hours)
        else:
            _,integral=low(p,cross)
            rest=hours-cross
            end=reference+slope*rest
            integral+=reference*rest+slope*rest*rest/2
    end=max(0.0,end)
    removed=max(0.0,generated_kg_hour*hours-(end-p)/alpha)
    return end,integral/hours,removed


def co2_evidence(req,summary):
    return {
        "co2_crew_generation":{"value":CREW_CO2_KG_DAY,"unit":"kg/person/day","classification":"reference_baseline","source_ids":["bvad"],"note":"BVAD Rev 2 Table 3-31 nominal 82 kg crew/exercise profile; not the different HIDH 1.04 kg/day profile."},
        "co2_limit":{"value":CO2_LIMIT_MMHG,"unit":"mmHg, one-hour average","classification":"reference_screening_limit","source_ids":["co2_limit"],"note":"Applies to one-hour mean, not a lethal threshold. Initial p above it is separately rejected as an initial screening condition."},
        "co2_scrubber":{"value":summary["co2_capacity_kg_day"],"unit":"kg/day at 2 mmHg","classification":summary["evidence_status"],"source_ids":["co2_cdra"],"note":"Historical per-unit 4.16 kg/day, 1 kW, 450 lb; quantities scale rate, power and mass. Sub-reference proportional response is unvalidated."},
        "co2_gas_model":{"value":"p=mRT/(MV); fixed well-mixed cabin","classification":"idealized_equation_with_assumptions","source_ids":["ideal_gas","co2_molar_mass","gas_constant"],"note":"No total-pressure, oxygen partial-pressure, spatial mixing, leakage, delay, sorbent aging or vacuum/cooling infrastructure model."},
        "habitat_volume_m3":{"value":req.habitat_volume_m3,"unit":"m3","classification":"unvalidated_design_input","source_ids":[],"note":"User-selected well-mixed free cabin volume, not total structure volume."},
        "initial_co2_mmhg":{"value":req.initial_co2_mmhg,"unit":"mmHg","classification":"scenario_input","source_ids":[],"note":"Chosen starting CO2 partial pressure, independent of exterior atmosphere; total cabin pressure is not simulated."},
    }
