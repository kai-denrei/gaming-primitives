---
id: lunar-lander-thrust
status: speced
tech: canvas-2d
target_loc: 280
controls: "ArrowLeft/Right tilt, ArrowUp thrust, R restart; touch: tilt zones + thrust pad"
orientation: auto
---

## Goal of the demo

In thirty seconds the player should feel **fuel as deferred cost**. Gravity is free and constant; the engine is finite. Hovering bleeds the budget the touchdown needs. A clean run is a single late full-throttle burn that hits zero velocity at the pad. A panicked run hover-creeps into an empty tank and free-falls. Win = soft touchdown on the pad. Loss = high-velocity contact, or fuel-zero impact.

## Reduced ruleset

1. The lander has a tilt angle θ; ArrowLeft/Right rotates it at `ROT_RATE`. The body keeps its angle when released — no auto-level.
2. ArrowUp fires the engine along the lander's local up-axis at constant magnitude, gated on fuel > 0; fuel drains linearly while thrust is on.
3. Gravity adds constant downward acceleration `G` every tick; semi-implicit Euler updates velocity, then position.
4. The world is bounded — left/right edges clamp x, top is open, bottom is terrain.
5. Contact with terrain ends the run: win if the lander overlaps the flat pad and `|vx|<V_SAFE_X` and `|vy|<V_SAFE_Y` and `|θ|<TILT_SAFE`; otherwise crash.
6. R restarts: same terrain seed, lander reset to top-centre with zero velocity and full fuel.

## Visual language

Vector-monitor aesthetic. Black `#000` background, `#e8e8f0` stroke for terrain ridge and lander body. Era accent `#ff5e3a` (arcade-early) for the engine flame, the pad segment, and a single-frame crash flash. Lander is a 14-px isoceles triangle with two leg ticks; flame is a smaller inverted triangle below, length scaled by thrust. Terrain is one jagged polyline (~30 vertices, midpoint-displacement) with one flat ~80-px pad. HUD top-left, 11-px monospace `#888`: altitude, `vx`, `vy`, fuel bar. Strokes only, 1.5 px.

## State model

```text
state = {
  lander: { x, y, vx, vy, theta },
  terrain: Float32Array(N),     // N≈30 heights, linear interp between
  pad: { x0, x1, y },
  fuel, input:{rotL,rotR,thrust}, status:'play'|'win'|'dead', flash
}

G=18, T_MAG=46, BURN_RATE=22, ROT_RATE=2.6 rad/s,
V_SAFE_X=14, V_SAFE_Y=22, TILT_SAFE=0.18 rad, FUEL_START=100,
world={ w:480, h:320 }

tick(dt):
  if status != 'play': flash = max(0, flash-dt); return
  if input.rotL: theta -= ROT_RATE*dt
  if input.rotR: theta += ROT_RATE*dt
  ax=0; ay=G
  if input.thrust && fuel > 0:
    ax += sin(theta)*T_MAG; ay -= cos(theta)*T_MAG
    fuel = max(0, fuel - BURN_RATE*dt)
  // semi-implicit Euler: velocity, then position
  vx += ax*dt; vy += ay*dt
  x  += vx*dt; y  += vy*dt
  x = clamp(x, 4, world.w-4)
  groundY = terrainAt(x)
  if y >= groundY:
    y = groundY
    onPad = x>=pad.x0 && x<=pad.x1 && groundY===pad.y
    soft = onPad && abs(vx)<V_SAFE_X && abs(vy)<V_SAFE_Y && abs(theta)<TILT_SAFE
    status = soft ? 'win' : 'dead'
    if !soft: flash = 0.25
  render()
```

## Failure modes to handle

- **Frame-rate independence.** All accumulators scale by clamped `dt` (template caps at 50 ms). Constants are per-second.
- **Semi-implicit ordering.** Velocity before position. Explicit Euler under constant gravity is energy-gain and visibly springy; semi-implicit is the right tool — RK4 overkill.
- **Terrain tunnelling.** At high vy a frame can step past the ridge. Sample interpolated ground at new x; if y crosses groundY, snap and resolve in-tick.
- **Resize.** Logical world fixed; template handles DPR and scale. Terrain regenerates only on R.
- **Pause on blur.** Template-handled. On resume, clear held-input flags so a stuck ArrowUp does not auto-thrust.
- **Touch leak.** `touchstart` calls `preventDefault` to suppress scroll and tap-delay.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, suppress flame flicker and crash flash. Lander motion stays.
- **Stuck-on-pad jitter.** After landing, freeze the tick until R.

## Out of scope

No multiple lives. No score. No bonus levels, no progression. No surface zoom. No analog thrust lever (binary hold). No multiple pads, no multipliers. No abort button. No enemies. No sound. No menus. No difficulty levels. No particles beyond the crash flash. No mouse input. No high-score persistence. No analytics. No network calls.

## Controls

```
Keyboard:
- ArrowLeft  : tilt counter-clockwise (held)
- ArrowRight : tilt clockwise (held)
- ArrowUp    : fire engine along lander up-axis (held)
- R          : restart (any time)

Touch (auto orientation):
- Left third of stage, held   : tilt ccw
- Right third of stage, held  : tilt cw
- Bottom-center pad, held     : thrust
- Two-finger tap              : restart

Touch zones render as faint #222 outlines only while a touch is active.
```
