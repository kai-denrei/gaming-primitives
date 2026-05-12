---
id: boulder-dash-falling-rocks
status: researched
research_date: 2026-05-11
sources_used: 8
---

## Player verb

The player tunnels through a grid of dirt to collect a quota of diamonds, against rocks (and the diamonds themselves) that rest on whatever is beneath them, fall the instant their support is dug out, kill on landing atop the player, and topple sideways off any rounded surface — turning the same gravity rule that threatens the player into a chain-reaction puzzle device.

## Canonical originator

*Boulder Dash*, First Star Software, 1984, Atari 8-bit and Commodore 64. Designed and programmed by Peter Liepa with level design and concept contributions by Chris Gray, published by First Star founder Richard Spitalny[^1][^2]. The Atari 8-bit version shipped first in early 1984; the C64 conversion followed the same year and became the platform of record, with later ports to Apple II, ZX Spectrum, Amstrad CPC, MSX, NES (Tengen/JVC, 1990), Game Boy, and IBM PC[^1][^3]. Liepa's design notebook, posted decades later, documents the iterative tuning of the falling-rock rule — early prototypes had only diggable dirt, and the gravity loop was added to give the dug landscape consequences[^4].

The direct mechanical predecessor is *Mr. Do!* (Universal, 1982, Arcade), in which apples sit on top of dirt the player digs through and fall — and can kill enemies — when undermined[^5]. *Dig Dug* (Namco, 1982, Arcade) shares the digging substrate but uses an inflation verb and has no falling-object physics; it is a substrate predecessor, not a mechanical one[^6]. What *Boulder Dash* added beyond *Mr. Do!* was unification: rocks and diamonds run identical physics, so any rock-handling skill is also a diamond-handling skill, and the rule that endangers the player is the rule that solves the puzzle. The sideways-topple rule (a rock at rest atop another rock or diamond rolls into an adjacent empty cell) is the load-bearing addition that produces cascades — without it the system is a Sokoban variant; with it the system is a cellular automaton the player edits in real time[^7].

## Variations and successors

- *Repton* (Superior Software / Tim Tyler, 1985, BBC Micro / Acorn Electron): same rocks/diamonds/dirt loop, adds a meta-puzzle where collected diamond shapes spell a password; sequels through *Repton Infinity* (1988) add scripting[^8].
- *Emerald Mine* (Kingsoft / Volker Wertich, 1987, Amiga / Atari ST): adds amoeba, conveyor belts, dynamite, magic walls; the genre's canonical "everything bag"[^7].
- *Supaplex* (Digital Infinity, 1991, PC-DOS / Amiga): direct successor reskinned as a chip-inside-a-computer; rocks become `Zonks`, diamonds `Infotrons`, physics one-for-one[^7].
- *Rocks 'n' Diamonds* (Holger Schemel, 1995, multi): open-source engine that runs *Boulder Dash*, *Emerald Mine*, *Sokoban*, and *Supaplex* levels in one binary; canonical reference implementation[^9].
- *Boulder Dash Construction Kit* (First Star, 1986, multi): user-authored levels and physics tweaks; first acknowledgement that the rule set is the product, not the levels.
- *Mr. Driller* (Namco, 1999, Arcade / PS1 / multi): vertical-scroll reinterpretation; same-colour blocks merge into chains that fall when undermined, drill downward against an air clock — keeps the crush-on-fall core, drops the dirt substrate[^10].
- *Spelunky Classic* (Derek Yu, 2008, Win) / *Spelunky* (Mossmouth, 2012, multi): falling rocks remain instant-kill, but the level is procedurally generated and the primitive becomes one hazard among many[^7].
- *Tomb of the Mask* (Playgendary, 2016, iOS / Android): touch-input variant; falling-block / collect-gem grammar preserved, movement auto-locks into orthogonal slides.
- *Boulder Dash 30th Anniversary* (BBG, 2014, multi) and *Boulder Dash Deluxe* (2021, Switch / Win): licensed remakes, original rules intact, new tilesets.
- *Diamond Mines* / *Cavez of Phear* (various shareware, 1990s, multi): countless freeware reimplementations; the primitive is one of the most-cloned in early home-computer history.

## Algorithm / math

