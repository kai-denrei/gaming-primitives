---
slug: a-star-grid
name: A* Grid
status: built
description: A* search over a 4- or 8-connected grid using a heuristic cost-to-go.
parameters:
  - { type: float, id: wall_density, min: 0,  max: 0.4, default: 0.2,         label: wall-density }
  - { type: int,   id: cell_size,    min: 16, max: 40,  default: 24, unit: px, label: cell-size }
in_the_wild:
  - { applied: dune-2-rts-base, note: "Westwood 1992 — selected harvesters and tanks resolve a tile-graph route to the clicked cell; sand tiles cost less than rock, and the heuristic drives the genre-defining click-to-move feel." }
  - { applied: lemmings-assign-roles, note: "DMA 1991 — when a Lemming is assigned Builder or Basher the engine projects a short A*-equivalent walk along the modified terrain grid to test whether the role can complete." }
code_anchor: public/d/pathfinding/a-star-grid.js
---
