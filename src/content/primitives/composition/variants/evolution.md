---
slug: evolution
name: Evolution
status: built
description: Items level up or transform into more powerful forms via threshold conditions.
parameters:
  - { type: int,    id: stage_count,    min: 3,   max: 6, default: 4,   unit: '',     label: stages }
  - { type: toggle, id: branch_toggle,  default: false, on_label: branching, off_label: linear, label: shape }
  - { type: float,  id: level_speed,    min: 0.2, max: 2, default: 0.6, unit: lvl/s,  label: level-speed }
in_the_wild:
  - { applied: vampire-survivors-evolve, note: "Poncle 2022 — a max-rank weapon paired with the right passive transforms once into a fixed evolved form; the path is linear per pair, with no branching." }
  - { applied: slay-the-spire-deck-run, note: "Mega Crit 2019 — most cards have a single upgrade step; a few key cards offer a two-way upgrade branch, making the upgrade graph mostly linear with sparse forks." }
code_anchor: public/d/composition/evolution.js
---
