---
id: defender-of-the-crown-catapult
status: researched
research_date: 2026-05-11
sources_used: 7
---

## Player verb

The player sets an angle and a power level for a single catapult stone, releases the shot in one decisive input, and watches a parabolic arc resolve against a castle wall — with no in-flight steering, no preview trajectory, and a hard cap on how many stones the siege allows.

## Canonical originator

*Defender of the Crown*, Cinemaware, 1986, Amiga. Designed by Kellyn Beck as Cinemaware's launch title for the "interactive movie" line; the catapult is one of four arcade interludes (jousting, sword duel, rescue, siege) embedded in a turn-based strategic map of post-Norman England[^1][^2]. The Amiga build, programmed by R. J. Mical with art by Jim Sachs, exploited the blitter and a 32-colour palette to render the castle at a fidelity unmatched on contemporary 8-bit ports, and was widely used as a demo disk to sell Amiga hardware[^2][^3]. Ports to Atari ST, Apple IIGS, C64, NES, PC-DOS, and later iOS, XBLA, and Wii followed between 1987 and 2008, each downgrading the art but preserving the four-minigame structure[^1][^4].

The verb's prior art is the mainframe artillery lineage: Mike Forman's BASIC *Artillery* (1976) and the *War 3* / *Artillery* family on PDP-10 and HP timeshare systems established the "type an angle, type a velocity, watch the shell" loop[^5]. Astrocade's *Artillery Duel* (1982) brought it to a console cartridge, with two tanks and a destructible mountain between them[^5]. What was new in Cinemaware's catapult was the framing: the player faces a static, non-firing castle rather than a symmetric opponent; the input is a real-time two-stage commit (angle bar, then power bar, both swept by held button) rather than a typed number; and the segment exists inside a strategic wrapper where each stone has campaign cost. The minigame strips artillery to a single decision per shot — closer to a free-throw than a duel.

## Variations and successors

- *Artillery* (Mike Forman, 1976, mainframe BASIC): the type-in ancestor — input angle and powder charge as numbers, single-shot, symmetric two-player[^5].
- *Artillery Duel* (Xonox / Astrocade, 1982, Atari 2600 / Astrocade / ColecoVision): two-tank symmetric duel over a mountain with adjustable wind; cartridge-era canonical form[^5].
- *Tank Wars* / *Gorillas.BAS* (Microsoft, 1991, PC-DOS): the bundled QBasic "throw bananas between gorillas atop New York skyscrapers" demo; same angle-and-power input model, square-of-velocity range, fixed wind per round[^6].
- *Scorched Earth* (Wendell Hicken, 1991, PC-DOS): up to ten tanks, dozens of weapon types with distinct ballistic and explosion models, per-shot wind, destructible terrain, purchasable shields and fuel — the genre's maximalist endpoint[^7].
- *Pocket Tanks* (BlitWave / Michael P. Welch, 2001, Win/Mac/iOS/Android): two-tank duel reduced again, with 30+ weapons per side selected pre-match; movement budget per turn turns it into a positional game.
- *Worms* (Team17 / Andy Davidson, 1995, Amiga): the major divergence — see [[worms-bazooka-wind]]. Adds per-turn unit movement, wind, an environmental terrain, and crucially shifts the input model from pre-commit numeric set-and-fire to hold-to-charge-then-release in real time per shot.
- *Worms 2* / *Worms Armageddon* (Team17, 1997 / 1999, multi): keeps the verb, refines weapon roster and physics; *Armageddon* remains the lineage's competitive reference[^8].
- *Hogs of War* (Infogrames, 2000, PS1/Win): 3D *Worms* with anthropomorphic pigs; the camera moves but the shot is still pre-committed.
- *Angry Birds* (Rovio, 2009, iOS): drag-release slingshot variant — input becomes a single pinch-and-release vector rather than a two-stage angle/power commit; the trajectory is partially previewed as a dotted trail after release[^9].
- *Angry Birds Space* (Rovio, 2012, multi): adds per-planet gravity wells around the arc; convergence with [[lunar-lander-thrust]]'s force field on top of the same input model[^9].
- *Tank Stars* (Playgendary, 2018, iOS/Android): mobile *Pocket Tanks* descendant with energy-bar charge and instant-result animations.

## Algorithm / math

Source code for the Cinemaware build is not in public circulation; the algorithm is reconstructed from gameplay observation across the Amiga, C64, and DOS ports, and from the documented behaviour of the same-era artillery family[^2][^4][^5]. The model below produces visually equivalent arcs and consistent hit/miss outcomes against the castle silhouette.

```text
State per shot:
  pos:    (x, y)            # stone position, screen coords, y-down
  vel:    (vx, vy)
  g:      gravity            # constant downward acceleration
  alive:  bool
  ground_y: int              # baseline of castle and earth

Pre-shot input (two stages, held button sweeps a bar):
  angle  ∈ [θ_min, θ_max]    # e.g. 30°..80° from horizontal
  power  ∈ [P_min, P_max]    # e.g. 20..120 in screen-units/tick

Launch (single commit; no in-flight steering):
  vx =  power * cos(angle)
  vy = -power * sin(angle)   # negative because y grows downward
  pos = catapult_muzzle

Per-tick integration (semi-implicit Euler, dt = 1 frame):
  vy += g * dt               # gravity acts only on vertical
  pos.x += vx * dt
  pos.y += vy * dt

Termination — checked in this order each tick:
  1. if pos.y >= ground_y:                          → MISS (ground)
  2. if AABB(pos) overlaps castle_wall_rect:        → HIT_WALL
       if HIT_WALL strikes designated weak_spot:    → BREACH
  3. if pos.x > screen_right_edge:                  → MISS (overshoot)
  4. if shots_remaining == 0 and not BREACH:        → LOSE_SIEGE
```

