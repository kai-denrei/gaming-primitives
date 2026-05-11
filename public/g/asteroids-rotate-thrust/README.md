# Asteroids Rotate-Thrust

**Player verb**: combine angular and linear thrust with screen-wrap topology

**Canonical originator**: Asteroids (1979, Arcade) — Atari / Lyle Rains, Ed Logg

## How to play

- ArrowLeft / ArrowRight — rotate the ship (held)
- ArrowUp — thrust along current facing (held)
- Space — fire one bullet (no auto-fire on hold; max 4 in flight)
- R — restart after death
- Touch: left third of stage rotates left, right third rotates right, bottom-center pad thrusts, top-right corner is the fire tap-zone; two-finger tap restarts when dead

## What to notice

Thrust is cheap to spend, expensive to undo. Within thirty seconds the player should feel **inertial debt**: a momentum mistake from five seconds ago is the rock that kills them now. The line you shoot is rarely the line you travel — bullets fly at fixed muzzle speed along the current facing (no velocity inheritance, by Logg's deliberate choice), while the ship drifts on accumulated velocity. The torus has no corner: every edge stitches to its opposite, so there is no safe wall to retreat to, only velocity management. Try clearing a wave without thrusting at all — it's slower, but it survives longer than the obvious thrust-everywhere approach. Design choice noted: thrust is held-continuous (not pulsed) per the spec's `thrust along facing (held)` reading.

## The mechanism

`tick()` runs semi-implicit Euler against `dt` from the rAF clock: rotation increments `dir` by `ROT_RATE*dt`, thrust adds `cos/sin(dir)*THRUST*dt` to the velocity, and friction is `v *= exp(-FRICTION*dt)` so the glide-to-stop time is identical on a 30fps phone and a 144fps monitor — a naïve `v *= 0.99` would couple feel to refresh rate. Velocity is magnitude-clamped to `V_MAX`. Positions wrap on both axes via `mod(x, W)` and `mod(y, H)`, making the playfield a torus. Collisions use a custom `torusDist` that takes the per-axis minimum of `|Δ|` and `W-|Δ|` — without this, a shot that wraps past the right edge misses a rock just inside the left edge. Asteroid fission on bullet-hit follows large → 2 mediums → 2 smalls → vanish, with children inheriting position, random heading, and a 1.4× speed boost so late-wave swarms accelerate emergently. See [`research.md`](../../../src/content/primitives/asteroids-rotate-thrust/research.md) §Algorithm/math for the original 6502 reference and the framerate-coupling fix this implementation applies.

## Code map

- `index.html` — boot
- `game.js` — the primitive (≤ 400 lines)
- `style.css` — visuals
- `sw.js` — offline shell

Read `game.js`. Interesting parts are commented `// mechanism:`.
