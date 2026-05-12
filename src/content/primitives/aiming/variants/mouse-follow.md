---
slug: mouse-follow
name: Mouse-Follow
status: built
description: Aim vector points from the firer toward the cursor's world position each frame.
parameters:
  - { type: float, id: aim_smoothing, min: 0,  max: 1,   default: 0,   label: smoothing }
  - { type: float, id: target_speed,  min: 30, max: 300, default: 100, unit: u/s, label: target-speed }
in_the_wild:
  - { applied: robotron-twin-stick, note: "Vid Kidz 1982 — the right stick supplies a fire direction vector that the player aims continuously, the analog ancestor of mouse-look." }
code_anchor: public/d/aiming/mouse-follow.js
---
