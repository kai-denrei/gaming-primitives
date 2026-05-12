---
slug: combo-chain
name: Combo Chain
status: built
description: Each move cancels into the next within the previous move's recovery window. Successful chain stacks damage; a missed link leaves the attacker in punishable recovery.
parameters:
  - { type: int,   id: chain_target,     min: 2,  max: 8,   default: 5,            label: chain-target }
  - { type: int,   id: cancel_window_ms, min: 80, max: 400, default: 180, unit: ms, label: cancel-window }
  - { type: float, id: auto_skill,       min: 0,  max: 1,   default: 0.7,          label: auto-skill }
in_the_wild:
  - { applied: street-fighter-special, note: "Chain-cancel into special-cancel into super defines high-execution play. Each link must commit within the previous move's cancel window or the string drops and the attacker is punishable on recovery." }
  - { applied: mortal-kombat-fatality, note: "Pre-set combo strings (`HK HK BP HP`) require each input within the cancel window; missed-cancel drops the dial-a-combo string and ends the pressure." }
code_anchor: public/d/fighting/combo-chain.js
---
