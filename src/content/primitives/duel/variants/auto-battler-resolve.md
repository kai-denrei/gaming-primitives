---
slug: auto-battler-resolve
name: Auto-Battler Resolve
status: built
description: Two teams of units face off; combat runs as a deterministic simulation tick-by-tick. The Auto Chess / Teamfight Tactics combat phase.
parameters:
  - { type: int,    id: team_size,     min: 3, max: 7,  default: 5,             label: team-size }
  - { type: float,  id: tick_rate,     min: 1, max: 10, default: 4, unit: "/s", label: tick-rate }
  - { type: float,  id: unit_variance, min: 0, max: 1,  default: 0.3,           label: unit-variance }
  - { type: toggle, id: auto_restart,                   default: true,          label: auto-restart, on_label: "on", off_label: "off" }
in_the_wild:
  - { applied: slay-the-spire-deck-run,   note: "Card combat resolves as a deterministic tick of attack/block/damage values for each side — the same auto-resolve pattern with a card-driven loadout instead of a pre-placed team." }
  - { applied: vampire-survivors-evolve,  note: "Player and enemy units exchange damage on a fixed tick with no manual targeting; the run resolves itself once weapons and HP are wired in, exactly the auto-battler simulation pattern." }
code_anchor: public/d/duel/auto-battler-resolve.js
---
