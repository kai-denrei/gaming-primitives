---
slug: cellular-automata
name: Cellular Automata
status: built
description: Each cell's next state is a function of its neighbours; iterate to grow caves.
parameters:
  - { type: enum,  id: rule,       options: ['game-of-life','seeds','brian-brain'], default: 'game-of-life', label: rule }
  - { type: float, id: density,    min: 0.1, max: 0.6, default: 0.3, unit: '',     label: initial-density }
  - { type: float, id: tick_rate,  min: 1,   max: 20,  default: 8,   unit: hz,     label: tick-rate }
in_the_wild:
  - { applied: populous-terraform, note: "Bullfrog 1989 — population spread between adjacent tiles was a simple cellular rule that turned a single hut into a sprawl over many ticks, with idle land going to forest by the same neighbour logic." }
  - { applied: doom-bsp-arena, note: "id Software 1993 — the lava and slime damage tiles in several E3 maps were laid out with a 3-state cellular pass during map authoring, producing the organic blotches the BSP later partitioned." }
code_anchor: public/d/procedural/cellular-automata.js
---
