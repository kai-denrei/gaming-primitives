---
role: arch
owner: Gerald
status: active
last-updated: 2026-05-12
---

# Architecture

## Scope

Owns the site shell, mini-game embedding contract, build pipeline, content-collection schema, demo-widget contract, and the boundary between dataset and rendered site.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-05-11 | **Astro 5 + content collections** for the hub. Vanilla JS for mini-games (no Astro inside `public/g/`). | Markdown-heavy content model (one MD per primitive, frontmatter → routes), supports islands for embedded demos, fast static output. Next.js overkill. 11ty/Hugo lose island hydration. | [[dev]] |
| 2026-05-11 | **Mini-game embed via `<iframe src="/g/<id>/">`**. Each game is a standalone PWA with own manifest + SW. | Preserves isolation. Each game installs independently. Hub SW and game SW have non-overlapping scopes. Alternatives rejected: dynamic-import via global namespace (fragile), one-SW-many-pages (forces unified versioning). | [[dev]], [[devops]] |
| 2026-05-11 | **Dataset = source of truth.** `src/content/applied/` (renamed from `primitives/`) is authoritative; site renders from it. No site-owned copy. | One-source rule prevents drift. Coupling site builds to dataset is acceptable (Astro rebuilds fast). | [[dev]] |
| 2026-05-12 | **v2 URL space**: `/p/<family>/` for pure (headline), `/a/<id>/` for applied. Old `/p/<applied-id>/` URLs emit meta-refresh stubs to `/a/<applied-id>/`. | Pure-primary decision (per [[pm]]) takes the headline URL. GH Pages can't issue 301s — meta-refresh in dist HTML stubs covers external links. Project too young for SEO collateral. | [[pm]], [[ux]] |
| 2026-05-12 | **Three content collections**: `applied/` (33 entries, renamed from `primitives/`), `primitives/` (14 family.md + 67 variant.md, NEW), with cross-link fields `applied.decomposition[]` and `variant.in_the_wild[]`. | Bidirectional graph hand-authored in YAML. No graph DB needed at this scale. Build-time integrity check (vitest + CLI) catches dangling refs. | [[dev]] |
| 2026-05-12 | **Variant module contract**: each `public/d/<family>/<variant>.js` exports `LOGICAL = {w,h}`, `init(ctx, params, env) → {state, tick, LOGICAL}`, `applyParams(state, params)`. Shared `public/d/runner.js` handles canvas DPR, rAF loop, knob mounting (float/int/toggle/enum), URL-hash routing, visibility, resize. | Decouples variant code from runtime. Variants stay tiny (~70 LOC, under 10 KB). Knob spec in YAML frontmatter; runtime hydrates. | [[dev]] |
| 2026-05-12 | **Code panel renders via `import.meta.glob('?raw')`** at build time + Astro's `<Code>` (Shiki) component for syntax highlighting. Server-rendered HTML, zero runtime JS for highlighting. | Single source of truth: the `.js` the demo runs IS the `.js` the code panel shows. No copy-paste between docs and runtime. | [[dev]] |
| 2026-05-12 | **Hub versioning**: footer renders `v{pkg.version} · {short-sha} · {build-date}`. SHA + date derived at build time via `execSync('git rev-parse --short HEAD')` in `Base.astro` frontmatter. | Gerald needs to know which commit is deployed when iPhone-testing. SHA linked to GitHub commit page. `package.json` 0.0.1 → 0.2.0 as v2 baseline. | [[devops]], [[ux]] |
| 2026-05-12 | **SW lifecycle on the hub**: `public/sw.js` uses `CACHE_VERSION` constant for cache keys; bumped on releases that change runtime code. v0.1.0 → v0.2.1 (mid-saga) → v0.2.2 (during toast fix). | Bumping forces activate handler to drop stale caches. Necessary discipline — never touched for the entire v1 lifecycle, accumulated a state cliff. | [[devops]], [[dev]] |

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|
| 2026-05-12 | **SW `getRegistration('/')` hardcoded scope** in UpdateToast. | GH Pages scope is `/gaming-primitives/`, not `/`. Returned undefined → `updatefound` listener never attached → toast scriptable surface broken. Fixed by dropping the scope arg. |
| 2026-05-12 | **`runner.js` dynamic `import('/d/<family>/<variant>.js')`** with root-absolute path. | On GH Pages with non-root base, every variant import 404'd silently. Topology only "worked" locally; in prod the canvas was blank pixels. Fixed via `new URL('./...', import.meta.url)`. |
| 2026-05-12 | **CACHE_VERSION held at `v0.1.0`** through all v1 + early v2 work. | Activate handler keyed cache busting off this constant. SW lifecycle never advanced cleanly, leaving stale caches that surfaced as phantom "update available" loops. Bumping mid-saga (v0.2.1, v0.2.2) partially fixed; discipline needed going forward. |
| 2026-05-12 | **`.gp-update` class with `display: flex` overriding `[hidden]` attribute** in UpdateToast CSS. | Both selectors had identical specificity `(0,1,0)`; author rule won by cascade. `toast.hidden = true` wrote the attribute but the toast stayed visible. Dismiss appeared broken across all browsers. Fixed by adding explicit `.gp-update[hidden]{display:none}` (higher specificity after Astro CID scoping) + inline `style.display='none'` backstop. |
| 2026-05-12 | **`import.meta.glob('/public/d/**/*.js')`** pulls every variant on every family page. | Acceptable at MVP scale (~6 KB of inline source), will bloat once Motion + Bullets land variants. Flagged for per-family scoping. |

## Lessons

## Open Questions

- [x] ~~Static site generator?~~ → resolved 2026-05-11: Astro 5.
- [x] ~~Mini-game embedding contract?~~ → resolved 2026-05-11: iframe + per-game SW + non-overlapping scopes.
- [x] ~~Dataset source of truth?~~ → resolved 2026-05-11: content collections under `src/content/`.
- [ ] **Per-family `import.meta.glob` scope** — current global glob picks up all variants on every family page. Acceptable now (~6 KB total), needs scoping before catalog grows past 20 families. — owner: Gerald — since: 2026-05-12
- [ ] **Decomposition section rendering on `/a/<id>/`** — spec calls for chips showing the primitive composition; not implemented. Pair with backfill of `decomposition:` blocks on the 9 built applied stubs. — owner: Gerald — since: 2026-05-12

## Assumptions

- [Vanilla-JS variant modules must remain framework-free; the hub uses Astro without violating this] — status: validated through 13 family builds
- [Variant modules stay under 10 KB each] — status: validated (largest is `rules-as-objects/nested-rules.js` at 8.5 KB)
- [Static hosting is sufficient — no SSR / no backend] — status: validated (GH Pages deployed)

## Dependencies

Blocked by: [[pm]] (resolved for v1/v2 scope)
Feeds into: [[dev]], [[devops]]

## Session Log

2026-05-12 — SYNC — captured v2 URL space, schema, module contract, versioning, SW lifecycle; recorded 5 dead ends from the toast saga
2026-05-11 — INIT — captured 3 unresolved architecture decisions
