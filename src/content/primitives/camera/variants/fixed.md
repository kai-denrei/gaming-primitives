---
slug: fixed
name: Fixed
status: built
description: Camera position never moves; the playfield is fully contained.
parameters:
  - { type: float, id: world_speed, min: 30, max: 300, default: 100, unit: u/s, label: world-speed }
in_the_wild:
  - { applied: resident-evil-fixed-cam-survival, note: "Capcom 1996 — pre-rendered backgrounds force a static camera per room; the character walks off-frame between cuts." }
  - { applied: donkey-kong-platform-arc, note: "Nintendo 1981 — each girder screen is a fixed view; the whole level fits the cabinet without any panning." }
code_anchor: public/d/camera/fixed.js
---
