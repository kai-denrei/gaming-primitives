---
slug: multi-lane
name: Multi-Lane
status: built
description: Multiple parallel timing lanes. Notes scroll along separate columns toward a shared target line; player must hit each column's note within its window. The DDR / Guitar Hero / Beat Saber primitive.
parameters:
  - { type: int,   id: bpm,           min: 60, max: 220, default: 120, unit: bpm, label: tempo }
  - { type: int,   id: lanes,         min: 2,  max: 6,   default: 4,                label: lanes }
  - { type: float, id: note_density,  min: 0.1, max: 1,  default: 0.5,              label: note-density }
  - { type: float, id: auto_skill,    min: 0,  max: 1,   default: 0.85,             label: auto-skill }
in_the_wild:
  - { applied: ddr-step-grid,             note: "The canonical 4-lane vertical note highway. Arrows scroll on-tempo; each lane has its own perfect/good/miss window evaluated independently." }
  - { applied: vampire-survivors-evolve,  note: "Survival 'lanes' are weapon cooldowns firing in parallel — each weapon is its own auto-resolved column hitting its target tick." }
  - { applied: pacman-power-pellet,       note: "Four ghosts on independent timers act as four parallel timing windows the player must read simultaneously." }
code_anchor: public/d/rhythm/multi-lane.js
---
