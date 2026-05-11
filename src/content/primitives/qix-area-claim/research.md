---
id: qix-area-claim
status: researched
research_date: 2026-05-11
sources_used: 9
---

## Player verb

The player walks a diamond marker along the edges of claimed territory and, at will, peels off into the void to draw a closed polygonal line that — on touching any existing boundary — partitions the playfield into two regions, one of which is permanently claimed, against a moving abstract hazard that destroys any line still in progress.

## Canonical originator

*Qix*, Taito (America), October 1981, Arcade. Designed by the husband-and-wife team Randy and Sandy Pfeiffer, *Qix* is one of the few titles produced by Taito's American division rather than its Japanese parent[^1][^2]. The cabinet runs two Motorola 6809E processors (a main "game" CPU and a dedicated "video" CPU) at 1.25 MHz each, with a third 6802 for sound driving an 8-bit DAC and a (per the schematic, never wired) TMS5220 speech chip; the screen is a vertical raster monitor at 256×256 pixels with an 8-bit framebuffer[^3]. The hardware is over-specced for a line-drawing game on purpose: the second CPU exists so the main game logic never blocks on the pixel-level flood-fill that resolves every claim.

Prior art for the verb is sparse. The dot-eating territorial loop of *Head On* (Sega, 1979) and *Pac-Man* (Namco, 1980) and the paint-the-floor traversal of *Amidar* (Konami, 1981) all measured claim by *edge traversed*[^1]. *Qix* changes the unit to *area enclosed*, which lets a confident stroke take a quarter of the screen and a timid one take a tile. The Pfeiffers also introduced what is now a stock arcade pattern: the antagonist is not a character but a parameterised visual particle system — a bundle of rotating, length-varying line segments whose only role is to make empty space dangerous. Win condition: claim 75% of the screen, operator-adjustable between 50% and 90%[^1].

## Variations and successors

- *Qix II: Tournament* (Taito, 1982, Arcade): two-player simultaneous, tournament timer; verb unchanged[^1].
- *Xonix* (Ilan Rav, 1984, PC-DOS): replaces the Qix with bouncing balls in the void plus edge enemies; forces right-angle draws only[^4][^5].
- *Super Qix* (Taito, 1987, Arcade): grid-snapped draws, bonus tiles, bouncing-ball hazard[^1].
- *Volfied* / *Ultimate Qix* (Taito, 1989, Arcade; ports to Genesis, PS1): SF reskin as ship Monotros, 80% threshold, shootable laser line, boss-Qix per stage, power-ups[^6].
- *Gals Panic* (Kaneko, 1990, Arcade): pinup-reveal reskin; identical loop; sequels through *Gals Panic S 3* (2002) and Saturn port *Gals Panic SS* (1996)[^7].
- *JezzBall* (Microsoft / Pavlovsky, 1992, Win 3.x): right-angle wall-extension only; multiple bouncing balls; 75% threshold[^8].
- *Twin Qix* (Taito, 1995, Arcade prototype): cooperative two-player; never released[^1].
- *Qix Adventure* (Taito, 1999, Game Boy Color): branching stage map, per-stage bosses[^1].
- *AirXonix* (KraiSoft, 2000, Win): 3D-rendered *Xonix*[^4].
- *Battle Qix* (Taito, 2002, PS1): split-screen versus over a shared field[^1].
- *Qix++* (Taito, 2009, XBLA / PSP): canonical verb with online leaderboards[^1].

## Algorithm / math

Behaviour is reconstructed from cabinet docs, MAME's `taito/qix.cpp` driver, and published analyses of the claim resolution[^3][^9]; pixel-level source for the Pfeiffer build is not in public circulation.

```text
Constants (1981 cabinet, vertical 256x256):
  W, H = 256, 256
  TARGET_PERCENT = 75       # operator-adjustable 50..90
  SLOW_MULT, FAST_MULT = 2, 1
  FUSE_DELAY = ~1s of standstill in draw mode

Grid (one byte per cell in dual-ported video RAM):
  cell ∈ { VOID, BOUNDARY, CLAIMED_FAST, CLAIMED_SLOW, DRAWING }

Marker state:
  pos = (mx, my); on_boundary: bool
  drawing ∈ { none, fast, slow }       # selected by fire-button held
  trail: list[(x, y)]                  # pixels since leaving boundary

Qix: N line segments, each (p_a, p_b, v_a, v_b). Per tick each endpoint
  steps by its velocity, bouncing (negate normal component) off any
  cell in {BOUNDARY, CLAIMED_*, DRAWING}, with a small random
  perturbation each frame so it never falls into a periodic orbit.
  Trail-touch = player death.

Sparx: 1-D walkers on the BOUNDARY graph. Each holds a current edge
  and direction; at junctions pick an outgoing edge (biased toward
  the marker once Super Sparx triggers). Cannot enter VOID.

Fuse: if drawing and marker idle for FUSE_DELAY ticks, spawn at
  trail[0], advance one trail-cell per tick; reach marker = death.
```

Tick loop: read 4-way joystick + two buttons. If `on_boundary and not drawing`, the marker slides along boundary cells, never entering `VOID`. If `drawing`, the candidate next cell is checked: a `VOID` cell becomes `DRAWING` and is appended to `trail`; a `BOUNDARY`/`CLAIMED_*` cell triggers `close_polygon()`; the marker cannot cross its own trail. Then advance the Qix segments, advance Sparx along the boundary graph, advance the fuse if standstill. Any collision of `qix_segments` with `trail`, `sparx` with marker, or `fuse` reaching marker is a life lost.

