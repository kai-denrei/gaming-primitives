---
id: qix-area-claim
status: speced
tech: canvas-2d
target_loc: 380
controls: "ArrowKeys move; hold Space + direction to draw; release on boundary closes; R restart; touch: virtual D-pad + draw button"
orientation: auto
---

## Goal of the demo

In thirty seconds the player should feel **committed exposure**. Walking the boundary is safe. Leaving it stakes time you cannot take back: the trail is fatal to touch, reversible only by reaching another edge. The Qix drifts in the void as a soft threat. Closing a polygon flood-fills the smaller side in the claim colour; the counter ticks up. Win at 75%.

## Reduced ruleset

1. The marker rides the boundary of claimed area; arrows slide it along edges only.
2. Holding Space + a direction into the void begins a trail; the marker paints `DRAWING` cells behind it.
3. While drawing, the marker may turn but may not cross its trail; motion is forced at constant speed.
4. Touching any `BOUNDARY` or `CLAIMED` cell closes the polygon: trail promotes to boundary, a flood-fill from the Qix's cell defines the unreachable region, that region becomes `CLAIMED`.
5. One Qix particle drifts in `VOID`, reflecting off boundary and trail; contact with any `DRAWING` cell ends the run.
6. Reach 75% claimed (`TARGET_PERCENT`, configurable) to win; R restarts.
7. One life. No fuse, no Sparx.

## Visual language

Flat raster on a 200×150 logical grid scaled to canvas. Five colours: void `#0a0a14`, boundary `#2a2a3a`, claimed `#ffd23f` (era arcade-golden) at 55% alpha, trail `#ff5ec4`, marker and Qix `#e8e8f0`. The Qix is one ~14-px line segment rotating at ~3 rad/s; the marker a 3-px diamond. HUD: thin top bar with percent fill in the claim colour plus 10-px monospace `N%`. No gradients, 1-px strokes. Abstract, no IP.

## State model

```text
W=200, H=150 logical grid; cell ∈ {VOID=0, BOUNDARY=1, CLAIMED=2, DRAWING=3}
TARGET_PERCENT=0.75, MARKER_SPEED=60 c/s, QIX_SPEED=70 c/s

state = {
  grid: Uint8Array(W*H),
  marker: { x, y, dir, drawing, trail: [{x,y}] },
  qix:    { x, y, vx, vy, angle, omega },
  input:  { up,down,left,right, draw },
  claimed: int,            // incremental
  status:  'play' | 'win' | 'dead',
}

init(): paint outer ring BOUNDARY; marker at (0,0); qix centred

tick(dt):
  if status != 'play': return
  read input → heading
  if not drawing:
    slide marker along adjacent BOUNDARY/CLAIMED in heading
    if draw held AND heading points into VOID: drawing=true; trail=[pos]
  else:
    step marker by MARKER_SPEED*dt (substepped, 1 cell max)
    next = grid[mx,my]
    if next == DRAWING: die()
    if next == VOID:    mark DRAWING; trail.push
    if next ∈ {BOUNDARY,CLAIMED}: closePolygon()
  qix: angle+=omega*dt; (x,y)+=(vx,vy)*dt; reflect on non-VOID
  rasterise segment; if any segment cell == DRAWING: die()
  render()

closePolygon():
  promote trail → BOUNDARY
  flood4 from qix cell over VOID → reachable R
  unreachable = VOID \ R → CLAIMED; claimed += |unreachable|
  drawing=false; trail=[]
  if claimed/(W*H) >= TARGET_PERCENT: status='win'
```

## Failure modes to handle

- **Degenerate polygons.** Trail length < 3, or trail re-touching its origin on step two: kill the run (treat as self-cross). Prevents zero-area claims and soft-locks.
- **Flood seed inside trail.** If the Qix sits inside the just-closed loop before promotion, advance it one cell along velocity before seeding; otherwise the wrong region claims.
- **Resize.** Logical grid fixed; template's resize only recomputes render scale and DPR. Gameplay coordinates never change.
- **Frame-rate independence.** Motion scaled by clamped `dt`; marker substeps so it cannot teleport past a cell.
- **Pause on blur.** Template-handled. On resume, clear held-input flags so Space does not auto-draw.
- **Touch leak.** `touchstart` calls `preventDefault`; D-pad buttons absorb events.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, freeze Qix rotation and skip the flood sweep; claim still snaps.

## Out of scope

No Sparx (boundary enemies). No Fuse on standstill. No fast/slow draw distinction (one speed, no 2× multiplier). No multiple lives. No high-score persistence. No sound. No menus. No difficulty levels. No mouse input. No level progression past first 75%. No bonus tiles, no power-ups, no shootable line. No multi-Qix. No analytics. No network calls.

## Controls

```
Keyboard:
- ArrowUp/Down/Left/Right : heading (held)
- Space (held)            : draw — heading takes marker into VOID
- Space (released)        : revert to boundary-walk if on a boundary
- R                       : restart

Touch (auto orientation):
- Bottom-left D-pad: four 44×44 px buttons in a + cross
- Bottom-right round button (56 px): DRAW (held = Space)
- Top-right FAB: RESTART
- Faint #2a2a3a outlines; active fill #ffd23f at 30% alpha.
```
