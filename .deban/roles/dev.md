---
role: dev
owner: Gerald
status: active
last-updated: 2026-05-12
---

# Development

## Scope

Owns implementation: site shell, mini-game wrappers, agent dispatch scripts, build/CI configuration. Executes the wave loop from CLI-RUNBOOK and the subagent-driven plans.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-05-11 | **Subagent-driven development pattern** for plan execution: 1 implementer + (spec compliance reviewer + code quality reviewer) per task or phase, fresh subagent each time. | Subagents follow TDD naturally, isolated context per task, two-stage review catches issues the implementer's self-review missed. Plan 1 used this strictly; v2 family loop relaxed it to fit budget. | [[qa]] |
| 2026-05-12 | **Cross-link integrity check via vitest + standalone CLI** (`tests/cross-links.test.ts` + `scripts/check-cross-links.mjs`, `npm run check:links`). | Build-time check that every `applied.decomposition[].variant` and every `variant.in_the_wild[].applied` resolves. Catches dangling refs before deploy. Hand-authored YAML cross-links need this safety net. | [[arch]], [[qa]] |
| 2026-05-12 | **Mobile-first DOM control bar** for asteroid + qix mini-games (replacing canvas-drawn touch zones). Explicit buttons (◀ ▶ thrust fire / d-pad + draw) below the play area, with safe-area-inset-bottom padding. | iPhone audit surfaced: invisible canvas zones are confusing; iOS home-indicator gesture zone interferes with bottom-of-canvas controls. DOM buttons decouple touch hitboxes from canvas letterboxing and lift the controls clear of the home indicator. | [[ux]], [[qa]] |
| 2026-05-12 | **Variant module pattern**: vanilla JS, ~60–150 LOC per file, no imports. Stateful via closure returned from `init()`. `applyParams` re-seeds on entity-count changes and retunes live for the rest. | Self-contained, fast to author, easy to read. Shared runner.js handles all boilerplate. | [[arch]] |
| 2026-05-12 | **`new URL(path, import.meta.url)` for all dynamic imports** under a base path. Never hardcode root-absolute paths in dynamic imports for GH-Pages-deployable code. | Discovered during iPhone audit when every variant demo was blank. See [[arch]] dead end. | [[devops]] |

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|
| 2026-05-12 | **`mod = await import(\`/d/${family}/${slug}.js\`)`** — root-absolute dynamic import path. | 404'd on GH Pages where base is `/gaming-primitives/`. Silently broke every variant demo in production. Topology never actually ran in prod — only the tab strip rendered. |
| 2026-05-12 | **Capturing `waiting` SW reference at script-load time** in UpdateToast's click handler. | Stale by click time if the SW lifecycle had advanced. Fix: re-fetch `getRegistration()` inside the click handler. |
| 2026-05-12 | **`navigator.serviceWorker.getRegistration('/')`** with hardcoded scope. | Wrong scope on GH Pages. Returned undefined. Fix: drop the scope arg — `getRegistration()` returns the registration controlling the current page. |
| 2026-05-12 | **`toast.hidden = true` alone** (no class or inline style). | CSS specificity bug — `.gp-update`'s `display: flex` outranked UA's `[hidden]{display:none}`. Visually nothing changed. Fix: explicit `.gp-update[hidden]{display:none}` rule + inline `style.display='none'` backstop. See [[arch]] and `docs/troubleshooting/update-toast.md`. |
| 2026-05-12 | **Trusting "Topology playable" badge in CI without iPhone audit.** | The runner.js import-path bug meant NO variant demo actually rendered in prod. CI checked file presence and content schema, not runtime behavior. Manual iPhone audit was the only check that would have caught it. |

## Lessons

## Open Questions

- [x] ~~Scaffold tarball vs. fresh build~~ → resolved: discarded, fresh Astro scaffold.
- [x] ~~Git not initialized~~ → resolved: initialized; on `feat/v1-implementation` and `feat/v2-families` branches; merged to main via PR #1 + #2 + #3 + #4.
- [x] ~~Agent dispatch mechanics~~ → resolved: subagent-driven-development pattern via Agent tool.
- [ ] **Per-family `import.meta.glob` scope** (also tracked in [[arch]]). — owner: Gerald — since: 2026-05-12
- [ ] **Two unbuilt Topology variants** (`infinite-scroll`, `tile-grid`) deferred from Plan 1. Easy follow-up if/when topology gets a second pass. — owner: Gerald — since: 2026-05-12

## Assumptions

- [ES modules with local imports are sufficient; no bundler needed for game code] — status: validated (62 variant modules, all imports-free, all under 10 KB)
- [Single repository, not a monorepo split] — status: validated

## Dependencies

Blocked by: [[arch]] (resolved)
Feeds into: [[qa]], [[devops]]

## Session Log

2026-05-12 — SYNC — recorded subagent-driven pattern, variant module contract, 5 production bugs from iPhone audit, the import-path discovery
2026-05-11 — INIT — 3 open questions: tarball, git, dispatch mapping
