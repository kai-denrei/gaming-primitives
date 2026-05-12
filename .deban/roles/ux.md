---
role: ux
owner: Gerald
status: active
last-updated: 2026-05-12
---

# User Experience

## Scope

Owns the visual language, information architecture, navigation, mini-game player chrome, demo-widget UX, reading experience, and mobile-first behavior.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-05-11 | **Visual direction: Option 3 hybrid** — clean monospace typography + dark palette + small retro accents (per-era color tokens, system-font monospaced metadata). | CRT/scanline was too retro-overdo and fights legibility. Swiss-grid neutral was too cold and lost the nostalgia. Hybrid carries both without committing to either extreme. | [[pm]] |
| 2026-05-11 | **Both taxonomy AND era timeline as primary nav** (Primitives \| Applied \| Era \| About). | Both views answer different questions ("how do mechanisms cluster?" vs. "when did each emerge?"). Showing both signals "this is for browsing across two axes." | |
| 2026-05-12 | **v2 top-nav rewrite**: `Primitives \| Applied \| Era \| About \| Install`. Taxonomy view subsumed into the per-collection index pages (`/p/` and `/a/`). | Pure-primary decision (per [[pm]]) makes Primitives the headline. Era timeline stays for the cultural-history angle on applied games. | [[arch]] |
| 2026-05-12 | **Family page layout**: hero + variant tabs (scroll-snap horizontal, hash-routed) + canvas (16:9, ≤50vh on mobile) + parameter knob row + "in the wild" sidebar + code panel (Shiki, collapsible on mobile). | Concrete interactive scanning pattern: see variant → tinker knob → read context → see source. Mirrors GME's UX but adds the cultural sidebar. | [[arch]] |
| 2026-05-12 | **Applied detail page**: iframe minigame (existing) + new decomposition section (chips → primitives) + research/spec (existing). | Bidirectional graph anchors the applied work to the primitive layer. Decomposition rendering deferred to a follow-up. | [[arch]] |
| 2026-05-12 | **Mini-game chrome**: toolbar with `←` back button (to hub root), brand title, install button, fullscreen button. Safe-area-inset-top padding on the toolbar (clears iOS clock). On asteroid + qix, a DOM `.touch-bar` below the play area replaces invisible canvas zones. | iPhone audit surfaced: title behind iOS clock, no exit affordance, invisible touch zones confusing, controls in iOS home-indicator gesture zone. | [[dev]], [[qa]] |
| 2026-05-12 | **Update toast**: top-right floating, max-width bounded, `× dismiss` button (24h localStorage memo), Refresh button uses click + pointerup belt-and-suspenders. Touch targets 44×44. | Persistent toast across browsers traced to a CSS specificity bug. Dismiss with localStorage TTL is the escape hatch. See `docs/troubleshooting/update-toast.md`. | [[arch]] |
| 2026-05-12 | **Family display order**: alphabetical 01–14, rendered as `01 — Aiming` style monospace prefix in `/p/` index. | Stable, scannable catalog ordering. Order field on `family.md` frontmatter, sorted in `index.astro`. | [[dev]] |

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|
| 2026-05-12 | **Invisible touch-zone overlay** on asteroid + qix (faint canvas rects revealed on touchstart). | Confusing on real iPhone — players didn't know where to tap. Fire button was a tiny corner. iOS home-indicator interfered with bottom zones. Replaced with explicit DOM control bar. |
| 2026-05-12 | **Toast `top: 1rem` (no safe-area-inset-top).** | Refresh button hid behind iOS battery/5G icons on installed PWA. |
| 2026-05-12 | **Toast `top: 1rem; right: 1rem; left: 1rem; max-width: 22rem; margin-left: auto`.** | Over-constrained — toast became a narrow right-anchored ribbon leaving a gap on the left where the brand text bled through. Reverted to `top + right + max-width` only. |
| 2026-05-12 | **Skipping per-family UX review** during the 13-family build loop. | Two families (rules-as-objects, state-machines) introduced off-palette semantic colors. Cosmetic, post-fixable, but a real audit gap. |

## Lessons

## Open Questions

- [x] ~~Nostalgic + modern direction?~~ → resolved 2026-05-11: Option 3 hybrid.
- [x] ~~Primary nav: taxonomy or timeline?~~ → resolved 2026-05-12: both, plus Primitives + Applied as two collection axes.
- [x] ~~Primitive page layout?~~ → resolved 2026-05-12: family page template (above).
- [x] ~~Mini-game chrome?~~ → resolved 2026-05-12: toolbar + safe-area-aware DOM control bar.
- [ ] **Decomposition chips on `/a/<id>/`** — spec calls for them; not yet rendered. — owner: Gerald — since: 2026-05-12
- [ ] **Palette consistency audit** on rules-as-objects + state-machines (off-token semantic colors slipped in during the unreviewed loop). — owner: Gerald — since: 2026-05-12
- [ ] **Mobile audit on the 13 newly-built family pages** (only Topology + the toast paths were iPhone-tested by Gerald so far). — owner: Gerald — since: 2026-05-12

## Assumptions

- [Desktop is primary, mobile is "first-class for play but secondary for read"] — status: superseded 2026-05-12. iPhone-first audit has driven most recent fixes; mobile is co-primary.
- [Reader is a literate adult — dense declarative prose is acceptable] — status: still operative

## Dependencies

Blocked by: [[pm]] (audience still soft)
Feeds into: [[dev]], [[qa]]

## Session Log

2026-05-12 — SYNC — captured v2 page templates, mini-game chrome decisions, toast UX, family numbering; recorded 4 UX dead ends
2026-05-11 — INIT — 4 open questions, visual direction highest-stakes
