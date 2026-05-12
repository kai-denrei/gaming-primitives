---
slug: tempo-curve
name: Tempo Curve
status: built
description: Pacing changes over time — acceleration, level transitions, density ramps.
parameters:
  - { type: int,   id: start_bpm,      min: 60,  max: 200, default: 80,  unit: bpm, label: start-bpm }
  - { type: int,   id: end_bpm,        min: 100, max: 400, default: 240, unit: bpm, label: end-bpm }
  - { type: float, id: cycle_seconds,  min: 5,   max: 30,  default: 12,  unit: s,   label: cycle-seconds }
  - { type: enum,  id: curve,          options: ['linear','exponential','stepped'], default: 'linear', label: curve }
in_the_wild:
  - { applied: ddr-step-grid,             note: "Charts ramp BPM over their duration — slow intros build into double-time finales following an authored curve." }
  - { applied: tetris-line-clear,         note: "Drop period shortens with each level — a stepped tempo curve clocked by lines cleared." }
  - { applied: vampire-survivors-evolve,  note: "Spawn-rate density and weapon-cadence both ramp throughout the 30-minute run on a near-exponential curve." }
code_anchor: public/d/rhythm/tempo-curve.js
---
