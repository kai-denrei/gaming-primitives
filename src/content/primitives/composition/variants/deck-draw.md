---
slug: deck-draw
name: Deck Draw
status: built
description: Player draws N cards from the top of the deck into a working hand each turn.
parameters:
  - { type: int,   id: deck_size,     min: 10, max: 40, default: 20, unit: '',  label: deck-size }
  - { type: int,   id: hand_max,      min: 3,  max: 10, default: 5,  unit: '',  label: hand-max }
  - { type: int,   id: draw_per_turn, min: 1,  max: 5,  default: 2,  unit: '',  label: draw/turn }
  - { type: float, id: turn_interval, min: 1,  max: 5,  default: 2,  unit: s,   label: turn-interval }
in_the_wild:
  - { applied: slay-the-spire-deck-run, note: "Mega Crit 2019 — each turn opens with a fixed draw count (usually 5) lifted from the top of the draw pile; emptying the pile triggers a discard-to-draw reshuffle mid-turn." }
code_anchor: public/d/composition/deck-draw.js
---
