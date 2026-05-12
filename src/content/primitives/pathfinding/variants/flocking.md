---
slug: flocking
name: Flocking
status: built
description: Each agent combines separation, alignment, and cohesion forces from its neighbours.
parameters:
  - { type: int,   id: agent_count,        min: 5, max: 50, default: 25,        label: agents }
  - { type: float, id: align_weight,       min: 0, max: 2,  default: 1,         label: align }
  - { type: float, id: cohesion_weight,    min: 0, max: 2,  default: 1,         label: cohesion }
  - { type: float, id: separation_weight,  min: 0, max: 2,  default: 1.5,       label: separation }
in_the_wild:
  - { applied: dune-2-rts-base, note: "Westwood 1992 — when several units route to the same waypoint they spread out via separation against neighbours; the alignment and cohesion forces give the formation a recognisable column." }
  - { applied: vampire-survivors-evolve, note: "Poncle 2022 — late-game enemy hordes use cheap boids-style steering so hundreds of zombies stay legible as a wave instead of stacking on a single pixel." }
code_anchor: public/d/pathfinding/flocking.js
---
