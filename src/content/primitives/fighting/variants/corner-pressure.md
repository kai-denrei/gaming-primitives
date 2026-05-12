---
slug: corner-pressure
name: Corner Pressure
status: built
description: Positional dynamics in a bounded arena. The attacker pushes the defender toward a stage edge; cornered defender has fewer escape options and smaller counter windows.
parameters:
  - { type: float, id: stage_width,           min: 400, max: 760, default: 600, unit: px, label: stage-width }
  - { type: float, id: pressure_strength,     min: 0.3, max: 2,   default: 1.0,           label: pressure-strength }
  - { type: float, id: corner_disadvantage,   min: 0,   max: 1,   default: 0.5,           label: corner-disadvantage }
in_the_wild:
  - { applied: warrior-melee,          note: "The canonical case — a bounded ledge with the abyss at either side. The aggressor pushes the defender toward the edge, where retreat ends in a fall. Pure positional pressure with no special escape." }
  - { applied: street-fighter-special, note: "The corner is the most expensive piece of real estate in any 2D fighter; wake-up reversals, counter-windows, and meter all collapse when the back is against the wall." }
code_anchor: public/d/fighting/corner-pressure.js
---
