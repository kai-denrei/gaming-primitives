# Qix Area Claim

**Player verb**: ride the boundary, peel into the void, close a polygon to claim the side the Qix isn't on.

**Canonical originator**: Qix (1981, Arcade) — Taito / Randy & Sandy Pfeiffer

## How to play

- Arrow keys (or WASD) — slide the marker along the boundary.
- Hold Space + a direction into the void — start drawing a trail.
- Touch the boundary or any claimed area to close the polygon.
- Don't let the rotating Qix segment touch your trail.
- R — restart. Touch UI: D-pad bottom-left, DRAW button bottom-right, R top-right.
- Win at 75% claimed.

## What to notice

The marker has no inertia; the cost of leaving the boundary is fixed the instant you commit. Bite size shapes the trade: a long polygon closes more area but exposes the trail longer. Drawing under the Qix's heading is suicide; perpendicular buys frames.

## The mechanism

The playfield is a 200×150 cell grid in `{VOID, BOUNDARY, CLAIMED, DRAWING}` states. Boundary-walk restricts motion to BOUNDARY or CLAIMED neighbours; pressing Space + heading into a VOID neighbour commits to DRAW. While drawing, the marker advances at a constant rate in its last heading, painting DRAWING cells behind it; turning is allowed but stopping is not, and self-cross is fatal. When the marker re-enters a BOUNDARY/CLAIMED cell the trail promotes to BOUNDARY and we run Gendel's single 4-connected flood from the Qix's cell across the remaining VOID — anything the flood doesn't reach is the unreachable side and becomes CLAIMED. Trails shorter than three cells are rejected as zero-area and kill the run, preventing soft-locks. See `src/content/primitives/qix-area-claim/research.md` for the canonical algorithm.

## Code map

- `index.html` — boot
- `game.js` — the primitive (≤ 400 lines)
- `style.css` — visuals
- `sw.js` — offline shell

Read `game.js`. Interesting parts are commented `// mechanism:`.
