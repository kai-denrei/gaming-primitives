# BRIEF — Gameplay Primitives Project

## What is a "gameplay primitive"?

An **irreducible player-facing mechanism**. The smallest atomic verb the player performs, considered together with the system response that makes it interesting. A primitive is *not* a genre, *not* a game, *not* a feature list.

Test: can you describe it in one sentence of the form "the player **{verb}** {object} to {goal}, against {system response}"?

Examples:
- **QIX area-claim**: the player **draws closed polygons** in shared space to **claim territory**, against a moving hazard that **destroys incomplete lines**.
- **Lunar Lander thrust**: the player **applies vector thrust** under **constant downward acceleration** to **null velocity at a target**, against **finite fuel**.
- **Defender of the Crown catapult**: the player **commits an angle and power** to **launch a projectile in a parabolic arc**, against **a one-shot timing window**.
- **Tetris line-clear**: the player **orients falling tetrominoes** to **complete horizontal rows**, against **accelerating drop speed**.
- **Pac-Man power-pellet inversion**: the player **eats a special item** that **inverts the predator/prey roles** for a **timed window**, against **a queue of pursuers with distinct behaviors**.

**Counter-examples** (NOT primitives):
- "Platformer" — genre, not primitive.
- "Roguelike" — genre + meta-loop, not primitive (but **permadeath-with-procedural-seed** *is* a primitive).
- "Open world" — scale, not primitive.
- "Crafting" — too broad; split into **recipe-combinatorial**, **resource-extraction-loop**, **base-as-progression-gate**, etc.

## Why this project

1. **Inventory** — make legible the surprisingly small set of mechanisms underneath thousands of games.
2. **Convergence** — show how distant-looking games share a primitive (Asteroids gravity ≈ Mario Galaxy gravity ≈ Angry Birds Space).
3. **Pedagogy** — a playable, minimal, source-readable mini-game for each primitive teaches design more than any essay.
4. **Inspiration** — designers can browse the taxonomy and recombine.

## Constraints

- **One canonical originator per primitive.** If two games invented something nearly simultaneously, cite both with dates.
- **Cite, don't reproduce.** Names, dates, platforms, developers are fine. No long quotes, no sprite rips, no soundtrack samples.
- **Algorithm + verb, both.** Every primitive entry must give the player-verb framing *and* the underlying math/algorithm/data-structure that makes it work. (E.g. Asteroids = Euler integration of thrust vector + screen-wrap topology; QIX = polygon flood-fill + line-segment collision.)
- **Era-balanced.** Don't drown in one decade. Quotas in `agent-prompts/01-discover.md`.
- **Convergence is a feature, not a bug.** If two primitives compress into one, document the variations as a sub-list, don't artificially split.
- **English-language primary sources preferred** for verifiability, but non-English primitives (Japanese arcade, doujin, etc.) are first-class — just cite carefully.

## Source whitelist (ranked, see `references/sources.md`)

**Tier 1 — authoritative, prefer these**
- Wikipedia game articles
- MobyGames
- Hardcore Gaming 101
- The Digital Antiquarian (filfre.net)
- GDC Vault talks
- Game Maker's Toolkit (Mark Brown) with timestamps
- Game Developer / Gamasutra archives
- Shmuplations (translated developer interviews)
- Retro Gamer magazine archives

**Tier 2 — useful, verify**
- GiantBomb concepts pages
- TVTropes (for primitive *naming*, not facts)
- Sega Retro, NESdev wiki, C64 Wiki, Lemon64
- The CRPG Addict, Filfre, Matt Chat interviews
- DiGRA / Game Studies journal
- GDC talk transcripts on YouTube

**Tier 3 — community, treat as leads**
- Reddit r/truegaming, r/gamedesign threads
- TIGSource, Glorious Trainwrecks, itch.io devlogs
- Pico-8 BBS notes
- IndieDB

**Always avoid** as primary sources: AI-generated listicles, content farms, ad-heavy SEO sites, fan wikis without citations.

## Output norms

- Markdown only.
- Wikilinks `[[id]]` between primitives where relationships exist.
- Citations as footnotes `[^1]` with full URL + retrieval date.
- No emojis in research files. (Mini-game UIs can use them.)
- Dates always `YYYY` or `YYYY-MM`.
- Platforms in canonical short form: `Arcade`, `C64`, `Amiga`, `NES`, `SNES`, `Genesis`, `Atari 2600`, `Atari ST`, `PC-DOS`, `Win`, `Mac`, `iOS`, `Android`, `Web`, `Switch`, `PS1`–`PS5`, `Xbox`–`XSX`.

## Style

Dense, declarative, no hedging. "The player aims a vector and commits to a shot." Not "Players can choose to aim a vector and may then commit to a shot if they wish."

Read `style-guide.md` for full conventions.
