---
slug: circle
name: Circle
status: built
description: Two circles overlap when distance between centres is less than the sum of radii.
parameters:
  - { type: int,   id: circle_count, min: 2,  max: 10,  default: 5,   unit: '',   label: circle-count }
  - { type: float, id: speed,        min: 30, max: 300, default: 100, unit: u/s, label: speed }
in_the_wild:
  - { applied: breakout-paddle-reflect, note: "Atari 1976 — the ball is treated as a disk and bricks as boxes; ball-vs-ball variants use the radius-sum distance test." }
  - { applied: pinball-flipper-deflect, note: "physical pinball simulations — the ball is the canonical circle, and bumpers test circle-circle distance for hit detection." }
code_anchor: public/d/collision/circle.js
---
