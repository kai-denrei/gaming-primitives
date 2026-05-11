# Agent 05 — Mini-game Spec

You take one `primitives/{id}/research.md` and produce `primitives/{id}/spec.md` — a buildable specification for the eventual in-browser mini-game.

## Your inputs

- `primitives/{id}/research.md` (must have `status: researched`)
- `BRIEF.md`, `schema.md`, `style-guide.md`

## Your output

A single file: `primitives/{id}/spec.md` matching the schema in `schema.md`.

## Goals of every mini-game

1. **Demonstrate the primitive** — a player should feel the *core verb* within 30 seconds.
2. **Be tiny** — single HTML file or HTML + one JS file. 200–400 lines of vanilla JS.
3. **Be abstract** — no IP, no recognizable copyrighted sprites. Use shapes, colors, simple text.
4. **Be source-readable** — code is part of the educational artifact. Comment the *primitive mechanism*, not the boilerplate.
5. **Run offline** — no external deps unless explicitly approved. The whole site must work served from a folder.

## Tech selection

In the spec's frontmatter, set `tech` to one of:

| tech | when |
|---|---|
| `canvas-2d` | default for most primitives — 2D shapes, lines, gradients, simple particles |
| `svg-dom` | when you want crisp vectors and animation via CSS / Web Animations |
| `webgl` | shader-heavy effects (Geometry Wars-likes, ink-spread, fluid) |
| `three.js` | 3D primitives only (perspective rotation, 6-DOF, marble physics in 3D) |
| `web-audio` | required for rhythm primitives, additive for others |

Avoid Phaser, PixiJS, Babylon, etc. for the seed set. They add weight. The whole point is that each game is a readable artifact, not a framework demo. Exceptions need approval in a comment in the spec.

## Reduced ruleset

The hardest part. The original game has dozens of rules; you must keep ≤ 7. Choose the rules that make the **primitive itself** legible.

For `qix-area-claim`:
1. Player moves along the boundary of claimed area.
2. Pressing space + a direction begins drawing into the void.
3. Returning to a boundary closes the polygon and claims one of the two resulting regions.
4. A single hazard particle moves in the unclaimed region, bouncing off boundaries.
5. If the hazard touches your in-progress line, you lose.
6. Reach 75% claimed to win.

Six rules. The fifth and sixth could be cut to four if needed.

## State model

Write a sketch of the top-level state and the tick loop. Pseudocode:

```js
state = {
  player: { x, y, drawing: bool, drawPoints: [] },
  hazard: { x, y, vx, vy },
  claimedMask: Uint8Array(W*H),
  score: 0,
}

tick(dt):
  input → update player movement
  if player.drawing: append to drawPoints
  update hazard physics, bounce on claimedMask boundary
  if hazard hits any drawPoint: gameOver()
  if player returns to claimed: close polygon, flood-fill smaller region
  render
```

## Visual language

3–5 sentences. Specify palette (≤ 5 colors), shape vocabulary, what's foreground/background. Reference design pillars: legibility, abstract, no IP.

## Failure modes to handle

A bullet list of *implementation* gotchas. Examples:

- Frame-rate independence (use dt, not fixed steps).
- Touch input mapping for mobile.
- Window resize handling.
- Pause when tab loses focus.
- Soft-locks in the primitive (e.g. player draws a degenerate polygon).

## Out of scope

Explicit list. "No high-score persistence. No sound. No menus. No difficulty levels. No multiplayer." Prevents the build agent from over-shooting.

## Controls

State precisely: keyboard, mouse, touch. List every input.

```
- Arrow keys: move along boundary or draw direction
- Space (hold): begin drawing
- Space (release on boundary): close polygon
- R: restart
- (Mobile: virtual joystick + draw button — see #mobile in build spec)
```

## Length budget

400–700 words total. Anything more is over-specifying — leave the build agent room to make tactical decisions.

## Failure modes

- **Importing the whole game.** You're not rebuilding Qix. You're demonstrating one primitive. Cut.
- **Vague visual language.** "Looks cool" is not a spec. State the palette.
- **Missing failure modes.** Resize, focus loss, touch — these will bite the build agent.
- **No out-of-scope list.** Without it, the build agent will add features.
