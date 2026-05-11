# Lunar Lander Thrust

**Player verb**: apply fuel-limited vector thrust under gravity to null velocity at a target

**Canonical originator**: Lunar Lander (1979, Arcade) — Atari

## How to play

- ArrowLeft / ArrowRight — tilt the lander counter-clockwise / clockwise (held; no auto-level).
- ArrowUp — fire the engine along the lander's local up-axis (held; binary throttle).
- R — restart with the same terrain.
- Touch: left third = tilt ccw, right third = tilt cw, bottom-center pad = thrust, two-finger tap = restart.
- Touch zones render as faint outlines only while a finger is on the stage.

Soft-landing limits: `|vx| < 14`, `|vy| < 22`, `|tilt| < ~10°`, on the orange pad. Anything else is a crash.

## What to notice

Fuel is a deferred cost. Gravity is free; the engine is finite. A hover-creep
descent runs you out of tank above the pad and free-falls the last drop into
a crater. The clean run is a single late full-throttle burn that hits zero
velocity right as the legs touch. Try a hover and watch the fuel bar; try a
suicide burn and feel the inverted-braking that the cabinet was selling in
1979. Lateral drift is the lesser monster — angle to acquire, mirror-tilt
to kill.

## The mechanism

Per tick: rotate by `ROT_RATE * dt` while a tilt key is held; if thrust is
held and fuel remains, add `T_MAG * (sin θ, -cos θ)` to acceleration and
burn `BURN_RATE * dt` fuel; always add `G` to ay. Then semi-implicit Euler:
velocity first, position second — symplectic is stable under constant
gravity where explicit Euler would energy-gain and spring. Collision is a
per-frame heightmap lookup at the lander's new x: if `y >= terrainAt(x)`,
the run ends — win if on the flat pad with all three velocities and tilt
inside the soft limits, otherwise crash. Terrain is one midpoint-displaced
polyline seeded by a fixed LCG so R rehearses the same problem rather than
re-rolling it. See `../../../src/content/primitives/lunar-lander-thrust/research.md`
for the full algorithm and lineage.

## Code map

- `index.html` — boot, viewport, SW registration
- `game.js` — the primitive (≤ 400 lines, target 280)
- `style.css` — era-color theming, fullscreen stage
- `sw.js` — offline shell

Read `game.js`. The interesting parts are commented `// mechanism:`.
