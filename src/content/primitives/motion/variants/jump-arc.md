---
slug: jump-arc
name: Jump-Arc
status: built
description: Vertical impulse + constant gravity; the platformer parabola. On ground hit, snap and reset vy.
parameters:
  - { type: float, id: gravity,            min: 200, max: 1500, default: 800, unit: u/s², label: gravity }
  - { type: float, id: jump_velocity,      min: 200, max: 800,  default: 450, unit: u/s,  label: jump-velocity }
  - { type: float, id: auto_jump_interval, min: 0.5, max: 2,    default: 0.9, unit: s,    label: jump-interval }
in_the_wild:
  - { applied: mario-platform-arc, note: "Miyamoto 1985 — fixed gravity, fixed initial vy on the jump button; the entire moveset is this primitive with horizontal control layered on top." }
  - { applied: donkey-kong-platform-arc, note: "Miyamoto 1981 — Jumpman's hop is a discrete fixed-height arc with no horizontal mid-air control; same equations, fewer knobs." }
code_anchor: public/d/motion/jump-arc.js
---
