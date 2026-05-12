---
slug: follow
name: Follow
status: built
description: Camera position locks to the target's position each frame.
parameters:
  - { type: float, id: follow_speed, min: 0.5, max: 2,   default: 1,   label: follow-speed }
  - { type: float, id: world_speed,  min: 30,  max: 300, default: 120, unit: u/s, label: world-speed }
in_the_wild:
  - { applied: mario-platform-arc, note: "Nintendo 1985 — the camera tracks Mario rightward without lag once he passes the midline, a hard lock with no smoothing." }
  - { applied: donkey-kong-platform-arc, note: "Nintendo 1981 — within a single screen the camera is locked; lock-on follow is the natural extension when screens scroll." }
code_anchor: public/d/camera/follow.js
---
