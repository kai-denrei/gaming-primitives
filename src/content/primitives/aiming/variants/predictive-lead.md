---
slug: predictive-lead
name: Predictive Lead
status: built
description: Aim at where the target will be, not where it is.
parameters:
  - { type: float, id: projectile_speed, min: 100, max: 600, default: 300, unit: u/s, label: projectile-speed }
  - { type: float, id: target_speed,     min: 30,  max: 300, default: 120, unit: u/s, label: target-speed }
in_the_wild:
  - { applied: worms-bazooka-wind, note: "Team17 1995 — the targeting reticle requires the player to lead the shot against gravity and wind drift." }
  - { applied: robotron-twin-stick, note: "Vid Kidz 1982 — experienced players manually lead moving Grunts because projectile travel time is non-trivial across the screen." }
code_anchor: public/d/aiming/predictive-lead.js
---
