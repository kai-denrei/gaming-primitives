---
slug: bounce
name: Bounce
status: built
description: Position clamped at the edge; the velocity component normal to that edge is reflected. The Pong wall.
parameters:
  - { type: int,   id: agents,    min: 1,   max: 32,  default: 12,  label: agents }
  - { type: float, id: speed,     min: 30,  max: 300, default: 120, unit: u/s, label: speed }
  - { type: float, id: jitter,    min: 0,   max: 1,   default: 0.2, label: heading-jitter }
in_the_wild:
  - { applied: qix-area-claim, note: "The Qix segment bounces off non-VOID cells; per-bounce angle perturbation prevents periodic orbits." }
code_anchor: public/d/topology/bounce.js
---
