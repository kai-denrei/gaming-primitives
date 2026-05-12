---
slug: chain-segment
name: Chain Segment
status: built
description: Entity is a chain of segments following the head. Eating food appends a segment at the tail; collision with self or wall ends the run.
parameters:
  - { type: int,   id: grid_size,        min: 12, max: 30, default: 20,            label: grid-size }
  - { type: float, id: speed,            min: 2,  max: 15, default: 6,  unit: c/s, label: speed }
  - { type: int,   id: growth_per_food,  min: 1,  max: 5,  default: 1,             label: growth-per-food }
  - { type: int,   id: food_count,       min: 1,  max: 5,  default: 2,             label: food-count }
in_the_wild:
  - { applied: snake-eat-grow,  note: "The canonical chain — head follows input, body trails through cells the head occupied; tail grows by one segment per food." }
  - { applied: qix-area-claim,  note: "The drawn line is a tail-as-hazard: returning to it before closing the polygon kills the player, same self-collision rule as a snake." }
code_anchor: public/d/growth/chain-segment.js
---
