---
slug: fixed-direction
name: Fixed Direction
status: built
description: Bullets fire along a constant world-frame vector regardless of target position. The Space Invaders cannon.
parameters:
  - { type: float, id: fire_rate,    min: 0.5, max: 20,  default: 4,   unit: /s,  label: fire-rate }
  - { type: float, id: bullet_speed, min: 100, max: 600, default: 300, unit: u/s, label: bullet-speed }
in_the_wild:
  - { applied: space-invaders-vertical-shot, note: "Nishikado 1978 — the player's cannon fires a single bullet straight up the screen; no aim, no spread, no inheritance." }
code_anchor: public/d/bullets/fixed-direction.js
---
