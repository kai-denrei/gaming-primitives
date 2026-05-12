---
slug: stickiness
name: Stickiness
status: built
description: Passive adhesion on contact; detaches only when applied force exceeds a bond threshold.
parameters:
  - { type: float, id: bond_strength, min: 0,  max: 1,   default: 0.6, label: bond-strength }
  - { type: int,   id: entity_count,  min: 2,  max: 10,  default: 5,   label: agents }
  - { type: float, id: entity_speed,  min: 30, max: 300, default: 150, unit: u/s,  label: entity-speed }
  - { type: float, id: gravity,       min: 0,  max: 400, default: 100, unit: u/s², label: gravity }
in_the_wild:
  - { applied: worms-bazooka-wind, note: "Sticky bombs cling to terrain on contact; only sufficient blast or accumulated force shakes them loose." }
code_anchor: public/d/pressure/stickiness.js
---
