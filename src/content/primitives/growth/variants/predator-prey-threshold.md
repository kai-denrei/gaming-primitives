---
slug: predator-prey-threshold
name: Predator-Prey Threshold
status: built
description: Color or marker on each entity signals its trophic relationship to the player — prey (smaller), peer (similar), predator (larger). The label updates live as the player's size changes.
parameters:
  - { type: float, id: start_size,         min: 4,    max: 30,  default: 12,    unit: r, label: start-size }
  - { type: int,   id: entity_count,       min: 5,    max: 30,  default: 14,             label: entities }
  - { type: float, id: prey_threshold,     min: 0.6,  max: 0.95, default: 0.85,          label: prey-threshold }
  - { type: float, id: predator_threshold, min: 1.05, max: 1.4,  default: 1.15,          label: predator-threshold }
in_the_wild:
  - { applied: pacman-power-pellet, note: "Power pellet flips the trophic threshold globally — ghosts become prey for a timed window, then snap back to predator." }
  - { applied: osmos-mass-absorb,   note: "Every mote is colored by its size relative to the player; the field recolors live as the player grows or shrinks past each neighbor's mass." }
  - { applied: flow-evolve-tier,    note: "Tier progression rewrites which creatures are prey vs predator; the same neighbor flips its trophic label when the player's tier advances." }
code_anchor: public/d/growth/predator-prey-threshold.js
---
