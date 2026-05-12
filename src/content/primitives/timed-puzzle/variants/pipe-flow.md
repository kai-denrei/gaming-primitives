---
slug: pipe-flow
name: Pipe Flow
status: built
description: A grid of rotatable pipe tiles. Water advances from a source and must reach a sink before flowing out a dead end. Player rotates tiles ahead of the flow front. Pipe Dream, Bioshock hacking, Watch Dogs.
parameters:
  - { type: int,   id: grid_w,    min: 5,   max: 10, default: 8,                label: grid-w }
  - { type: int,   id: grid_h,    min: 4,   max: 8,  default: 6,                label: grid-h }
  - { type: float, id: flow_rate, min: 0.3, max: 3,  default: 1.2, unit: "t/s", label: flow-rate }
  - { type: float, id: auto_skill, min: 0,  max: 1,  default: 0.75,             label: auto-skill }
in_the_wild:
  - { applied: bioshock-hack-pipes, note: "The canonical case — a rectangular grid of pipe tiles with a fluid front advancing from a source; the player rotates tiles ahead of the front to route water into the sink before time expires." }
code_anchor: public/d/timed-puzzle/pipe-flow.js
---
