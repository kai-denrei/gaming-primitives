---
slug: slot-fit
name: Slot Fit
status: built
description: Items occupy a bounded grid; placement is constrained by shape and adjacency.
parameters:
  - { type: int,   id: slot_count,    min: 4,   max: 16, default: 8,   unit: '', label: slot-count }
  - { type: int,   id: item_count,    min: 2,   max: 20, default: 6,   unit: '', label: item-pool }
  - { type: enum,  id: algo,          options: ['greedy','first-fit'], default: 'greedy', label: algo }
  - { type: float, id: tick_interval, min: 0.4, max: 2,  default: 0.8, unit: s,  label: tick-interval }
in_the_wild:
  - { applied: slay-the-spire-deck-run, note: "Mega Crit 2019 — relics fit into a single linear strip with a soft cap; each pickup is appended where it can fit, mirroring first-fit placement." }
  - { applied: vampire-survivors-evolve, note: "Poncle 2022 — six weapon slots and six passive slots are filled greedily in chest-drop order; once full, only upgrades to existing items are offered." }
code_anchor: public/d/composition/slot-fit.js
---
