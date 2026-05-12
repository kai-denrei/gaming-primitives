---
slug: lerp
name: Lerp
status: built
description: Camera position interpolates toward the target with a smoothing factor.
parameters:
  - { type: float, id: lerp_factor, min: 0.02, max: 0.5, default: 0.1, label: lerp-factor }
  - { type: float, id: world_speed, min: 30,   max: 300, default: 120, unit: u/s, label: world-speed }
in_the_wild:
  - { applied: mario-platform-arc, note: "Nintendo 1985 — later Mario titles soften the hard-lock into a low-pass interpolation; the camera trails the player by a few frames." }
  - { applied: vampire-survivors-evolve, note: "Poncle 2022 — the camera smoothly chases the omnidirectional player; abrupt jumps would break the bullet-hell legibility." }
code_anchor: public/d/camera/lerp.js
---
