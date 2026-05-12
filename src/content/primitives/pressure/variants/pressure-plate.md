---
slug: pressure-plate
name: Pressure Plate
status: built
description: Sustained weight on a tile triggers a state change — door, trap, switch — with optional latching or momentary release.
parameters:
  - { type: int,    id: weight_threshold, min: 1, max: 5,  default: 1,   label: weight-threshold }
  - { type: float,  id: hold_duration,    min: 0, max: 2,  default: 0.4, unit: s, label: hold-duration }
  - { type: toggle, id: latching,         default: false,  on_label: "latching",   off_label: "momentary",  label: mode }
  - { type: int,    id: entity_count,     min: 1, max: 10, default: 4,   label: agents }
in_the_wild:
  - { applied: tomb-raider-tank-controls, note: "Floor-plate puzzles in Tomb Raider — Lara must stand for a beat to unlock the next room; some latch after first trip." }
code_anchor: public/d/pressure/pressure-plate.js
---
