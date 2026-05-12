---
slug: angled-grind
name: Angled Grind
status: built
description: Acute-angle slide along a surface attaches the entity to a rail state and preserves speed within an angle tolerance window.
parameters:
  - { type: float, id: angle_tolerance, min: 0,   max: 30,  default: 15,  unit: deg, label: angle-tolerance }
  - { type: float, id: entity_speed,    min: 100, max: 500, default: 300, unit: u/s, label: entity-speed }
  - { type: float, id: rail_friction,   min: 0,   max: 1,   default: 0.1, unit: /s,  label: rail-friction }
in_the_wild:
  - { applied: lode-runner-dig-fall, note: "Hand-over-hand bars in Lode Runner — only a near-horizontal approach attaches; off-angle falls past the bar." }
code_anchor: public/d/pressure/angled-grind.js
---
