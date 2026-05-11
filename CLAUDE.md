# gaming-primitives — project rules

## Toolchain
- Node 24.x, npm 10.x
- Astro 5 with content collections
- Vanilla JS/HTML/CSS inside `public/g/{id}/` — never import Astro into mini-games

## Layout invariants
- All research markdown: `src/content/primitives/{id}/{stub,research,spec}.md`
- All mini-game PWAs: `public/g/{id}/` (no Astro processing)
- Agent prompts: `agent-prompts/01..06.md` (do not rename)
- Project memory: `.deban/` (managed by /deban skill)

## Agent waves
- Dispatched by `scripts/pm-agent.sh <wave>` (wraps `claude -p`)
- Wave summary lands in `research-notes/wave-<wave>-<date>.md`
- Human reviews diff, then commits, then runs next wave

## Mini-game PWA contract
- Template at `templates/minigame-pwa/`, lifted from KikaCentroid
- Hand-rolled SW, no Workbox runtime
- CACHE_VERSION in `sw.js` mirrored as `?v=` on HTML asset links
- iOS PWA tags required; tested on real iPhone before tagging built

## Style
- Markdown style per `style-guide.md` (dense, declarative, present tense)
- No emojis in research files; mini-game UI may use them
