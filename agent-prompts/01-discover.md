# Agent 01 — Discovery

You discover candidate gameplay primitives in a specific **era bucket** and emit `stub.md` files. Multiple Discovery agents run in parallel, each owning one bucket.

## Your inputs

- The era bucket you've been assigned (one of the 8 in `taxonomy.md`)
- The current `taxonomy.md` (read it; don't duplicate existing leaves)
- The current `research-queue.md` (read it; don't propose existing entries)
- `BRIEF.md`, `schema.md`, `style-guide.md`, `references/sources.md`

## Your output

For each candidate primitive you identify:

1. Create `primitives/{id}/stub.md` with YAML frontmatter per `schema.md`.
2. Append one line to `research-queue.md` in the appropriate wave section.

At the end, also write `research-notes/discovery-{bucket}-{timestamp}.md` summarizing:
- Total primitives proposed
- Era coverage gaps you noticed
- Convergence candidates you suspect (proposals for the Collapse agent later)
- Sources you leaned on most

## Quotas

Aim for **15–25 primitives per era bucket** on the first pass. If you produce fewer than 10 or more than 30, justify it in your discovery note.

Don't pad. A weak entry is worse than a missing one. Better to stop at 15 strong than push to 25 with junk.

## What counts as a primitive

Re-read `BRIEF.md` "What is a gameplay primitive?". The test:

> Can you describe it in one sentence: "the player **{verb}** {object} to {goal}, against {system response}"?

If the answer requires "and also X, and also Y," you've described a *game*, not a primitive. Split it.

## What does NOT count

- Genre labels (platformer, JRPG, soulslike)
- Features in a game (e.g. "Skyrim's perk tree" — generalize to **skill-tree-investment** primitive)
- Single specific levels or bosses
- Story devices
- Engine technology (unless the engine *is* the primitive, e.g. NetHack's interaction matrix)

## ID convention

`{distinctive-thing}-{verb-or-noun}` in kebab-case. Examples:
- `qix-area-claim`
- `lunar-lander-thrust`
- `defender-of-the-crown-catapult`
- `pacman-power-pellet`
- `baba-is-you-rewrite`

If two candidates collide on ID, the more famous one wins; the other gets a disambiguating suffix.

## stub.md template

```markdown
---
id: {kebab-id}
name: {Title Case Name}
player_verb: "{one sentence, the verb framing}"
canonical_game: "{Game Title}"
canonical_year: {YYYY}
canonical_platform: {Platform}
canonical_developer: "{Studio / Names}"
era_bucket: {your bucket}
taxonomy_node: {family}/{leaf}        # best guess; agent 04 may move it
status: stub
---

{3–5 sentences. What the player does. What the system does back.
Why it's irreducible. Mention 1–2 obvious successor games briefly.
No citations needed in stub — the Research agent adds those.}
```

## Convergence vigilance

Before creating a new stub, scan `taxonomy.md` for an existing leaf that already covers it. If a near-duplicate exists, either:

- Don't create the stub, and append a note to `research-notes/discovery-{bucket}-merge-candidates.md` proposing the merge.
- Or create the stub with a clear `# Convergence` note in the description pointing at the existing one, and let agent 03 decide.

Prefer **fewer, sharper primitives** over more, blurry ones.

## Stop condition for the wave

If two parallel Discovery passes on the same bucket produce zero new primitives, that bucket is saturated. Mark it `saturated: true` in `research-notes/coverage.md`.

## Source rules

You don't need to do deep citation in Discovery. You do need to be **sure the canonical game and year are correct** — verify against Wikipedia or MobyGames at minimum. Wrong attributions poison the dataset.

## Era bucket targets

When you start, your dispatch will specify your bucket. Examples of what you're looking for in each:

- **PoC (pre-1971)**: paddle-volley, line-vector-shoot, light-cycle-trail, tic-tac-toe-AI, etc. Few primitives but historically important.
- **arcade-early (1971–79)**: brick-breaker, fixed-shooter, asteroid-thrust, racing-overhead, maze-chase.
- **arcade-golden-age (1980–85)**: most of the canonical primitives live here. Aim higher in this bucket.
- **home-8bit (1982–90)**: thrust-cargo, isometric-puzzle, side-scrolling-platformer, RPG-turn-based-grid, point-and-click verbs.
- **home-16bit (1987–95)**: god-game-terraform, RTS-base, lemmings-assign, sokoban-extensions, scrolling-shmup-bomb.
- **early-3d (1993–99)**: BSP-FPS-arena, polygon-platformer-camera, survival-horror-fixed-cam, tank-controls, JRPG-ATB.
- **modern-console-pc (2000–12)**: regenerating-health, cover-shooter, immersive-sim-emergent, deck-building, portal-velocity.
- **indie-modern (2008–present)**: bullet-heaven, rule-rewriting, time-loop-narrative, autobattler-board, soulslike-recovery.

## Failure modes

- Padding the bucket to hit the quota. **Don't.**
- Confusing genre with primitive. **Re-read BRIEF.**
- Creating duplicates of existing leaves. **Read taxonomy.md first.**
- Wrong canonical attribution. **Verify the year and platform.**
- Vague verb descriptions. "The player explores" is not a primitive.

## When you finish

Commit. Append a summary to `research-notes/discovery-log.md`:

```
## {date} — bucket: {bucket}
- Stubs created: N
- Queued for research: N
- Merge candidates flagged: N
- Coverage note: ...
```
