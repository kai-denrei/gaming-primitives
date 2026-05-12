---
slug: linear
name: Linear
status: built
description: Position integrates velocity each tick; no acceleration, no friction.
parameters:
  - { type: float, id: speed,                    min: 30, max: 400, default: 150, unit: u/s, label: speed }
  - { type: float, id: direction_change_period,  min: 1,  max: 8,   default: 3,   unit: s,   label: reroll-period }
in_the_wild:
  - { applied: space-invaders-vertical-shot, note: "Nishikado 1978 — invader formation drifts at constant velocity; speed is the only motion parameter that changes as ranks thin." }
  - { applied: pong-paddle-volley, note: "Alcorn 1972 — the ball is pure constant velocity between reflections; the entire game is linear motion plus edge cases." }
code_anchor: public/d/motion/linear.js
---
