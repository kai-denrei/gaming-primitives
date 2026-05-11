# Defender of the Crown Catapult

**Player verb**: pre-commit angle and power for a ballistic shot

**Canonical originator**: Defender of the Crown (1986, Amiga) — Cinemaware / Kellyn Beck

## How to play

- ArrowUp / ArrowDown — adjust angle by 1 degree (hold for 12 Hz repeat; range 20–80)
- ArrowLeft / ArrowRight — adjust power by 1 unit (hold for 12 Hz repeat; range 40–140)
- Space — fire (edge-triggered; locked while a stone is airborne)
- R — restart the siege
- Touch (landscape): top horizontal slider sets angle, right vertical slider sets power, bottom-center FIRE button launches, top-right R button restarts

Five stones. Reduce the wall to half (24 of 48 bricks remaining or fewer) to win.

## What to notice

The whole input surface is two numbers. There is no aim line, no preview, no in-flight steering — the moment you tap Space the outcome is fixed and you become a spectator for a second of parabola. After thirty seconds you should feel **blind commitment under budget**: every miss is a Bayesian update on the angle/power-to-distance function you cannot see, and you have five stones to triangulate before exhaustion. The failure-mode taxonomy is the teaching surface — short-fall (under-power), overshoot (over-power), flat-bounce (angle too low to clear the front of the wall), near-miss (one tick off). Try resisting the urge to spam fire-on-aim: the value lives in the read of each miss, not the rate.

## The mechanism

`launch()` decomposes the two scalars into orthogonal velocity components: `vx = power·cos(angle)`, `vy = -power·sin(angle)`. From that instant `tick()` integrates the stone with semi-implicit Euler under a constant gravity (320 u/s², logical 480×270 playfield) — velocity is updated before position so the discretisation stays stable for the full range of powers. Each tick substeps `ceil(|v|·dt / 4)` times against the 14×10 px brick AABBs so a 140-power shot cannot tunnel through a brick in one frame. A direct hit removes the struck brick and stops the projectile with a single-frame `#ff5e3a` flash and a small dust puff — bouncing was rejected as visually confusing for the verb (the player wants to read where it landed, not where it ricocheted). `endShot` evaluates WIN before LOSE so a breach on the final stone counts as a win rather than as exhaustion. Hold-repeat is a dt-accumulator clocking at 12 Hz, not `setInterval`. See [`research.md`](../../../src/content/primitives/defender-of-the-crown-catapult/research.md) for the artillery-lineage context and the *Worms* / *Angry Birds* convergence levers this primitive deliberately omits.

## Code map

- `index.html` — boot
- `game.js` — the primitive (~360 lines, ~260 effective per spec budget)
- `style.css` — visuals
- `sw.js` — offline shell

Read `game.js`. Interesting parts are commented `// mechanism:`.
