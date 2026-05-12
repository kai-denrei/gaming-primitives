---
slug: slot-claim-race
name: Slot-Claim Race
status: built
description: A moving evaluator passes through ordered slots; both parties race to claim each slot with finite tokens; final tally determines the duel outcome. The Paradroid takeover primitive.
parameters:
  - { type: int,   id: cell_count,    min: 6, max: 14, default: 10,           label: cell-count }
  - { type: float, id: pulse_period,  min: 4, max: 15, default: 8,  unit: s,  label: pulse-period }
  - { type: float, id: ai_aggression, min: 0, max: 1,  default: 0.6,          label: ai-aggression }
  - { type: float, id: player_skill,  min: 0, max: 1,  default: 0.7,          label: player-skill }
in_the_wild:
  - { applied: paradroid-takeover, note: "The canonical case — a central column of logic-gate cells with a descending pulse pointer; the player and the host droid race to commit influence into each cell before the pulse locks it, final tally decides the takeover." }
code_anchor: public/d/duel/slot-claim-race.js
---
