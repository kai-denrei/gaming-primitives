---
slug: fsm
name: FSM
status: built
description: Entity holds one of N discrete states; transitions fire on labelled events.
parameters:
  - { type: float, id: transition_interval, min: 0.5, max: 3, default: 1.2, unit: s, label: transition-interval }
  - { type: int,   id: agent_count,         min: 1,   max: 6, default: 3,            label: agents }
in_the_wild:
  - { applied: pacman-power-pellet, note: "Namco 1980 — each ghost's AI is a 3-state FSM (CHASE / SCATTER / FRIGHTENED); the power pellet pushes every ghost into FRIGHTENED for a fixed window before transitioning back." }
  - { applied: resident-evil-fixed-cam-survival, note: "Capcom 1996 — zombies cycle IDLE → SHAMBLE → LUNGE → DOWNED via proximity and damage triggers; the legible state changes are what sell the slow-horror pacing." }
code_anchor: public/d/state-machines/fsm.js
---
