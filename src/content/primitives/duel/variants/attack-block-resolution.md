---
slug: attack-block-resolution
name: Attack-Block Resolution
status: built
description: One side declares attackers, the other declares blockers, then damage resolves simultaneously per pairing. Magic the Gathering combat, Hearthstone trades.
parameters:
  - { type: int,   id: attacker_count,     min: 2, max: 6, default: 4,           label: attacker-count }
  - { type: int,   id: blocker_count,      min: 1, max: 5, default: 3,           label: blocker-count }
  - { type: float, id: round_period,       min: 3, max: 8, default: 5, unit: s,  label: round-period }
  - { type: float, id: creature_variance,  min: 0, max: 1, default: 0.4,         label: creature-variance }
in_the_wild:
  - { applied: slay-the-spire-deck-run, note: "Per-turn play resolves attack and block values simultaneously per pairing — block soaks damage, surplus carries through to life total. Same primitive expressed via cards instead of permanents." }
code_anchor: public/d/duel/attack-block-resolution.js
---
