---
slug: push-tiles
name: Push Tiles
status: built
description: Player movement pushes adjacent objects if the cell behind them is clear.
parameters:
  - { type: int,   id: block_count,    min: 1,   max: 6,   default: 3,   label: blocks }
  - { type: float, id: move_interval,  min: 0.3, max: 1.5, default: 0.6, unit: s, label: move-interval }
in_the_wild:
  - { applied: baba-is-you-rewrite, note: "Hempuli 2019 — pushing word-tiles and noun-tiles is the core verb of the game." }
  - { applied: lode-runner-dig-fall, note: "Smith 1983 — gold and enemies obey block-pushed-into-empty-cell rules adjacent to the tile grid." }
code_anchor: public/d/rules-as-objects/push-tiles.js
---
