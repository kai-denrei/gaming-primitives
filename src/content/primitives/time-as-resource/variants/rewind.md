---
slug: rewind
name: Rewind
status: built
description: Player undoes time within a finite window.
parameters:
  - { type: float, id: rewind_interval, min: 4, max: 10, default: 6, unit: s, label: rewind-interval }
  - { type: float, id: rewind_duration, min: 1, max: 4,  default: 2, unit: s, label: rewind-duration }
in_the_wild:
  - { applied: braid-time-rewind, note: "Number None 2008 — the rewind button replays a recorded buffer of player and world state in reverse; the buffer is the level's primary puzzle surface." }
code_anchor: public/d/time-as-resource/rewind.js
---
