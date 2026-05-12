---
slug: dilation
name: Dilation
status: built
description: World tick rate slows while player input continues at normal speed.
parameters:
  - { type: float, id: slowmo_interval, min: 4,   max: 10,  default: 6,    unit: s, label: slowmo-interval }
  - { type: float, id: slowmo_duration, min: 1,   max: 3,   default: 2,    unit: s, label: slowmo-duration }
  - { type: float, id: slowmo_factor,   min: 0.1, max: 0.5, default: 0.25,          label: slowmo-factor }
in_the_wild:
  - { applied: dark-souls-bonfire-recovery, note: "FromSoftware 2011 — boss intro sequences and parry windows briefly dilate world-tick relative to input, giving the player an extra perception beat without freezing the simulation." }
code_anchor: public/d/time-as-resource/dilation.js
---
