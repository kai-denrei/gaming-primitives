---
slug: pattern-match-race
name: Pattern-Match Race
status: built
description: A grid of colored items; swap adjacent pairs to form runs of three or more which clear and cascade; race against a depleting time bar. Bejeweled Blitz, Candy Crush time mode.
parameters:
  - { type: int,   id: grid_size,    min: 6,  max: 10, default: 8,             label: grid-size }
  - { type: int,   id: gem_colors,   min: 4,  max: 7,  default: 6,             label: gem-colors }
  - { type: float, id: time_seconds, min: 30, max: 120, default: 60, unit: s,  label: time-seconds }
  - { type: float, id: auto_skill,   min: 0,  max: 1,  default: 0.75,          label: auto-skill }
in_the_wild: []
code_anchor: public/d/timed-puzzle/pattern-match-race.js
---
