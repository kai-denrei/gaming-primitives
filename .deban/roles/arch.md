---
role: arch
owner: Gerald
status: active
last-updated: 2026-05-11
---

# Architecture

## Scope

Owns the site shell, mini-game embedding contract, build pipeline, and the boundary between the research dataset (markdown + frontmatter) and the rendered site.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons

## Open Questions

- [ ] **Static site generator or framework?** Astro suits the markdown-heavy content model (one MD per primitive, frontmatter → routes), supports islands for the mini-games, and yields fast static output. Next.js is overkill. 11ty/Hugo are leaner but lose island hydration. Plain HTML+JS is feasible but loses the content-collection ergonomics. — owner: Gerald — since: 2026-05-11
- [ ] **Mini-game embedding contract.** Each `primitives/{id}/minigame/` is its own standalone HTML+JS (per agent-prompt 06). Site can either: (a) iframe each one, (b) inline-import via dynamic script, or (c) require the build agent to export a single boot function. Iframe is simplest and preserves isolation; inline saves bytes but introduces a global-namespace contract. — owner: Gerald — since: 2026-05-11
- [ ] **Dataset is the source of truth.** Are the primitive `.md` files in `primitives/{id}/` the authoritative dataset, with the site rendering them, or does the site own its own copy? One-source rule prevents drift but couples site builds to research-agent output. — owner: Gerald — since: 2026-05-11

## Assumptions

- [Vanilla-JS mini-games must remain framework-free per agent-prompt 06; the site shell can use a framework without violating this] — status: untested — since: 2026-05-11
- [Mini-games will not exceed ~500 LOC each on average; total site weight stays small enough for a static host] — status: untested — since: 2026-05-11

## Dependencies

Blocked by: [[pm]] (v1 scope, PM-agent boundary)
Feeds into: [[dev]], [[devops]]

## Session Log

2026-05-11 — INIT — captured 3 unresolved architecture decisions
