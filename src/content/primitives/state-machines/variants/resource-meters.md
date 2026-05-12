---
slug: resource-meters
name: Resource Meters
status: built
description: Scalar pools (HP, mana, stamina) drain and refill under defined rules.
parameters:
  - { type: float, id: regen_rate,      min: 0.1, max: 2, default: 0.5, unit: /s, label: regen-rate }
  - { type: float, id: drain_interval,  min: 1,   max: 4, default: 2,   unit: s,  label: drain-interval }
  - { type: int,   id: meter_count,     min: 2,   max: 5, default: 3,             label: meters }
in_the_wild:
  - { applied: dark-souls-bonfire-recovery, note: "FromSoftware 2011 — HP, stamina and FP each tick independently; stamina regen pauses while attacking, and resting at a bonfire refills every pool while resetting the world state." }
  - { applied: slay-the-spire-deck-run, note: "Mega Crit 2019 — energy refills to 3 each turn while HP carries between fights; the two pools running at different cadences create the run's tension curve." }
code_anchor: public/d/state-machines/resource-meters.js
---
