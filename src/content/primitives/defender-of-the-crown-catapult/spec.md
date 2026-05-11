---
id: defender-of-the-crown-catapult
status: speced
tech: canvas-2d
target_loc: 260
controls: "Up/Down adjust angle 1 deg; Left/Right adjust power 1 unit; Space fire; R restart; touch: angle slider + power slider + FIRE"
orientation: landscape
---

## Goal of the demo

In thirty seconds the player should feel **blind commitment under budget**. Two HUD numbers — angle and power — are the input surface. No aim line, no preview, no in-flight steering. The player commits, watches a parabola resolve, reads the miss, adjusts, fires again. Five stones; reduce the wall by half to win.

## Reduced ruleset

1. Catapult on the left ground line. Two scalars per shot: `angle` ∈ [20°, 80°], `power` ∈ [40, 140]. Both shown in the HUD.
2. Up/Down step `angle` by 1°; Left/Right step `power` by 1 unit. Holding repeats at 12 Hz. Adjustment is free until launch.
3. Space fires. While the stone is airborne all input is locked — no steering, no abort.
4. The stone integrates with semi-implicit Euler under constant gravity. No wind. Terminates on ground, wall, or overshoot.
5. The castle is a stacked grid of bricks on the right. A stone overlapping a brick AABB removes that brick (plus the brick directly behind, if any) and stops.
6. Five stones per siege. Wall reduced by ≥ 50% of starting bricks → WIN; stones exhausted otherwise → LOSE. R restarts.
7. No trajectory preview, no ghost arc, no aim reticule — the commitment is the point.

## Visual language

Flat `#0a0a14` background. Era accent `#5b76ff` (home-8bit Amiga blue) paints the castle silhouette and brick outlines. Ground line and catapult frame `#2a2a3a`. Stone and HUD text `#e8e8f0`. A single-frame `#ff5e3a` flash marks brick-hit. Bricks are 14×10 logical-px rectangles with 1-px inner stroke; the castle is a wall plus two crenellated towers, 6 columns × 8 rows. The catapult is a V-shape with an arm rotating to `angle`. HUD top-left: `ANGLE 45°` / `POWER 80` / `STONES 5` in 10-px monospace. No gradients, no textures, no sprites.

## State model

```text
Logical 480×270 landscape. GROUND_Y=240, g=320 u/s².
ANGLE_RANGE=[20,80], POW_RANGE=[40,140], MAX_STONES=5,
BRICK=14×10, GRID=6×8, brickStart=48.

state = {
  angle:45, power:80, stonesLeft:5, flash:0,
  stone: null,             // { x, y, vx, vy } while airborne
  bricks: Uint8Array(48),  // 1 = present
  status: 'aim'|'fly'|'win'|'lose',
  input: { up,down,left,right, fire, repeatT },
}

tick(dt):
  if status in ('win','lose'): return
  if status == 'aim':
    advance repeatT; step angle/power per held key at 12 Hz
    if input.fire: launch()
  else: // 'fly' — substep when |v|·dt > 4 px
    integrate semi-implicit Euler under g
    if y >= GROUND_Y or x ∉ [0,480]: endShot(false)
    else if AABB(stone, anyBrickRect):
      remove brick + brick-behind; flash=0.08; endShot(true)
  flash = max(0, flash - dt)

launch(): rad = angle·π/180
  stone = { x:muzzleX, y:muzzleY,
            vx: power·cos(rad), vy: -power·sin(rad) }
  status='fly'

endShot(hit): stone=null; stonesLeft -= 1
  if count(bricks==1) <= 24: status='win'
  elif stonesLeft <= 0:      status='lose'
  else:                      status='aim'
```

## Failure modes to handle

- **Frame-rate independence.** Gravity and motion scale by clamped `dt` ≤ 50 ms. Hold-to-repeat uses an accumulator, not `setInterval`.
- **Tunnelling.** High power can step the stone past a brick in one frame. Substep `ceil(|v|·dt / 4 px)` AABB-checks per tick.
- **Range edges.** Clamp angle/power to min/max on every adjust; never wrap. Keys held at a clamp no-op silently.
- **Stuck fire.** Latch Space on keydown, consume on launch, ignore until keyup; prevents auto-fire on shot resolve.
- **Pause on blur.** Template-handled. On resume clear held-input flags so a stuck Arrow does not drift the value.
- **Resize.** Logical 480×270 fixed; template recomputes render scale. Touch sliders re-anchor on resize.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, suppress hit-flash and catapult-arm tween. The parabola stays — it is the verb.
- **Win-on-last-stone.** Evaluate WIN before LOSE in `endShot`; a final-stone breach must not register as exhaustion.

## Out of scope

No wind. No trajectory preview, ghost arc, or aim line. No drag-release input (that's [[worms-bazooka-wind]]). No mid-flight steering. No multiple weapons. No defenders, archers, or counter-fire. No catapult repositioning. No campaign, no map, no menus, no difficulty levels. No high-score persistence. No sound. No particle explosions beyond the single-frame flash. No mouse input. No analytics. No network calls.

## Controls

```
Keyboard:
- ArrowUp/Down    : angle ±1° (held: 12 Hz repeat)
- ArrowRight/Left : power ±1  (held: 12 Hz repeat)
- Space           : fire (consumed on press; locked in flight)
- R               : restart

Touch (landscape):
- Top horizontal slider  : angle
- Right vertical slider  : power
- Bottom-center FIRE (72 px round) : Space
- Top-right FAB                    : R
- Faint #2a2a3a outlines; active fill #5b76ff at 30% alpha.
```
