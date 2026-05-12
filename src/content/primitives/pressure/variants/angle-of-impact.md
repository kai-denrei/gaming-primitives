---
slug: angle-of-impact
name: Angle of Impact
status: built
description: Velocity vector and surface normal determine reflection, penetration, or energy retained on contact.
parameters:
  - { type: float, id: surface_angle, min: -60, max: 60,  default: 30,   unit: deg, label: surface-angle }
  - { type: float, id: ball_speed,    min: 50,  max: 400, default: 200,  unit: u/s, label: ball-speed }
  - { type: float, id: elasticity,    min: 0,   max: 1,   default: 0.85, label: elasticity }
in_the_wild:
  - { applied: pinball-flipper-deflect, note: "Flipper tip-vs-base contact angle decides whether the ball ramps up or dribbles back to the drain." }
  - { applied: pong-paddle-volley,      note: "Vertical impact offset on the paddle synthesizes a surface angle — controls return trajectory." }
  - { applied: breakout-paddle-reflect, note: "Paddle curvature maps contact x-offset to an outgoing angle; same vector-reflection math, parameterized." }
code_anchor: public/d/pressure/angle-of-impact.js
---
