# Schema

Every primitive directory contains files conforming to these shapes. YAML frontmatter on every `.md` makes the dataset machine-readable.

## `primitives/{id}/stub.md` (seed, written by Discovery agent)

```yaml
---
id: qix-area-claim                    # kebab-case, unique, stable
name: QIX Area-Claim                   # human title
player_verb: "draw closed polygons in shared space to claim territory"
canonical_game: "Qix"
canonical_year: 1981
canonical_platform: Arcade
canonical_developer: "Taito / Randy Pfeiffer & Sandy Pfeiffer"
era_bucket: arcade-golden-age          # see agent-prompts/01-discover.md
taxonomy_node: spatial-claim/closed-area  # path in taxonomy.md
status: stub                            # stub | researched | speced | built
---

One-paragraph description (3–5 sentences). What the player does. What the
system does back. Why it's irreducible. What variations exist.
```

## `primitives/{id}/research.md` (filled by Research agent)

```yaml
---
id: qix-area-claim
status: researched
research_date: 2026-05-11
sources_used: 6
---
```

Sections (all required, in this order):

### `## Player verb`
One sentence. Identical to or refined from `stub.md`.

### `## Canonical originator`
Game, year, platform, developer. Two paragraphs of context: what prior art existed, what was new here.

### `## Variations and successors`
Bullet list. For each: game, year, platform, **what they varied** (not what they added in general). Aim for 5–15 entries spanning eras.

### `## Algorithm / math`
The actual mechanism. Pseudocode, equations, or data-structure sketch. For physics primitives, the integration scheme (Euler, semi-implicit Euler, Verlet, RK4). For pattern primitives, the matching algorithm. For procedural primitives, the generator (noise type, WFC, BSP, drunkard's walk, etc.). For AI primitives, the FSM or behavior tree shape. **Concrete, not hand-wavy.**

### `## Player-experience hooks`
What the primitive *feels like* to play. Tension, mastery curve, failure modes. Reference Steve Swink's game-feel vocabulary where useful.

### `## Convergence notes`
Other primitives in this repo that share structure. Wikilinks. E.g. "Shares projectile-arc with `[[angry-birds-slingshot]]` but differs in pre-commit input model."

### `## Suggested mini-game scope`
3–7 sentences. The minimum viable demonstration. What to strip, what to keep. Target: 200–400 lines of vanilla JS in a single file.

### `## References`
Footnotes. Each `[^N]: Title — Source — URL — retrieved YYYY-MM-DD`. Minimum 4, target 6–10. Tier-1 sources weighted 2x in any quality count.

## `primitives/{id}/spec.md` (filled by Mini-game-spec agent)

```yaml
---
id: qix-area-claim
status: speced
tech: canvas-2d                         # canvas-2d | webgl | webgl2 | three.js
target_loc: 300                         # lines of code budget
controls: "arrow keys + space"
---
```

### `## Goal of the demo`
What the player should understand after 30 seconds of play.

### `## Reduced ruleset`
Numbered list. The minimum rules. No more than 7.

### `## Visual language`
Abstract shapes, palette, no IP. 3–5 sentences.

### `## State model`
Top-level state variables and tick loop sketch. Pseudocode.

### `## Failure modes to handle`
What can go wrong (edge cases, soft-locks, frame-rate dependence, etc.).

### `## Out of scope`
Explicit list of things NOT to add. Prevents scope creep.

## `references/citations.bib`

Accumulated, deduplicated. One entry per unique source. Format:

```
@misc{wikipedia-qix-2025,
  title  = {Qix},
  author = {{Wikipedia contributors}},
  url    = {https://en.wikipedia.org/wiki/Qix},
  note   = {Retrieved 2026-05-11},
  year   = {2025}
}
```

## `taxonomy.md`

Tree. Indented bullet list. Each leaf links to one or more primitives. See the file itself for current state.

## `research-queue.md`

A flat list of primitive `id`s, grouped by wave. Each line:

```
- [ ] {id} — {one-line player verb} — era:{bucket} — priority:{1-3}
```

Check off as research completes.
