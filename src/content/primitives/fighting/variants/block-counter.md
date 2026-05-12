---
slug: block-counter
name: Block + Counter
status: built
description: Defender absorbs strike in block-stun while attacker enters recovery; defender gets a brief counter-attack window. The defensive primitive of every 2D fighter.
parameters:
  - { type: float, id: attacker_speed,    min: 0.5, max: 3,   default: 1.2, unit: "/s", label: attacker-speed }
  - { type: float, id: defender_skill,    min: 0,   max: 1,   default: 0.7,             label: defender-skill }
  - { type: int,   id: block_window_ms,   min: 80,  max: 300, default: 150, unit: ms,   label: block-window }
  - { type: int,   id: counter_window_ms, min: 80,  max: 400, default: 200, unit: ms,   label: counter-window }
in_the_wild:
  - { applied: exploding-fist-karate,  note: "Hold back to block; on successful block the attacker is in recovery and the defender gets a free strike. The skeleton of the genre's defensive grammar." }
  - { applied: street-fighter-special, note: "Block-stun + counter-window defines the punish game. A successful block leaves the attacker in recovery frames; the defender can launch a stronger counter within the counter-window for bonus damage." }
code_anchor: public/d/fighting/block-counter.js
---
