---
project: gaming-primitives
spec: v1
created: 2026-05-11
status: approved-by-user-pending
---

# Gaming Primitives — v1 Design

## Goal

Ship a publicly-browsable website that catalogs the irreducible gameplay primitives underneath thousands of games (1958–present). v1 demonstrates the thesis with 33 researched primitive cards + 3 fully playable mini-game demos, each installable as its own PWA. The website is nostalgic in palette and typography, modern in code and layout.

## Locked decisions (from brainstorming clarification)

| Decision | Choice |
|---|---|
| v1 scope | Site shell + 33 primitive stub cards + 3 fully playable demos |
| Three v1 demos | `asteroids-rotate-thrust`, `qix-area-claim`, `baba-is-you-rewrite` |
| PM agent boundary | Pauses after each wave for human review |
| Hosting | Local-only first; deploy target deferred |
| Stack | Astro + content collections (hub) + vanilla JS (mini-games) |
| Embedding | `<iframe src="/g/{id}/">` on hub pages; same URL is standalone install target |
| Mini-game PWA template | Hand-rolled, lifted from `KikaCentroid` (NetworkFirst nav, SWR JS/CSS, CacheFirst images, version-bumped cache) |
| Orientation policy | Auto by default; per-spec override in `spec.md` frontmatter |
| Install affordance | Both: hub as catalog PWA AND each game as its own installable PWA |

## Architecture

Two PWAs in one repository, non-overlapping service-worker scopes.

```
                    ┌────────────────────────────┐
                    │  Hub PWA  (Astro, scope /) │
                    │  - taxonomy view           │
                    │  - era timeline view       │
                    │  - /p/{id}/ primitive page │
                    │  - SW: hub-cache           │
                    └─────────────┬──────────────┘
                                  │ iframe src="/g/{id}/"
                                  ▼
                    ┌────────────────────────────┐
                    │  Mini-game PWA             │
                    │  scope /g/{id}/            │
                    │  vanilla HTML/JS, no Astro │
                    │  own manifest + own SW     │
                    │  installable independently │
                    └────────────────────────────┘
```

### Scope discipline

- `/sw.js` → controls `/` (hub)
- `/g/qix-area-claim/sw.js` → controls only `/g/qix-area-claim/` (game)

Per the mobile-pwa skill: scopes are explicit, never nested. Each game's SW is unaware of the hub and vice versa.

## Repository layout

```
gaming-primitives/
├── src/
│   ├── content/
│   │   ├── config.ts                          # Zod schema mirroring schema.md
│   │   └── primitives/
│   │       └── {id}/
│   │           ├── stub.md
│   │           ├── research.md
│   │           └── spec.md
│   ├── pages/
│   │   ├── index.astro
│   │   ├── taxonomy.astro
│   │   ├── era.astro
│   │   ├── about.astro
│   │   └── p/[id].astro
│   ├── components/
│   │   ├── TaxonomyTree.astro
│   │   ├── EraTimeline.astro
│   │   ├── PrimitiveCard.astro
│   │   ├── GameEmbed.astro
│   │   ├── InstallButton.astro              # client island
│   │   └── UpdateToast.astro                # client island
│   ├── layouts/
│   │   └── Base.astro
│   └── styles/
│       ├── tokens.css                        # palette per era, type scale, spacing
│       └── prose.css                         # mise-en-page rules
├── public/
│   ├── manifest.webmanifest                  # hub PWA manifest
│   ├── sw.js                                 # hub SW
│   ├── offline.html
│   ├── icons/                                # hub icons (192, 512, maskable, apple-180)
│   └── g/
│       └── {id}/                             # mini-game PWAs (vanilla)
├── templates/
│   └── minigame-pwa/                         # KikaCentroid-cloned skeleton + placeholders
├── agent-prompts/
│   ├── 01-discover.md
│   ├── 02-research.md
│   ├── 03-collapse.md
│   ├── 04-taxonomy.md
│   ├── 05-minigame-spec.md
│   └── 06-minigame-build.md                  # updated with PWA quality gates
├── references/
│   ├── sources.md
│   └── citations.bib
├── research-notes/                            # wave summaries land here
├── scripts/
│   ├── pm-agent.sh                            # wave dispatcher (wraps claude -p)
│   ├── new-minigame.sh                        # scaffolds public/g/{id}/ from template
│   └── gen-icons.sh                           # produces 192/512/maskable from a source svg per primitive
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-05-11-gaming-primitives-v1-design.md   # this file
├── .deban/                                    # project memory (initialized)
├── BRIEF.md
├── README.md
├── taxonomy.md
├── schema.md
├── style-guide.md
├── CLI-RUNBOOK.md
├── research-queue.md
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── .gitignore
```

