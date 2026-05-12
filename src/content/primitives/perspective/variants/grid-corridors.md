---
slug: grid-corridors
name: Grid Corridors
status: built
description: Cell-snap navigation on a 2D maze grid; first-person view rendered as nested rectangles per cell of forward depth. 90° turns, no smooth heading. The earliest FPS primitive — Maze War (1973), Dungeon Master (1987), Eye of the Beholder.
parameters:
  - { type: int,   id: maze_size,      min: 8,   max: 20, default: 12,           label: maze-size }
  - { type: float, id: wall_density,   min: 0,   max: 0.5, default: 0.25,        label: wall-density }
  - { type: float, id: move_interval,  min: 0.3, max: 2,   default: 0.6, unit: s, label: move-interval }
  - { type: int,   id: draw_distance,  min: 4,   max: 10,  default: 6,           label: draw-distance }
in_the_wild:
  - { applied: maze-war-corridor,        note: "The canonical case — discrete cell movement, 90° turns, first-person view drawn as a stack of receding rectangles per cell of forward depth." }
  - { applied: dungeon-master-fireball,  note: "The dungeon is a grid of corridors and rooms; party steps cell by cell with 90° rotation and renders the world as nested wall slabs ahead." }
code_anchor: public/d/perspective/grid-corridors.js
---
