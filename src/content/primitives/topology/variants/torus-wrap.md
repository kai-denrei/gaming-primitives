---
slug: torus-wrap
name: Torus-Wrap
status: built
description: Position wraps modulo the playfield edge. Left edge ↔ right edge, top ↔ bottom. The Asteroids playfield.
parameters:
  - { type: int,   id: agents,    min: 1,   max: 32,  default: 12,  label: agents }
  - { type: float, id: speed,     min: 30,  max: 300, default: 120, unit: u/s, label: speed }
  - { type: float, id: jitter,    min: 0,   max: 1,   default: 0.2, label: heading-jitter }
in_the_wild:
  - { applied: asteroids-rotate-thrust, note: "Logg 1979 — entire playfield wraps; collisions use toroidal distance." }
code_anchor: public/d/topology/torus-wrap.js
---
