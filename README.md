# Gameplay Primitives — Research & Mini-Game Project

A taxonomy of irreducible gameplay primitives from the earliest proof-of-concept games (Tennis for Two, 1958) through modern indies (Vampire Survivors, Baba Is You, Patrick's Parabox). Each primitive is researched, documented, and ultimately implemented as a tiny, focused, in-browser mini-game.

## Hypothesis

Despite tens of thousands of games, the space of **irreducible player-facing mechanisms** is small. Most games are recombinations and variations of a converging set of primitives — projectile-arc, momentum-integration, spatial-claim, pattern-match, rule-modification, resource-cascade, identity-conceal, and so on. This project aims to enumerate and demonstrate them.

## Phases

1. **Seed (this scaffold)** — taxonomy skeleton, schemas, agent prompts, queue.
2. **Research (Claude CLI, batched agents)** — populate `/primitives/{id}/research.md` for every entry in `research-queue.md`.
3. **Synthesis** — collapse near-duplicates, refine the taxonomy tree, finalize the convergence map.
4. **Mini-games** — one tiny browser playable per primitive, runnable from a static site.
5. **Educational site** — link everything together with playable demos, history, and code.

## Repository layout

```
gameplay-primitives/
├── README.md                       # this file
├── BRIEF.md                        # the project brief for any agent
├── taxonomy.md                     # canonical taxonomy tree (living document)
├── schema.md                       # data shapes for primitives, references, mini-games
├── research-queue.md               # the to-do list — what still needs researching
├── style-guide.md                  # prose and citation conventions
├── agent-prompts/
│   ├── 01-discover.md              # find candidate primitives, emit stubs
│   ├── 02-research.md              # deepen one primitive into research.md
│   ├── 03-collapse.md              # detect duplicates, merge / split
│   ├── 04-taxonomy.md              # re-fit the tree after a research wave
│   ├── 05-minigame-spec.md         # write a mini-game spec from research.md
│   └── 06-minigame-build.md        # implement the mini-game from spec.md
├── primitives/
│   └── {id}/
│       ├── stub.md                 # seed: id, verb, canonical game, year
│       ├── research.md             # filled in by agent 02
│       ├── spec.md                 # filled in by agent 05
│       └── minigame/               # filled in by agent 06
│           ├── index.html
│           ├── game.js
│           └── README.md
├── references/
│   ├── sources.md                  # whitelisted source domains, ranked
│   └── citations.bib               # accumulated citations (BibTeX-ish)
├── research-notes/                 # scratch notes, working hypotheses
└── mini-games/
    └── index.html                  # gallery linking every /primitives/{id}/minigame
```

## Read order for any agent

1. `BRIEF.md`           — what we're doing and why
2. `style-guide.md`     — how to write
3. `schema.md`          — data shapes
4. `taxonomy.md`        — current state of the tree
5. The specific `agent-prompts/0X-*.md` for the task
6. The relevant `primitives/{id}/` directory

## How to run a wave

The CLI dispatches **N parallel sub-agents** per wave. Recommended wave sizes:

- Discovery wave: 1 agent per era bucket (8 buckets, see `agent-prompts/01-discover.md`)
- Research wave: 5–10 agents at a time, each takes 1 primitive from `research-queue.md`
- Collapse wave: 1 agent, scans all `research.md` files, emits a merge proposal
- Mini-game wave: 5 agents at a time, each builds one mini-game

After every wave, a human reviews the diff before the next wave runs. **Quality gates are explicit in each agent prompt.**

## Stop conditions

- Discovery stops when two consecutive era-bucket agents produce zero new primitives (saturation).
- Research stops when `research-queue.md` is empty.
- Collapse stops when a pass produces zero merges or splits.
- Mini-games stop when every primitive has a working playable.

## Non-goals

- Not building a complete history of video games. Primitives only.
- Not ranking games by quality. Citing canonical originators only.
- Not writing essays. Tight, dense, primitive-focused prose.
- Not reproducing copyrighted sprites, sounds, or assets in mini-games. Abstract, original visuals only.
