---
slug: follow-leader
name: Follow-Leader
status: built
description: Each NPC steers toward the position of the unit ahead of it in the chain.
parameters:
  - { type: float, id: leader_speed,    min: 30, max: 300, default: 120, unit: u/s, label: leader-speed }
  - { type: int,   id: follower_count,  min: 1,  max: 6,   default: 3,              label: followers }
  - { type: int,   id: follow_distance, min: 30, max: 120, default: 60,  unit: u,   label: gap }
in_the_wild:
  - { applied: lemmings-assign-roles, note: "DMA 1991 — a Lemming chain walks single-file off a spawner; each member follows the one ahead by one tile until a role-assigned action breaks the line." }
  - { applied: pacman-power-pellet, note: "Namco 1980 — collected eaten-pellet trails are not used in canon, but the conga-line frightened ghosts in arcade ports use this exact chain primitive." }
code_anchor: public/d/pathfinding/follow-leader.js
---
