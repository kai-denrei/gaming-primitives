---
slug: separating-axis
name: Separating-Axis
status: built
description: Test for a separating hyperplane between two convex shapes.
parameters:
  - { type: int,   id: poly_a_size, min: 3,  max: 8,   default: 5,   unit: '',  label: poly-a-vertices }
  - { type: int,   id: poly_b_size, min: 3,  max: 8,   default: 4,   unit: '',  label: poly-b-vertices }
  - { type: float, id: speed,       min: 30, max: 300, default: 100, unit: u/s, label: speed }
in_the_wild:
  - { applied: pinball-flipper-deflect, note: "the flipper is a convex polygon and the ball is treated as a polygon-approximated disk; SAT handles the non-axis-aligned contact." }
  - { applied: qix-area-claim, note: "Taito 1981 — Qix-traced regions are convex sub-polygons; SAT tests resolve intersection of player path with claimed boundaries." }
code_anchor: public/d/collision/separating-axis.js
---
