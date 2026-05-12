---
slug: spread-n
name: Spread-N
status: built
description: N bullets fan out within an arc on each shot. Coverage in exchange for per-bullet density.
parameters:
  - { type: int,   id: bullet_count, min: 1,   max: 16,  default: 5,  label: bullets-per-shot }
  - { type: float, id: spread_arc,   min: 5,   max: 180, default: 60, unit: deg, label: spread-arc }
  - { type: float, id: fire_rate,    min: 0.5, max: 10,  default: 2,  unit: /s,  label: fire-rate }
in_the_wild:
  - { applied: robotron-twin-stick, note: "Vid Kidz 1982 — certain weapon power-ups widen the bullet pattern to a multi-shot fan in the aim direction." }
  - { applied: vampire-survivors-evolve, note: "Poncle 2022 — evolved weapons such as the Phieraggi fire a procedural fan whose count and arc scale with level." }
code_anchor: public/d/bullets/spread-n.js
---
