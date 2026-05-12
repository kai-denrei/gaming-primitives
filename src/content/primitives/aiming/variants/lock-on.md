---
slug: lock-on
name: Lock-On
status: built
description: Once acquired, the aim vector tracks a specific target until lost or released.
parameters:
  - { type: float, id: lock_range,   min: 50, max: 400, default: 200, unit: u,   label: lock-range }
  - { type: int,   id: target_count, min: 1,  max: 5,   default: 3,              label: targets }
  - { type: float, id: target_speed, min: 30, max: 300, default: 100, unit: u/s, label: target-speed }
in_the_wild:
  - { applied: vampire-survivors-evolve, note: "Poncle 2022 — most weapons auto-acquire the nearest enemy inside range, so the player never chooses a heading themselves." }
code_anchor: public/d/aiming/lock-on.js
---
