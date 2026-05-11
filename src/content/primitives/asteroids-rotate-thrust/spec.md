---
id: asteroids-rotate-thrust
status: speced
tech: canvas-2d
target_loc: 350
controls: "ArrowLeft/Right rotate, ArrowUp thrust, Space fire, R restart; touch: tap-zones + fire button"
orientation: auto
---

## Goal of the demo

In thirty seconds the player should feel **inertial debt**: thrust is cheap to spend, expensive to undo. The ship glides. Shots fly along the *current facing*, not the velocity vector — the line you shoot is rarely the line you travel. The torus has no edge, no corner, no safe wall: only momentum management. Score implicit (asteroids cleared); no menus, no lives. Restart by R.

## Reduced ruleset

1. The ship is a wireframe triangle that rotates continuously and applies thrust along its facing.
2. Velocity decays gently each tick (multiplicative friction) — the ship glides but is not frictionless.
3. Fire spawns a bullet at the nose with fixed muzzle speed along the current facing; bullets live ~1.0 s; cap of 4 concurrent.
4. Asteroids drift at constant velocity. A bullet hit fissions large → 2 mediums, medium → 2 smalls, small is destroyed.
5. All positions wrap modulo the playfield on both axes (toroidal world).
6. Ship-asteroid contact ends the run; press R to restart.
7. When the field is cleared, a new wave of N+1 large rocks spawns at the edges.

## Visual language

Wireframe vector aesthetic. Black background, single foreground stroke `#ffffff` for ship, bullets, asteroids. Era-accent `#ff5e3a` used sparingly: a thrust flame behind the ship while thrusting, and a single-frame flash on fission. Strokes only, 1.5 px nominal — no fills. Ship is an isoceles triangle ~14 px tall. Asteroids are irregular closed polygons (7–11 vertices) with randomised vertex radii. Optional 12 px monospace cleared-count top-left in dim `#222`. Palette: `#000`, `#ffffff`, `#ff5e3a`, `#222`.

## State model

```text
state = {
  ship:      { x, y, vx, vy, dir, thrust, rotL, rotR, alive },
  bullets:   [ { x, y, vx, vy, ttl } ],
  asteroids: [ { x, y, vx, vy, size: 0|1|2, verts: [r0..rN] } ],
  wave, cleared,
  world:     { w, h },        // logical units; render scales to canvas
  input:     { ... }          // mirrors keys + touch zones
}

ROT_RATE=3.2 rad/s, THRUST=220 u/s^2, FRICTION=0.6 /s,
V_MAX=360, MUZZLE=480, BULLET_TTL=1.0

tick(dt):
  if ship.alive:
    if rotL: dir -= ROT_RATE*dt
    if rotR: dir += ROT_RATE*dt
    if thrust:
      vx += cos(dir)*THRUST*dt; vy += sin(dir)*THRUST*dt
    decay = exp(-FRICTION*dt); vx *= decay; vy *= decay
    clampMag(vel, V_MAX)
    x = mod(x + vx*dt, world.w); y = mod(y + vy*dt, world.h)
  for b in bullets:  wrapMove(b, dt); b.ttl -= dt
  bullets = filter(b.ttl > 0)
  for a in asteroids: wrapMove(a, dt)
  // toroidal distance: dx = min(|ax-bx|, w-|ax-bx|), same y
  resolve bullet↔asteroid → fission or remove
  resolve ship↔asteroid   → ship.alive = false
  if asteroids.empty: spawnWave(++wave)
```

## Failure modes to handle

- **Frame-rate independence.** All accumulators scale by `dt`; friction is `exp(-k·dt)`. Template clamps `dt` ≤ 50 ms.
- **Toroidal collision.** Per-axis `dx = min(|a-b|, world.w-|a-b|)`; naive Euclidean misses wrap-edge hits through the seam.
- **Resize.** Logical world units decoupled from canvas pixels; recompute render scale from `clientWidth/Height` on resize.
- **Pause on blur.** Handled by template. Reset held-input flags on resume so a stuck key does not auto-thrust.
- **Soft-locks.** Spawn waves with a guard radius (no rock within `r·3` of ship). Cap bullets at 4. On death, R reinits state.
- **Touch leak.** `touchstart` calls `preventDefault` to suppress page scroll and tap delay.
- **Reduced motion.** If `prefers-reduced-motion: reduce`, suppress thrust-flame flicker and fission flash. Gameplay motion is essential and stays.

## Out of scope

No saucers. No hyperspace. No multi-life. No high-score persistence. No sound. No menus. No difficulty levels. No power-ups. No leaderboard. No particle explosions beyond the single-frame flash. No gravity wells. No bullet-inherits-ship-velocity (fixed muzzle speed). No mouse input. No analytics. No network calls.

## Controls

```
Keyboard:
- ArrowLeft  : rotate ccw (held)
- ArrowRight : rotate cw  (held)
- ArrowUp    : thrust along facing (held)
- Space      : fire one bullet per press (no auto-fire on hold)
- R          : restart (only after death)

Touch (auto orientation):
- Left third of stage, held   : rotate left
- Right third of stage, held  : rotate right
- Bottom-center pad, held     : thrust
- Top-right FAB, tap          : fire
- Two-finger tap after death  : restart

Touch zones render as faint #222 outlines only while a touch is active.
```
