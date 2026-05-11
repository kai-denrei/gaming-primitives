---
role: devops
owner: Gerald
status: active
last-updated: 2026-05-11
---

# DevOps

## Scope

Owns hosting, deployment, domain, CI/CD, token-budget tracking for the agent waves, and the repository on GitHub (kai-denrei).

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons

## Open Questions

- [ ] **Hosting target.** GitHub Pages (free, static, easiest) vs. Vercel (better preview deploys, Astro/Next defaults) vs. local-only-first (defer publishing entirely). Affects domain decision. — owner: Gerald — since: 2026-05-11
- [ ] **GitHub repo creation.** New public repo on `kai-denrei`? Name `gaming-primitives`? Public from day one, or private until v1? — owner: Gerald — since: 2026-05-11
- [ ] **Token-budget tracking.** CLI-RUNBOOK forecasts ~5M tokens for full pipeline. `~/scripts/check-usage.sh` exists per CLAUDE.md — should the PM-agent loop call it between waves and pause if approaching limit? — owner: Gerald — since: 2026-05-11

## Assumptions

- [Static hosting is sufficient; no server-side rendering or backend needed for v1] — status: untested — since: 2026-05-11

## Dependencies

Blocked by: [[arch]] (build output shape)
Feeds into: [[pm]]

## Session Log

2026-05-11 — INIT — 3 open questions: hosting, repo, budget tracking
