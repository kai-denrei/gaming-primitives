---
slug: gravity-affected
name: Gravity-Affected
status: built
description: Projectile follows a parabola under constant downward acceleration. Range and apex follow ballistic equations.
parameters:
  - { type: float, id: gravity,       min: 50,  max: 600, default: 250, unit: u/s², label: gravity }
  - { type: float, id: initial_speed, min: 200, max: 500, default: 350, unit: u/s,  label: muzzle-speed }
  - { type: float, id: launch_angle,  min: 20,  max: 80,  default: 60,  unit: deg,  label: launch-angle }
in_the_wild:
  - { applied: worms-bazooka-wind, note: "Team17 1995 — the bazooka projectile is a textbook parabola; aim and power resolve to initial vector, gravity does the rest." }
  - { applied: defender-of-the-crown-catapult, note: "Cinemaware 1986 — siege catapult shots follow a 2D parabola; the player tunes a single launch angle and watches the arc." }
code_anchor: public/d/bullets/gravity-affected.js
---
