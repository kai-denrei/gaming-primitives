#!/usr/bin/env bash
# Usage: scripts/new-minigame.sh <id>
# Copies templates/minigame-pwa/ into public/g/<id>/, substitutes placeholders
# (id, name, short, verb, game, year, platform, developer, era_color,
# orientation, version) from the primitive's stub.md frontmatter, and
# generates the icon set via gen-icons.mjs.
set -euo pipefail

ID=${1:?usage: $0 <id>}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
STUB="$ROOT/src/content/primitives/$ID/stub.md"
DEST="$ROOT/public/g/$ID"

[ -f "$STUB" ] || { echo "no stub at $STUB"; exit 1; }
[ -d "$DEST" ] && { echo "$DEST already exists; refusing to overwrite"; exit 1; }

# Parse YAML frontmatter (simple awk; assumes top-of-file frontmatter)
yaml() { awk -v key="$1" '/^---$/{in_fm=!in_fm; next} in_fm{ if ($1==key":"){ $1=""; sub(/^ /,""); gsub(/"/,""); print; exit } }' "$STUB"; }

NAME=$(yaml name)
GAME=$(yaml canonical_game)
YEAR=$(yaml canonical_year)
PLATFORM=$(yaml canonical_platform)
DEVELOPER=$(yaml canonical_developer)
ERA=$(yaml era_bucket)
ORIENT=$(yaml orientation)
VERB=$(awk '/player_verb:/{ sub(/^[^:]+: *"?/,""); sub(/"$/,""); print; exit }' "$STUB")
VERSION=0.1.0
SHORT=${NAME:0:12}

case "$ERA" in
  PoC) ERA_COLOR="#39ff14" ;;
  arcade-early) ERA_COLOR="#ff5e3a" ;;
  arcade-golden-age) ERA_COLOR="#ffd23f" ;;
  home-8bit) ERA_COLOR="#5b76ff" ;;
  home-16bit) ERA_COLOR="#c83be0" ;;
  early-3d) ERA_COLOR="#ff9f1c" ;;
  modern-console-pc) ERA_COLOR="#7a8a99" ;;
  indie-modern) ERA_COLOR="#ff85a1" ;;
  *) ERA_COLOR="#0d1117" ;;
esac

# Manifest orientation: 'auto' isn't a valid manifest value — translate
MAN_ORIENT="$ORIENT"
if [ "$ORIENT" = "auto" ]; then MAN_ORIENT="any"; fi

cp -r "$ROOT/templates/minigame-pwa" "$DEST"

# Substitute placeholders in text files (NOT icons — those are PNG)
for f in "$DEST/index.html" "$DEST/manifest.webmanifest" "$DEST/sw.js" \
         "$DEST/offline.html" "$DEST/style.css" "$DEST/README.md" \
         "$DEST/game.js"; do
  sed -i.bak \
    -e "s|__ID__|$ID|g" \
    -e "s|__NAME__|$NAME|g" \
    -e "s|__SHORT__|$SHORT|g" \
    -e "s|__VERB__|$VERB|g" \
    -e "s|__GAME__|$GAME|g" \
    -e "s|__YEAR__|$YEAR|g" \
    -e "s|__PLATFORM__|$PLATFORM|g" \
    -e "s|__DEVELOPER__|$DEVELOPER|g" \
    -e "s|__ERA_COLOR__|$ERA_COLOR|g" \
    -e "s|__ORIENTATION__|$MAN_ORIENT|g" \
    -e "s|__VERSION__|$VERSION|g" \
    "$f"
  rm "$f.bak"
done

# Generate icons. Glyph is the first two letters of the short name uppercase.
GLYPH=$(printf '%.2s' "$SHORT" | tr '[:lower:]' '[:upper:]')
node "$ROOT/scripts/gen-icons.mjs" "$DEST/icons" "$ERA_COLOR" "$GLYPH"

echo "scaffolded $DEST"
echo "next: build agent writes $DEST/game.js + fills $DEST/README.md"
