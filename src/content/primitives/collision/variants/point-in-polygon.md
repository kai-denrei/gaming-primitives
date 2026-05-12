---
slug: point-in-polygon
name: Point-in-Polygon
status: built
description: Ray-cast from the point and count edge crossings; odd means inside.
parameters:
  - { type: int,   id: vertex_count, min: 5,  max: 12,  default: 7,   unit: '',   label: vertex-count }
  - { type: int,   id: point_count,  min: 3,  max: 15,  default: 8,   unit: '',   label: point-count }
  - { type: float, id: point_speed,  min: 30, max: 300, default: 100, unit: u/s, label: point-speed }
in_the_wild:
  - { applied: qix-area-claim, note: "Taito 1981 — the claimed region is an arbitrary polygon; the Qix's position is tested against it to determine capture." }
  - { applied: worms-bazooka-wind, note: "Team17 1995 — destructible terrain is a polygonal mask; whether a worm or projectile is inside ground geometry uses point-in-polygon." }
code_anchor: public/d/collision/point-in-polygon.js
---
