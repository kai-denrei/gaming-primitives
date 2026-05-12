---
slug: follow-cursor
name: Follow-Cursor
status: built
description: Position lerps toward a target each frame. Demo target orbits in a figure-8; pointer overrides if available.
parameters:
  - { type: float,  id: lerp_factor, min: 0.02, max: 0.5, default: 0.1, unit: '',   label: lerp-factor }
  - { type: toggle, id: auto_path,   default: true,  on_label: auto, off_label: pointer, label: target-source }
in_the_wild:
  - { applied: vampire-survivors-evolve, note: "Galante 2022 — the player auto-fires while moving; positional control is a soft lerp toward the stick or pointer, which is what makes the swarm legible at high projectile counts." }
code_anchor: public/d/motion/follow-cursor.js
---