The 12 root-level markdown files from the existing scaffold (BRIEF, README, taxonomy, schema, style-guide, CLI-RUNBOOK, research-queue, agent-prompts) stay where they are — they're the authoring contract for the agents. The `primitives/{id}/` directories the README describes are renamed to `src/content/primitives/{id}/` to match Astro's content-collection convention; agent prompts 02 and 05 are updated with the new path.

## Hub PWA — Astro content collection

`src/content/config.ts`:

```ts
import { defineCollection, z } from 'astro:content';

const eraEnum = z.enum([
  'PoC', 'arcade-early', 'arcade-golden-age', 'home-8bit',
  'home-16bit', 'early-3d', 'modern-console-pc', 'indie-modern'
]);

const primitiveStub = z.object({
  id: z.string(),
  name: z.string(),
  player_verb: z.string(),
  canonical_game: z.string(),
  canonical_year: z.number().int(),
  canonical_platform: z.string(),
  canonical_developer: z.string(),
  era_bucket: eraEnum,
  taxonomy_node: z.string(),
  status: z.enum(['stub', 'researched', 'speced', 'built']),
  orientation: z.enum(['auto', 'portrait', 'landscape']).default('auto'),
});

export const collections = {
  primitives: defineCollection({ type: 'content', schema: primitiveStub }),
};
```

Each primitive directory holds three files (`stub.md`, `research.md`, `spec.md`) because the agent pipeline writes them in three different waves. The collection entry key is the directory name. Astro reads `stub.md` as the primary entry (frontmatter source); `research.md` and `spec.md` are loaded as sibling content at render time — either via `import.meta.glob` against `src/content/primitives/{id}/*.md` or Astro 5's Content Layer API with a custom directory-loader. Exact mechanism chosen during the implementation plan; the file shape is fixed.

Routes:
- `/` — landing: hero + thesis + tile grid of 12 hand-picked "convergence threads"
- `/taxonomy/` — collapsible tree from `taxonomy.md`, primitives as leaves, status badges
- `/era/` — horizontal timeline 1958→present, primitives as dots colored by era
- `/p/[id]/` — primitive detail: hero (name, verb, year, platform, developer, era glyph) → iframe game (if built) → research prose → variations/successors → algorithm section (with code block highlighting) → convergence wikilinks → references
- `/about/` — what a primitive is, why this project exists, how to read

## Mini-game PWA template

`templates/minigame-pwa/` contains the canonical structure. `scripts/new-minigame.sh {id}` copies it to `public/g/{id}/` and substitutes placeholders.

```
templates/minigame-pwa/
├── index.html                # viewport, iOS tags, version-bumped CSS/JS, fullscreen button
├── game.js                   # placeholder with agent-prompt-06 shape
├── style.css                 # uses CSS vars from era palette
├── manifest.webmanifest      # display: fullscreen + standalone fallback
├── sw.js                     # hand-rolled, KikaCentroid-derived
├── offline.html
├── icons/
│   ├── icon-192.png          # generated per-primitive
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon-180.png
│   └── favicon-32.png
└── README.md                 # auto-filled by build agent
```

### Mobile-first defaults (every game)

```html
<meta name="viewport" content="width=device-width, initial-scale=1,
  maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="{era-color}">
```

Manifest defaults:
```json
{
  "display": "fullscreen",
  "display_override": ["fullscreen", "standalone", "minimal-ui"],
  "orientation": "{auto|portrait|landscape, from spec.md}",
  "scope": "/g/{id}/",
  "start_url": "/g/{id}/?src=pwa"
}
```

