---
role: devops
owner: Gerald
status: active
last-updated: 2026-05-12
---

# DevOps

## Scope

Owns hosting, deployment, domain, CI/CD, token-budget tracking for agent waves, the GitHub repo (kai-denrei), SW lifecycle / PWA install, branch / PR strategy.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-05-11 | **Hosting: GitHub Pages.** Repo `kai-denrei/gaming-primitives`, public, deploy from `main`. | Free, static-only matches project, no server-side needed. Vercel overkill. Alternative rejected: defer publishing (would have lost iPhone audit signal). | [[arch]] |
| 2026-05-11 | **Deploy workflow on `main`**: GitHub Actions builds Astro, publishes to GH Pages. Auto-deploy on merge. | Standard pattern. Workflow committed at `cba2268`. | |
| 2026-05-12 | **Branch / PR strategy**: feature branches per major chunk (`feat/v1-implementation`, `feat/v2-families`, `fix/*` for small targeted fixes), merge via `gh pr merge`. CLI has full authority post-2026-05-12. | Auditable history without per-action confirmation friction. PRs for the diff trail; merges happen automatically when CI green. | [[pm]] |
| 2026-05-12 | **Hub SW `CACHE_VERSION` discipline**: bump on every release that changes runtime code. Currently `v0.2.2`. Activate handler keys cache busting off this. | Sat at `v0.1.0` through v1 + early v2 — SW lifecycle accumulated state cliff. Bumping discipline avoids the cliff. | [[arch]] |
| 2026-05-12 | **Version surfacing in footer**: `v{pkg.version} · {short-sha} · {build-date}`. SHA hyperlinked to GitHub commit page. | Necessary for "what am I looking at" diagnosis during iPhone testing. Build-time injection via `execSync` in `Base.astro`. | [[arch]], [[ux]] |
| 2026-05-12 | **Telegram alerts** via `@kainode_alert_bot` for significant deploy events (PR merged, deploy started, fix shipped). | Gerald iPhone-tests in real time; Telegram is the side channel. | |

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|
| 2026-05-12 | **GH Pages serving 301 redirects** for legacy `/p/<applied-id>/` URLs. | Static hosting — no 301 capability. Fallback: meta-refresh HTML stubs at build time covering all 33 applied entries. |
| 2026-05-12 | **Leaving CACHE_VERSION at `v0.1.0`** through the entire v1 + early v2 lifecycle. | SW activate handler never dropped old caches. Surfaced as phantom "new version available" loops + stuck waiting SW on Gerald's iPhone PWA. Bumping mid-saga (v0.2.1 then v0.2.2) only partially recovered. |
| 2026-05-12 | **`gh pr merge --merge --delete-branch`** without `--auto`. | Branch deletion was fine for `fix/*` branches but blocked the rebase path for stacked PRs. Adapted: keep feat branches around until PR is verified merged-and-deployed. |

## Lessons

## Open Questions

- [x] ~~Hosting target~~ → resolved 2026-05-11: GitHub Pages.
- [x] ~~GitHub repo creation~~ → resolved 2026-05-11: `kai-denrei/gaming-primitives`, public.
- [ ] **Token-budget tracking** — `~/scripts/check-usage.sh` exists per kainode CLAUDE.md; not integrated into the agent loop. Was checked manually at session boundaries. — owner: Gerald — since: 2026-05-11
- [ ] **Custom domain** — currently `kai-denrei.github.io/gaming-primitives/`. Worth a real domain at some point. — owner: Gerald — since: 2026-05-12
- [ ] **SW update strategy** beyond "bump CACHE_VERSION on release" — automated bump in deploy workflow? Worth considering before manual bumps drift. — owner: Gerald — since: 2026-05-12

## Assumptions

- [Static hosting is sufficient; no SSR or backend needed for v1] — status: validated 2026-05-12
- [Solo dev means Gerald merges all PRs personally] — status: superseded 2026-05-12 by CLI git authority grant

## Dependencies

Blocked by: [[arch]] (resolved)
Feeds into: [[pm]]

## Session Log

2026-05-12 — SYNC — recorded deploy pipeline, branch strategy, SW lifecycle discipline, versioning surface; 3 dead ends from the deploy/SW saga
2026-05-11 — INIT — 3 open questions: hosting, repo, budget tracking
