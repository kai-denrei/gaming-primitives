---
slug: line-of-sight
name: Line-of-Sight
status: built
description: NPC moves toward the target only while an unobstructed ray exists between them.
parameters:
  - { type: int,   id: obstacle_count, min: 3,   max: 12,  default: 6,             label: obstacles }
  - { type: float, id: view_range,     min: 100, max: 400, default: 250, unit: u,  label: view-range }
  - { type: float, id: agent_speed,    min: 30,  max: 300, default: 100, unit: u/s, label: wanderer-speed }
in_the_wild:
  - { applied: doom-bsp-arena, note: "id 1993 — imps and demons only wake when the BSP ray from their bounding box to the player clears all walls; the engine's LOS query is the same primitive the renderer uses." }
  - { applied: resident-evil-fixed-cam-survival, note: "Capcom 1996 — zombies in a room engage only after a scripted LOS volume around the door is broken; off-screen enemies wait for the trigger ray instead of pathing blind." }
code_anchor: public/d/pathfinding/line-of-sight.js
---
