---
slug: dead-zone
name: Dead-Zone
status: built
description: Camera only moves when the target leaves a rectangular tolerance region.
parameters:
  - { type: int,   id: dead_zone_w, min: 50, max: 400, default: 200, unit: u,   label: dead-zone-w }
  - { type: int,   id: dead_zone_h, min: 50, max: 300, default: 150, unit: u,   label: dead-zone-h }
  - { type: float, id: world_speed, min: 30, max: 300, default: 120, unit: u/s, label: world-speed }
in_the_wild:
  - { applied: mario-platform-arc, note: "Nintendo 1985 — Mario can wander a band of the screen before the camera resumes scrolling, the classic horizontal dead-zone." }
code_anchor: public/d/camera/dead-zone.js
---