### Service-worker contract

Hand-rolled, follows KikaCentroid:
- `CACHE_VERSION` constant bumped per release (mirrored as `?v=` query in HTML asset links)
- Install: `cache.addAll(PRECACHE_URLS, { cache: 'reload' })`
- Activate: delete stale caches; enable navigation preload; `clients.claim()`
- Fetch:
  - HTML navigations → NetworkFirst with 3s timeout, fallback to cached then `offline.html`
  - CSS/JS → StaleWhileRevalidate from precache
  - Images → CacheFirst with transparent-PNG fallback
  - Manifest → NetworkFirst (so install metadata updates propagate to Android Chrome)
  - Cross-origin → pass through untouched
- Message handler: `SKIP_WAITING` from page → `self.skipWaiting()`
- Never caches non-GET requests

### Update UX

Per mobile-pwa skill: new SW installs → `waiting` state → page detects via `reg.addEventListener('updatefound')` → non-blocking toast "New version available — Refresh" → user clicks → `reg.waiting.postMessage({ type: 'SKIP_WAITING' })` → `controllerchange` listener triggers `window.location.reload()`.

The hub uses the same pattern. Each game uses its own version-bumped CACHE_VERSION; they update independently.

### Install affordance

Both hub and each game implement:
- Capture `beforeinstallprompt`, stash, show in-app "Install" button after first meaningful interaction (Chrome/Edge/Android)
- iOS Safari: detect `navigator.standalone === false && /iP(hone|ad|od)/.test(navigator.userAgent)`, show one-time "Tap Share → Add to Home Screen" hint with dismiss memory in localStorage

## Visual language

### Type
- **Prose**: system serif stack (`Charter, Georgia, "Iowan Old Style", serif`)
- **Metadata** (year, platform, developer, era glyph caption): system mono (`ui-monospace, "SF Mono", Menlo, monospace`)
- **Game UI** (inside mini-games only): `VT323` self-hosted webfont (downloaded to `public/g/{id}/fonts/`, no CDN at runtime), with system-mono fallback
- **Site chrome** (nav, buttons): system sans (`-apple-system, "Segoe UI", system-ui`)

### Palette per era (CSS custom properties in `tokens.css`)

| Era | Token | Sample hex | Notes |
|---|---|---|---|
| PoC | `--era-poc` | `#39ff14` | phosphor green on near-black |
| arcade-early | `--era-arcade-early` | `#ff5e3a` | hot orange |
| arcade-golden-age | `--era-arcade-golden` | `#ffd23f` | arcade yellow + accent red `#e63946` |
| home-8bit | `--era-home-8bit` | `#5b76ff` | C64 blue on `#2e2e2e` |
| home-16bit | `--era-home-16bit` | `#c83be0` | Amiga magenta |
| early-3d | `--era-early-3d` | `#ff9f1c` | CRT amber |
| modern-console-pc | `--era-modern` | `#7a8a99` | graphite-neutral |
| indie-modern | `--era-indie` | `#ff85a1` | dawn-pink |

Hub theme color: `#0d1117` (dark, neutral, KikaCentroid carry-over). Per-primitive page tints its hero band with the era token.

### Layout
- Mise-en-page principles: max 68ch measure on prose pages, 1.55 line-height, 0.5rem optical baseline grid
- Swiss-grid for landing and taxonomy; era timeline is horizontal scroll on mobile, fixed on desktop
- 16×16 pixel era-glyphs (drawn by hand or generated via simple `<canvas>` script) sit next to each primitive name

### Reduced motion

Every animation gated on `@media (prefers-reduced-motion: no-preference)`. Era timeline scrolling, taxonomy collapse animations, hover effects: all off when reduced.

## Wave loop (PM agent)

`scripts/pm-agent.sh` is a thin wrapper:

