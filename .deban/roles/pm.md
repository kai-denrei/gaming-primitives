---
role: pm
owner: Gerald
status: active
last-updated: 2026-05-12
---

# Product Management

## Scope

Owns scope, sequencing, and v1 acceptance criteria. Defines what ships, in what order, and what the PM-agent loop is allowed to decide autonomously vs. escalate.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-05-11 | **v1 = site shell + 33 stubbed primitives + 3 fully built mini-game PWAs** (asteroids-rotate-thrust, qix-area-claim, baba-is-you-rewrite). Shipped via PR #1. | Concrete acceptance criterion needed before agent waves could start. Three demos prove the thesis without committing tokens on all 33. Alternatives rejected: full 33 playable (too much budget), curated 5–8 (too small to feel like a catalog). | [[arch]], [[dev]], [[ux]] |
| 2026-05-12 | **v2 pivot: pure primitives become the headline at `/p/`; existing applied work relocates to `/a/`.** Family-of-variants pages (one URL per family, 3–10 tabbed variants). | The current "primitives" are actually *applied* primitives (Asteroids = a specific composition). True primitives are tinkerable mechanism families à la Game Mechanic Explorer. Alternatives rejected: equal-weight parallel catalogs (fragments narrative); applied-primary with pure as decomposition footnotes (Gerald wanted pure as the headline). | [[arch]], [[ux]], [[dev]] |
| 2026-05-12 | **14-family taxonomy** (Approach C): GME engine spine (motion, bullets, topology, aiming, collision, camera, pathfinding, procedural) + modern axes (rules-as-objects, time-as-resource, composition, state-machines, information-asymmetry, nested-spaces). | GME-only is too 2D-arcade-bound; reverse-engineered-from-applied makes pure a slave to applied. Hybrid covers engine + culture. | [[arch]] |
| 2026-05-12 | **Voice: neutral engineering body + "in the wild" sidebar.** Cultural memory ("Logg 1979 — torus-wrap, k=0.6") lives in the sidebar; mechanism prose is neutral reference. | Pure pages need to be useful as engineering reference. Forcing cultural framing on every page would crowd out the engineering. Stripping all culture loses the project's voice. Sidebar carries both. | [[ux]] |
| 2026-05-12 | **MVP build order for v2 Plan 1: Topology (3 variants) → Motion → Bullets.** Subsequent loop went alphabetical 01→13 per Gerald override. | Topology smallest — validates the demo widget contract cheap. If contract is wrong, find out in 3 days, not 10. | [[dev]] |
| 2026-05-12 | **CLI has full git push/commit/merge authority** for this project. Direct-to-main allowed for small fixes; large changes still get a PR for the diff trail. | Gerald velocity. CLAUDE.md default ("Gerald reviews and merges all PRs") superseded by explicit grant. Memory updated under feedback_git_authority. | [[devops]] |
| 2026-05-12 | **Build all 13 unbuilt families in a single subagent-driven loop, alphabetical 01→13.** Skip per-family spec/quality review subagents to fit budget; do one final whole-branch review. | User chose velocity over per-family review depth. Trade-off acknowledged: palette drift in two families (rules-as-objects, state-machines) slipped through; flagged as follow-up audit. | [[dev]], [[qa]] |

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|
| 2026-05-12 | **"Equal-weight parallel catalogs"** as the v2 frame (two top-tabs, both headline). | Would fragment the project's narrative. Pure-primary chosen instead. |
| 2026-05-12 | **Per-family quality-review subagents during the 13-family build loop.** | Token budget didn't allow review × 13. Final whole-branch review caught most issues but missed palette drift in 2 families. |
| 2026-05-12 | **Defer iPhone audit until end of PR #3.** | Bug surfaced on real device that mass-broke every family demo silently (`runner.js` dynamic import path). "Topology playable" badge in CI told nothing about prod behavior. Audit needs to happen DURING the loop, not after. |

## Lessons

## Open Questions

- [x] ~~v1 acceptance criterion~~ → resolved 2026-05-11: site shell + 33 stubs + 3 built demos. Shipped.
- [x] ~~PM-agent decision-rights boundary~~ → resolved 2026-05-12: CLI has full git authority for this project. Memory updated.
- [ ] **Audience is unspecified.** Voice decision (neutral-engineering + in-wild sidebar) implies "designers wanting reference + history" — not validated against real users. — owner: Gerald — since: 2026-05-11
- [ ] **Convergence hypothesis** reframed: pure primitives ARE the catalog (14 families). Whether *real* games decompose cleanly into these 14 is now empirical — to be answered via `decomposition:` backfill on built applied stubs. — owner: Gerald — since: 2026-05-11
- [ ] **Source-readable vs. fun-to-play tension** — 65 variants now playable but most are auto-animated educational demos, not games. Whether visitors stay to tinker is untested. — owner: Gerald — since: 2026-05-11
- [ ] **Palette-consistency audit** on rules-as-objects + state-machines (off-token colors slipped in during the unreviewed bulk loop). — owner: Gerald — since: 2026-05-12
- [ ] **Decomposition backfill** for the 9 built applied stubs (Plan 1 deferred). Needed for the bidirectional graph claim. — owner: Gerald — since: 2026-05-12

## Assumptions

- [Gerald wants to ship a public-facing site, not just a private research notebook] — status: validated 2026-05-12 (deployed publicly to GH Pages, public PRs, Telegram updates)
- [Token budget for full pipeline (~5M tokens) is acceptable] — status: in-progress, Max5 plan used through multiple major iterations
- [Mini-games are the headline feature; research prose is supporting material] — status: superseded by v2 pivot. Pure-primitive demos are now the headline; applied mini-games support that.
- [Solo project means Gerald reviews PM-agent output before merge, not after] — status: superseded 2026-05-12 by CLI git authority grant

## Dependencies

Blocked by:
Feeds into: [[arch]], [[dev]], [[ux]]

## Session Log

2026-05-12 — SYNC — recorded v2 pivot, MVP build order, CLI git authority grant, 13-family loop trade-off
2026-05-11 — INIT — surfaced 5 open questions challenging brief assumptions
