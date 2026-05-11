---
role: dev
owner: Gerald
status: active
last-updated: 2026-05-11
---

# Development

## Scope

Owns implementation: site shell code, mini-game wrappers, agent dispatch scripts, build/CI configuration. Executes the wave loop from CLI-RUNBOOK.md.

## Decisions

| Date | Decision | Rationale | Linked roles |
|---|---|---|---|

## Dead Ends

<!-- APPEND ONLY. Never delete. -->

| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons

## Open Questions

- [ ] **Scaffold tarball vs. fresh build.** `gameplay-primitives-scaffold.tar.gz` exists in repo root alongside the markdown — does it contain the expected `agent-prompts/`, `primitives/`, `references/`, `research-notes/`, `mini-games/` layout described in README? Extract and inspect before deciding whether to use as-is, merge with current loose files, or discard. — owner: Gerald — since: 2026-05-11
- [ ] **Git: not yet initialized.** Repo state shows "Is a git repository: false". CLI-RUNBOOK's commit-hygiene section assumes git. Need init + initial commit before any wave dispatches. — owner: Gerald — since: 2026-05-11
- [ ] **Agent dispatch mechanics.** Sub-agents per CLI-RUNBOOK call the Task tool. Our environment offers TaskCreate/dispatching-parallel-agents/Agent tools — need to map the runbook's "Task tool" wording to actual Agent invocations. — owner: Gerald — since: 2026-05-11

## Assumptions

- [ES modules with local imports are sufficient; no bundler needed for the seed deliverable] — status: untested — since: 2026-05-11
- [Single repository, not a monorepo split between site and research] — status: untested — since: 2026-05-11

## Dependencies

Blocked by: [[arch]] (SSG choice, embedding contract)
Feeds into: [[qa]], [[devops]]

## Session Log

2026-05-11 — INIT — 3 open questions: tarball, git, dispatch mapping
