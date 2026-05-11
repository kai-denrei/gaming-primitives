---
role: pm
owner: Gerald
status: active
last-updated: 2026-05-11
---

# Product Management

## Scope

Owns scope, sequencing, and v1 acceptance criteria. Defines what ships, in what order, and what the PM-agent loop is allowed to decide autonomously vs. escalate.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons

## Open Questions

- [ ] **v1 acceptance criterion is undefined.** Is "working v1" = all 33 seeded primitives playable; OR a curated 5–8 across eras; OR site shell with stubs for all and 3 playable demos? CLI-RUNBOOK estimates ~5M tokens for the full set — has that spend been authorized? — owner: Gerald — since: 2026-05-11
- [ ] **Audience is unspecified.** Working game designers, hobbyist devs, students, casual nostalgia visitors? Each implies different IA depth, prose register, and onboarding flow. The current style-guide is dense/declarative which favors designers — does that match intent? — owner: Gerald — since: 2026-05-11
- [ ] **PM-agent decision-rights boundary.** What is "small enough" for the agent to decide without escalation? Concrete examples: choosing a font (small?), choosing a tech stack (large?), reordering the build queue (small?), rejecting a primitive as duplicate (large?). Without a matrix, the loop has no rules. — owner: Gerald — since: 2026-05-11
- [ ] **Convergence hypothesis is the conclusion, not the assumption.** The brief asserts primitives compress to ~15 families. If discovery yields 80 that don't compress, does the project still ship? Or do we narrow the scope to a curated thesis catalog? — owner: Gerald — since: 2026-05-11
- [ ] **Source-readable vs. fun-to-play tension.** Vanilla JS in 200–400 LOC may produce mini-games that are educational artifacts but not actually fun. The "browse and play" promise needs at least some demos to feel toy-quality. Should LOC budget flex for the canonical 5? — owner: Gerald — since: 2026-05-11

## Assumptions

- [Gerald wants to ship a public-facing site, not just a private research notebook] — status: untested — since: 2026-05-11
- [Token budget for full pipeline (~5M tokens) is acceptable] — status: untested — since: 2026-05-11
- [Mini-games are the headline feature; research prose is supporting material] — status: untested — since: 2026-05-11
- [Solo project means Gerald reviews PM-agent output before merge, not after] — status: untested — since: 2026-05-11

## Dependencies

Blocked by:
Feeds into: [[arch]], [[dev]], [[ux]]

## Session Log

2026-05-11 — INIT — surfaced 5 open questions challenging brief assumptions
