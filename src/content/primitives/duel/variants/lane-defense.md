---
slug: lane-defense
name: Lane Defense
status: built
description: Parallel lanes with static defenders and advancing attackers; the defender places units under a resource economy; the attacker spawns waves. Plants vs Zombies, Castle defense.
parameters:
  - { type: int,   id: lane_count,             min: 3,   max: 6, default: 5,                label: lane-count }
  - { type: float, id: attacker_spawn_rate,    min: 0.3, max: 2, default: 0.8, unit: "/s",  label: attacker-spawn }
  - { type: float, id: defender_fire_rate,     min: 0.5, max: 3, default: 1.2, unit: "/s",  label: defender-fire }
  - { type: float, id: defender_economy_rate,  min: 0.5, max: 3, default: 1.5, unit: "/s",  label: economy-rate }
in_the_wild:
  - { applied: plants-vs-zombies-lane, note: "The canonical case — horizontal lanes with zombies marching left from the right edge, plants placed at the left under a sun-economy budget firing projectiles down their lane until an attacker reaches the house." }
code_anchor: public/d/duel/lane-defense.js
---
