---
slug: frame-trade
name: Frame Trade
status: built
description: Both fighters strike at near-simultaneous time; the strike with faster startup and better priority lands while the loser eats the hit. Frame data and hitbox priority decide the exchange.
parameters:
  - { type: int,   id: p1_startup,   min: 2,   max: 20, default: 8,            label: p1-startup }
  - { type: int,   id: p2_startup,   min: 2,   max: 20, default: 8,            label: p2-startup }
  - { type: float, id: p1_priority,  min: 0,   max: 1,  default: 0.5,          label: p1-priority }
  - { type: float, id: auto_pace,    min: 0.5, max: 3,  default: 1.0, unit: "/s", label: auto-pace }
in_the_wild:
  - { applied: warrior-melee,            note: "The canonical case — two stick-figure swordfighters in the Atari 2600 cabinet trade strikes; whichever sword extends first lands the hit. Naive frame-trade with no priority tiebreaker — pure reach + timing." }
  - { applied: exploding-fist-karate,    note: "Each karate stance has a published startup frame count; players who pre-empt with the faster move land first. Trades resolve cleanly: loser eats the hit, winner unscathed." }
  - { applied: street-fighter-special,   note: "Frame-data culture begins. Every normal attack has a published startup, and the faster startup wins simultaneous exchanges; priority on hitbox-vs-hurtbox overlap breaks ties." }
code_anchor: public/d/fighting/frame-trade.js
---
