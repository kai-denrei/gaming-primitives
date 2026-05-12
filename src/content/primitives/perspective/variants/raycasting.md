---
slug: raycasting
name: Raycasting
status: built
description: One ray cast per screen column finds the first wall hit on a 2D grid; the wall slab is drawn at a height inversely proportional to hit distance. Smooth heading rotation, depth-shaded walls. Wolfenstein 3D (1992) is the canonical case; Catacomb 3D and Doom build on this scaffold.
parameters:
  - { type: float, id: fov_deg,         min: 45,  max: 120, default: 70,  unit: deg, label: fov }
  - { type: int,   id: ray_count,       min: 32,  max: 200, default: 100,            label: ray-count }
  - { type: float, id: move_speed,      min: 0.5, max: 5,   default: 1.8, unit: c/s, label: move-speed }
  - { type: float, id: rotation_speed,  min: 0.3, max: 3,   default: 1.0, unit: r/s, label: rotation-speed }
in_the_wild:
  - { applied: wolfenstein-3d-raycast,    note: "The canonical case — one ray per screen column on a 2D grid, hit distance determines wall slab height, smooth heading rotation around a fixed-height camera." }
  - { applied: doom-bsp-arena,            note: "Doom replaces the uniform grid with a BSP-partitioned world, but the per-column wall-slab projection is the same primitive scaled up." }
  - { applied: dungeon-master-fireball,   note: "The Atari ST / DOS port renders dungeon walls as raycast slabs, with the grid corridors acting as the world geometry the rays sample." }
code_anchor: public/d/perspective/raycasting.js
---
