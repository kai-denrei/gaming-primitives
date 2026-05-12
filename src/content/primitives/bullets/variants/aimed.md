---
slug: aimed
name: Aimed
status: built
description: Bullet velocity equals shooter facing × speed. The vector is sampled at fire-time.
parameters:
  - { type: float, id: fire_rate,  min: 0.5, max: 20, default: 4, unit: /s, label: fire-rate }
  - { type: enum,  id: aim_target, options: ['moving','random'], default: 'moving', label: aim-mode }
in_the_wild:
  - { applied: space-invaders-vertical-shot, note: "Nishikado 1978 — invader bombs sample the cannon column at drop-time and fall straight; not aimed in the modern sense but the same fire-time-sample idiom." }
  - { applied: robotron-twin-stick, note: "Vid Kidz 1982 — the right stick sets a continuous aim vector; bullets inherit that vector at the moment of spawn." }
code_anchor: public/d/bullets/aimed.js
---
