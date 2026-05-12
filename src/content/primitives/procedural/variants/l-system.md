---
slug: l-system
name: L-System
status: built
description: Iteratively rewrite a string by production rules; interpret it as turtle graphics.
parameters:
  - { type: int,   id: iterations,      min: 1,  max: 6,  default: 4,  unit: '',   label: iterations }
  - { type: float, id: angle_deg,       min: 10, max: 60, default: 25, unit: deg,  label: branch-angle }
  - { type: float, id: regen_interval,  min: 5,  max: 15, default: 8,  unit: s,    label: regen-interval }
in_the_wild:
  - { applied: populous-terraform, note: "Bullfrog 1989 — forest growth around the player's settlement is rule-driven expansion of a seed tile, the spirit of an L-system rewrite step applied to a tile grid each game-tick." }
code_anchor: public/d/procedural/l-system.js
---
