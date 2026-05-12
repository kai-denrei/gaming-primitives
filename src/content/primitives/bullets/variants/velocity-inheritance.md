---
slug: velocity-inheritance
name: Velocity Inheritance
status: built
description: Bullet velocity = muzzle vector ± firing-platform velocity. The Logg-vs-Jarvis choice.
parameters:
  - { type: toggle, id: inherit,       default: false, on_label: on, off_label: off, label: inherit-shooter-velocity }
  - { type: float,  id: shooter_speed, min: 30, max: 200, default: 80, unit: u/s,    label: shooter-speed }
in_the_wild:
  - { applied: asteroids-rotate-thrust, note: "Logg 1979 — bullets are muzzle-frame only; the player's drift does not propagate, so backwards-fire-while-coasting is the standard tactic." }
  - { applied: defender-radar-rescue, note: "Jarvis 1981 — bullets inherit the ship's lateral velocity, which is why holding thrust while firing extends effective range forward." }
code_anchor: public/d/bullets/velocity-inheritance.js
---
