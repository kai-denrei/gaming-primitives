---
slug: combo-streak
name: Combo Streak
status: built
description: Sequential success accumulates a multiplier; a miss resets the streak.
parameters:
  - { type: int,   id: bpm,             min: 60, max: 200,  default: 120, unit: bpm, label: tempo }
  - { type: float, id: success_rate,    min: 0,  max: 1,    default: 0.85,            label: success-rate }
  - { type: int,   id: decay_ms,        min: 0,  max: 3000, default: 0,   unit: ms,  label: decay }
  - { type: int,   id: bonus_threshold, min: 5,  max: 50,   default: 10,              label: bonus-threshold }
in_the_wild:
  - { applied: ddr-step-grid,             note: "Consecutive PERFECTs build a combo counter; a single MISS drops it to zero — the genre-defining streak loop." }
  - { applied: vampire-survivors-evolve,  note: "Kill-streak and pickup-chain meters accumulate multipliers across the run; a death or break drops them." }
  - { applied: slay-the-spire-deck-run,   note: "Combo-card archetypes scale linearly with consecutive plays in a turn; ending the chain resets the stack." }
code_anchor: public/d/rhythm/combo-streak.js
---
