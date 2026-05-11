---
role: qa
owner: Gerald
status: active
last-updated: 2026-05-11
---

# Quality Assurance

## Scope

Owns review gates: research citation quality, mini-game playability, code-readability of the source artifacts, accessibility, and the human-review checkpoints in the wave loop.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons

## Open Questions

- [ ] **Spot-check protocol per wave.** README says "human reviews diff before next wave" and "Play every mini-game once before tagging build done." Need a checklist artifact, not a vibe — at minimum: 5 random `research.md` for citation tier-1 presence + algorithm-section depth; every `minigame/` for the 8 quality gates in agent-prompt 06. — owner: Gerald — since: 2026-05-11
- [ ] **No-IP enforcement.** Mini-games must not reproduce copyrighted sprites/fonts/sounds. Build agents are instructed in agent-prompt 06 but no automated check exists. Probably a code-only review by Gerald per game. — owner: Gerald — since: 2026-05-11
- [ ] **Accessibility floor.** Keyboard-only play for every minigame? Color-blind palettes? Reduced-motion respect for animated backgrounds? Not in any spec; will rot if not surfaced now. — owner: Gerald — since: 2026-05-11

## Assumptions

- [Manual review is acceptable for v1; automated linting/test infrastructure can wait] — status: untested — since: 2026-05-11

## Dependencies

Blocked by: [[arch]], [[ux]]
Feeds into: [[pm]]

## Session Log

2026-05-11 — INIT — 3 open questions, accessibility floor not yet specified
