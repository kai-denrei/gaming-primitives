# Agent 02 — Research

You take **one** primitive id from `research-queue.md` and produce a complete `research.md` for it. Many Research agents run in parallel; each owns one id.

## Your inputs

- The primitive `id` assigned to you
- `primitives/{id}/stub.md` (already exists)
- `BRIEF.md`, `schema.md`, `style-guide.md`, `references/sources.md`
- The current `taxonomy.md` (for wikilinks)

## Your output

A single file: `primitives/{id}/research.md` conforming to the schema in `schema.md`.

When done, check off the entry in `research-queue.md`, set the stub's `status: researched` in its frontmatter, and append the citations you used to `references/citations.bib` (deduplicating against what's there).

## Required sections (in order, all required)

1. **YAML frontmatter** — id, status: researched, research_date, sources_used.
2. **`## Player verb`** — one sentence. May refine the stub's wording.
3. **`## Canonical originator`** — two paragraphs. Prior art, what was new.
4. **`## Variations and successors`** — 5–15 bullets, each with what was *varied*.
5. **`## Algorithm / math`** — concrete. Pseudocode, equations, data structures.
6. **`## Player-experience hooks`** — what it feels like, mastery curve, failure modes.
7. **`## Convergence notes`** — wikilinks to related primitives and exactly what's shared / differs.
8. **`## Suggested mini-game scope`** — 3–7 sentences for the eventual playable.
9. **`## References`** — minimum 4 footnotes, target 6–10.

## Algorithm section — examples of acceptable depth

For **`lunar-lander-thrust`**:

```text
State per tick:
  pos:   (x, y)
  vel:   (vx, vy)
  fuel:  f
  thrust_on: bool
  angle: θ   (in some variants)

Integration (semi-implicit Euler, dt = frame time):
  if thrust_on and fuel > 0:
    ax += T * sin(θ)
    ay += T * cos(θ)
    fuel -= burn_rate * dt
  ay += g                       # gravity, positive y = down
  vx += ax * dt
  vy += ay * dt
  x  += vx * dt
  y  += vy * dt

Win condition:
  |vx| < v_safe AND |vy| < v_safe AND on_landing_pad(x)

Note: original Atari (1979) used framerate-dependent integration on
discrete 6502 instructions; modern reimplementations should normalize dt.
```

For **`qix-area-claim`**:

```text
Grid: 256×192 cells, each in {void, wall, claimed-A, claimed-B, drawing}.

When player closes a polygon by returning to the wall:
  1. Identify the smaller of the two regions created (by flood-fill count).
  2. Convert that region's cells to claimed.
  3. Score = area_just_claimed.
  4. If hazard was inside the larger region, the larger region is claimed
     instead.

Hazard (the Qix):
  A particle system with constrained-random motion. Bounces off the
  current wall-and-claimed boundary. If it touches the player's
  in-progress drawing line, player dies.

Boundary follower:
  Player moves along edges of claimed regions. Two speeds: "fast" stays
  on existing boundary; "slow" begins drawing into void.
```

For **`baba-is-you-rewrite`**:

```text
World grid: tiles can be OBJECTS or WORDS.
Words form RULES by reading [SUBJECT][IS][PREDICATE] left-to-right
and top-to-bottom.

Per turn:
  1. Player input → push attempt in direction.
  2. Push resolution: chain of pushable tiles moves if endpoint is empty.
     (PUSH property comes from current rule set, recursively.)
  3. Re-parse rules from the grid → new rule set.
  4. Apply derived properties:
       SINK: when SINK + non-SINK overlap, both removed.
       MELT + HOT: MELT object removed.
       Etc.
  5. Win check: any object with property YOU also has property WIN.

The rule set is a function of the grid state every tick. Pushing the
word IS literally re-writes the game's rules.
```

Concrete is required. "It uses a physics engine" is not acceptable.

## Citation rules

- Minimum 4 sources. Target 6–10.
- At least 2 must be Tier 1 (`references/sources.md`).
- Footnote style: `[^N]: Title — Source — URL — retrieved YYYY-MM-DD`.
- Cite every factual claim about dates, authorship, or platforms.
- Don't cite obvious mechanism facts (e.g. "Tetris has 7 piece types").
- If sources disagree (common for arcade attribution), say so and cite both.

## Length budget

800–1500 words total. Over budget = padding = cut. Under 800 = probably under-researched.

## When you're stuck

If after a reasonable search you can't find:

- **Canonical year**: say `[NEEDS VERIFICATION]` and proceed; flag in `research-notes/needs-review.md`.
- **Algorithm details**: describe the *visible behavior* and note "Source code or detailed implementation notes not located; behavior reconstructed from gameplay observation." This is acceptable for closed-source commercial games.
- **More than 6 sources**: 4 is the floor. Don't pad with weak sources to hit 8.

## When you finish

1. Set `status: researched` in `primitives/{id}/stub.md` frontmatter.
2. Check off the entry in `research-queue.md`: `- [x] {id} — ...`
3. Append your new citations to `references/citations.bib` (deduplicate by URL).
4. Append a single line to `research-notes/research-log.md`:
   `{date} — {id} — sources: N — wordcount: N`

## Failure modes

- **Hand-wavy algorithm section.** "Uses physics" / "AI behavior" / "procedural generation" — these are not algorithms. Force yourself to write the loop.
- **Citing one source N times.** Spread the load across sources.
- **Wikipedia-only.** Wikipedia is Tier 1 but you need diversity. Pair it with at least one developer interview, postmortem, or technical write-up.
- **Forgetting wikilinks.** The Convergence section without wikilinks is useless.
- **Ignoring the stub.** The stub is the seed; refine it, don't override it without reason.
