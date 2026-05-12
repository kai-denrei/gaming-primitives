---
slug: eat-smaller
name: Eat Smaller
status: built
description: Entity absorbs anything strictly smaller than itself; grows by a fraction of the absorbed mass. The core of the growth loop.
parameters:
  - { type: float, id: start_size,     min: 4,  max: 30,  default: 10,   unit: r,    label: start-size }
  - { type: int,   id: prey_count,     min: 5,  max: 40,  default: 15,                label: prey-count }
  - { type: float, id: growth_factor,  min: 0,  max: 1,   default: 0.85,              label: growth-factor }
  - { type: float, id: pursuit_speed,  min: 30, max: 300, default: 80,   unit: u/s,  label: pursuit-speed }
in_the_wild:
  - { applied: osmos-mass-absorb,   note: "The exact mechanic — touch a strictly smaller mote to absorb it, growing by a fraction of its mass." }
  - { applied: flow-evolve-tier,    note: "Each tier's prey are creatures smaller than the player; contact absorbs them and advances growth toward the next tier." }
  - { applied: snake-eat-grow,      note: "Food is a degenerate 'smaller blob' — touching it appends a fixed-mass segment to the head." }
code_anchor: public/d/growth/eat-smaller.js
---
