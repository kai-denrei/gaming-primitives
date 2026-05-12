---
slug: drag-friction
name: Drag / Friction
status: built
description: Velocity decays as v *= exp(-k·dt); periodic impulses inject momentum that glides to a stop.
parameters:
  - { type: float, id: friction,         min: 0,   max: 2,   default: 0.6, unit: 1/s, label: friction }
  - { type: float, id: impulse_interval, min: 0.5, max: 3,   default: 1.5, unit: s,   label: impulse-interval }
  - { type: float, id: impulse_strength, min: 50,  max: 400, default: 200, unit: u/s, label: impulse-strength }
in_the_wild:
  - { applied: lunar-lander-thrust, note: "Atari 1979 — when thrust is off the lander still carries inertia; the friction coefficient here is effectively zero in vacuum, but the integration scheme is identical." }
  - { applied: asteroids-rotate-thrust, note: "Logg 1979 — the ship's frictionless drift is this primitive with k=0; arcade tuning relies on the player adding their own counter-thrust." }
code_anchor: public/d/motion/drag-friction.js
---
