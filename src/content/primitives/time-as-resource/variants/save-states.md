---
slug: save-states
name: Save States
status: built
description: Player snapshots full game state on demand and restores it later.
parameters:
  - { type: float, id: save_interval, min: 3, max: 8,  default: 5,  unit: s, label: save-interval }
  - { type: float, id: load_interval, min: 6, max: 15, default: 10, unit: s, label: load-interval }
in_the_wild:
  - { applied: dark-souls-bonfire-recovery, note: "FromSoftware 2011 — resting at a bonfire writes a durable snapshot of inventory and progress that the next death restores from." }
  - { applied: braid-time-rewind, note: "Number None 2008 — the recorded buffer is, in effect, a continuously refreshed sequence of micro-snapshots the player can load any frame of." }
code_anchor: public/d/time-as-resource/save-states.js
---
