---
slug: eight-directional
name: Eight-Directional
status: built
description: Heading snaps to 8 compass directions from key input; constant speed along the active axis.
parameters:
  - { type: float, id: speed,              min: 30,  max: 400, default: 150, unit: u/s, label: speed }
  - { type: float, id: auto_change_period, min: 0.4, max: 3,   default: 1.0, unit: s,   label: reroll-period }
in_the_wild:
  - { applied: pacman-power-pellet, note: "Iwatani 1980 — Pac-Man's grid-locked motion is 4-directional in practice but the input model is the 8-dir ancestor: snap heading, integrate at fixed speed." }
  - { applied: robotron-twin-stick, note: "Jarvis 1982 — left stick drives the player at constant speed along 8 cardinal/diagonal headings; right stick separately fires." }
code_anchor: public/d/motion/eight-directional.js
---
