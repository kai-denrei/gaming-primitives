---
slug: waypoint
name: Waypoint
status: built
description: NPC steers to a sequence of designer-placed nodes in order.
parameters:
  - { type: int,   id: waypoint_count, min: 3, max: 10,  default: 5,             label: waypoints }
  - { type: float, id: agent_speed,    min: 30, max: 300, default: 120, unit: u/s, label: speed }
in_the_wild:
  - { applied: pacman-power-pellet, note: "Namco 1980 — the four ghosts each follow a tile-graph waypoint loop in scatter mode; chase mode swaps the target tile but the routing primitive is identical." }
  - { applied: doom-bsp-arena, note: "id 1993 — patrol monsters wake into a state machine that walks the next waypoint tile of the BSP sector graph until line-of-sight to the player flips them to chase." }
code_anchor: public/d/pathfinding/waypoint.js
---
