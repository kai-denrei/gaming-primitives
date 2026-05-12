---
slug: fog-of-war
name: Fog of War
status: built
description: Unexplored tiles render dark; explored-but-unseen tiles render dimmed.
parameters:
  - { type: float, id: viewer_radius, min: 30, max: 200, default: 100, unit: px, label: viewer-radius }
  - { type: int,   id: agent_count,   min: 1,  max: 5,   default: 1,   unit: '',  label: agents }
  - { type: float, id: agent_speed,   min: 30, max: 200, default: 80,  unit: px/s, label: agent-speed }
in_the_wild:
  - { applied: dune-2-rts-base, note: "Westwood 1992 — units reveal a circular patch of map; once revealed terrain stays dim-known after sight ends, but enemy units vanish back into the cloud." }
  - { applied: doom-bsp-arena,  note: "id 1993 — the automap only paints sectors the player has actually entered; unvisited rooms are blank until the visibility line is crossed." }
code_anchor: public/d/information-asymmetry/fog-of-war.js
---
