---
id: asteroids-rotate-thrust
status: researched
research_date: 2026-05-11
sources_used: 7
---

## Player verb

The player rotates a triangular ship to point a heading, applies forward thrust against linear inertia, and shoots along the current facing — all inside a doubly-wrapped torus where every edge stitches to its opposite.

## Canonical originator

*Asteroids*, Atari, 1979, Arcade. Conceived by Lyle Rains and programmed by Ed Logg, with hardware contributions from Howard Delman[^1][^2]. The cabinet ran a MOS 6502 paired with Atari's QuadraScan (a.k.a. the Digital Vector Generator) driving an XY vector monitor[^1][^3]. Development took roughly six months and shipped in November 1979; Atari sold over 70,000 units, making it the company's best-selling arcade game[^1][^2].

The prior art Logg drew on is explicit: *Spacewar!* (MIT, 1962) had already established rotate-and-thrust as a two-player verb on a vector display, and *Computer Space* (Nutting, 1971) commercialised it[^1]. What was new in *Asteroids* was the combination of three elements that no earlier game fused: (1) a destructible field of objects that fission into smaller, faster children on impact, giving the level a procedurally accelerating density; (2) screen-wrap topology applied to ship, bullets, saucer, and rocks alike, making the play space a torus instead of a bounded arena; (3) a tuned inertial drift that Logg explicitly tweaked away from frictionless *Spacewar!*-style infinite glide, because that made survival trivial, and away from aggressive friction, which made the ship feel dead[^4]. The settled midpoint — gentle decay, not zero, not strong — is the load-bearing feel.

## Variations and successors

- *Asteroids Deluxe* (Atari, 1981, Arcade): replaces hyperspace with a depleting shield, adds rotating asteroids and the "Killer Satellite" that fissions into homing ships, and lets saucers target across the wrap[^5].
- *Space Duel* (Atari, 1982, Arcade): same rotate-thrust verb, but rocks become coloured geometric shapes and adds tethered two-player co-op[^6].
- *Blasteroids* (Atari Games, 1987, Arcade): raster reimplementation; adds power-ups, ship morphing (speeder/fighter/warrior), branching map, bosses, ship-docking co-op[^6].
- *Sinistar* (Williams, 1983, Arcade): rotate-thrust in 8-way scrolling space rather than a wrapped screen; adds resource extraction (sinibombs) and a single named pursuer[^6].
- *Solar Quest* (Cinematronics, 1981, Arcade): vector clone with central-gravity well — the wrap becomes radial attraction.
- *Gravitar* (Atari, 1982, Arcade): rotate-thrust under per-planet gravity wells with tractor-beam rescue; descends from *Lunar Lander* lineage as much as *Asteroids*.
- *Star Castle* (Cinematronics, 1980, Arcade): rotate-thrust around a fixed central fortress with rotating ring defences.
- *Oids* (FTL, 1987, Atari ST/Amiga): rotate-thrust with continuous gravity, rescue-and-return objective; pure *Thrust*-family hybrid.
- *Thrust* (Superior Software, 1986, BBC/C64): rotate-thrust under gravity in tunnel mazes, with cargo tether physics.
- *Space Taxi* (Muse, 1984, C64): see [[space-taxi-precision-thrust]] — soft-touchdown variant in a non-wrapped chambered map.
- *Geometry Wars: Retro Evolved* (Bizarre Creations, 2005, Xbox 360): keeps the bounded-torus arena and screen-wrap-style geometry but decouples aim from movement; see [[robotron-twin-stick]].
- *Resogun* (Housemarque, 2013, PS4): horizontally-wrapping cylinder rather than torus, but inherits the *Asteroids* lineage of "destroy a fissioning field while the camera holds still"[^6].
- *Asteroids: Recharge* (Atari/Adamvision, 2021, Multi): roguelite skin with persistent upgrades, otherwise the verb is intact.

## Algorithm / math

Asteroids' original 6502 implementation uses semi-implicit Euler integration on 16-bit fixed-point position, 8-bit direction, and lookup-table-driven thrust decomposition. The disassembly confirms `ShipXPosHi/ShipXPosLo`, `ShipYPosHi/ShipYPosLo` (16-bit position), `ShipXSpeed`/`ShipYSpeed` (velocity), `ShipXAccel`/`ShipYAccel` (accumulated thrust), and `ShipDir` (8-bit, 256 = one full turn)[^7]. The main loop runs at a submultiple of the NMI clock and velocities are capped (the disassembly shows `cmp #112; bcc SaveObjXVel`)[^7].

```text
State per ship:
  pos:       (x, y)         # 16-bit fixed-point each
  vel:       (vx, vy)
  dir:       θ              # 0..255 → 0..2π
  thrust_on, rotate_l, rotate_r, fire, hyperspace : bool

Constants (1979 cabinet, approximate):
  ROT_STEP   = 1 unit / frame  (≈ 1.4° per tick)
  THRUST     = small lookup value, scaled by 2× then added to accel
  FRICTION   = 1 − ε          (multiplicative decay, ε small)
  V_MAX      ≈ 112 sub-pixels / frame on each axis
  SCREEN_W, SCREEN_H = playfield dimensions in vector units

Per-tick update (semi-implicit Euler, original is dt = const):
  if rotate_l: dir = (dir − ROT_STEP) mod 256
  if rotate_r: dir = (dir + ROT_STEP) mod 256

  if thrust_on:
    ax = SIN_TABLE[dir] * THRUST    # lookup, no real-time trig
    ay = −COS_TABLE[dir] * THRUST   # screen y grows downward
    vx += ax
    vy += ay

  vx *= FRICTION                    # gentle inertial decay
  vy *= FRICTION
  vx = clamp(vx, −V_MAX, +V_MAX)
  vy = clamp(vy, −V_MAX, +V_MAX)

  x = (x + vx) mod SCREEN_W         # torus wrap, both axes
  y = (y + vy) mod SCREEN_H

  if fire and bullet_slots_free:
    spawn_bullet(x, y, dir, BULLET_SPEED)   # inherits ship vel? No — fixed muzzle speed in v−frame

  if hyperspace:
    x, y = rand_pos(); vx, vy = 0, 0
    with small probability: destroy_self()
```

