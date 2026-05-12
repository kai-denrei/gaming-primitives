---
slug: homing
name: Homing
status: built
description: Each bullet steers toward its nearest target with rate-limited rotation. Curvature falls with target distance perpendicular to heading.
parameters:
  - { type: float, id: turn_rate,    min: 0.5, max: 6,   default: 2,   unit: rad/s, label: turn-rate }
  - { type: float, id: bullet_speed, min: 100, max: 400, default: 200, unit: u/s,   label: bullet-speed }
  - { type: int,   id: target_count, min: 1,   max: 3,   default: 1,                label: targets }
in_the_wild:
  - { applied: vampire-survivors-evolve, note: "Poncle 2022 — several evolved projectiles (Vento Sacro, Holy Wand variants) curve to acquire the nearest enemy, modulated by a per-weapon turn rate." }
code_anchor: public/d/bullets/homing.js
---
