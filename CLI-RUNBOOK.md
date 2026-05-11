# CLI Runbook

How to actually execute this project with Claude Code (the CLI).

## Setup

```bash
git init
git add .
git commit -m "scaffold: initial structure"
```

Open the repo in your terminal. Make sure Claude Code is installed and authenticated.

## Wave dispatch pattern

Claude Code can spawn parallel sub-agents using the **Task tool**. The pattern below is the canonical loop for this project.

### Wave 1 — Discovery (8 parallel agents, one per era bucket)

In Claude Code, paste:

```
Read README.md, BRIEF.md, schema.md, taxonomy.md, style-guide.md,
references/sources.md, and agent-prompts/01-discover.md.

Then dispatch 8 parallel sub-agents using the Task tool, one per era bucket
listed at the bottom of taxonomy.md. Each sub-agent owns exactly one bucket
and follows agent-prompts/01-discover.md to the letter.

Do not run discovery for the era bucket sequentially — dispatch all 8 at
once. Each sub-agent must write its stubs to primitives/{id}/stub.md and
append to research-queue.md under its bucket's section.

When all 8 return, summarize: total stubs created per bucket, merge
candidates flagged, era coverage gaps noted. Then stop and wait for human
review.
```

Review the discovery output. Sanity-check 5 random stubs:
- Is the canonical year right?
- Is it actually a primitive (not a genre)?
- Does it duplicate Wave 0?

If a bucket looks weak, dispatch a second pass on just that bucket.

### Wave 2 — Research (batch of 5–10 parallel agents)

```
Read agent-prompts/02-research.md.

Take the first 8 unchecked entries from research-queue.md (skip Wave 0 if
already completed). Dispatch 8 parallel sub-agents via the Task tool, one
per primitive id.

Each sub-agent reads primitives/{id}/stub.md, schema.md, style-guide.md,
references/sources.md, and agent-prompts/02-research.md. Then produces
primitives/{id}/research.md and checks off the entry in research-queue.md.

When all 8 return, summarize: completed ids, sources cited, [NEEDS
VERIFICATION] flags raised. Then stop and wait for human review.
```

Repeat in batches of 8 until `research-queue.md` is empty.

**Budget guidance**: each Research agent uses ~30–60k tokens for a well-cited primitive (web search + writing). 8 agents in parallel = ~400k tokens per wave. Plan accordingly.

### Wave 3 — Collapse (single agent, broad context)

```
Read agent-prompts/03-collapse.md.

You are the Collapse agent. Scan every primitives/*/research.md with
status: researched. Produce
research-notes/collapse-proposal-{today}.md per the agent prompt's format.

Do not auto-execute any merge. Stop and wait for human review.
```

Review each proposal. Mark `APPROVED` / `REJECTED` / `DEFER` in the proposal file. Then:

```
Read research-notes/collapse-proposal-{today}.md and execute every APPROVED
merge/split/re-parent per the agent prompt's execution rules. Update
research-queue.md and taxonomy.md as needed.
```

### Wave 4 — Taxonomy refit (single agent)

```
Read agent-prompts/04-taxonomy.md.

Refit taxonomy.md based on the current set of researched primitives and
the most recent collapse log. Produce both the updated taxonomy.md and the
diff summary at research-notes/taxonomy-update-{today}.md.
```

### Wave 5 — Specs (batch of 5–10)

Same pattern as Wave 2, but with `agent-prompts/05-minigame-spec.md` and reading `research.md` to produce `spec.md`.

### Wave 6 — Builds (batch of 3–5, lower parallelism)

Build agents take longer (they're writing actual code, testing visually). Drop to 3–5 in parallel.

```
Read agent-prompts/06-minigame-build.md.

Take the first 4 entries from research-queue.md with status: speced.
Dispatch 4 parallel sub-agents via the Task tool. Each sub-agent reads
primitives/{id}/spec.md and produces primitives/{id}/minigame/.

Each sub-agent must self-verify every quality gate in
agent-prompts/06-minigame-build.md before declaring done.

When all 4 return, summarize: ids built, LOC per game, quality-gate
failures. Then stop and wait for human review.
```

After human review, run the gallery regenerator (or update by hand).

## Loop until done

The waves repeat:

1. Discovery → fills queue with new primitives.
2. Research → fills `research.md` for each.
3. Collapse → proposes merges/splits.
4. Taxonomy → re-fits the tree.
5. Specs → translates research to buildable specs.
6. Builds → implements playables.

Stop conditions per `README.md`:
- Discovery saturated when two passes on the same bucket find zero new primitives.
- Collapse stable when a pass finds zero merge/split candidates.
- Builds done when every primitive has a working playable.

## Failure recovery

If a sub-agent stalls or fails:
- The work-in-progress is already in the file system (the agent writes incrementally).
- Diff against `git`; commit anything good, throw out anything bad.
- Re-dispatch just the failed id, not the whole wave.

If a research wave produces hand-wavy `Algorithm / math` sections (the most common failure):
- Add a note to the agent prompt with concrete examples.
- Re-dispatch the offending primitives with `agent-prompts/02-research.md` + a one-line correction in your dispatch message: "The previous attempt's algorithm section was hand-wavy. Reproduce the actual mechanism per the examples in section `## Algorithm section — examples of acceptable depth`."

## Commit hygiene

After each wave:

```bash
git add .
git commit -m "wave-N: {discovery|research|collapse|taxonomy|spec|build} — {summary}"
```

Tag stable points:

```bash
git tag wave-1-discovery-complete
git tag wave-2-research-batch-1-done
```

## Token budgeting

Rough estimates per wave (assuming ~30 primitives in seed + wave 1):

| Wave | Agents | Tokens each | Wave total |
|---|---|---|---|
| 1 Discovery | 8 | ~50k | ~400k |
| 2 Research | 30 (batched 8/wave) | ~50k | ~1.5M |
| 3 Collapse | 1 | ~100k | ~100k |
| 4 Taxonomy | 1 | ~30k | ~30k |
| 5 Spec | 30 (batched 8/wave) | ~20k | ~600k |
| 6 Build | 30 (batched 4/wave) | ~80k | ~2.4M |

Total seed-set completion: ~5M tokens. Plan in installments.

## What humans should still do

- Approve every Collapse proposal individually.
- Spot-check 5 random `research.md` files per wave for citation quality.
- Play every mini-game once before tagging the build as done.
- Maintain `taxonomy.md`'s top-level family count — agents will drift.