The original Atari/C64 build is closed-source 6502 assembly; the rules below are reconstructed from Liepa's design notes, the *Rocks 'n' Diamonds* engine (whose author corresponded with Liepa for fidelity), and disassembly write-ups of the C64 ROM[^4][^7][^9].

```text
Grid (per cell, one byte):
  tile ∈ { EMPTY, DIRT, WALL, ROCK, DIAMOND, PLAYER, EXIT,
           AMOEBA, FIREFLY, BUTTERFLY, EXPLOSION }
  flag ∈ { RESTING, FALLING }            # only meaningful for ROCK/DIAMOND
  scanned: bool                          # set during the tick, cleared at end

Per-tick scan (bottom-up, right-to-left to avoid double-processing
a cell that just received a falling object):

  for y in H-1 .. 0:
    for x in W-1 .. 0:
      t = tile[x][y]
      if t.scanned: continue
      switch t:
        case ROCK or DIAMOND:
          below = tile[x][y+1]

          if below == EMPTY:
            # Gravity: fall one cell, mark FALLING.
            tile[x][y+1] = t with flag = FALLING; tile[x][y+1].scanned = true
            tile[x][y]   = EMPTY

          else if t.flag == FALLING and below == PLAYER:
            # Lethal landing on player's head.
            kill_player(); spawn_explosion(x, y+1)

          else if t.flag == FALLING and below in {ROCK, DIAMOND, WALL}:
            # Land and rest. (DIAMOND landing on player same as ROCK.)
            t.flag = RESTING
            # Optional: a DIAMOND landing on something may
            # cause a "magic-wall" transform in extended rules.

          else if t.flag == RESTING and below in {ROCK, DIAMOND, BRICK_ROUND}:
            # Sideways topple. Prefer left then right (per original).
            if tile[x-1][y] == EMPTY and tile[x-1][y+1] == EMPTY:
              tile[x-1][y] = t with flag = FALLING; mark scanned
              tile[x][y]   = EMPTY
            else if tile[x+1][y] == EMPTY and tile[x+1][y+1] == EMPTY:
              tile[x+1][y] = t with flag = FALLING; mark scanned
              tile[x][y]   = EMPTY

        case PLAYER:
          d = read_input()                       # one of N,S,E,W,none
          target = tile[x+dx][y+dy]
          switch target:
            EMPTY, DIRT:        move_player(dx, dy); if DIRT: score += 0
            DIAMOND:            move_player(dx, dy); diamonds_got += 1
            ROCK if dy == 0:    # horizontal push only
              beyond = tile[x+2*dx][y]
              if beyond == EMPTY and random() < PUSH_PROB:
                tile[x+2*dx][y] = ROCK(RESTING)
                tile[x+dx][y]   = PLAYER
                tile[x][y]      = EMPTY
            EXIT if diamonds_got >= quota: win_level()
            else: blocked

        case FIREFLY, BUTTERFLY:  # optional; FSM walking left-hand or right-hand wall.
          ...

  clear all scanned flags
  if level_timer expired: kill_player()
```

Two implementation patterns deserve note. The **single-pass bottom-up scan** suffices because gravity only moves objects down; the `scanned` flag prevents a rock from falling two cells in one tick (which would let the player walk under it). The alternative, a **double-buffered next-state grid** (read `tile`, write `tile_next`, swap), is the cellular-automaton textbook form and is what *Rocks 'n' Diamonds* uses internally for exact simultaneity[^9]; the C64 build uses in-place scan for memory and speed. Either is correct; mixing them silently breaks cascade timing.

The **softlock hazard**: the player can permanently rearrange rocks but cannot pull them, so many otherwise-valid plays end with the diamond quota walled off. The original ships a per-level timer that converts unsolvable positions into forced deaths rather than interactive freezes — a design hedge worth porting forward. *Repton* and *Emerald Mine* add explicit dynamite or restart-level commands; *Supaplex* keeps the timer.

Diamonds share gravity, fall, topple, and lethal-landing with rocks; only collect-on-touch and the win-condition increment distinguish them. Having two objects share one physics function is the design's central efficiency.

## Player-experience hooks

The mastery curve runs along three axes. **Spatial commitment**: every dirt cell dug is a permanent edit to the support graph, and a poorly chosen tunnel can drop a rock into the only path to the last diamond. **Timing under cascades**: a rock dislodged at a stack's top can topple, fall, dislodge the next, and chain several rows deep — the player must read frames ahead and either step clear or position so the cascade delivers diamonds into a collectable column. **The push-window**: a rock the player is *next to* is a tool; a rock the player is *under* is a death sentence. Beginners die to their own digging. Experts undermine from the side so rocks fall into a known channel rather than onto their head.

