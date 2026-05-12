---
slug: mass-expel-propulsion
name: Mass-Expel Propulsion
status: built
description: Entity expels mass to gain velocity (Newton's third law). Lost mass shrinks the entity but accelerates it; the expelled mass is recoverable as field debris.
parameters:
  - { type: float, id: start_size,       min: 15,  max: 40,   default: 25,   unit: r,   label: start-size }
  - { type: float, id: expel_fraction,   min: 0.005, max: 0.05, default: 0.02,           label: expel-fraction }
  - { type: float, id: expel_velocity,   min: 100, max: 500,  default: 250,  unit: u/s, label: expel-velocity }
  - { type: int,   id: mote_count,       min: 3,   max: 15,   default: 8,               label: motes }
in_the_wild:
  - { applied: osmos-mass-absorb,        note: "Movement is exclusively by expelling small mass at high velocity in the opposite direction; the cost-to-move is the central tension." }
  - { applied: asteroids-rotate-thrust,  note: "Thrust is the same Newton's-3rd-law trade — exhaust mass leaves the ship; the ship gains velocity in the opposing direction. Mass loss is implicit fuel here, explicit in osmos." }
  - { applied: lunar-lander-thrust,      note: "Burning fuel imparts an opposing velocity vector on the lander; mass-loss-for-velocity is the literal mechanism." }
code_anchor: public/d/growth/mass-expel-propulsion.js
---