```bash
#!/usr/bin/env bash
# pm-agent.sh <wave-name> [args...]
# Wave names: discover, research, collapse, taxonomy, spec, build
set -euo pipefail
WAVE=$1; shift
PROMPT_FILE="agent-prompts/0X-${WAVE}.md"  # resolved per wave
DATE=$(date -u +%Y-%m-%d)
SUMMARY="research-notes/wave-${WAVE}-${DATE}.md"

# Build the dispatch message from CLI-RUNBOOK.md's canonical text for this wave
# then invoke claude -p with --output-format stream-json so we can capture it.
claude -p "$(scripts/build-dispatch-msg.sh "$WAVE" "$@")" \
  --output-format stream-json \
  | tee "$SUMMARY"

echo "Wave ${WAVE} complete. Summary: ${SUMMARY}"
echo "Review the diff with: git diff --stat"
```

Human-in-the-loop checkpoint: after each wave the PM exits, you `git diff`, decide accept/reject/redo, commit, run next wave.

Wave order for v1:
1. **Discover** — skipped for v1 (Wave 0 seeded 33 primitives by hand; sufficient for v1)
2. **Research** — 33 primitives, batched 8 at a time, ~4 batches
3. **Collapse** — single agent, flags merges; you approve
4. **Taxonomy** — single agent, refits the tree
5. **Spec** — 3 primitives (asteroids, qix, baba), batched together
6. **Build** — 3 primitives, batched together with PWA quality gates

## Quality gates (additions to agent-prompt-06)

Existing 8 gates stay. New 4:
- [ ] Lighthouse Installability passes in Chrome
- [ ] App loads + plays after `chrome://serviceworker-internals` → unregister → re-visit → toggle network offline
- [ ] Fullscreen + portrait/landscape per spec works on real iPhone Safari
- [ ] `prefers-reduced-motion: reduce` disables non-essential animation

## Failure modes designed for

| Failure | Mitigation |
|---|---|
| SW eviction after 14 days on iOS | NetworkFirst nav reseeds cache on next visit; no UX impact |
| Cache drift between hub and games | Each PWA has its own CACHE_VERSION; bumps are independent |
| iframe + fullscreen API restrictions | "Play fullscreen" button opens `/g/{id}/` in new tab; install flow can fire there |
| Pause-on-blur for canvas games | Standard pattern in `boot()`: `document.addEventListener('visibilitychange', ...)` |
| Astro content-collection schema drift | Zod schema in `config.ts` is the single source; agents asked to validate frontmatter before commit |
| Mini-game frame drops on low-end Android | Cap `dt` to 50ms in `requestAnimationFrame` (per agent-prompt-06); never block on `JSON.stringify(state)` per render |
| Hub and mini-game scope conflict | Explicit `scope: '/'` in hub manifest and `scope: '/g/{id}/'` in each game manifest |

## Out of scope for v1

- Authentication, user accounts, save state synced across devices
- Search (rendered taxonomy + era views are the navigation)
- Sound on mini-games beyond what spec.md authorizes
- Multiplayer
- Comment threads / community contributions
- i18n / translated prose
- Analytics, telemetry, tracking pixels
- Push notifications
- Custom 404 page beyond Astro default
- Sitemap.xml automation (manual is fine for 33 entries)
- RSS feed
- Mobile virtual joystick / touch overlay shared across games — each game owns its touch UI per its primitive

## Cross-references

- Brief: `BRIEF.md`
- Project memory: `.deban/` — 21 open questions across 6 roles
- Existing scaffold: `README.md`, `schema.md`, `taxonomy.md`, `style-guide.md`, `CLI-RUNBOOK.md`, `research-queue.md`
- Agent prompts: `agent-prompts/01..06.md` (06 will be amended with PWA gates during implementation)
- Centroid reference: `/Users/minikai/Documents/Dev/KikaCentroid/` (template source)

## What ships at v1

- Hub PWA accessible at `http://localhost:4321/` (Astro dev server)
- All 33 primitive cards rendered from stub frontmatter, with status badges
- 3 primitive detail pages with full research prose + embedded playable game: `asteroids-rotate-thrust`, `qix-area-claim`, `baba-is-you-rewrite`
- Each of those 3 games is independently installable from `/g/{id}/`
- Hub is installable as one app
- Taxonomy and era views functional
- All quality gates pass on 3 demos
- All decisions logged to `.deban/`
