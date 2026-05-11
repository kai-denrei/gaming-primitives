# Boulder Dash Falling Rocks

**Player verb**: dig dirt to reach a diamond quota while a gravity-on-grid
cellular automaton drops rocks (and diamonds) the instant their support
is removed.

**Canonical originator**: Boulder Dash (1984, Atari 800) — First Star /
Peter Liepa, Chris Gray.

## How to play

- Arrow keys / WASD: one step per fresh keypress (no auto-repeat).
- Walking into dirt digs it. Walking into a diamond collects it.
- A rock you step into sideways pushes one cell IF the cell beyond it is
  empty; you cannot push up or down.
- The exit (bottom-right) opens once you have collected 4 diamonds, and
  pulses cyan-to-white to signal it.
- R restarts the level.
- Touch: swipe (>= 24 px) to step in the swipe direction; bottom-right
  RST button restarts.

## What to notice

Gravity is your weapon and your assassin. Stand directly under a stack of
rocks and pull the keystone of dirt from the side, then step clear before
the cascade lands on the cell you were standing in. The diamond beneath
the rock pile in the right column requires this — see if you can get to
it without dying once. The 4-cell-wide gap of unreachable diamonds in the
walled chamber is deliberate: total diamonds on the level (6) exceed the
quota (4) so the puzzle is solvable without optimal play.

The classic Boulder Dash footgun: collect a diamond that had a rock above
it, then take ONE more downward step. That second step opens the cell
under the rock; the next physics scan crushes you.

## The mechanism

Every keypress runs one logical turn. `tryMove` resolves the player step
(move into EMPTY/DIRT/DIAMOND, push a ROCK horizontally if the cell
beyond is EMPTY, enter EXIT if quota is met). Then `scanPhysics` is
iterated to a fixed point: a bottom-up grid sweep that, for each ROCK or
DIAMOND, lets it fall one row if the cell below is EMPTY, kills the
player if a FALLING tile lands on them, lands a falling tile if its below
is solid, or topples a resting tile one cell left-then-right into an
empty side cell whose own below is also empty. The outer loop iterates
until no transition occurs, so the entire cascade — drop, land, topple,
drop, land — happens in one keypress. `tick(dt)` only walks down the
render tween and exit pulse; the rule logic is dt-independent.

See `src/content/primitives/boulder-dash-falling-rocks/research.md` for
the canonical-game lineage and `spec.md` for the reduced ruleset this
implementation follows.

## Code map

- `index.html` — boot, viewport, iOS PWA tags, SW registration.
- `game.js` — the primitive (~400 lines). Read `step`, `tryMove`,
  `scanPhysics`, `tryTopple` — all commented `// mechanism:`.
- `style.css` — era theming, fullscreen stage, reduced-motion respect.
- `sw.js`, `manifest.webmanifest`, `offline.html` — PWA shell.
- `icons/` — generated.
