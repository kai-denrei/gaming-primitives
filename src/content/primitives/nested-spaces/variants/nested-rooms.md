---
slug: nested-rooms
name: Nested Rooms
status: built
description: A room contains another room of the same type; descent reuses the same geometry.
parameters:
  - { type: int,   id: nesting_depth,  min: 1, max: 6,   default: 3,                label: depth }
  - { type: float, id: inner_scale,    min: 0.2, max: 0.6, default: 0.45,           label: inner-scale }
  - { type: float, id: rotation_rate,  min: 0,   max: 1,   default: 0.2, unit: rad/s, label: rotation-rate }
in_the_wild:
  - { applied: patrick-parabox-nested, note: "Bremer 2022 — every room is itself a pushable block that contains the puzzle space; the recursion is the mechanic." }
code_anchor: public/d/nested-spaces/nested-rooms.js
---
