---
slug: non-euclidean
name: Non-Euclidean
status: built
description: Local geometry is consistent but the global metric violates Euclidean axioms.
parameters:
  - { type: float, id: rotation_per_step, min: 0,  max: 0.5, default: 0.15, unit: rad/u, label: rotation-per-step }
  - { type: float, id: agent_speed,       min: 30, max: 200, default: 100,  unit: u/s,   label: speed }
in_the_wild:
  - { applied: patrick-parabox-nested, note: "Bremer 2022 — a room placed inside itself produces a global metric that no Euclidean embedding satisfies; the player navigates the contradiction." }
code_anchor: public/d/nested-spaces/non-euclidean.js
---
