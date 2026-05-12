---
slug: status-effects
name: Status Effects
status: built
description: Time-bounded modifiers stack on an entity and alter its stats or behaviour.
parameters:
  - { type: float, id: effect_interval, min: 1, max: 4, default: 2, unit: s, label: effect-interval }
  - { type: int,   id: agent_count,     min: 1, max: 6, default: 3,          label: agents }
in_the_wild:
  - { applied: slay-the-spire-deck-run, note: "Mega Crit 2019 — Poison, Weak, Vulnerable, Strength, Frail and a few dozen more all live as stackable `{type, amount, duration}` rows on the actor; every card and relic just edits that list." }
  - { applied: dark-souls-bonfire-recovery, note: "FromSoftware 2011 — bleed, poison, toxic, curse and frostbite each accumulate a hidden meter then trigger a fixed DoT window; the visible debuff icon mirrors the underlying timed-effect record." }
code_anchor: public/d/state-machines/status-effects.js
---
