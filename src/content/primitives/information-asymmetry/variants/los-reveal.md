---
slug: los-reveal
name: Line-of-Sight Reveal
status: built
description: A tile is visible only while an unobstructed ray reaches it from the player.
parameters:
  - { type: float, id: wall_density,  min: 0,  max: 0.4, default: 0.15, unit: '',   label: wall-density }
  - { type: float, id: viewer_speed,  min: 30, max: 200, default: 100,  unit: px/s, label: viewer-speed }
  - { type: float, id: cone_angle,    min: 30, max: 180, default: 90,   unit: deg,  label: cone-angle }
in_the_wild:
  - { applied: doom-bsp-arena, note: "id 1993 — the BSP-driven renderer only draws what the player's view frustum can ray-trace to; walls hard-occlude everything behind them." }
  - { applied: resident-evil-fixed-cam-survival, note: "Capcom 1996 — pre-rendered fixed cameras frame the room so threats lurk just past the cone of the lens; off-camera enemies are heard before they are seen." }
code_anchor: public/d/information-asymmetry/los-reveal.js
---
