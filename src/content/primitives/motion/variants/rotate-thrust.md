---
slug: rotate-thrust
name: Rotate-Thrust
status: built
description: Inertial heading + thrust along facing; velocity decays as v *= exp(-k·dt). The Asteroids family.
parameters:
  - { type: float, id: rot_rate, min: 0.5, max: 6,   default: 3.2, unit: rad/s, label: rotation-rate }
  - { type: float, id: thrust,   min: 50,  max: 400, default: 200, unit: u/s²,  label: thrust }
  - { type: float, id: friction, min: 0,   max: 2,   default: 0.6, unit: 1/s,   label: friction }
in_the_wild:
  - { applied: asteroids-rotate-thrust, note: "Logg 1979 — the canonical implementation; rotate left/right, thrust forward, no friction at all (the open-space variant)." }
  - { applied: lunar-lander-thrust, note: "Atari 1979 — same rotate-thrust kernel applied vertically against constant gravity; the thrust knob is now a fuel budget." }
  - { applied: space-taxi-precision-thrust, note: "Springer 1984 — rotate-thrust under gravity with tight corridors; demands sub-pixel velocity control to land on platforms." }
code_anchor: public/d/motion/rotate-thrust.js
---
