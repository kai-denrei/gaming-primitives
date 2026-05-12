---
slug: grip-hold
name: Grip Hold
status: built
description: Entity adheres to a surface while input is sustained; releases on input drop or stamina expiry, preserving (or shedding) velocity.
parameters:
  - { type: float, id: stamina_max,       min: 1, max: 10,  default: 4,   unit: s,   label: stamina-max }
  - { type: float, id: regen_rate,        min: 0, max: 2,   default: 0.5, unit: /s,  label: regen-rate }
  - { type: float, id: release_velocity,  min: 0, max: 400, default: 200, unit: u/s, label: release-velocity }
in_the_wild:
  - { applied: tomb-raider-tank-controls, note: "Ledge-grab in Tomb Raider — finite grip-time; release shoves Lara off the wall with whatever horizontal momentum she had." }
code_anchor: public/d/pressure/grip-hold.js
---
