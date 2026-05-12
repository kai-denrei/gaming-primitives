---
slug: lifetime
name: Lifetime
status: built
description: Each bullet expires after a fixed TTL. Effective range equals speed times lifetime.
parameters:
  - { type: float, id: lifetime,     min: 0.2, max: 3,   default: 1,   unit: s,   label: lifetime }
  - { type: float, id: bullet_speed, min: 100, max: 600, default: 300, unit: u/s, label: bullet-speed }
in_the_wild:
  - { applied: asteroids-rotate-thrust, note: "Logg 1979 — each shot lives for a fixed number of frames; max range is bounded to roughly half the playfield, forcing closer engagement." }
code_anchor: public/d/bullets/lifetime.js
---
