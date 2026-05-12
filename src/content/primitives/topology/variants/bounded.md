---
slug: bounded
name: Bounded
status: built
description: Position clamped at the edges. Velocity is zeroed on contact — the wall stops you dead. The maze rule.
parameters:
  - { type: int,   id: agents,    min: 1,   max: 32,  default: 12,  label: agents }
  - { type: float, id: speed,     min: 30,  max: 300, default: 120, unit: u/s, label: speed }
  - { type: float, id: jitter,    min: 0,   max: 1,   default: 0.2, label: heading-jitter }
in_the_wild:
  - { applied: qix-area-claim,            note: "Marker walks the 1-cell-thick boundary; void clamps motion." }
  - { applied: boulder-dash-falling-rocks, note: "Cave walls clamp the rover." }
code_anchor: public/d/topology/bounded.js
---
