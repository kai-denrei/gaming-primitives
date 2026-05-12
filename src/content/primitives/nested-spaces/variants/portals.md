---
slug: portals
name: Portals
status: built
description: Two surfaces are identified so that crossing one places the entity at the other.
parameters:
  - { type: int,   id: portal_count, min: 1,  max: 3,   default: 2,              label: portal-pairs }
  - { type: int,   id: agent_count,  min: 1,  max: 5,   default: 3,              label: agents }
  - { type: float, id: agent_speed,  min: 30, max: 200, default: 100, unit: u/s, label: speed }
in_the_wild:
  - { applied: portal-momentum-warp, note: "Valve 2007 — paired portals identify two surfaces; momentum is preserved across the cut, which the player exploits to reach otherwise-unreachable geometry." }
code_anchor: public/d/nested-spaces/portals.js
---
