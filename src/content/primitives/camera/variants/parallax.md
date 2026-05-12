---
slug: parallax
name: Parallax
status: built
description: Background layers scroll at fractions of foreground speed to fake depth.
parameters:
  - { type: float, id: bg_factor,   min: 0,  max: 1,   default: 0.3, label: bg-factor }
  - { type: float, id: mid_factor,  min: 0,  max: 1,   default: 0.6, label: mid-factor }
  - { type: float, id: world_speed, min: 30, max: 300, default: 120, unit: u/s, label: world-speed }
in_the_wild:
  - { applied: donkey-kong-platform-arc, note: "Nintendo 1981 — the arcade had no parallax, but Donkey Kong Country (1994) used multi-layer parallax to add depth to a 2D plane." }
  - { applied: pacman-power-pellet, note: "Namco 1980 — Pac-Man is single-layer, but the maze backdrop in later sequels and ports introduced depth cues via parallax bands." }
code_anchor: public/d/camera/parallax.js
---
