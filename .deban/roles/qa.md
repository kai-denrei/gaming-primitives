---
role: qa
owner: Gerald
status: active
last-updated: 2026-05-12
---

# Quality Assurance

## Scope

Owns review gates: research citation quality, mini-game playability, code-readability, accessibility, mobile audit, and human-review checkpoints in the wave loop.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-05-11 | **Two-stage review per task**: spec compliance reviewer (verifies code matches plan) → code quality reviewer (verifies code is well-built). Fresh subagent each. | Implementer self-review missed real issues (off-palette colors, ARIA gaps, dead-code references). Two-stage caught most before merge. | [[dev]] |
| 2026-05-12 | **iPhone audit is a manual gate** before "deploy looks good" claim. Subagent CI doesn't substitute for real-device behavior. | The runner.js import-path bug was invisible to CI (build succeeded, tests green, check:links OK) but mass-broke every variant demo in prod. Only Gerald's iPhone tap-through caught it. | [[ux]], [[dev]] |
| 2026-05-12 | **Cross-link integrity** enforced at build time via vitest + CLI (`scripts/check-cross-links.mjs`). Build fails on dangling decomposition/in_the_wild references. | Hand-authored YAML cross-links need this safety net to scale past Topology. | [[dev]], [[arch]] |
| 2026-05-12 | **Touch-target floor: 44×44px** for all interactive elements (toast buttons, mini-game touch-bar). | iOS HIG minimum; sub-44 targets get fumble-tapped. | [[ux]] |
| 2026-05-12 | **WAI-ARIA tab pattern** for variant tabs (`role=tablist`, `aria-selected` toggled on tab swap). Native `<input type=range>` for sliders (free keyboard accessibility). | Cheap accessibility wins. Documented in spec, implemented in PrimitiveDemo + runner. | [[ux]] |

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|
| 2026-05-12 | **Trust "Topology playable" badge as ship-readiness signal.** | CI checked variant.md status + module syntax. Runtime behavior in prod was completely broken (root-absolute import). Manual iPhone audit was the only catch. |
| 2026-05-12 | **Skip per-family spec/quality review for the 13-family bulk loop** to fit token budget. | Palette drift in rules-as-objects + state-machines slipped through. Cosmetic only, but a real review gap. Cost: ~25 minutes of post-hoc audit work pending. |
| 2026-05-12 | **`aria-selected="false"` shipped on all variant tabs by SSR** with no JS update on tab swap. | Screen readers announce every tab as unselected forever. Fixed: `runner.js` now toggles `aria-selected` alongside `data-active`. |

## Lessons

## Open Questions

- [x] ~~Spot-check protocol per wave~~ → resolved 2026-05-11 via two-stage subagent review.
- [ ] **No-IP enforcement** — mini-games must not reproduce copyrighted sprites/fonts/sounds. Currently relies on agent-prompt instruction. No automated check. — owner: Gerald — since: 2026-05-11
- [ ] **Accessibility floor**: keyboard-only play for every minigame? Color-blind palettes? Reduced-motion respect on background animations? Partially covered (variant modules read `matchMedia('(prefers-reduced-motion: reduce)')`). Not specified across the catalog. — owner: Gerald — since: 2026-05-11
- [ ] **iPhone audit checklist** — currently ad-hoc per-page. Should formalize: portrait + landscape + tab swap + knob slide + back-nav + redirect-from-old-URL for each family page. — owner: Gerald — since: 2026-05-12

## Assumptions

- [Manual review is acceptable for v1; automated linting/test infrastructure can wait] — status: superseded for v2. Cross-link CI + vitest now operational.

## Dependencies

Blocked by: [[arch]], [[ux]] (resolved for current scope)
Feeds into: [[pm]]

## Session Log

2026-05-12 — SYNC — recorded two-stage review pattern, iPhone-audit-as-gate decision, ARIA + touch-target floors; 3 dead ends from the audit gap
2026-05-11 — INIT — 3 open questions, accessibility floor not yet specified
