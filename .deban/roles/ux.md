---
role: ux
owner: Gerald
status: active
last-updated: 2026-05-11
---

# User Experience

## Scope

Owns the visual language, information architecture, navigation, mini-game player chrome, and reading experience for the research entries.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons

## Open Questions

- [ ] **"Nostalgic + modern" needs a concrete direction.** Three honest options: (1) CRT/scanline/pixel — full retro, easy to overdo, fights legibility; (2) Swiss-grid neutral with monochrome screenshots — modern, cold, "designer respect" but visitors may not feel the nostalgia; (3) Hybrid: clean typography + grid + small retro accents (system-font monospaced metadata, pixel icons, period-correct palette per era). Option 3 is the live candidate — needs validation. — owner: Gerald — since: 2026-05-11
- [ ] **Primary navigation: taxonomy tree or era timeline?** Taxonomy (SPATIAL → spatial-claim → qix-area-claim) showcases the convergence thesis. Era timeline (1958 → 2026) showcases history. Could ship both as toggleable views. Default-view choice signals what the site is *for*. — owner: Gerald — since: 2026-05-11
- [ ] **Primitive page layout.** Above-the-fold play-button-first vs. read-first? Recommend split: hero with primitive name + one-sentence verb + Play button; below, the research prose with the canonical year/platform/developer as metadata. — owner: Gerald — since: 2026-05-11
- [ ] **Mini-game chrome.** Frameless inline iframe? Game-boy-style chrome around each game? Minimal full-bleed canvas? Chrome adds nostalgia and visual coherence; frameless puts the mechanism centerstage. — owner: Gerald — since: 2026-05-11

## Assumptions

- [Desktop is the primary form factor; mobile is "doesn't crash" not "first-class"] — status: untested — since: 2026-05-11
- [Reader is a literate adult — dense declarative prose per style-guide is acceptable] — status: untested — since: 2026-05-11

## Dependencies

Blocked by: [[pm]] (audience)
Feeds into: [[dev]], [[qa]]

## Session Log

2026-05-11 — INIT — 4 open questions, visual direction is the highest-stakes
