---
slug: click-to-move
name: Click-to-Move
status: built
description: A destination is picked; the entity walks toward it at constant speed along a straight path.
parameters:
  - { type: float, id: move_speed,                 min: 50, max: 400, default: 200, unit: u/s, label: move-speed }
  - { type: float, id: destination_change_period,  min: 1,  max: 4,   default: 2,   unit: s,   label: destination-period }
in_the_wild:
  - { applied: dune-2-rts-base, note: "Westwood 1992 — units selected, point clicked, harvesters and tanks pathfind to the waypoint at constant speed; the genre-defining input scheme." }
  - { applied: lemmings-assign-roles, note: "DMA 1991 — lemmings walk forward until a role-assigned action interrupts; click-to-move generalises to the role-assign primitive when destinations are replaced with verbs." }
code_anchor: public/d/motion/click-to-move.js
---
