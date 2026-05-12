---
slug: rotation-rate-limited
name: Rotation-Rate Limited
status: built
description: Aim heading rotates toward the desired angle capped at a maximum radians/sec.
parameters:
  - { type: float, id: rotation_rate, min: 0.5, max: 6.0, default: 2.0, unit: rad/s, label: rotation-rate }
  - { type: float, id: target_speed,  min: 30,  max: 300, default: 100, unit: u/s,   label: target-speed }
in_the_wild:
  - { applied: asteroids-rotate-thrust, note: "Logg 1979 — the ship's heading turns at a fixed angular velocity; the player cannot snap-aim and must anticipate rotation lag." }
code_anchor: public/d/aiming/rotation-rate-limited.js
---
