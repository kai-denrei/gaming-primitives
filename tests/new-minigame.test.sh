#!/usr/bin/env bash
# Smoke test: scaffold using the __test__ fixture primitive, verify files
# exist and placeholders are substituted, then clean up.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
TARGET="$ROOT/public/g/__test__"

# Cleanup leftover from prior runs
rm -rf "$TARGET"

bash "$ROOT/scripts/new-minigame.sh" __test__

# Files exist
for f in index.html game.js style.css manifest.webmanifest sw.js offline.html \
         icons/icon-192.png icons/icon-512.png icons/icon-maskable-512.png \
         icons/apple-touch-icon-180.png icons/favicon-32.png; do
  test -f "$TARGET/$f" || { echo "MISSING: $f"; exit 1; }
done

# Placeholders substituted
! grep -lq '__ID__\|__NAME__\|__ERA_COLOR__' "$TARGET"/*.html "$TARGET"/*.js "$TARGET"/*.css "$TARGET"/*.json "$TARGET"/*.md \
  || { echo "unsubstituted placeholders found"; exit 1; }

# Manifest is valid JSON
node -e "JSON.parse(require('fs').readFileSync('$TARGET/manifest.webmanifest','utf8'))" \
  || { echo "manifest invalid JSON"; exit 1; }

echo "OK"

# Cleanup
rm -rf "$TARGET"
