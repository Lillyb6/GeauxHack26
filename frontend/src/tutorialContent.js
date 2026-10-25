// Authored guide copy only; no images, external content, or API calls.
export const tutorialChapters = [
  {
    "name": "Meet Mission Lab",
    "title": "A habitat starts with a question.",
    "intro": "Can your supplies and equipment meet a crew’s needs for the mission you have in mind?",
    "next": "Choose your mission →",
    "content": [
      {
        "type": "steps",
        "items": [
          {
            "title": "Design",
            "text": "Choose a world, crew, supplies and life-support equipment."
          },
          {
            "title": "Simulate",
            "text": "Follow oxygen, water and battery balances hour by hour."
          },
          {
            "title": "Learn & adjust",
            "text": "Read the constraints, change a setting, then compare designs."
          }
        ]
      },
      {
        "type": "note",
        "title": "A design explorer, with limits.",
        "text": "Completing the enabled checks means resources covered the modeled scenario. It does not prove that people could safely live there."
      },
      {
        "type": "section",
        "title": "What is real, and what is modeled?",
        "technical": "Reference data, design assumptions and calculated results",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Planetary conditions and crew baselines have scientific sources. Equipment performance, conductance and efficiency may be simplified assumptions. The simulator calculates outcomes from those inputs."
          },
          {
            "type": "paragraph",
            "text": "Sources and limitations travel with each result. The environmental cards are reference information, not live telemetry."
          }
        ]
      },
      {
        "type": "section",
        "title": "Your first run",
        "technical": "A simple starting point",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Start with the default Mars mission. Run it once, inspect the charts, then change one setting. For example, lower power generation and see how the battery responds. Rerun after each edit."
          }
        ]
      }
    ]
  },
  {
    "name": "Choose your mission",
    "title": "Where are you going, and for how long?",
    "intro": "Set the mission first. More crew and more time generally mean more resources to account for.",
    "next": "Explore supplies & equipment →",
    "content": [
      {
        "type": "section",
        "title": "Choose a destination",
        "technical": "Mars, Venus or Titan",
        "blocks": [
          {
            "type": "fields",
            "entries": [
              {
                "term": "Mars",
                "description": "A cold, thin-atmosphere surface environment."
              },
              {
                "term": "Venus",
                "description": "A hot, high-pressure surface scenario, not a cloud habitat."
              },
              {
                "term": "Titan",
                "description": "Saturn’s cold moon, with a thick atmosphere."
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "Outside temperature changes the simplified thermal load. Environmental pressure and gravity are reference context; a complete structural or gravity-effects model is not implemented."
          }
        ]
      },
      {
        "type": "section",
        "title": "People on the mission",
        "technical": "Crew size · 1–12 people",
        "blocks": [
          {
            "type": "paragraph",
            "text": "This determines modeled crew oxygen and water consumption, and CO₂ production when enabled. It does not automatically scale every equipment load."
          }
        ]
      },
      {
        "type": "section",
        "title": "Mission length",
        "technical": "Duration · 1–180 Earth days",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The simulator advances in one-Earth-hour steps. One day means 24 steps; 30 days means 720. A shortage can stop the run early."
          }
        ]
      },
      {
        "type": "note",
        "title": "Change one thing at a time.",
        "text": "Keep the same mission when comparing equipment so the difference is easier to understand."
      }
    ]
  },
  {
    "name": "Supplies & equipment",
    "title": "Pack supplies. Give equipment power.",
    "intro": "Starting inventory is what you bring. Equipment changes how quickly those inventories rise or fall.",
    "next": "Check the cabin →",
    "content": [
      {
        "type": "section",
        "title": "Starting supplies",
        "technical": "Stored oxygen · usable water · battery energy",
        "blocks": [
          {
            "type": "fields",
            "entries": [
              {
                "term": "Starting oxygen supply · kg",
                "description": "The oxygen inventory available at hour zero. It is separate from cabin oxygen percentage."
              },
              {
                "term": "Starting water supply · kg",
                "description": "Usable water for the modeled crew use and oxygen electrolysis. Wastewater is not the same as usable water."
              },
              {
                "term": "Battery storage · kWh",
                "description": "The battery starts full. Energy can be used up or recharged, up to its capacity."
              },
              {
                "term": "Power available · kW",
                "description": "Continuous external electricity generation. kW is power; kWh is stored energy. Generation has no solar-day or fuel model yet."
              }
            ]
          }
        ]
      },
      {
        "type": "section",
        "title": "Oxygen maker",
        "technical": "Custom production or catalog equipment",
        "blocks": [
          {
            "type": "fields",
            "entries": [
              {
                "term": "Custom oxygen made each day · kg O₂/day",
                "description": "A fixed production rate. Water electrolysis consumes water and electricity to make oxygen."
              },
              {
                "term": "Energy needed to make oxygen · kWh/kg O₂",
                "description": "The custom electrical energy required per kilogram produced."
              },
              {
                "term": "Catalog design and unit count",
                "description": "Published reference output and power replace custom values. More units produce more oxygen, but also consume more power and feedwater."
              }
            ]
          }
        ]
      },
      {
        "type": "section",
        "title": "Water recycler",
        "technical": "Recovery fraction, processing capacity and wastewater",
        "blocks": [
          {
            "type": "fields",
            "entries": [
              {
                "term": "Water recovered · %",
                "description": "In custom mode, enter 93 for 93%. The engine stores this as 0.93. This simplified recovery has no processing-capacity limit."
              },
              {
                "term": "Water recycler power · kW",
                "description": "Custom electrical load when recovery is enabled."
              },
              {
                "term": "Catalog design and unit count",
                "description": "Selected equipment sets processing capacity, assumed recovery yield and installed power. Unprocessed wastewater waits in a queue."
              },
              {
                "term": "Wastewater and brine",
                "description": "The queue holds unprocessed feed. Processed feed splits into recovered usable water and unrecovered brine/losses. Queue storage is idealized."
              }
            ]
          }
        ]
      },
      {
        "type": "section",
        "title": "Other power needs",
        "technical": "Other habitat load · kW",
        "blocks": [
          {
            "type": "paragraph",
            "text": "This represents additional equipment demand such as lighting and electronics. It is a total design input; the model does not automatically itemize or scale every device."
          }
        ]
      },
      {
        "type": "note",
        "title": "More equipment is not always better.",
        "text": "Extra equipment can increase power demand enough to drain the battery sooner."
      }
    ]
  },
  {
    "name": "Cabin & temperature",
    "title": "Enough supplies is only part of the story.",
    "intro": "Optional checks look at selected cabin conditions. A check that is off has not passed—it has not been evaluated.",
    "next": "Read your results →",
    "content": [
      {
        "type": "section",
        "title": "Heating and cooling",
        "technical": "Conductance · target temperature · COP · installed capacity",
        "blocks": [
          {
            "type": "fields",
            "entries": [
              {
                "term": "Heat transfer through the habitat · kW/K",
                "description": "Conductance describes how easily heat passes through the habitat. Higher conductance means more heat transfer for the same temperature difference."
              },
              {
                "term": "Target indoor temperature · °C",
                "description": "The indoor temperature your design aims to maintain."
              },
              {
                "term": "Heating/cooling efficiency · COP",
                "description": "Thermal output per unit of electrical input. At COP 2, 3.2 kW thermal requires 1.6 kW electrical under the assumed conditions."
              },
              {
                "term": "Heating or cooling available · kW thermal",
                "description": "Total installed output, not electrical consumption. Enable capacity screening to compare it with the requirement. A capacity shortfall stops the run at hour zero."
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "Required heat transfer = conductance × temperature difference. This conduction-only model omits thermal inertia, internal heat and several environmental heat-transfer effects."
          }
        ]
      },
      {
        "type": "section",
        "title": "Cabin pressure and oxygen",
        "technical": "Static atmosphere screening",
        "blocks": [
          {
            "type": "fields",
            "entries": [
              {
                "term": "Air pressure inside · kPa absolute",
                "description": "Selected total cabin pressure, separate from the outside environmental pressure."
              },
              {
                "term": "Oxygen in cabin air · %",
                "description": "Dry oxygen percentage. The screen calculates dry and inspired oxygen partial pressure; these are not the same quantity."
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "These are fixed settings. No pressure regulator, leaks or makeup-gas model maintains them. Passing the selected criteria does not validate a pressure vessel."
          }
        ]
      },
      {
        "type": "section",
        "title": "Carbon dioxide buildup",
        "technical": "Free cabin volume · initial CO₂ · scrubber units",
        "blocks": [
          {
            "type": "fields",
            "entries": [
              {
                "term": "Air space inside · m³",
                "description": "The modeled well-mixed cabin air volume. It affects CO₂ concentration."
              },
              {
                "term": "Starting carbon dioxide · mmHg",
                "description": "Initial CO₂ partial pressure."
              },
              {
                "term": "Carbon dioxide cleaner and unit count",
                "description": "Selected scrubber reference and quantity. Enabled units add power and known hardware mass."
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "The screen checks the modeled one-hour mean against its selected CO₂ reference. The scrubber response curve and mixing assumptions remain simplified."
          }
        ]
      }
    ]
  },
  {
    "name": "Understand results",
    "title": "Read the outcome before the chart.",
    "intro": "The result describes the exact configuration used in that run. Editing a control does not recalculate it automatically.",
    "next": "Compare, ask & save →",
    "content": [
      {
        "type": "section",
        "title": "Checks completed or constraint reached",
        "technical": "Resource balance complete · evaluated hours",
        "blocks": [
          {
            "type": "fields",
            "entries": [
              {
                "term": "Resource balance completed",
                "description": "The scenario completed all requested hours without failing an enabled model check. Review disabled checks and limitations too."
              },
              {
                "term": "Resource constraint reached",
                "description": "A modeled check failed. Read the event to see the affected resource and hour."
              },
              {
                "term": "Evaluated hours",
                "description": "The run can stop before the requested duration. Hour-zero screening failures consume no supplies."
              }
            ]
          }
        ]
      },
      {
        "type": "section",
        "title": "Read the trends",
        "technical": "Hourly oxygen, usable water, battery and enabled cabin readings",
        "blocks": [
          {
            "type": "paragraph",
            "text": "An upward oxygen line means modeled production exceeds crew use. A declining water or battery line shows depletion. Look at the final reading and how much of the mission was evaluated."
          },
          {
            "type": "paragraph",
            "text": "Failed-hour inventory values can be clamped to zero. They are diagnostic balances, not evidence that equipment operated without its required water or electricity."
          }
        ]
      },
      {
        "type": "section",
        "title": "Warnings are different from failures",
        "technical": "Capacity warnings · disabled checks · stale results",
        "blocks": [
          {
            "type": "fields",
            "entries": [
              {
                "term": "A warning",
                "description": "May flag accumulating wastewater or an unevaluated check without stopping the run."
              },
              {
                "term": "A failure event",
                "description": "Identifies a stopping condition. Its hour is a model step, not a crew survival deadline."
              },
              {
                "term": "Inputs changed",
                "description": "The displayed result is outdated. Run again before interpreting it as your current design."
              }
            ]
          }
        ]
      },
      {
        "type": "section",
        "title": "Check the evidence",
        "technical": "Sources, assumptions and limitations",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Open the evidence section to distinguish published reference values from transferred equipment data and design assumptions. A NASA citation supporting one equation does not validate the entire habitat."
          }
        ]
      },
      {
        "type": "note",
        "title": "Power tip:",
        "text": "if demand exceeds continuous generation, the battery can cover the gap temporarily. A full battery does not make a permanent power deficit disappear."
      }
    ]
  },
  {
    "name": "Compare, ask & save",
    "title": "Explore a better design. Keep the evidence.",
    "intro": "Use the same calculation engine to compare equipment choices, ask for explanations and save your mission inputs.",
    "next": "Finish tutorial →",
    "content": [
      {
        "type": "section",
        "title": "Optimize and compare",
        "technical": "Bounded equipment-count search",
        "blocks": [
          {
            "type": "fields",
            "entries": [
              {
                "term": "Maximum units to try",
                "description": "Sets the inclusive search limit for oxygen and water units, plus CO₂ scrubbers when enabled. Zero units are included."
              },
              {
                "term": "No wastewater waiting at mission end",
                "description": "Optional requirement that rejects a candidate with an ending processing backlog."
              },
              {
                "term": "What stays fixed",
                "description": "Destination, crew, duration, supplies, power and thermal settings."
              },
              {
                "term": "What “best” means",
                "description": "Lowest known installed oxygen/water hardware mass, plus enabled CO₂ scrubber mass, among qualifying candidates in the selected search."
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "This excludes total mission mass and thermal hardware. “No feasible candidate” means none worked within these bounds; it does not mean every possible design was tested."
          }
        ]
      },
      {
        "type": "section",
        "title": "Ask the AI mission designer",
        "technical": "Goal → validated calculation → review → Apply",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Describe a goal such as “evaluate this mission without changing my supplies.” Gemini can request supported simulations or equipment searches. Python calculates the outcomes."
          },
          {
            "type": "paragraph",
            "text": "Review the proposed differences before clicking Apply. Apply updates the manual configuration with the evaluated proposal. Changing your goal or inputs makes an older proposal stale."
          },
          {
            "type": "paragraph",
            "text": "Your goal and mission settings are sent to Google Gemini. AI prose can be mistaken; the calculated audit and evidence remain the basis for review. Live AI features require backend configuration."
          }
        ]
      },
      {
        "type": "section",
        "title": "Save, load and share",
        "technical": "Browser mission library · JSON import/export",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Save a named snapshot of your input settings in this browser. Export JSON to back it up or share it. Import a file and review it before loading."
          },
          {
            "type": "paragraph",
            "text": "Loading replaces current inputs and clears old results; run a fresh evaluation. Saves do not include results or API keys. Browser storage is local to the device/profile and can be cleared."
          }
        ]
      },
      {
        "type": "note",
        "title": "You’re ready to explore.",
        "text": "Start with one mission, change one thing, run again, and ask why the result changed. Reopen this guide anytime from Mission Lab help."
      }
    ]
  }
];
