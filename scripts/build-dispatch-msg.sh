#!/usr/bin/env bash
# Emits the canonical dispatch prompt for a given wave per CLI-RUNBOOK.md.
# Output goes to stdout; pm-agent.sh pipes it to `claude -p`.
set -euo pipefail
WAVE=$1; shift || true

case "$WAVE" in
  research)
    IDS=${1:?usage: build-dispatch-msg.sh research <id1,id2,...>}
    cat <<EOF
Read BRIEF.md, schema.md, style-guide.md, references/sources.md, and agent-prompts/02-research.md.

Dispatch one parallel sub-agent per id below via the Task tool. Each sub-agent:
- Reads src/content/primitives/<id>/stub.md
- Reads agent-prompts/02-research.md to the letter
- Produces src/content/primitives/<id>/research.md (status: researched)
- Updates the stub.md frontmatter status to "researched"
- Checks off the entry in research-queue.md
- Appends citations to references/citations.bib (deduplicate by URL)
- Appends one line to research-notes/research-log.md

Ids:
$(echo "$IDS" | tr ',' '\n' | sed 's/^/  - /')

When all return, summarize: completed ids, total sources cited, any [NEEDS VERIFICATION] flags. Then stop and wait for human review.
EOF
    ;;
  collapse)
    cat <<'EOF'
Read agent-prompts/03-collapse.md.

You are the Collapse agent. Scan every src/content/primitives/*/research.md with status: researched. Produce research-notes/collapse-proposal-$(date -u +%Y-%m-%d).md per the agent prompt's format.

Do not auto-execute any merge. Stop and wait for human review.
EOF
    ;;
  taxonomy)
    cat <<'EOF'
Read agent-prompts/04-taxonomy.md.

Re-fit taxonomy.md based on the current set of researched primitives and the most recent collapse log. Produce the updated taxonomy.md and the diff summary at research-notes/taxonomy-update-$(date -u +%Y-%m-%d).md.
EOF
    ;;
  spec)
    IDS=${1:?usage: build-dispatch-msg.sh spec <id1,id2,...>}
    cat <<EOF
Read agent-prompts/05-minigame-spec.md and BRIEF.md, schema.md, style-guide.md.

Dispatch one parallel sub-agent per id below. Each sub-agent reads src/content/primitives/<id>/research.md and produces src/content/primitives/<id>/spec.md per the schema, sets stub status to "speced", and checks off the entry in research-queue.md.

Important spec.md frontmatter additions for v1 PWA delivery:
- orientation: auto | portrait | landscape   (default auto; only override when the primitive demands it)
- target_loc: integer line budget per agent-prompts/05

Ids:
$(echo "$IDS" | tr ',' '\n' | sed 's/^/  - /')

Stop when all return. Summarize: ids spec'd, target_loc per game.
EOF
    ;;
  build)
    IDS=${1:?usage: build-dispatch-msg.sh build <id1,id2,...>}
    cat <<EOF
Read agent-prompts/06-minigame-build.md and CLAUDE.md.

For each id below, dispatch one sub-agent that:
1. Runs: bash scripts/new-minigame.sh <id>
   (this scaffolds public/g/<id>/ from templates/minigame-pwa/, with all PWA wiring already in place — manifest, sw.js, icons, offline.html)
2. Reads src/content/primitives/<id>/spec.md and writes only:
   - public/g/<id>/game.js  (replacing the template body with the actual primitive)
   - public/g/<id>/README.md (filling the template placeholders)
3. Does NOT touch manifest.webmanifest, sw.js, offline.html, style.css, index.html — those are template-managed.
4. Updates src/content/primitives/<id>/stub.md frontmatter status to "built"
5. Appends to research-notes/build-log.md

PWA quality gates (in addition to agent-prompts/06's 8 existing gates):
- Lighthouse Installability passes in Chrome (manual verification by human after build)
- Game loads + plays after toggling network offline (human verifies via DevTools)
- Fullscreen + portrait/landscape per spec works on real iOS Safari (human verifies on device)
- prefers-reduced-motion: reduce disables non-essential animation

Ids:
$(echo "$IDS" | tr ',' '\n' | sed 's/^/  - /')

Stop when all return. Summarize: ids built, LOC per game, gate failures.
EOF
    ;;
  *)
    echo "unknown wave: $WAVE" >&2
    echo "wave names: research, collapse, taxonomy, spec, build" >&2
    exit 1
    ;;
esac