Swink's grammar fits awkwardly because input is discrete-grid; the load-bearing felt quality is **legibility under cascade**. The player must believe at every step that the next tick is predictable from the visible grid — the bottom-up scan and the no-double-fall rule together preserve that contract. Characteristic deaths: *cascade misread* (assumed a falling rock would topple left, it fell straight), *quota lock* (collected enough diamonds, but the exit is now buried), *push panic* (pushed a rock into the only escape route while a firefly approached).

## Convergence notes

Shares the gravity-on-a-grid rule with [[tetris-line-clear]] in the inverse: Tetris uses one piece falling onto a settled field, *Boulder Dash* uses a settled field that falls onto the player. Shares the dig-the-substrate verb with [[lode-runner-dig-fall]] but inverts the role of the dug hole — in *Lode Runner* the hole is a tool against pursuers; in *Boulder Dash* the hole is a permanent edit to gravity's support graph. Shares cellular-automaton-as-game-rules structure with [[lemmings-assign-roles]] (deterministic per-tick scan over autonomous agents) and with [[baba-is-you-rewrite]] (rule-driven grid re-evaluation each turn), but differs in scale: *Baba* re-parses *which rules apply*; *Boulder Dash* applies a fixed rule set whose emergent behaviour is the puzzle. Shares the Sokoban-style horizontal push with [[baba-is-you-rewrite]] and [[patrick-parabox-nested]] but adds gravity, so a pushed rock is rarely where the push left it — the push is a setup for the fall, not a placement.

## Suggested mini-game scope

Single HTML file, canvas-2D, vanilla JS, no assets. A 32×20 logical grid stored as `Uint8Array` for `tile` plus a parallel `Uint8Array` for `flag` (`RESTING`/`FALLING`). Tile set: `EMPTY, DIRT, WALL, ROCK, DIAMOND, PLAYER, EXIT` — skip amoeba, fireflies, butterflies. One hand-authored level: dirt-filled cavern with a ceiling row of rocks, a vein of diamonds the player must undermine without standing under, an exit gated on 5 diamonds. Implement the bottom-up scan, the fall/topple/kill rules, horizontal push, dirt-dig collect. Use a fixed tick (one logic tick every 100–150 ms) decoupled from `requestAnimationFrame`, render frame-interpolated. Aim ~350 LOC including a tiny tile-blit helper. Goal: in 30 seconds the player should both kill themselves to a falling rock once and successfully cascade a rock into clearing a path once.

## References

[^1]: Boulder Dash (video game) — Wikipedia — https://en.wikipedia.org/wiki/Boulder_Dash_(video_game) — retrieved 2026-05-11
[^2]: Boulder Dash (1984) — MobyGames — https://www.mobygames.com/game/176/boulder-dash/ — retrieved 2026-05-11
[^3]: Peter Liepa — Wikipedia — https://en.wikipedia.org/wiki/Peter_Liepa — retrieved 2026-05-11
[^4]: The Making of Boulder Dash — Peter Liepa's design notebook and commentary — boulder-dash.com (Peter Liepa's archive) — https://www.boulder-dash.com/history/ — retrieved 2026-05-11
[^5]: Mr. Do! — Hardcore Gaming 101 — http://www.hardcoregaming101.net/mr-do/ — retrieved 2026-05-11
[^6]: Dig Dug — Wikipedia — https://en.wikipedia.org/wiki/Dig_Dug — retrieved 2026-05-11
[^7]: Boulder Dash and its descendants — Hardcore Gaming 101 — http://www.hardcoregaming101.net/boulder-dash/ — retrieved 2026-05-11
[^8]: Repton (video game) — Wikipedia — https://en.wikipedia.org/wiki/Repton_(video_game) — retrieved 2026-05-11
[^9]: Rocks 'n' Diamonds — Holger Schemel — https://www.artsoft.org/rocksndiamonds/ — retrieved 2026-05-11
[^10]: Mr. Driller — Wikipedia — https://en.wikipedia.org/wiki/Mr._Driller — retrieved 2026-05-11
