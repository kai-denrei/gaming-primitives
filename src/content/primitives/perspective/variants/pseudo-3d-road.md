---
slug: pseudo-3d-road
name: Pseudo-3D Road
status: built
description: Forward-receding road segments with sprite scaling — the arcade racer trick that predates real 3D. Curvature drifts horizontally per segment; objects at depth scale toward the horizon. Pole Position (1982), OutRun (1986).
parameters:
  - { type: float, id: forward_speed,  min: 50,  max: 400, default: 200, unit: u/s, label: forward-speed }
  - { type: int,   id: road_width,     min: 60,  max: 200, default: 120, unit: px,  label: road-width }
  - { type: float, id: curve_amount,   min: -1,  max: 1,   default: 0.4,            label: curve-amount }
  - { type: toggle, id: markers,       default: true, on_label: "markers on", off_label: "markers off", label: roadside-markers }
in_the_wild:
  - { applied: outrun-pseudo-3d,  note: "The defining example — segment-based road receding to the horizon, curvature applied per segment, roadside trees scaled by depth." }
  - { applied: f-zero-mode-7,     note: "F-Zero's track sits on a Mode-7 plane, but the player's forward-receding road still scales the world by depth — same illusion of forward motion via per-segment scaling." }
code_anchor: public/d/perspective/pseudo-3d-road.js
---
