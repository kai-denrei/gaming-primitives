---
slug: identity-grid
name: Identity Grid
status: built
description: Entities have hidden roles deduced by the player from constrained observations.
parameters:
  - { type: int,   id: cell_count,      min: 6, max: 16, default: 9, unit: '', label: cells }
  - { type: int,   id: feature_count,   min: 2, max: 5,  default: 3, unit: '', label: features }
  - { type: float, id: reveal_interval, min: 1, max: 4,  default: 2, unit: s,  label: reveal-interval }
in_the_wild:
  - { applied: obra-dinn-identity-grid, note: "Lucas Pope 2018 — the manifest displays 60 crew members; the player narrows identity, fate, and cause one constrained clue at a time." }
  - { applied: wordle-letter-deduce,    note: "Josh Wardle 2021 — each guess reveals a per-letter constraint (green/yellow/grey); the hidden word is deduced from accumulated feedback." }
code_anchor: public/d/information-asymmetry/identity-grid.js
---
