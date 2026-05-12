---
slug: mutate-rules
name: Mutate Rules
status: built
description: Player rearranges rule-tiles to change the world's laws between ticks.
parameters:
  - { type: float, id: mutation_interval, min: 1, max: 4, default: 2, unit: s, label: mutation-interval }
in_the_wild:
  - { applied: baba-is-you-rewrite, note: "Hempuli 2019 — swapping the subject in `X IS YOU` retargets control to a different tile, which is the puzzle." }
code_anchor: public/d/rules-as-objects/mutate-rules.js
---
