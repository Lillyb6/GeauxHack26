"""Versioned evidence and explicit design choices; sources do not imply validation."""
SOURCES = {'bvad': {'title': 'NASA BVAD Rev. 2 (2022), Table 3-31, printed p.58 / PDF p.72',
          'url': 'https://ntrs.nasa.gov/api/citations/20210024855/downloads/BVAD_2.15.22-final.pdf',
          'context': '82 kg reference astronaut with the documented daily exercise profile; not a '
                     'universal human requirement.'},
 'doe_pem': {'title': 'US DOE PEM electrolysis technical targets — 2022 system status',
             'url': 'https://www.energy.gov/cmei/fuels/technical-targets-proton-exchange-membrane-electrolysis',
             'context': '55 kWh/kg H2 system status. Approximate O2 basis: divide by 8 = 6.875 '
                        'kWh/kg O2. Terrestrial technology proxy, not space-qualified OGA '
                        'hardware.'},
 'wrm': {'title': 'Chow, Nelson & Perry (2018), NASA NTRS, Table 1 / PDF p.3',
         'url': 'https://ntrs.nasa.gov/api/citations/20180007962/downloads/20180007962.pdf',
         'context': '0.527 kW water recovery/management load in a historical ISS configuration '
                    'analysis. Using it for this habitat and any crew/recovery setting is an '
                    'unvalidated transfer assumption.'},
 'water_recovery': {'title': 'NASA ISS water recovery milestone (2023)',
                    'url': 'https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/',
                    'context': '93–94% overall before BPA; 98% demonstrated with BPA on ISS. Not a '
                               'demonstrated recovery rate on Mars, Venus or Titan.'},
 'conduction': {'title': 'NASA Passive Thermal Control Engineering Guidebook Rev.4 (2023), section '
                         '4.2.1 / printed p.42',
                'url': 'https://ntrs.nasa.gov/api/citations/20230013900/downloads/NASA%20Thermal%20Control%20Engineering%20Guidebook%20v4.pdf',
                'context': 'Fourier conduction equation supports a steady conduction calculation, '
                           'not the demo UA, COP or an entire habitat thermal model.'},
 'electrolysis': {'title': 'NASA NTRS electrolysis study (2018), OGA description / PDF p.3',
                  'url': 'https://ntrs.nasa.gov/api/citations/20180007962/downloads/20180007962.pdf',
                  'context': 'Water splits into hydrogen and oxygen. Ideal rounded stoichiometry: '
                             '2 H2O -> 2 H2 + O2; 36/32 = 1.125 kg feedwater/kg O2; losses '
                             'omitted.'},
 'mars': {'title': 'NASA Mars Fact Sheet, bulk parameters and Martian Atmosphere',
          'url': 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
          'context': '-59 C average atmospheric temperature, 6.36 mbar at mean radius, mean '
                     'gravity 3.73 m/s2. Values vary with site and season.'},
 'venus': {'title': 'NASA Venus Fact Sheet, bulk parameters and Venus Atmosphere',
           'url': 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html',
           'context': '464 C average, 92 bar surface pressure, 8.87 m/s2 gravity; surface '
                      'scenario, not cloud habitat.'},
 'titan': {'title': 'NASA TFAWS 2023 Dragonfly thermal analysis, slide 4 / PDF p.4',
           'url': 'https://tfaws.nasa.gov/wp-content/uploads/TFAWS23-AT-15-Presentation.pdf',
           'context': '94 K, approximately -180 C as rounded in the source; 146 kPa and 1.352 '
                      'm/s2. Nitrogen atmosphere.'}}

PARAMETERS = {'oxygen_consumption_kg_person_day': {'value': 0.895,
                                      'unit': 'kg/person/day',
                                      'classification': 'reference_baseline',
                                      'source_ids': ['bvad'],
                                      'note': 'Nominal Table 3-31 value. Table 4-1 instead rounds '
                                              'a related reference to 0.90; this model uses 0.895 '
                                              'consistently.'},
 'water_consumption_kg_person_day': {'value': 3.217,
                                     'unit': 'kg/person/day',
                                     'classification': 'reference_baseline',
                                     'source_ids': ['bvad'],
                                     'note': 'Potable input for drinking/food preparation; '
                                             'excludes pre-existing food water, hygiene, payload '
                                             'use. Recovery of this intake is a simplified '
                                             'effective loop.'},
 'electrolysis_water_ratio': {'value': 1.125,
                              'unit': 'kg water/kg O2',
                              'classification': 'derived_ideal',
                              'source_ids': ['electrolysis'],
                              'note': 'Rounded stoichiometric minimum, not total equipment '
                                      'feedwater including losses.'},
 'electrolyzer_kwh_kg_oxygen': {'value': 6.875,
                                'unit': 'kWh/kg O2',
                                'classification': 'derived_technology_proxy',
                                'source_ids': ['doe_pem'],
                                'note': '55/8; linear scaling and off-Earth applicability not '
                                        'validated.'},
 'recycler_power_kw': {'value': 0.527,
                       'unit': 'kW',
                       'classification': 'transferred_reference',
                       'source_ids': ['wrm'],
                       'note': 'Fixed load when recovery is enabled. Not a validated plant sizing '
                               'model.'},
 'other_load_kw': {'value': 3.2,
                   'unit': 'kW',
                   'classification': 'unvalidated_design_input',
                   'source_ids': [],
                   'note': 'Illustrative total lighting/electronics load; replaces unsupported 0.8 '
                           'kW/person.'},
 'heat_loss_kw_k': {'value': 0.04,
                    'unit': 'kW/K',
                    'classification': 'unvalidated_design_input',
                    'source_ids': [],
                    'note': 'Illustrative lumped conductance; no wall geometry/material '
                            'validation.'},
 'interior_temperature_c': {'value': 21.0,
                            'unit': 'C',
                            'classification': 'design_setpoint',
                            'source_ids': [],
                            'note': 'Chosen setpoint, not an asserted NASA requirement.'},
 'hvac_cop': {'value': 1.0,
              'unit': 'dimensionless',
              'classification': 'unvalidated_design_input',
              'source_ids': [],
              'note': 'Assumed heater/cooler performance; no operating envelope validation.'},
 'recycling_fraction': {'value': 0.93,
                        'unit': 'fraction',
                        'classification': 'transferred_reference',
                        'source_ids': ['water_recovery'],
                        'note': 'Effective recovery of potable demand only; omits food/metabolic '
                                'water. ISS evidence does not validate this simplified boundary or '
                                'other environments.'}}

