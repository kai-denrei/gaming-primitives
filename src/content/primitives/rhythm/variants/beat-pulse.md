---
slug: beat-pulse
name: Beat Pulse
status: built
description: A metronome emits a pulse at a fixed BPM — the substrate every other rhythm mechanic builds on.
parameters:
  - { type: int,   id: bpm,             min: 40, max: 240, default: 120, unit: bpm, label: tempo }
  - { type: int,   id: accent_every,    min: 1,  max: 8,   default: 4,                label: accent-every }
  - { type: float, id: flash_intensity, min: 0,  max: 1,   default: 0.7,              label: flash-intensity }
in_the_wild:
  - { applied: ddr-step-grid,         note: "The grid scrolls in lockstep with the song's BPM; every arrow lands on a beat tick from this same metronome substrate." }
  - { applied: vampire-survivors-evolve, note: "Weapons fire on fixed cooldown ticks — a slow, autonomous metronome whose period contracts as the build evolves." }
  - { applied: tetris-line-clear,     note: "Gravity drops the piece one cell per beat; level-up shortens the period, accelerating the pulse." }
code_anchor: public/d/rhythm/beat-pulse.js
---
