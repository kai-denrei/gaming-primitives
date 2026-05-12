---
slug: bonfire-recovery
name: Bonfire Recovery
status: built
description: Resting at a checkpoint restores resources but respawns defeated enemies.
parameters:
  - { type: float, id: death_interval, min: 3, max: 15, default: 8, unit: s, label: death-interval }
  - { type: int,   id: enemy_count,    min: 1, max: 6,  default: 3,         label: enemies }
in_the_wild:
  - { applied: dark-souls-bonfire-recovery, note: "FromSoftware 2011 — resting at a bonfire refills Estus and resets the world; every defeated standard enemy respawns and the player is returned to the checkpoint, trading progress for replenishment." }
code_anchor: public/d/time-as-resource/bonfire-recovery.js
---
