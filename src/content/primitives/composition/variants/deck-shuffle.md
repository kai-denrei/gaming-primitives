---
slug: deck-shuffle
name: Deck Shuffle
status: built
description: A finite pool of cards is randomly permuted before play.
parameters:
  - { type: int,   id: deck_size,        min: 10,  max: 52, default: 20,  unit: '',  label: deck-size }
  - { type: enum,  id: algo,             options: ['fisher-yates','riffle','naive'], default: 'fisher-yates', label: algo }
  - { type: float, id: shuffle_interval, min: 0.5, max: 3,  default: 1.5, unit: s,   label: shuffle-interval }
in_the_wild:
  - { applied: slay-the-spire-deck-run, note: "Mega Crit 2019 — the draw pile is re-shuffled from the discard pile at the start of each combat and again whenever it empties; ordering within a run is uniform-random." }
code_anchor: public/d/composition/deck-shuffle.js
---