Bullets, asteroids, and saucers share the same wrapped-Euler scheme. Asteroid fission on bullet impact spawns 2–3 children at the parent's position with randomised heading and a speed scaled up by a per-size factor — the curve that makes screen-clear feel like an emergent fight against acceleration. Collisions are point-in-polygon against the convex hull of each vector sprite (the disassembly references vector-data subroutines for exactly this), not bounding-circle, which is why the ship's spindly tail kills you.

Two implementation hazards a modern port must address:

1. **Framerate coupling.** The 6502 build integrates with implicit `dt = 1 frame`, so all velocity, friction, and rotation constants are calibrated to the QuadraScan refresh — frame rate dependent. A modern vanilla-JS port must multiply every accumulation by `dt` and replace the multiplicative `vx *= FRICTION` with `vx *= pow(FRICTION, dt * 60)` (or the equivalent `exp(-k * dt)` formulation) to stay frame-rate-independent.

2. **Wrap-aware collision.** Bullets near a wrapped edge must collision-test against ghost copies of every object on the opposite side (or, equivalently, compute the toroidal minimum distance `min(|dx|, W-|dx|)` on each axis). Naive AABB tests miss the wrap.

## Player-experience hooks

The verb's mastery curve runs on two contradictory pressures. Thrust adds momentum but every shot is a static muzzle vector, so the player who flies the cleanest line is the player who shoots least. Beginners thrust constantly, slingshot themselves into faster-moving small rocks, and die to their own velocity. Experts learn to fire-without-thrusting from drifting orientation, treating the ship as an aimed gun mounted on a glider. Steve Swink would call the felt control "indirect with high inertial latency"; the failure mode is **player-induced compounding** — a momentum debt accrued earlier becomes a death seconds later, and you cannot brake, only counter-thrust.

The fission curve is the secondary loop. Each shot multiplies the on-screen object count up to a limit, so a level's apparent difficulty inverts: early shots are easy and create the late-level swarm. Hyperspace is the escape valve — pure non-determinism, sometimes lethal — which forms a third axis of decision. The torus topology means there is no corner, no safe edge: the playfield admits no positional retreat, only velocity management.

## Convergence notes

Shares semi-implicit Euler thrust integration with [[lunar-lander-thrust]] and [[space-taxi-precision-thrust]] but differs in gravity (zero here vs. constant-downward in Lunar Lander) and in topology (torus vs. bounded). Shares the screen-wrap world with [[defender-radar-rescue]] (which wraps on one axis only and adds a radar to compensate). Shares the rotate-and-fire-along-facing input model with [[space-invaders-vertical-shot]] degenerately — Invaders is the case where rotation is removed and the heading is fixed to up. Twin-stick descendants like [[robotron-twin-stick]] explicitly *unfuse* the move and aim vectors that *Asteroids* binds together, which is what makes that primitive distinct rather than a variation.

## Suggested mini-game scope

Single HTML file, canvas-2D, vanilla JS, no assets. Implement: one player ship as three line segments, four rocks at scene start, fission to two smaller children on hit (three sizes, terminal small destroyed outright). Five inputs: rotate-left, rotate-right, thrust, fire, hyperspace. Use `requestAnimationFrame` with a measured `dt`, semi-implicit Euler, toroidal modulo on `x` and `y`. Collisions: simple radius test, but compute toroidal distance, not Euclidean. Skip saucers, score-extra-life, and sound. Aim for ~300 LOC including the tiny vector-draw helpers. Goal: in 30 seconds the player should feel the cost of momentum.

## References

[^1]: Asteroids (video game) — Wikipedia — https://en.wikipedia.org/wiki/Asteroids_(video_game) — retrieved 2026-05-11
[^2]: Atari Asteroids: Creating a Vector Arcade Classic — The Arcade Blogger — https://arcadeblogger.com/2018/10/24/atari-asteroids-creating-a-vector-arcade-classic/ — retrieved 2026-05-11
[^3]: Ed Logg — Wikipedia — https://en.wikipedia.org/wiki/Ed_Logg — retrieved 2026-05-11
[^4]: Outstanding Ideas: Ed Logg on Asteroids and Gauntlet — Game Developer (Gamasutra archives) — https://www.gamedeveloper.com/business/outstanding-ideas-ed-logg-on-asteroids-and-gauntlet — retrieved 2026-05-11
[^5]: Asteroids Deluxe — Wikipedia — https://en.wikipedia.org/wiki/Asteroids_Deluxe — retrieved 2026-05-11
[^6]: Best Asteroids-Style Games — survey of successors (Space Duel, Blasteroids, Sinistar, Resogun) — https://clashroids.com/asteroids-games — retrieved 2026-05-11
[^7]: Asteroids Disassembly (6502 ROM, commented) — 6502disassembly.com — https://www.6502disassembly.com/va-asteroids/Asteroids.html — retrieved 2026-05-11
