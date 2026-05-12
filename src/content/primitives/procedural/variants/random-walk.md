---
slug: random-walk
name: Random Walk
status: built
description: Each step picks a random direction; the trail carves caves or corridors.
parameters:
  - { type: int,   id: walker_count,    min: 1, max: 8,  default: 3,  unit: '', label: walkers }
  - { type: int,   id: step_size,       min: 1, max: 8,  default: 3,  unit: px, label: step-size }
  - { type: float, id: regen_interval,  min: 5, max: 30, default: 15, unit: s,  label: regen-interval }
in_the_wild:
  - { applied: dune-2-rts-base, note: "Westwood 1992 — sandworm spawn positions and patrol drift were sampled by a directional random walk across the map's open-sand tiles, giving each mission a unique threat distribution despite a fixed layout." }
  - { applied: populous-terraform, note: "Bullfrog 1989 — the early prototype seeded coastline detail with multi-walker drift across a tile grid before the height-raising rules ran, producing the irregular island outlines the final game shipped with." }
code_anchor: public/d/procedural/random-walk.js
---