def evidence_for(request, equipment_summary=None, water_equipment_summary=None):
    values = request.model_dump()
    evidence = {}
    for name, entry in PARAMETERS.items():
        item = dict(entry)
        if name in values:
            item["value"] = values[name]
            if values[name] != entry["value"]:
                item["classification"] = "user_override"
                item["note"] = "User-selected scenario value; cited reference is context only. " + entry["note"]
        evidence[name] = item
    for name in ("crew_size", "duration_days", "oxygen_kg", "water_kg", "battery_kwh", "generation_kw", "oxygen_capacity_kg_day"):
        evidence[name] = {"value":values[name], "classification":"scenario_input", "source_ids":[], "note":"User-selected mission design, not a scientific observation."}
    if equipment_summary is not None:
        evidence.pop("oxygen_capacity_kg_day", None)
        evidence.pop("electrolyzer_kwh_kg_oxygen", None)
        source_id = "equipment:" + equipment_summary["equipment_id"]
        for name, field, unit in (
            ("equipment_oxygen_output", "oxygen_output_kg_day", "kg O2/day"),
            ("equipment_power", "electrical_power_kw", "kW"),
            ("equipment_hardware_mass", "known_hardware_mass_kg", "kg"),
        ):
            evidence[name] = {
                "value": equipment_summary[field], "unit": unit,
                "classification": equipment_summary["evidence_status"],
                "source_ids": [source_id],
                "note": "Published per-unit design value multiplied by selected quantity. Mass is equipment hardware only; planetary operating envelope is unknown.",
            }
        evidence["oxygen_equipment_quantity"] = {
            "value": request.oxygen_equipment_quantity, "unit": "units",
            "classification": "scenario_input", "source_ids": [],
            "note": "User-selected count of identical units at the published design point.",
        }
    if water_equipment_summary is not None:
        evidence.pop("recycling_fraction", None)
        evidence.pop("recycler_power_kw", None)
        source_id = "equipment:" + water_equipment_summary["equipment_id"]
        for name, field, unit in (
            ("water_feed_budget", "feed_capacity_kg_day", "kg feed/day"),
                        ("water_equipment_power", "electrical_power_kw", "kW"),
            ("water_equipment_hardware_mass", "known_hardware_mass_kg", "kg"),
        ):
            evidence[name] = {
                "value":water_equipment_summary[field], "unit":unit,
                "classification":water_equipment_summary["evidence_status"],
                "source_ids":[source_id],
                "note":"Derived historical reference case; feed budget and fixed power/mass are historical reference specifications; recovery yield is separately labeled as an assumption. See source derivations and limitations.",
            }
        evidence["water_processed_feed_recovery"] = {
            "value":water_equipment_summary["recovery_fraction"], "unit":"fraction",
            "classification":water_equipment_summary["recovery_evidence_status"], "source_ids":[],
            "note":water_equipment_summary["derivations"]["recovery_fraction"],
        }
        evidence["water_equipment_quantity"] = {
            "value":request.water_equipment_quantity, "unit":"units", "classification":"scenario_input", "source_ids":[],
            "note":"Identical reference-case units; quantity scales feed budget, installed power and known hardware mass, not recovery fraction.",
        }
    return evidence


def sources_for(evidence, environment_id, equipment_summary=None, water_equipment_summary=None):
    sources = dict(SOURCES)
    if equipment_summary is not None:
        source = equipment_summary["source"]
        sources["equipment:" + equipment_summary["equipment_id"]] = {
            "title": source["title"], "url": source["url"],
            "context": source["location"] + "; " + "; ".join(equipment_summary["limitations"]),
        }
    if water_equipment_summary is not None:
        source = water_equipment_summary["source"]
        sources["equipment:" + water_equipment_summary["equipment_id"]] = {
            "title":source["title"], "url":source["url"],
            "context":source["location"] + "; " + "; ".join(water_equipment_summary["derivations"].values()) + "; " + "; ".join(water_equipment_summary["limitations"]),
        }
    used_ids = {source for item in evidence.values() for source in item["source_ids"]}
    used_ids.add(environment_id)
    return {key: value for key, value in sources.items() if key in used_ids}
