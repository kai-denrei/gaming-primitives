---
slug: aabb
name: AABB
status: built
description: Axis-aligned bounding box overlap test on min/max in x and y.
parameters:
  - { type: int,   id: box_count, min: 2,  max: 8,   default: 4,   unit: '',   label: box-count }
  - { type: float, id: speed,     min: 30, max: 300, default: 100, unit: u/s, label: speed }
in_the_wild:
  - { applied: mario-platform-arc, note: "Nintendo 1985 — Mario's hitbox is a rectangle; collisions against blocks and enemies resolve as axis-aligned overlap." }
  - { applied: pong-paddle-volley, note: "Atari 1972 — paddle and ball are both axis-aligned rectangles; intersection is the canonical AABB test." }
code_anchor: public/d/collision/aabb.js
---
