---
id: baba-is-you-rewrite
status: speced
tech: canvas-2d
target_loc: 400
controls: "Arrow keys / WASD to move; R to restart; Z to undo"
orientation: auto
---

## Goal of the demo

In thirty seconds the player should feel **the sentence is the world**. Pushing a word-tile is a Sokoban step, but the consequence is a re-parse: walls become walkable, rocks become controllable, the flag stops winning. The intended *aha* is rule-breakage as a verb — shove `IS` out of `WALL IS STOP`, walk through the wall, re-form a sentence on the far side that points `WIN` at something reachable. No timer, no score; one rewrite exposes the path.

## Reduced ruleset

1. One hand-crafted 12×9 level. Objects: `BABA`, `FLAG`, `WALL`, `ROCK`. Word tiles: `BABA`, `IS`, `YOU`, `WIN`, `WALL`, `STOP`, `ROCK`, `PUSH`, `FLAG` (nine).
2. Seed rules on the board: `BABA IS YOU`, `FLAG IS WIN`, `WALL IS STOP`, `ROCK IS PUSH`. Any can be broken by pushing tiles apart.
3. Per-turn order, atomic: `input → push from each YOU → re-parse → derive properties (only YOU/WIN/PUSH/STOP) → win check`.
4. Push resolution: a chain of `PUSH`-tagged tiles moves if the endpoint cell is in-bounds and holds no `STOP`. Otherwise nothing moves.
5. All word tiles are implicitly `PUSH`. Objects are `PUSH` only if a rule says so.
6. Win: any object tagged both `YOU` and `WIN`, or a `YOU` sharing a cell with a `WIN`.
7. Undo: stack of grid snapshots, max 50; `Z` pops one. `R` clears the stack and reloads.

## Visual language

Five colours: `#0e0e14` (bg), `#ff85a1` (era indie-modern accent, `YOU` outline), `#e8e8f0` (text default), `#5c8aff` (object accent), `#2a2a3a` (grid lines). Each cell is 48 logical px on a 576×432 stage. Objects render as flat coloured squares with a single uppercase mono letter centred (`B`, `F`, `W`, `R`); word tiles render as squares with a thin 2-px inner border and the full word in 10-px monospace, so word and object never read as the same kind. The current `YOU` pulses a 1-px `#ff85a1` outline.

## State model

```text
W=12, H=9; cell holds Object[]; OBJ_{BABA|FLAG|WALL|ROCK},
W_{BABA|FLAG|WALL|ROCK|IS|YOU|WIN|STOP|PUSH}

state = { grid, rules:Set<[s,p]>, props:Map<name,Set<prop>>,
          history:Snapshot[<=50], status:'play'|'win' }

step(dir):                   // turn-based, one per keypress
  history.push(snapshot(grid))
  for o in objectsTagged('YOU', top-left order):
    attemptMove(o, dir)
  parseRules(); deriveProps()
  if checkWin(): status='win'

attemptMove(o, dir):
  chain=[o]; cur=neighbour(o.pos, dir)
  while inBounds(cur) and cellHasPushable(cur):
    for x in cell(cur):
      if hasProp(x,'STOP') and !isPushable(x): return
      if isPushable(x): chain.push(x)
    cur = neighbour(cur, dir)
  if !inBounds(cur): return
  for x in cell(cur):
    if hasProp(x,'STOP') and !isPushable(x): return
  for x in chain.reverse(): move(x, dir)

parseRules():                // the heart — both axes
  rules.clear()
  for y in 0..H-1: scanLine(row(y))
  for x in 0..W-1: scanLine(col(x))

scanLine(line):              // emit SUBJECT-IS-PREDICATE triples
  for i in 0..len-3:
    s=firstWord(line[i]);   if !NOUN(s): continue
    v=firstWord(line[i+1]); if v!=W_IS:  continue
    p=firstWord(line[i+2]); if !(NOUN(p)||PROP(p)): continue
    rules.add([nounOf(s), predOf(p)])
  // conjunctions (AND) skipped for v1

deriveProps():               // NOUN-IS-NOUN substitution skipped
  props.clear()
  for [s,p] in rules: if PROP(p): props[s].add(p)
```

`tick(dt)` only interpolates a ~0.08 s ease-out slide per move; all game logic runs inside `step(dir)` on keypress.

## Failure modes

- **No `YOU` rule.** Breaking `BABA IS YOU` leaves nothing controllable. Allowed; surface a faint `press Z to undo` hint after 2 s with no `YOU`. No auto-revert.
- **Multiple `YOU`.** All move per turn in deterministic top-left order; two-pass attemptMove so one `YOU` blocking another does not desync.
- **Degenerate sentence.** `BABA IS BABA` is a legal no-op; parser emits, deriveProps drops it (NOUN-pred unused in v1).
- **Undo past start.** Empty stack → ignore `Z`.
- **Frame-rate.** Turn-based; `dt` drives only the slide tween. Skip the tween if `dt > 50 ms`.
- **Resize.** Logical grid fixed; template handles render scale and DPR.
- **Pause on blur.** Template-handled; on resume clear keydown latches so held arrows do not repeat-fire turns.
- **Touch.** Swipe on stage (≥ 24 px) fires one `step(dir)`; tap-buttons for undo and restart.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, skip the tween; snap to post-step positions.

## Out of scope

`SINK`, `HOT`, `MELT`, `DEFEAT`, `SHIFT`, `WEAK`, `OPEN`, `SHUT`, `MOVE`, `TELE`, `NOT`, `AND`, `BLUE`, `RED`, `ON`, `NEAR`, `FACING`. `NOUN IS NOUN` substitution. Multiple levels. Level select. Level editor. Animated sprites. Sound. Save/load. High-score. Menus. Mouse input. Analytics. Network calls.

## Controls

```
Keyboard:
- Arrow / WASD : step in that direction
- Z            : undo one turn
- R            : restart (clears undo stack)

Touch (auto orientation):
- Swipe on stage (>= 24 px) : step in swipe direction
- Bottom-left button (UNDO) : Z
- Bottom-right button (RST) : R
- Faint #2a2a3a outlines; active fill #ff85a1 at 30% alpha.
```
