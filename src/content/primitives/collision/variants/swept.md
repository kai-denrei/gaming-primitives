---
slug: swept
name: Swept
status: built
description: Test the volume swept along a body's motion this frame to avoid tunnelling.
parameters:
  - { type: float, id: box_speed,    min: 100, max: 600, default: 300, unit: u/s, label: box-speed }
  - { type: int,   id: static_count, min: 1,   max: 5,   default: 3,   unit: '',  label: static-count }
in_the_wild:
  - { applied: mario-platform-arc, note: "Nintendo 1985 — at high fall speed Mario must not tunnel through a one-tile platform; swept tests catch the crossing within a frame." }
  - { applied: donkey-kong-platform-arc, note: "Nintendo 1981 — Jumpman vs. barrels at fast vertical speeds rely on swept volume checks to register the hit reliably." }
code_anchor: public/d/collision/swept.js
---
