---
slug: cascade-clear-rush
name: Cascade Clear Rush
status: built
description: Falling blocks must be cleared by row-completion or pattern matching; drop speed accelerates with progress; failure on stack overflow. Tetris, Dr Mario, Puyo Puyo.
parameters:
  - { type: int,   id: board_width,    min: 6,   max: 12, default: 10,             label: board-width }
  - { type: float, id: initial_speed,  min: 0.3, max: 2,  default: 0.7, unit: "b/s", label: initial-speed }
  - { type: float, id: speed_ramp,     min: 0,   max: 2,  default: 0.4,             label: speed-ramp }
  - { type: float, id: auto_skill,     min: 0,   max: 1,  default: 0.75,            label: auto-skill }
in_the_wild:
  - { applied: tetris-line-clear, note: "The canonical case — tetrominoes fall onto a fixed-width board; the player rotates and slides each piece to complete horizontal rows which then clear; drop speed accelerates with line count and the run ends when a new piece can no longer spawn." }
code_anchor: public/d/timed-puzzle/cascade-clear-rush.js
---
