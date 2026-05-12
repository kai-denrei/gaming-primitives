---
slug: mitosis
name: Mitosis
status: built
description: Entity splits in two when above a size threshold; both halves carry half the mass. Splitting doubles reach but halves survivability. Optional merge timer rejoins the halves.
parameters:
  - { type: float, id: start_size,           min: 20,  max: 50,  default: 30,   unit: r,   label: start-size }
  - { type: float, id: split_velocity,       min: 80,  max: 400, default: 200,  unit: u/s, label: split-velocity }
  - { type: float, id: merge_timer,          min: 2,   max: 10,  default: 5,    unit: s,   label: merge-timer }
  - { type: float, id: auto_split_interval,  min: 3,   max: 15,  default: 7,    unit: s,   label: split-interval }
in_the_wild:
  - { applied: osmos-mass-absorb,  note: "The player can split into two motes that retain half-mass and inherit opposing momentum — same conservation rule and merge-on-contact follow-up." }
  - { applied: flow-evolve-tier,   note: "Some tier creatures fission when struck or when mass exceeds a threshold; halves drift independently and can re-merge." }
code_anchor: public/d/growth/mitosis.js
---
