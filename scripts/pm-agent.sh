#!/usr/bin/env bash
# Usage: scripts/pm-agent.sh <wave> [args...]
#   wave: research <id1,id2,...>   # one or more primitives to research in parallel
#         collapse                 # single agent scans all research.md
#         taxonomy                 # single agent re-fits the tree
#         spec <id1,id2,...>       # spec-ify researched primitives
#         build <id1,id2,...>      # build mini-games from spec'd primitives
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

WAVE=${1:?usage: $0 <wave> [args]}; shift || true
DATE=$(date -u +%Y-%m-%d-%H%M)
SUMMARY="research-notes/wave-${WAVE}-${DATE}.md"

if ! command -v claude >/dev/null; then
  echo "claude CLI not found in PATH"; exit 1
fi

PROMPT=$(scripts/build-dispatch-msg.sh "$WAVE" "$@")

echo "=== Wave: $WAVE ==="
echo "=== Summary will land at: $SUMMARY ==="
echo "$PROMPT" | claude -p --output-format text | tee "$SUMMARY"

echo ""
echo "Wave complete. Review the diff:"
echo "  git diff --stat"
echo "  git status"
echo ""
echo "Approve → commit:"
echo "  git add -A && git commit -m 'wave-$WAVE: <summary>'"
echo "Reject → restore:"
echo "  git checkout -- ."
