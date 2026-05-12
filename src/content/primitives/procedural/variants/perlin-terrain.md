---
slug: perlin-terrain
name: Perlin Terrain
status: built
description: Sample Perlin/Simplex noise across a 2D grid to produce smooth heightmaps.
parameters:
  - { type: int,   id: octaves,         min: 1,     max: 6,    default: 4,    unit: '', label: octaves }
  - { type: float, id: frequency,       min: 0.005, max: 0.05, default: 0.02, unit: '', label: frequency }
  - { type: float, id: regen_interval,  min: 4,     max: 20,   default: 8,    unit: s,  label: regen-interval }
in_the_wild:
  - { applied: populous-terraform, note: "Bullfrog 1989 — random-height base maps were smoothed by repeated neighbour-averaging, a single-octave value-noise equivalent that produced the rolling islands players raised and lowered." }
  - { applied: worms-bazooka-wind, note: "Team17 1995 — destructible cave maps were built by thresholding a multi-octave noise field, then carving silhouettes; the same field drives the wind-strength readout players see each turn." }
code_anchor: public/d/procedural/perlin-terrain.js
---
