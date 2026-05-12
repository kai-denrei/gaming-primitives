---
slug: hitscan
name: Hitscan
status: built
description: No projectile entity. A ray is cast at fire-time and resolved on the same frame. Travel time is zero.
parameters:
  - { type: float, id: fire_rate,     min: 0.5,  max: 10,  default: 2,    unit: /s, label: fire-rate }
  - { type: float, id: beam_duration, min: 0.05, max: 0.5, default: 0.15, unit: s,  label: beam-flash }
in_the_wild:
  - { applied: doom-bsp-arena, note: "id 1993 — the pistol, shotgun and chaingun all hitscan; the trace traverses the BSP and resolves damage on the same frame the shot is pressed." }
  - { applied: resident-evil-fixed-cam-survival, note: "Capcom 1996 — combat weapons are functionally hitscan; the aim cone resolves to a die-roll on a list of zombie hitboxes the same frame the trigger is pulled." }
code_anchor: public/d/bullets/hitscan.js
---
