---
slug: special-input
name: Special Input
status: built
description: Directional gesture parser. Sequences like quarter-circle-forward + punch are recognized within a sliding input buffer and trigger named special moves with distinct properties. The Hadouken / Shoryuken / Tatsumaki primitive.
parameters:
  - { type: float, id: input_speed,     min: 0.5, max: 3,  default: 1.3, unit: "/s", label: input-speed }
  - { type: float, id: auto_skill,      min: 0,   max: 1,  default: 0.7,             label: auto-skill }
  - { type: enum,  id: move_difficulty, options: ['easy','medium','hard'], default: 'medium', label: move-difficulty }
in_the_wild:
  - { applied: street-fighter-special,   note: "The canonical case — quarter-circle-forward + punch buffers as `↓ ↘ → P` in the input window; on a right-edge match the Hadouken fires with its own startup, active, and recovery profile. Distinct named moves keyed to distinct gestures." }
  - { applied: mortal-kombat-fatality,   note: "Fatality inputs (e.g. `↓ → ↓ → P`) parsed off the same sliding-buffer machinery, gated on the opponent's stun state. A specialized late-match-window special." }
code_anchor: public/d/fighting/special-input.js
---