Three design choices are load-bearing:

1. **Pre-commit, no preview.** The original draws no trajectory before release and offers no aim-line overlay. The player commits blind and watches the result — the same epistemic position as Forman's 1976 *Artillery*. *Worms* (1995) lets the player rehearse with a "dummy" reticule; *Angry Birds* (2009) shows the trail post-release. Whether to render a preview is the lever that re-genres the primitive.

2. **No wind, no in-flight steering.** Cinemaware's catapult omits the wind variable that *Artillery Duel*, *Gorillas*, *Scorched Earth*, and *Worms* all include. The arc is a clean parabola with two degrees of freedom mapped to a one-dimensional target line. Adding wind under-determines the result and turns the loop into a learn-the-wind regression — the *Worms* shift documented in [[worms-bazooka-wind]].

3. **Shot budget as commit pressure.** A finite stone count per siege gives every shot campaign-level cost — closer to a free-throw than to an arcade shooter.

Hit detection in the original appears to be an AABB test of the projectile against the castle wall sprite, with a smaller embedded weak-spot rectangle that triggers the breach animation [NEEDS VERIFICATION: per-port collision form].

## Player-experience hooks

The signature feel is **blind commitment under budget**. The player sweeps a power bar, releases, and is then a spectator for two seconds of parabola. Failure modes cluster: the short-fall (under-powered, lands in the moat), the overshoot (sails behind the castle), the flat-trajectory wall-bounce (angle too low, stone skips off the battlements), and the near-miss (correct angle, power one tick off). The mastery curve is Bayesian: each miss is a posterior update on the unknown angle/power-to-distance function, and three or four shots are typically enough to triangulate the weak spot. Swink's vocabulary calls this **deferred feedback under high commitment latency** — the input cost is fixed the moment the second bar releases, and the system's reply is the entire flight.

What it does *not* feel like: aiming. Aiming implies continuous adjustment against a moving reticule; here the reticule is a pair of one-dimensional bars and the world is invisible during input. The closer cousins are pinball nudging and free-throw shooting — verbs where the body sets a parameter and watches gravity finish the action.

## Convergence notes

Closest cousin in the catalog is [[worms-bazooka-wind]], which inherits angle-power-launch and adds two complications: a per-shot wind variable that perturbs `vx` mid-flight, and a per-turn movement budget that turns positioning into part of the verb. The pre-commit-blind input is preserved; what changes is the dimensionality of the decision (angle, power, position, wind-compensation) and the existence of a continuously-shown aim reticule.

Shares semi-implicit Euler integration under constant gravity with [[lunar-lander-thrust]] but inverts the verb: Lunar Lander runs the integrator under continuous player thrust to *null* a velocity at a target; the catapult sets a velocity once and lets the integrator run uncontested. Shares the parabolic arc with [[donkey-kong-platform-arc]] and [[mario-platform-arc]] but those are character-jumps with mid-air horizontal control, which is exactly the steering this primitive denies. Shares the one-shot timing-window feel — the moment of release fixes the outcome — with [[pinball-flipper-deflect]], where the flipper's contact angle and timing similarly determine the ball's exit vector with no further input.

## Suggested mini-game scope

Single HTML file, canvas-2D, vanilla JS, no assets. Render a catapult silhouette on the left, a castle silhouette with a clearly marked weak spot on the right, flat ground between. Two-stage input: press and hold space to sweep an angle bar, release to lock; press and hold space again to sweep a power bar, release to launch. Integrate the stone with semi-implicit Euler under constant gravity, draw it as a single pixel-trail. Resolve on ground-hit, wall-hit, or off-screen with three distinct outcome states (miss-short, hit-wall, breach-weak-spot). Five shots per siege; breach wins, exhaustion loses. No wind, no preview line, no in-flight controls — those are the convergence levers and removing them is the point. Aim for ~250 LOC. Goal: in 30 seconds the player should feel the cost of committing blind.

## References

[^1]: Defender of the Crown — Wikipedia — https://en.wikipedia.org/wiki/Defender_of_the_Crown — retrieved 2026-05-11
[^2]: Defender of the Crown — MobyGames — https://www.mobygames.com/game/179/defender-of-the-crown/ — retrieved 2026-05-11
[^3]: Cinemaware — Wikipedia — https://en.wikipedia.org/wiki/Cinemaware — retrieved 2026-05-11
[^4]: Hardcore Gaming 101: Cinemaware overview — Hardcore Gaming 101 — http://www.hardcoregaming101.net/cinemaware/ — retrieved 2026-05-11
[^5]: Artillery game — Wikipedia — https://en.wikipedia.org/wiki/Artillery_game — retrieved 2026-05-11
[^6]: Gorillas (video game) — Wikipedia — https://en.wikipedia.org/wiki/Gorillas_(video_game) — retrieved 2026-05-11
[^7]: Scorched Earth (video game) — Wikipedia — https://en.wikipedia.org/wiki/Scorched_Earth_(video_game) — retrieved 2026-05-11
[^8]: Worms (1995 video game) — Wikipedia — https://en.wikipedia.org/wiki/Worms_(1995_video_game) — retrieved 2026-05-11
[^9]: Angry Birds (video game) — Wikipedia — https://en.wikipedia.org/wiki/Angry_Birds_(video_game) — retrieved 2026-05-11
