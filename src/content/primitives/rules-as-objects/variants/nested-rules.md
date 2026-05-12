---
slug: nested-rules
name: Nested Rules
status: built
description: Rule-objects can themselves contain sub-rules that apply within their scope.
parameters:
  - { type: float, id: mutation_interval, min: 1.5, max: 5, default: 3,  unit: s, label: mutation-interval }
  - { type: int,   id: chain_depth,       min: 2,   max: 4, default: 3,           label: chain-depth }
in_the_wild:
  - { applied: baba-is-you-rewrite, note: "Hempuli 2019 — meta-rules like `TEXT IS PUSH` or `X IS Y` chains resolve transitively into what is YOU." }
code_anchor: public/d/rules-as-objects/nested-rules.js
---
