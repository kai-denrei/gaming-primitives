---
slug: defuse-sequence
name: Defuse Sequence
status: built
description: A coded sequence with conditional rules; player must input the correct response based on observed bomb state before the timer expires. Keep Talking and Nobody Explodes.
parameters:
  - { type: float, id: timer_seconds,      min: 8, max: 30, default: 15, unit: s, label: timer-seconds }
  - { type: enum,  id: module_difficulty,  options: ['simple','medium','hard'], default: 'medium', label: difficulty }
  - { type: float, id: auto_skill,         min: 0, max: 1,  default: 0.8,         label: auto-skill }
in_the_wild:
  - { applied: ktane-bomb-defuse, note: "The canonical case — a bomb with a countdown timer and modules whose correct input depends on a conditional rule sheet keyed to other observable bomb properties; the player resolves the rules and inputs the sequence before the timer hits zero." }
code_anchor: public/d/timed-puzzle/defuse-sequence.js
---
