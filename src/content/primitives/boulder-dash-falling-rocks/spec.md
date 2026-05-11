---
id: boulder-dash-falling-rocks
status: speced
tech: canvas-2d
target_loc: 380
controls: "Arrow keys / WASD step; R restart; touch: swipe-to-step + restart button"
orientation: auto
---

## Goal of the demo

In thirty seconds the player should feel **gravity as both threat and tool**. Digging is free — until the rock above remembers it is heavy. The rule that kills you under a falling rock is the rule that delivers a diamond into your collectable column. The intended *aha*: undermine from the side, watch the topple chain into your channel, walk over the dropped diamond, reach the exit.

## Reduced ruleset

1. World: 20×14 grid. Tiles `EMPTY`, `DIRT`, `WALL`, `ROCK`, `DIAMOND`, `PLAYER`, `EXIT`.
2. One keypress steps the player one cell. Into `EMPTY`: move. Into `DIRT`: dig and move. Into `DIAMOND`: collect and move. Into `EXIT`: win iff `collected >= QUOTA`.
3. Horizontal-only push: stepping into a `ROCK` with the cell beyond empty shifts the rock one cell and the player follows. Vertical push is blocked.
4. After every player step (and only then), a physics scan runs bottom-up, right-to-left, repeating until no cell changes.
5. Fall: a `ROCK` or `DIAMOND` with `EMPTY` directly below drops one cell and is flagged `FALLING`.
6. Topple: a resting `ROCK`/`DIAMOND` sitting on another `ROCK`/`DIAMOND` slides into an adjacent `EMPTY` cell whose below is also `EMPTY` — left preferred, then right.
7. Crush: a `FALLING` cell resolving into the player's cell kills the player. `R` restarts.

## Visual language

Era palette home-8bit, six colours: bg `#0a0a14`, dirt `#5b3a1e` as 2-px stippled crosshatch, wall solid `#3a3a4a`, rock `#8a8a96` filled octagon with 1-px highlight, diamond `#5b76ff` (era accent) tight rhombus with one white facet pixel, player `#e8e8f0` silhouette, exit a 28-px rectangle pulsing `#5b76ff`↔white at 1 Hz once quota is met (dim grey before). Cell 28 logical px → 560×392 stage; DPR-aware canvas scales to viewport. HUD: top bar with `N / QUOTA` in 12-px mono.

## State model

```text
W=20, H=14; tile, falling: Uint8Array(W*H)
TILE = { EMPTY, DIRT, WALL, ROCK, DIAMOND, PLAYER, EXIT }; QUOTA=6

state = { tile, falling, player:{x,y,alive}, collected:0,
          status:'play'|'win'|'dead', anim:{from,t} }  // 0.08 s tween

onKey(dir):                                 // one logical step per keypress
  if status!='play' || !tryMove(dir): return
  while scanPhysics(): {}                   // cascade to fixed point
  if onExit && collected>=QUOTA: status='win'
  if !player.alive: status='dead'

tryMove({dx,dy}):
  t = tile[px+dx, py+dy]
  switch t:
    EMPTY:      step
    DIRT:       clear cell, step
    DIAMOND:    collected++, step
    EXIT:       if collected>=QUOTA: step
    ROCK:       if dy==0 && tile[px+2dx,py]==EMPTY:
                  tile[px+2dx,py]=ROCK; falling[..]=0; step
    else:       blocked

scanPhysics():                              // bottom-up, right-to-left
  changed = false
  for y in H-2..0: for x in W-1..0:
    t = tile[x,y]; if t!=ROCK && t!=DIAMOND: continue
    b = tile[x,y+1]
    if b==EMPTY:                                  move down; falling[x,y+1]=1; changed=true
    else if falling[x,y] && b==PLAYER:            player.alive=false; tile[x,y+1]=EMPTY; changed=true
    else if falling[x,y]:                         falling[x,y]=0           // landed → rest
    else if b in {ROCK,DIAMOND}:                  if topple(-1) || topple(+1): changed=true
  return changed
```

`tick(dt)` only advances the tween — all rule logic runs inside `onKey`. The fixed-point loop produces the full cascade in one turn; each keypress is deterministic.

### Level layout (hand-authored, 20×14)

Dirt-filled cavern walled top and left. Horizontal vein of 4 rocks on a thin dirt shelf above a 3-wide vertical channel — player approaches from the side, digs the support, watches the cascade. Diamond cluster of 8 (6 required) sits beneath a keystone rock the player pushes horizontally to expose. Exit bottom-right behind a 2-cell dirt plug. One unreachable diamond demonstrates quota < total. Spawn top-left on dirt.

## Failure modes to handle

- **Double-fall in one pass.** The `falling` flag plus bottom-up ordering caps each rock at one cell per inner pass; the outer loop produces the cascade.
- **Soft-lock by burying quota.** No auto-detect; surface a faint `press R to restart` hint after 4 s of no movement with `collected < QUOTA`.
- **Crush during push.** Horizontal push never lands the rock on the player; lethal landings only occur during the post-step scan.
- **Frame-rate independence.** Turn-based; `dt` drives only the tween. Clamp `dt` ≤ 50 ms; skip tween if exceeded.
- **Held arrows.** No auto-repeat — a step requires a fresh keydown. Pause-on-blur clears latches on resume.
- **Resize.** Logical grid fixed; template handles render scale and DPR.
- **Touch leak.** `touchstart` calls `preventDefault`.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, skip tween and exit pulse.

## Out of scope

No amoeba. No butterflies, fireflies, or enemies. No time limit. No magic wall. No dynamite. No multiple levels. No level editor. No score beyond the diamond counter. No sound. No menus. No difficulty. No high-score persistence. No mouse input. No undo. No analytics. No network calls.

## Controls

```
Keyboard:
- ArrowUp / W      : step north (one cell per keydown, no hold-repeat)
- ArrowDown / S    : step south
- ArrowLeft / A    : step west
- ArrowRight / D   : step east
- R                : restart

Touch (auto orientation):
- Swipe on stage (>= 24 px) : step in swipe direction
- Bottom-right button (RST) : R
- Faint #2a2a3a outlines; active fill #5b76ff at 30% alpha.
```
