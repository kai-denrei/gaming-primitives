---
slug: timing-window
name: Timing Window
status: built
description: Input graded by proximity to a target event time — perfect / good / miss bands sized in milliseconds.
parameters:
  - { type: int,   id: bpm,               min: 60, max: 200, default: 120, unit: bpm, label: tempo }
  - { type: int,   id: perfect_window_ms, min: 20, max: 150, default: 50,  unit: ms,  label: perfect-window }
  - { type: int,   id: good_window_ms,    min: 100, max: 400, default: 150, unit: ms, label: good-window }
  - { type: float, id: auto_skill,        min: 0,  max: 1,   default: 0.7,             label: auto-skill }
in_the_wild:
  - { applied: ddr-step-grid,                 note: "PERFECT / GREAT / GOOD / MISS bands are millisecond windows around each arrow's target time — the canonical case." }
  - { applied: pacman-power-pellet,           note: "Eating a ghost mid-pellet requires being inside the fear-window — a coarse perfect/good/miss against the pellet's countdown." }
  - { applied: pinball-flipper-deflect,       note: "A flipper tap is graded by proximity to the ball — early/perfect/late determines launch angle and energy." }
  - { applied: dark-souls-bonfire-recovery,   note: "Parries and i-frame rolls live or die by sub-frame timing windows around the enemy strike." }
code_anchor: public/d/rhythm/timing-window.js
---
