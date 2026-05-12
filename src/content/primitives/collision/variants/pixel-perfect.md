---
slug: pixel-perfect
name: Pixel-Perfect
status: built
description: Per-pixel mask overlap check after bounding-box prefilter.
parameters:
  - { type: int,   id: sprite_count, min: 2,  max: 5,   default: 3,   unit: '',  label: sprite-count }
  - { type: float, id: speed,        min: 30, max: 300, default: 100, unit: u/s, label: speed }
in_the_wild:
  - { applied: space-invaders-vertical-shot, note: "Nishikado 1978 — the bullet's hit on an invader required true sprite-mask collision because the shapes are non-rectangular." }
  - { applied: doom-bsp-arena, note: "id 1993 — sprite enemies sampled per-pixel for hit detection at the projectile's tile so visible silhouette equals hit shape." }
code_anchor: public/d/collision/pixel-perfect.js
---
