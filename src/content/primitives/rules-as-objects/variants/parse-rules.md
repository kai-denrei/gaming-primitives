---
slug: parse-rules
name: Parse Rules
status: built
description: Word-tile arrangements on the grid are parsed into active rules each tick.
parameters:
  - { type: float, id: mutation_interval, min: 1, max: 4, default: 2, unit: s, label: mutation-interval }
  - { type: int,   id: rule_count,        min: 1, max: 3, default: 2,            label: target-rules }
in_the_wild:
  - { applied: baba-is-you-rewrite, note: "Hempuli 2019 — `NOUN IS PROP` triplets are reparsed every step; the rule list is the world's source of truth." }
code_anchor: public/d/rules-as-objects/parse-rules.js
---