Claim resolution on `close_polygon()` — the core algorithm:

```text
1. Promote every cell in `trail` from DRAWING to BOUNDARY.
2. Pick two seed pixels, one left and one right of the first trail
   step relative to the local tangent. They lie in the two new
   VOID regions A and B.
3. Four-connected flood-fill from each seed, counting cells and
   short-circuiting on any Qix-segment pixel. Tag visited cells
   SCRATCH_A / SCRATCH_B in video RAM.
4. Record qix_in_A, qix_in_B; count_A, count_B.
5. CLAIMED = whichever of {A, B} the Qix is NOT in. If the Qix
   straddles both (rare: a draw split it — multi-Qix bonus), claim
   the smaller region.
6. Repaint SCRATCH for the claimed side as CLAIMED_FAST or
   CLAIMED_SLOW by drawing mode; revert the other to VOID.
7. score += claimed_count * (SLOW_MULT if slow else FAST_MULT)
8. if total_CLAIMED / (W*H) >= TARGET_PERCENT: advance_level()
```

The second-CPU split exists for step 3: a 256×256 flood is hundreds of thousands of 6809E instructions worst-case, unaffordable per draw on the game CPU. Gendel's reconstruction[^9] collapses it to one pass: rasterise the trail as `BOUNDARY`, flood once from the Qix's pixel, define `CLAIMED = VOID \ reachable_from_qix`. Most modern clones use this form.

The slow/fast distinction is a per-pixel scoring tag stamped at claim time. Drawing speed is mathematically identical; the slow button reduces the marker's step rate and marks the trail for the 2× multiplier — the player trades clock seconds for points while the Qix moves at full speed.

## Player-experience hooks

The signature feel is committed exposure. The instant the marker leaves the boundary, it is staked: it cannot reverse, cannot stop without growing a fuse, and is killed by any contact with the Qix or by a Sparx running down the trail from behind. The mastery curve runs along three axes — *bite size* (large polygons close faster but give the Qix more time to interfere), *fast or slow draw* (the 2× multiplier is the entire scoring economy), and *risk geometry* (drawing under the Qix's heading is suicide; drawing perpendicular buys frames). Swink's vocabulary fits poorly because the marker has no inertia; what the player feels instead is **commitment latency** — the moment the input goes in, the cost of that input is fixed for several seconds. Characteristic deaths: the fuse death (frozen by indecision), the Sparx-from-behind death (forgot the edge-walker), the Qix-rebound death (drew toward a wall it was already heading for).

## Convergence notes

No close-kin spatial-claim primitives are currently in the catalog; future entries on territory-control mechanics (*JezzBall*-style right-angle build, *Splatoon*-style paint coverage, area-control RTS) should land beside this one. The trail-that-kills-on-contact shares geometry with [[lode-runner-dig-fall]] in the negative sense only — both let the player edit the level — but *Lode Runner*'s dig is a local discrete edit while *Qix*'s draw is a global region partition. The committed-exposure feel is closer to [[defender-of-the-crown-catapult]] (one-shot timing window) than to any continuous-control primitive in the set, despite the unrelated surface mechanics.

## Suggested mini-game scope

Single HTML file, canvas-2D, vanilla JS, no assets. A 200×150 logical grid scaled 3× on screen; cells in `{VOID, BOUNDARY, CLAIMED, DRAWING}` stored as a flat `Uint8Array`. One marker, one bouncing two-segment Qix with random-perturbed velocity, no Sparx, no Fuse — those add complication, not understanding. Controls: arrow keys + Z (fast draw) / X (slow draw). On close, run one flood from the Qix's pixel; everything in `VOID` not reached becomes `CLAIMED`. Score per pixel, 2× for slow. Win at 75%. Aim ~350 LOC including the flood and a `requestAnimationFrame` loop. Goal: in 30 seconds the player should feel the cost of leaving the boundary.

## References

[^1]: Qix — Wikipedia — https://en.wikipedia.org/wiki/Qix — retrieved 2026-05-11
[^2]: Qix — The Arcade Museum (Museum of the Game) — https://www.arcade-museum.com/Videogame/qix — retrieved 2026-05-11
[^3]: MAME source: `src/mame/taito/qix.cpp` (Qix hardware driver) — MAMEdev on GitHub — https://github.com/mamedev/mame/blob/master/src/mame/taito/qix.cpp — retrieved 2026-05-11
[^4]: Xonix (1984) — MobyGames — https://www.mobygames.com/game/46702/xonix/ — retrieved 2026-05-11
[^5]: Qix variants (group) — MobyGames — https://www.mobygames.com/group/3678/qix-variants/ — retrieved 2026-05-11
[^6]: Volfied — Wikipedia — https://en.wikipedia.org/wiki/Volfied — retrieved 2026-05-11
[^7]: Gals Panic — Wikipedia — https://en.wikipedia.org/wiki/Gals_Panic — retrieved 2026-05-11
[^8]: JezzBall — Wikipedia — https://en.wikipedia.org/wiki/JezzBall — retrieved 2026-05-11
[^9]: How the Algorithm Knows Where the Qix is: a (ful)filling solution — Ido Gendel — https://www.idogendel.com/en/archives/738 — retrieved 2026-05-11
