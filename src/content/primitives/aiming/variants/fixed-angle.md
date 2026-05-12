---
slug: fixed-angle
name: Fixed Angle
status: built
description: Weapon points along a constant heading, independent of target position.
parameters:
  - { type: float, id: angle_deg,    min: -180, max: 180, default: 0,   unit: deg, label: angle }
  - { type: float, id: target_speed, min: 30,   max: 300, default: 100, unit: u/s, label: target-speed }
in_the_wild:
  - { applied: space-invaders-vertical-shot, note: "Nishikado 1978 — the player cannon fires only straight up; the heading is hard-coded." }
  - { applied: defender-of-the-crown-catapult, note: "Cinemaware 1986 — catapult fires at a preset arc; the player adjusts power, not angle." }
code_anchor: public/d/aiming/fixed-angle.js
---
