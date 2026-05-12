---
slug: mode-7-floor
name: Mode-7 Floor
status: built
description: A tilted ground plane rendered with per-scanline affine transformation — the texture stretches and shears toward the horizon. SNES Mode-7 hardware made this trivial; software emulations work the same way. F-Zero (1990), Mario Kart (1992), Pilotwings.
parameters:
  - { type: float, id: tilt_deg,       min: 15, max: 80,  default: 45,  unit: deg, label: tilt }
  - { type: float, id: forward_speed,  min: 30, max: 300, default: 120, unit: u/s, label: forward-speed }
  - { type: float, id: turn_rate,      min: 0,  max: 2,   default: 0.3, unit: r/s, label: turn-rate }
  - { type: enum,  id: pattern,        options: [checker, grid, radial], default: checker, label: pattern }
in_the_wild:
  - { applied: f-zero-mode-7,     note: "The original use — SNES Mode-7 rotates and scales a single background plane per scanline to render a tilted track that shears toward the horizon." }
  - { applied: outrun-pseudo-3d,  note: "OutRun precedes Mode-7 hardware but builds the same illusion in software: a tilted ground plane assembled from per-scanline scaled strips." }
code_anchor: public/d/perspective/mode-7-floor.js
---
