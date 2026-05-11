# Baba Is You Rewrite

**Player verb**: push word-tiles to rewrite game rules

**Canonical originator**: Baba Is You (2019, PC) — Hempuli / Arvi Teikari

## How to play

- Arrow keys / WASD — step one cell in that direction
- Space — wait (advances a turn with no movement)
- Z — undo one turn (50-step buffer)
- R — restart the level
- Touch — swipe (>= 24px) on the playfield; corner buttons for undo / restart

You are the pink B. The yellow F is the goal. The grey walls block you because
of one sentence on the board: `WALL IS STOP`. Read every sentence — the
geometry IS the rulebook.

## What to notice

The sentences sit in the playfield as pushable word-tiles. Shoving a single
word out of a row destroys that rule on the next turn — walls stop stopping,
rocks stop being pushable, flags stop being winnable. The aha is the inversion
moment: the wall that blocked you a second ago is now empty space because you
moved a three-letter word.

Try: push `IS` or `STOP` out of `WALL IS STOP` and walk through the fortress.
Then break `BABA IS YOU` and watch the world stop responding to your arrows.

## The mechanism

Each keypress is one atomic turn. `step(dir)` snapshots the grid, attempts to
move every `YOU`-tagged object in the chosen direction (pushing chains of
`PUSH`-tagged tiles), then `parseRules()` re-scans every row and column for
`SUBJECT IS PREDICATE` triples. Properties (`YOU`, `WIN`, `STOP`, `PUSH`) are
rebuilt from scratch from whatever sentences currently exist on the grid, so a
rule the player just destroyed truly disappears. Finally, a win-check tests
whether any `YOU` shares a cell with a `WIN`. See `research.md` for the
algorithmic provenance and Teikari's design notes.

## Code map

- `index.html` — boot
- `game.js` — the primitive (~390 lines)
- `style.css` — visuals
- `sw.js` — offline shell

Read `game.js`. The rule-rewrite verb lives in `parseRules`, `attemptMove`,
`step`, and `checkWin` — all commented `// mechanism:`.
