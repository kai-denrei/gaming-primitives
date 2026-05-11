# Gaming Primitives v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working v1 of gaming-primitives: an Astro hub PWA showing all 33 seeded primitives as research-stub cards, three of which (`asteroids-rotate-thrust`, `qix-area-claim`, `baba-is-you-rewrite`) are fully researched, spec'd, and built as their own installable mini-game PWAs lifted from the KikaCentroid template.

**Architecture:** Two PWAs in one repo with non-overlapping service-worker scopes. The hub (Astro, scope `/`) renders content collections of primitive markdown and embeds each game via `<iframe src="/g/{id}/">`. Each mini-game is a self-contained vanilla-JS PWA at `/g/{id}/` with its own manifest + hand-rolled SW. A `pm-agent.sh` wrapper dispatches Claude CLI for the research/spec/build waves defined in `CLI-RUNBOOK.md`.

**Tech Stack:** Astro 5 (content collections + content layer API), TypeScript, npm, vanilla JS/HTML/CSS for mini-games, Workbox-style hand-rolled service workers (no build pipeline for games), Vitest for unit tests, Playwright for the few integration checks. Node 24.x, npm 10.x.

---

## File structure (created/modified by this plan)

```
gaming-primitives/
├── package.json                                            [created — task 1]
├── astro.config.mjs                                        [created — task 1]
├── tsconfig.json                                           [created — task 1]
├── src/
│   ├── content/
│   │   ├── config.ts                                       [created — task 5]
│   │   └── primitives/{id}/{stub,research,spec}.md         [created — task 8, agent waves]
│   ├── layouts/Base.astro                                  [created — task 11]
│   ├── pages/
│   │   ├── index.astro                                     [created — task 13]
│   │   ├── taxonomy.astro                                  [created — task 14]
│   │   ├── era.astro                                       [created — task 15]
│   │   ├── about.astro                                     [created — task 16]
│   │   └── p/[id].astro                                    [created — task 17]
│   ├── components/
│   │   ├── PrimitiveCard.astro                             [created — task 18]
│   │   ├── TaxonomyTree.astro                              [created — task 19]
│   │   ├── EraTimeline.astro                               [created — task 20]
│   │   ├── GameEmbed.astro                                 [created — task 21]
│   │   ├── InstallButton.astro                             [created — task 27]
│   │   ├── UpdateToast.astro                               [created — task 28]
│   │   └── EraGlyph.astro                                  [created — task 12]
│   ├── lib/
│   │   ├── eras.ts                                         [created — task 9]
│   │   └── content-loader.ts                               [created — task 6, tests at task 7]
│   └── styles/
│       ├── tokens.css                                      [created — task 9]
│       └── prose.css                                       [created — task 10]
├── public/
│   ├── manifest.webmanifest                                [created — task 24]
│   ├── sw.js                                               [created — task 25]
│   ├── offline.html                                        [created — task 26]
│   ├── icons/{icon-192,icon-512,icon-maskable-512,apple-touch-icon-180,favicon-32}.png   [created — task 23]
│   └── g/{id}/                                             [created — task 38 per primitive]
├── templates/
│   └── minigame-pwa/                                       [created — task 29]
│       ├── index.html
│       ├── game.js
│       ├── style.css
│       ├── manifest.webmanifest
│       ├── sw.js
│       ├── offline.html
│       ├── README.md
│       └── icons/
├── scripts/
│   ├── new-minigame.sh                                     [created — task 30, tests task 31]
│   ├── pm-agent.sh                                         [created — task 32]
│   ├── build-dispatch-msg.sh                               [created — task 33]
│   ├── gen-stubs.mjs                                       [created — task 8]
│   └── gen-icons.mjs                                       [created — task 22]
├── tests/
│   ├── content-loader.test.ts                              [created — task 7]
│   └── new-minigame.test.sh                                [created — task 31]
├── research-notes/                                         [created — task 32]
├── agent-prompts/
│   └── 06-minigame-build.md                                [modified — task 34: add PWA gates]
├── CLAUDE.md                                               [created — task 2: project-local rules]
└── README.md                                               [modified — task 41: update layout + run instructions]
```

---

## Phase 1 — Astro project bootstrap (tasks 1–4)

### Task 1: Initialize Astro project

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`

- [ ] **Step 1: Run Astro init non-interactively**

```bash
cd /Users/minikai/Documents/Dev/gaming-primitives
npm create astro@latest -- --template minimal --typescript strict --no-install --no-git --skip-houston --yes .
```

Expected: scaffolds `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`. Will conflict with existing files — the CLI will ask; pass `--yes` and reject the example pages we'll overwrite anyway.

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, exits 0.

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev -- --port 4321 &
sleep 4
curl -sS http://localhost:4321/ | head -20
kill %1
```

Expected: HTML response with Astro default page. Kill the bg job after verifying.

- [ ] **Step 4: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json package-lock.json src/pages/index.astro src/env.d.ts public/favicon.svg
git commit -m "chore: scaffold Astro 5 project"
```

---

### Task 2: Project-local CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write the file**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add project-local CLAUDE.md"
```

---

### Task 3: Configure Astro for content collections + integrations

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Replace the file**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'http://localhost:4321',
  output: 'static',
  trailingSlash: 'always',
  build: {
    assets: 'astro-assets',
  },
  server: {
    port: 4321,
  },
  vite: {
    server: {
      watch: {
        // Mini-game source under public/g/ must NOT trigger Astro HMR — these
        // are vendored standalone PWAs, not Astro-processed assets.
        ignored: ['**/public/g/**'],
      },
    },
  },
});
```

- [ ] **Step 2: Verify dev server still starts**

```bash
npm run dev -- --port 4321 &
sleep 3
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:4321/
kill %1
```

Expected: `200`.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "config: lock trailingSlash, static output, ignore public/g in HMR"
```

---

### Task 4: Set up Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest@latest
```

- [ ] **Step 2: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Edit `package.json`'s `"scripts"` to include:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify**

```bash
npm test
```

Expected: "No test files found" exits 0 (or exit code 1 with that message — both acceptable as we have no tests yet).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add Vitest"
```

---

## Phase 2 — Content schema + stub generation (tasks 5–8)

### Task 5: Zod schema for the `primitives` content collection

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write the schema**

```ts
import { defineCollection, z } from 'astro:content';

export const eraEnum = z.enum([
  'PoC',
  'arcade-early',
  'arcade-golden-age',
  'home-8bit',
  'home-16bit',
  'early-3d',
  'modern-console-pc',
  'indie-modern',
]);

export type Era = z.infer<typeof eraEnum>;

const primitiveStub = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case only'),
  name: z.string(),
  player_verb: z.string(),
  canonical_game: z.string(),
  canonical_year: z.number().int().min(1958).max(2100),
  canonical_platform: z.string(),
  canonical_developer: z.string(),
  era_bucket: eraEnum,
  taxonomy_node: z.string(),
  status: z.enum(['stub', 'researched', 'speced', 'built']),
  orientation: z.enum(['auto', 'portrait', 'landscape']).default('auto'),
});

export const collections = {
  primitives: defineCollection({
    type: 'content',
    schema: primitiveStub,
  }),
};
```

- [ ] **Step 2: Commit**

```bash
git add src/content/config.ts
git commit -m "feat: define primitives content collection schema"
```

---

### Task 6: Sibling content loader (research.md, spec.md per primitive)

**Files:**
- Create: `src/lib/content-loader.ts`

- [ ] **Step 1: Write the loader**

```ts
// Each primitive lives in src/content/primitives/{id}/ with up to three files:
// stub.md (collection entry), research.md, spec.md. Astro's collection only
// reads the first; this helper grabs the others at render time.

const allMd = import.meta.glob<{ rawContent: () => string; Content: any }>(
  '/src/content/primitives/*/*.md',
  { eager: true }
);

export type PrimitiveExtras = {
  research?: { rawContent: string };
  spec?: { rawContent: string };
};

export function loadExtras(id: string): PrimitiveExtras {
  const out: PrimitiveExtras = {};
  for (const [path, mod] of Object.entries(allMd)) {
    if (!path.includes(`/${id}/`)) continue;
    if (path.endsWith('/research.md')) {
      out.research = { rawContent: (mod as any).rawContent?.() ?? '' };
    } else if (path.endsWith('/spec.md')) {
      out.spec = { rawContent: (mod as any).rawContent?.() ?? '' };
    }
  }
  return out;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/content-loader.ts
git commit -m "feat: sibling content loader for research/spec markdown"
```

---

### Task 7: Test the content loader

**Files:**
- Create: `tests/content-loader.test.ts`
- Create: `src/content/primitives/__test__/{stub,research,spec}.md`

- [ ] **Step 1: Create test fixture files**

```bash
mkdir -p src/content/primitives/__test__
cat > src/content/primitives/__test__/stub.md <<'EOF'
---
id: __test__
name: Test Primitive
player_verb: "do a test thing"
canonical_game: "Test"
canonical_year: 2000
canonical_platform: PC
canonical_developer: "Nobody"
era_bucket: modern-console-pc
taxonomy_node: test/leaf
status: stub
---
Stub body.
EOF
cat > src/content/primitives/__test__/research.md <<'EOF'
Research body.
EOF
cat > src/content/primitives/__test__/spec.md <<'EOF'
Spec body.
EOF
```

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { loadExtras } from '../src/lib/content-loader';

describe('loadExtras', () => {
  it('returns research and spec for a primitive with all three files', () => {
    const extras = loadExtras('__test__');
    expect(extras.research?.rawContent).toMatch(/Research body/);
    expect(extras.spec?.rawContent).toMatch(/Spec body/);
  });

  it('returns empty object for unknown id', () => {
    const extras = loadExtras('does-not-exist');
    expect(extras.research).toBeUndefined();
    expect(extras.spec).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run the test**

```bash
npm test -- tests/content-loader.test.ts
```

Expected: both tests pass (the loader was already implemented; tests verify it). If they fail, fix the loader before proceeding.

- [ ] **Step 4: Commit**

```bash
git add tests/content-loader.test.ts src/content/primitives/__test__/
git commit -m "test: content-loader sibling md resolution"
```

> **Note:** the `__test__` fixture stays in the repo. It will render as a phantom primitive on the hub. To hide it from prod, the listing pages filter `entry.slug !== '__test__'` (handled in tasks 13/14/15/17).

---

### Task 8: Generate all 33 stub markdown files from `research-queue.md`

**Files:**
- Create: `scripts/gen-stubs.mjs`
- Create: `src/content/primitives/{33 ids}/stub.md`

- [ ] **Step 1: Write the generator script**

```js
// scripts/gen-stubs.mjs
// Reads Wave-0 entries from research-queue.md and writes one
// src/content/primitives/{id}/stub.md per entry with minimal frontmatter
// derived from taxonomy.md + research-queue.md. Bodies are 3-sentence
// placeholders the Research agent will overwrite later.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const queue = readFileSync(join(ROOT, 'research-queue.md'), 'utf8');
const taxonomy = readFileSync(join(ROOT, 'taxonomy.md'), 'utf8');

// Hand-curated metadata for the 33 Wave-0 primitives. Year/platform/developer
// pulled from the existing taxonomy. era_bucket and priority from
// research-queue.md.
const SEED = {
  'lunar-lander-thrust':           { name: 'Lunar Lander Thrust',           game: 'Lunar Lander',           year: 1979, platform: 'Arcade',    dev: 'Atari',                                era: 'arcade-early',       node: 'MOMENTUM/momentum-thrust' },
  'asteroids-rotate-thrust':       { name: 'Asteroids Rotate-Thrust',       game: 'Asteroids',              year: 1979, platform: 'Arcade',    dev: 'Atari / Lyle Rains, Ed Logg',          era: 'arcade-early',       node: 'MOMENTUM/momentum-thrust' },
  'pong-paddle-volley':            { name: 'Pong Paddle Volley',            game: 'Pong',                   year: 1972, platform: 'Arcade',    dev: 'Atari / Allan Alcorn',                 era: 'arcade-early',       node: 'MOMENTUM/momentum-conservation' },
  'breakout-paddle-reflect':       { name: 'Breakout Paddle Reflect',       game: 'Breakout',               year: 1976, platform: 'Arcade',    dev: 'Atari / Steve Wozniak',                era: 'arcade-early',       node: 'MOMENTUM/momentum-conservation' },
  'space-invaders-vertical-shot':  { name: 'Space Invaders Vertical Shot',  game: 'Space Invaders',         year: 1978, platform: 'Arcade',    dev: 'Taito / Tomohiro Nishikado',           era: 'arcade-early',       node: 'PROJECTILE/projectile-direct' },
  'pacman-power-pellet':           { name: 'Pac-Man Power Pellet',          game: 'Pac-Man',                year: 1980, platform: 'Arcade',    dev: 'Namco / Toru Iwatani',                 era: 'arcade-golden-age',  node: 'RULE/rule-inversion' },
  'qix-area-claim':                { name: 'Qix Area Claim',                game: 'Qix',                    year: 1981, platform: 'Arcade',    dev: 'Taito / Randy & Sandy Pfeiffer',       era: 'arcade-golden-age',  node: 'SPATIAL/spatial-claim' },
  'defender-radar-rescue':         { name: 'Defender Radar Rescue',         game: 'Defender',               year: 1981, platform: 'Arcade',    dev: 'Williams / Eugene Jarvis',             era: 'arcade-golden-age',  node: 'SPATIAL/spatial-traversal' },
  'robotron-twin-stick':           { name: 'Robotron Twin Stick',           game: 'Robotron: 2084',         year: 1982, platform: 'Arcade',    dev: 'Williams / Eugene Jarvis, Larry DeMar', era: 'arcade-golden-age', node: 'PROJECTILE/projectile-direct' },
  'donkey-kong-platform-arc':      { name: 'Donkey Kong Platform Arc',      game: 'Donkey Kong',            year: 1981, platform: 'Arcade',    dev: 'Nintendo / Shigeru Miyamoto',          era: 'arcade-golden-age',  node: 'SPATIAL/spatial-traversal' },
  'mario-platform-arc':            { name: 'Mario Platform Arc',            game: 'Super Mario Bros.',      year: 1985, platform: 'NES',       dev: 'Nintendo / Shigeru Miyamoto',          era: 'home-8bit',          node: 'SPATIAL/spatial-traversal' },
  'space-taxi-precision-thrust':   { name: 'Space Taxi Precision Thrust',   game: 'Space Taxi',             year: 1984, platform: 'C64',       dev: 'Muse Software / John F. Kutcher',      era: 'home-8bit',          node: 'MOMENTUM/momentum-thrust' },
  'boulder-dash-falling-rocks':    { name: 'Boulder Dash Falling Rocks',    game: 'Boulder Dash',           year: 1984, platform: 'Atari 800', dev: 'First Star / Peter Liepa, Chris Gray', era: 'home-8bit',          node: 'RULE/rule-emergence' },
  'lode-runner-dig-fall':          { name: 'Lode Runner Dig Fall',          game: 'Lode Runner',            year: 1983, platform: 'Apple II',  dev: 'Brøderbund / Doug Smith',              era: 'home-8bit',          node: 'SPATIAL/spatial-claim' },
  'tetris-line-clear':             { name: 'Tetris Line Clear',             game: 'Tetris',                 year: 1984, platform: 'Electronika 60', dev: 'Alexey Pajitnov',                 era: 'home-8bit',          node: 'PATTERN-MATCH/pattern-line' },
  'defender-of-the-crown-catapult':{ name: 'Defender of the Crown Catapult',game: 'Defender of the Crown', year: 1986, platform: 'Amiga',     dev: 'Cinemaware / Kellyn Beck',             era: 'home-8bit',          node: 'PROJECTILE/projectile-arc' },
  'lemmings-assign-roles':         { name: 'Lemmings Assign Roles',         game: 'Lemmings',               year: 1991, platform: 'Amiga',     dev: 'DMA Design / Mike Dailly, Russell Kay', era: 'home-16bit',        node: 'RULE/rule-emergence' },
  'populous-terraform':            { name: 'Populous Terraform',            game: 'Populous',               year: 1989, platform: 'Amiga',     dev: 'Bullfrog / Peter Molyneux',            era: 'home-16bit',         node: 'RULE/rule-modification' },
  'dune-2-rts-base':               { name: 'Dune II RTS Base',              game: 'Dune II',                year: 1992, platform: 'PC-DOS',    dev: 'Westwood / Joe Bostic, Aaron Powell',  era: 'home-16bit',         node: 'ECONOMY-LOOP/loop-extract-craft-build' },
  'worms-bazooka-wind':            { name: 'Worms Bazooka Wind',            game: 'Worms',                  year: 1995, platform: 'Amiga',     dev: 'Team17 / Andy Davidson',               era: 'home-16bit',         node: 'PROJECTILE/projectile-arc' },
  'pinball-flipper-deflect':       { name: 'Pinball Flipper Deflect',       game: 'Pinball (electromech.)', year: 1947, platform: 'Arcade',    dev: 'Gottlieb',                              era: 'arcade-early',       node: 'MOMENTUM/momentum-conservation' },
  'doom-bsp-arena':                { name: 'Doom BSP Arena',                game: 'Doom',                   year: 1993, platform: 'PC-DOS',    dev: 'id Software / Carmack, Romero, Hall',  era: 'early-3d',           node: 'SPATIAL/spatial-traversal' },
  'tomb-raider-tank-controls':     { name: 'Tomb Raider Tank Controls',     game: 'Tomb Raider',            year: 1996, platform: 'PS1',       dev: 'Core Design / Toby Gard',              era: 'early-3d',           node: 'SPATIAL/spatial-traversal' },
  'resident-evil-fixed-cam-survival': { name: 'Resident Evil Fixed-Cam Survival', game: 'Resident Evil', year: 1996, platform: 'PS1',      dev: 'Capcom / Shinji Mikami',               era: 'early-3d',           node: 'RESOURCE/resource-decay' },
  'portal-momentum-warp':          { name: 'Portal Momentum Warp',          game: 'Portal',                 year: 2007, platform: 'PC',       dev: 'Valve / Kim Swift, Jeep Barnett',      era: 'modern-console-pc',  node: 'SPATIAL/spatial-traversal' },
  'braid-time-rewind':             { name: 'Braid Time Rewind',             game: 'Braid',                  year: 2008, platform: 'Xbox 360', dev: 'Number None / Jonathan Blow',          era: 'modern-console-pc',  node: 'RULE/rule-modification' },
  'dark-souls-bonfire-recovery':   { name: 'Dark Souls Bonfire Recovery',   game: 'Demon\'s Souls',         year: 2009, platform: 'PS3',      dev: 'FromSoftware / Hidetaka Miyazaki',     era: 'modern-console-pc',  node: 'ECONOMY-LOOP/loop-permadeath-procedural' },
  'slay-the-spire-deck-run':       { name: 'Slay the Spire Deck Run',       game: 'Slay the Spire',         year: 2019, platform: 'PC',       dev: 'Mega Crit / Anthony Giovannetti, Casey Yano', era: 'indie-modern', node: 'ECONOMY-LOOP/loop-permadeath-procedural' },
  'vampire-survivors-evolve':      { name: 'Vampire Survivors Evolve',      game: 'Vampire Survivors',      year: 2022, platform: 'PC',       dev: 'poncle / Luca Galante',                era: 'indie-modern',       node: 'ECONOMY-LOOP/loop-permadeath-procedural' },
  'baba-is-you-rewrite':           { name: 'Baba Is You Rewrite',           game: 'Baba Is You',            year: 2019, platform: 'PC',       dev: 'Hempuli / Arvi Teikari',               era: 'indie-modern',       node: 'RULE/rule-modification' },
  'patrick-parabox-nested':        { name: "Patrick's Parabox Nested",      game: "Patrick's Parabox",      year: 2022, platform: 'PC',       dev: 'Patrick Traynor',                       era: 'indie-modern',       node: 'RULE/rule-modification' },
  'obra-dinn-identity-grid':       { name: 'Obra Dinn Identity Grid',       game: 'Return of the Obra Dinn',year: 2018, platform: 'PC',       dev: 'Lucas Pope',                            era: 'indie-modern',       node: 'PATTERN-MATCH/pattern-deduction' },
  'wordle-letter-deduce':          { name: 'Wordle Letter Deduce',          game: 'Wordle',                 year: 2021, platform: 'Web',      dev: 'Josh Wardle',                           era: 'indie-modern',       node: 'PATTERN-MATCH/pattern-deduction' },
};

// Parse verbs from research-queue.md so they stay in sync with the queue file
const verbMap = new Map();
for (const line of queue.split('\n')) {
  const m = line.match(/- \[ \] `([^`]+)` — ([^—]+) —/);
  if (m) verbMap.set(m[1], m[2].trim());
}

let written = 0, skipped = 0;
for (const [id, meta] of Object.entries(SEED)) {
  const dir = join(ROOT, 'src/content/primitives', id);
  const file = join(dir, 'stub.md');
  if (existsSync(file)) { skipped++; continue; }
  mkdirSync(dir, { recursive: true });
  const verb = verbMap.get(id) ?? meta.name.toLowerCase();
  const fm = [
    '---',
    `id: ${id}`,
    `name: ${meta.name}`,
    `player_verb: "${verb}"`,
    `canonical_game: "${meta.game}"`,
    `canonical_year: ${meta.year}`,
    `canonical_platform: ${meta.platform}`,
    `canonical_developer: "${meta.dev.replace(/"/g, '\\"')}"`,
    `era_bucket: ${meta.era}`,
    `taxonomy_node: ${meta.node}`,
    'status: stub',
    'orientation: auto',
    '---',
    '',
    `Stub for **${meta.name}**. The player ${verb}. Research agent will overwrite this body with full algorithm + variations + citations per agent-prompts/02-research.md.`,
    '',
  ].join('\n');
  writeFileSync(file, fm);
  written++;
}

console.log(`stubs: wrote ${written}, skipped ${skipped} (already existed)`);
```

- [ ] **Step 2: Run the generator**

```bash
node scripts/gen-stubs.mjs
```

Expected: `stubs: wrote 33, skipped 0` and 33 new directories under `src/content/primitives/`.

- [ ] **Step 3: Verify Astro accepts the schema**

```bash
npm run dev -- --port 4321 &
sleep 4
curl -sS http://localhost:4321/ -o /dev/null
kill %1
```

Expected: dev server starts without schema errors (errors would print in the bg job's output). To explicitly check schema:

```bash
npx astro check 2>&1 | head -40
```

Expected: 0 errors related to content collection. (Unrelated "0 errors, 0 warnings" or pre-existing content errors are acceptable; primitive-related schema errors are not.)

- [ ] **Step 4: Commit**

```bash
git add scripts/gen-stubs.mjs src/content/primitives/
git commit -m "feat: seed 33 primitive stubs from research-queue.md"
```

---

## Phase 3 — Tokens + base layout (tasks 9–12)

### Task 9: Era palette tokens + helper module

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/lib/eras.ts`

- [ ] **Step 1: Write tokens.css**

```css
:root {
  /* Hub theme — neutral dark backdrop (KikaCentroid carryover) */
  --bg: #0d1117;
  --surface: #161b22;
  --fg: #e6edf3;
  --fg-muted: #9aa4b2;
  --border: #30363d;
  --accent: #58a6ff;

  /* Per-era accent colors — each primitive page tints its hero band */
  --era-poc: #39ff14;
  --era-arcade-early: #ff5e3a;
  --era-arcade-golden: #ffd23f;
  --era-arcade-golden-secondary: #e63946;
  --era-home-8bit: #5b76ff;
  --era-home-16bit: #c83be0;
  --era-early-3d: #ff9f1c;
  --era-modern: #7a8a99;
  --era-indie: #ff85a1;

  /* Type */
  --font-serif: Charter, Georgia, "Iowan Old Style", serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;
  --font-sans: -apple-system, "Segoe UI", system-ui, sans-serif;

  --measure-prose: 68ch;
  --line-height-prose: 1.55;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

a { color: var(--accent); }
a:hover { text-decoration: underline; }

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Write eras.ts**

```ts
import type { Era } from '../content/config';

export const eraMeta: Record<Era, {
  label: string;
  range: string;
  cssVar: string;
  order: number;
}> = {
  'PoC':                { label: 'Proof of Concept',  range: 'pre-1971',   cssVar: '--era-poc',           order: 0 },
  'arcade-early':       { label: 'Arcade Early',      range: '1971–1979',  cssVar: '--era-arcade-early',  order: 1 },
  'arcade-golden-age':  { label: 'Arcade Golden Age', range: '1980–1985',  cssVar: '--era-arcade-golden', order: 2 },
  'home-8bit':          { label: 'Home 8-bit',        range: '1982–1990',  cssVar: '--era-home-8bit',     order: 3 },
  'home-16bit':         { label: 'Home 16-bit',       range: '1987–1995',  cssVar: '--era-home-16bit',    order: 4 },
  'early-3d':           { label: 'Early 3D',          range: '1993–1999',  cssVar: '--era-early-3d',      order: 5 },
  'modern-console-pc':  { label: 'Modern',            range: '2000–2012',  cssVar: '--era-modern',        order: 6 },
  'indie-modern':       { label: 'Indie Modern',      range: '2008–today', cssVar: '--era-indie',         order: 7 },
};

export const erasByOrder = (Object.keys(eraMeta) as Era[]).sort(
  (a, b) => eraMeta[a].order - eraMeta[b].order
);
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css src/lib/eras.ts
git commit -m "feat: design tokens and era metadata"
```

---

### Task 10: Prose typography

**Files:**
- Create: `src/styles/prose.css`

- [ ] **Step 1: Write the file**

```css
.prose {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  line-height: var(--line-height-prose);
  color: var(--fg);
  max-width: var(--measure-prose);
  margin-inline: auto;
}

.prose h1 { font-size: 2.4rem; line-height: 1.15; margin: 1.5em 0 0.4em; }
.prose h2 { font-size: 1.75rem; line-height: 1.2; margin: 1.6em 0 0.4em; border-bottom: 1px solid var(--border); padding-bottom: 0.25em; }
.prose h3 { font-size: 1.3rem; line-height: 1.3; margin: 1.4em 0 0.3em; }
.prose p, .prose li { margin: 0.7em 0; }
.prose code {
  font-family: var(--font-mono);
  font-size: 0.92em;
  background: var(--surface);
  padding: 0.1em 0.35em;
  border-radius: 3px;
}
.prose pre {
  font-family: var(--font-mono);
  background: var(--surface);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.9rem;
  line-height: 1.5;
}
.prose pre code { background: transparent; padding: 0; }
.prose blockquote {
  border-left: 3px solid var(--accent);
  margin: 1em 0;
  padding-left: 1em;
  color: var(--fg-muted);
  font-style: italic;
}
.prose hr { border: 0; border-top: 1px solid var(--border); margin: 2em 0; }
.prose a { color: var(--accent); }
.prose ul, .prose ol { padding-left: 1.4em; }
.prose img { max-width: 100%; }
.prose table { border-collapse: collapse; width: 100%; margin: 1em 0; }
.prose th, .prose td { border: 1px solid var(--border); padding: 0.5em 0.75em; text-align: left; }
.prose th { background: var(--surface); }

.metadata {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--fg-muted);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/prose.css
git commit -m "feat: prose typography per mise-en-page"
```

---

### Task 11: Base layout

**Files:**
- Create: `src/layouts/Base.astro`

- [ ] **Step 1: Write the layout**

```astro
---
import '../styles/tokens.css';
import '../styles/prose.css';

interface Props {
  title: string;
  description?: string;
  themeColor?: string;
}
const { title, description = 'A catalog of irreducible gameplay primitives.', themeColor = '#0d1117' } = Astro.props;
---
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content={themeColor} />
  <meta name="color-scheme" content="dark" />
  <meta name="description" content={description} />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="icon" href="/icons/favicon-32.png" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" sizes="180x180" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Gaming Primitives" />
  <title>{title}</title>
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
      });
    }
  </script>
</head>
<body>
  <header class="topbar">
    <a href="/" class="brand">gaming primitives</a>
    <nav class="topnav">
      <a href="/taxonomy/">taxonomy</a>
      <a href="/era/">era</a>
      <a href="/about/">about</a>
    </nav>
  </header>
  <main><slot /></main>
  <footer class="sitefoot">
    <span class="metadata">primitives ≠ genres ≠ games. <a href="/about/">why this exists</a></span>
  </footer>
  <style>
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .brand { font-family: var(--font-mono); font-weight: 600; color: var(--fg); text-decoration: none; }
    .topnav a { font-family: var(--font-mono); margin-left: 1.25rem; color: var(--fg-muted); text-decoration: none; font-size: 0.9rem; }
    .topnav a:hover { color: var(--fg); }
    main { min-height: 70vh; padding: 2rem 1.5rem; }
    .sitefoot { padding: 1.5rem; border-top: 1px solid var(--border); text-align: center; }
  </style>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: base layout with topbar, footer, SW registration"
```

---

### Task 12: Era glyph component

**Files:**
- Create: `src/components/EraGlyph.astro`

- [ ] **Step 1: Write the component**

```astro
---
import { eraMeta } from '../lib/eras';
import type { Era } from '../content/config';

interface Props { era: Era; size?: number; }
const { era, size = 16 } = Astro.props;
const meta = eraMeta[era];
const color = `var(${meta.cssVar})`;
---
<span class="era-glyph" style={`--glyph-color: ${color}; width: ${size}px; height: ${size}px;`} title={meta.label} aria-label={meta.label}>
  {era === 'PoC' && <i class="g g-poc" />}
  {era === 'arcade-early' && <i class="g g-arcade-early" />}
  {era === 'arcade-golden-age' && <i class="g g-arcade-golden" />}
  {era === 'home-8bit' && <i class="g g-home-8bit" />}
  {era === 'home-16bit' && <i class="g g-home-16bit" />}
  {era === 'early-3d' && <i class="g g-early-3d" />}
  {era === 'modern-console-pc' && <i class="g g-modern" />}
  {era === 'indie-modern' && <i class="g g-indie" />}
</span>

<style>
  .era-glyph {
    display: inline-block;
    image-rendering: pixelated;
    background-color: var(--glyph-color);
    /* SVG mask for the pixel-glyph shape per era. Falls back to a solid square
       if the SVG fails to load, which is intentional — the color is the signal. */
    mask: var(--mask, none) center / contain no-repeat;
    -webkit-mask: var(--mask, none) center / contain no-repeat;
    vertical-align: middle;
  }
  /* Inline-encoded 8x8 pixel motifs per era. Kept compact in CSS to avoid
     extra HTTP requests for 33-card listings. */
  .g-poc                { --mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' shape-rendering='crispEdges'><rect x='0' y='3' width='8' height='2' fill='black'/><rect x='3' y='0' width='2' height='8' fill='black'/></svg>"); }
  .g-arcade-early       { --mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' shape-rendering='crispEdges'><rect x='3' y='0' width='2' height='2' fill='black'/><rect x='1' y='2' width='6' height='4' fill='black'/><rect x='3' y='6' width='2' height='2' fill='black'/></svg>"); }
  .g-arcade-golden      { --mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' shape-rendering='crispEdges'><rect x='0' y='0' width='8' height='2' fill='black'/><rect x='0' y='3' width='8' height='2' fill='black'/><rect x='0' y='6' width='8' height='2' fill='black'/></svg>"); }
  .g-home-8bit          { --mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' shape-rendering='crispEdges'><rect x='0' y='0' width='3' height='3' fill='black'/><rect x='5' y='0' width='3' height='3' fill='black'/><rect x='0' y='5' width='3' height='3' fill='black'/><rect x='5' y='5' width='3' height='3' fill='black'/></svg>"); }
  .g-home-16bit         { --mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' shape-rendering='crispEdges'><rect x='2' y='0' width='4' height='8' fill='black'/><rect x='0' y='2' width='8' height='4' fill='black'/></svg>"); }
  .g-early-3d           { --mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' shape-rendering='crispEdges'><polygon points='4,0 8,4 4,8 0,4' fill='black'/></svg>"); }
  .g-modern             { --mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' shape-rendering='crispEdges'><rect x='1' y='1' width='6' height='6' fill='black'/></svg>"); }
  .g-indie              { --mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' shape-rendering='crispEdges'><polygon points='4,0 5,3 8,3 6,5 7,8 4,6 1,8 2,5 0,3 3,3' fill='black'/></svg>"); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EraGlyph.astro
git commit -m "feat: era glyph component with inline svg masks"
```

---

## Phase 4 — Hub routes & components (tasks 13–21)

### Task 13: Landing page

**Files:**
- Create: `src/pages/index.astro` (overwrites Astro default)

- [ ] **Step 1: Write the page**

```astro
---
import Base from '../layouts/Base.astro';
import { getCollection } from 'astro:content';

const primitives = (await getCollection('primitives'))
  .filter(e => e.slug !== '__test__');

const builtCount = primitives.filter(p => p.data.status === 'built').length;
const totalCount = primitives.length;
---
<Base title="Gaming Primitives">
  <section class="hero">
    <h1>Gaming Primitives</h1>
    <p class="lede">
      A catalog of the irreducible verbs underneath thousands of games.
      Every entry is one mechanism, cited, with a tiny playable demo.
    </p>
    <p class="metadata">
      {builtCount} of {totalCount} primitives playable —
      <a href="/taxonomy/">browse the taxonomy</a> or
      <a href="/era/">scroll the timeline</a>.
    </p>
  </section>
</Base>

<style>
  .hero { max-width: 38rem; margin: 4rem auto 2rem; }
  .hero h1 { font-family: var(--font-mono); font-size: 2.4rem; margin-bottom: 0.5em; }
  .lede { font-family: var(--font-serif); font-size: 1.25rem; line-height: 1.5; color: var(--fg); }
</style>
```

- [ ] **Step 2: Verify**

```bash
npm run dev -- --port 4321 &
sleep 4
curl -sS http://localhost:4321/ | grep -i "gaming primitives" >/dev/null && echo OK || echo FAIL
kill %1
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: landing page"
```

---

### Task 14: PrimitiveCard component (used by taxonomy + era)

**Files:**
- Create: `src/components/PrimitiveCard.astro`

- [ ] **Step 1: Write the component**

```astro
---
import EraGlyph from './EraGlyph.astro';
import type { CollectionEntry } from 'astro:content';

interface Props { entry: CollectionEntry<'primitives'>; }
const { entry } = Astro.props;
const { id, name, player_verb, canonical_game, canonical_year, era_bucket, status } = entry.data;
---
<a class={`card status-${status}`} href={`/p/${id}/`}>
  <div class="card-head">
    <EraGlyph era={era_bucket} size={12} />
    <span class="card-name">{name}</span>
  </div>
  <p class="card-verb">{player_verb}</p>
  <div class="card-meta metadata">
    <span>{canonical_game} · {canonical_year}</span>
    <span class={`badge badge-${status}`}>{status}</span>
  </div>
</a>

<style>
  .card {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--fg);
    text-decoration: none;
    transition: border-color 150ms ease;
  }
  .card:hover { border-color: var(--accent); }
  .card-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
  .card-name { font-family: var(--font-mono); font-size: 0.95rem; font-weight: 600; }
  .card-verb { font-family: var(--font-serif); margin: 0 0 0.6rem; color: var(--fg); }
  .card-meta { display: flex; justify-content: space-between; font-size: 0.78rem; }
  .badge { padding: 0.1em 0.5em; border-radius: 999px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .badge-stub       { background: #1f2329; color: var(--fg-muted); }
  .badge-researched { background: #1f2329; color: #c9d1d9; }
  .badge-speced     { background: #1f2329; color: #ffd23f; }
  .badge-built      { background: #1f2329; color: #39ff14; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PrimitiveCard.astro
git commit -m "feat: PrimitiveCard"
```

---

### Task 15: Taxonomy view

**Files:**
- Create: `src/pages/taxonomy.astro`
- Create: `src/components/TaxonomyTree.astro`

- [ ] **Step 1: Write TaxonomyTree.astro**

```astro
---
import PrimitiveCard from './PrimitiveCard.astro';
import type { CollectionEntry } from 'astro:content';

interface Props { entries: CollectionEntry<'primitives'>[]; }
const { entries } = Astro.props;

// taxonomy_node is "FAMILY/group" — bucket by family, then by group
const families = new Map<string, Map<string, CollectionEntry<'primitives'>[]>>();
for (const e of entries) {
  const [family, group = 'misc'] = e.data.taxonomy_node.split('/');
  if (!families.has(family)) families.set(family, new Map());
  const grp = families.get(family)!;
  if (!grp.has(group)) grp.set(group, []);
  grp.get(group)!.push(e);
}
const sortedFamilies = Array.from(families.keys()).sort();
---
<div class="tree">
  {sortedFamilies.map(family => (
    <section class="family">
      <h2>{family}</h2>
      {Array.from(families.get(family)!.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([group, items]) => (
        <div class="group">
          <h3>{group}</h3>
          <div class="cards">
            {items.sort((a, b) => a.data.canonical_year - b.data.canonical_year).map(entry => (
              <PrimitiveCard entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </section>
  ))}
</div>

<style>
  .tree { max-width: 70rem; margin-inline: auto; }
  .family h2 { font-family: var(--font-mono); font-size: 1.4rem; margin-top: 2.5rem; color: var(--fg); border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
  .group h3 { font-family: var(--font-mono); font-size: 1rem; color: var(--fg-muted); margin: 1.2rem 0 0.6rem; }
  .cards { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
</style>
```

- [ ] **Step 2: Write taxonomy.astro page**

```astro
---
import Base from '../layouts/Base.astro';
import TaxonomyTree from '../components/TaxonomyTree.astro';
import { getCollection } from 'astro:content';

const entries = (await getCollection('primitives'))
  .filter(e => e.slug !== '__test__');
---
<Base title="Taxonomy — Gaming Primitives">
  <h1 class="page-h1">Taxonomy</h1>
  <p class="page-sub">Primitives grouped by family. The thesis: this tree compresses.</p>
  <TaxonomyTree entries={entries} />
</Base>

<style>
  .page-h1 { font-family: var(--font-mono); font-size: 2rem; max-width: 70rem; margin: 1rem auto 0; }
  .page-sub { font-family: var(--font-serif); color: var(--fg-muted); max-width: 70rem; margin: 0.3rem auto 1.5rem; }
</style>
```

- [ ] **Step 3: Verify**

```bash
npm run dev -- --port 4321 &
sleep 4
curl -sS http://localhost:4321/taxonomy/ | grep -ci "SPATIAL\|MOMENTUM\|PATTERN" || echo "FAIL: no family headers"
kill %1
```

Expected: count ≥ 3.

- [ ] **Step 4: Commit**

```bash
git add src/components/TaxonomyTree.astro src/pages/taxonomy.astro
git commit -m "feat: taxonomy view"
```

---

### Task 16: Era view

**Files:**
- Create: `src/pages/era.astro`
- Create: `src/components/EraTimeline.astro`

- [ ] **Step 1: Write EraTimeline.astro**

```astro
---
import PrimitiveCard from './PrimitiveCard.astro';
import { eraMeta, erasByOrder } from '../lib/eras';
import type { CollectionEntry } from 'astro:content';

interface Props { entries: CollectionEntry<'primitives'>[]; }
const { entries } = Astro.props;

const byEra = new Map<string, CollectionEntry<'primitives'>[]>();
for (const era of erasByOrder) byEra.set(era, []);
for (const e of entries) byEra.get(e.data.era_bucket)!.push(e);
---
<div class="timeline">
  {erasByOrder.map(era => (
    <section class="era" style={`--accent: var(${eraMeta[era].cssVar});`}>
      <div class="era-head">
        <span class="dot" />
        <h2>{eraMeta[era].label}</h2>
        <span class="range metadata">{eraMeta[era].range}</span>
      </div>
      <div class="cards">
        {byEra.get(era)!.sort((a, b) => a.data.canonical_year - b.data.canonical_year).map(entry => (
          <PrimitiveCard entry={entry} />
        ))}
      </div>
    </section>
  ))}
</div>

<style>
  .timeline { max-width: 70rem; margin-inline: auto; }
  .era { padding: 1.5rem 0; border-left: 2px solid var(--accent); padding-left: 1rem; margin-left: 1rem; }
  .era-head { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 0.6rem; }
  .era-head h2 { font-family: var(--font-mono); font-size: 1.3rem; margin: 0; }
  .dot { width: 0.8rem; height: 0.8rem; background: var(--accent); border-radius: 50%; display: inline-block; margin-left: -1.4rem; }
  .range { color: var(--fg-muted); }
  .cards { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
</style>
```

- [ ] **Step 2: Write era.astro**

```astro
---
import Base from '../layouts/Base.astro';
import EraTimeline from '../components/EraTimeline.astro';
import { getCollection } from 'astro:content';

const entries = (await getCollection('primitives'))
  .filter(e => e.slug !== '__test__');
---
<Base title="Era — Gaming Primitives">
  <h1 class="page-h1">By era</h1>
  <p class="page-sub">1947 → today. Color by era.</p>
  <EraTimeline entries={entries} />
</Base>

<style>
  .page-h1 { font-family: var(--font-mono); font-size: 2rem; max-width: 70rem; margin: 1rem auto 0; }
  .page-sub { font-family: var(--font-serif); color: var(--fg-muted); max-width: 70rem; margin: 0.3rem auto 1.5rem; }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/EraTimeline.astro src/pages/era.astro
git commit -m "feat: era timeline view"
```

---

### Task 17: About page

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Write the page**

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="About — Gaming Primitives">
  <article class="prose">
    <h1>About</h1>
    <p>
      A <strong>gameplay primitive</strong> is an irreducible player-facing mechanism — the
      smallest atomic verb the player performs, considered together with the system response
      that makes it interesting.
    </p>
    <p>
      The test: can you describe it in one sentence of the form "the player <em>{verb}</em>
      {object} to {goal}, against {system response}"?
    </p>
    <h2>Why this catalog</h2>
    <ul>
      <li><strong>Inventory.</strong> Make legible the small set of mechanisms underneath thousands of games.</li>
      <li><strong>Convergence.</strong> Show how distant-looking games share a primitive — Asteroids gravity, Mario Galaxy gravity, Angry Birds Space.</li>
      <li><strong>Pedagogy.</strong> A playable minimal mini-game teaches more than any essay.</li>
      <li><strong>Inspiration.</strong> Designers can browse and recombine.</li>
    </ul>
    <h2>Conventions</h2>
    <ul>
      <li>One canonical originator per primitive. Cite, don't reproduce.</li>
      <li>Algorithm + verb, both. Every entry gives the player-verb framing <em>and</em> the underlying math.</li>
      <li>Each mini-game is its own installable PWA, vanilla JS, source-readable.</li>
    </ul>
  </article>
</Base>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat: about page"
```

---

### Task 18: GameEmbed component (iframe + fullscreen open)

**Files:**
- Create: `src/components/GameEmbed.astro`

- [ ] **Step 1: Write the component**

```astro
---
interface Props { id: string; name: string; orientation?: 'auto' | 'portrait' | 'landscape'; }
const { id, name, orientation = 'auto' } = Astro.props;
const src = `/g/${id}/`;
---
<div class={`game-embed orient-${orientation}`}>
  <iframe
    src={src}
    title={`${name} — playable demo`}
    allow="fullscreen; gamepad; accelerometer; gyroscope"
    loading="lazy"
  ></iframe>
  <div class="game-bar">
    <a class="open-standalone" href={src} target="_blank" rel="noopener">open fullscreen ↗</a>
    <span class="metadata">PWA · installable</span>
  </div>
</div>

<style>
  .game-embed { background: #000; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .game-embed iframe { width: 100%; border: 0; display: block; background: #000; }
  .orient-auto iframe { aspect-ratio: 4 / 3; }
  .orient-portrait iframe { aspect-ratio: 9 / 16; max-height: 80vh; }
  .orient-landscape iframe { aspect-ratio: 16 / 9; }
  .game-bar { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.8rem; background: var(--surface); border-top: 1px solid var(--border); font-size: 0.85rem; }
  .open-standalone { color: var(--accent); text-decoration: none; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameEmbed.astro
git commit -m "feat: GameEmbed"
```

---

### Task 19: Primitive detail page

**Files:**
- Create: `src/pages/p/[id].astro`

- [ ] **Step 1: Write the page**

```astro
---
import Base from '../../layouts/Base.astro';
import GameEmbed from '../../components/GameEmbed.astro';
import EraGlyph from '../../components/EraGlyph.astro';
import { eraMeta } from '../../lib/eras';
import { loadExtras } from '../../lib/content-loader';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const all = await getCollection('primitives');
  return all
    .filter(e => e.slug !== '__test__')
    .map(entry => ({ params: { id: entry.data.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
const extras = loadExtras(entry.data.id);
const heroColor = `var(${eraMeta[entry.data.era_bucket].cssVar})`;
---
<Base title={`${entry.data.name} — Gaming Primitives`} themeColor="#0d1117">
  <article class="primitive">
    <header class="hero" style={`--hero: ${heroColor};`}>
      <div class="hero-meta">
        <EraGlyph era={entry.data.era_bucket} size={20} />
        <span class="metadata">{eraMeta[entry.data.era_bucket].label} · {entry.data.canonical_year}</span>
      </div>
      <h1>{entry.data.name}</h1>
      <p class="verb">The player <strong>{entry.data.player_verb}</strong>.</p>
      <p class="metadata">
        <strong>{entry.data.canonical_game}</strong> ({entry.data.canonical_year}, {entry.data.canonical_platform}) — {entry.data.canonical_developer}
      </p>
    </header>

    {entry.data.status === 'built' && (
      <section class="play">
        <h2>Play</h2>
        <GameEmbed id={entry.data.id} name={entry.data.name} orientation={entry.data.orientation} />
      </section>
    )}

    <section class="prose stub">
      <h2>Stub</h2>
      <Content />
    </section>

    {extras.research && (
      <section class="prose research">
        <h2>Research</h2>
        <pre>{extras.research.rawContent}</pre>
        <p class="metadata"><em>Rendered as raw markdown for v1. Markdown→HTML upgrade is post-v1.</em></p>
      </section>
    )}

    {extras.spec && (
      <section class="prose spec">
        <h2>Spec</h2>
        <pre>{extras.spec.rawContent}</pre>
      </section>
    )}
  </article>
</Base>

<style>
  .primitive { max-width: 70rem; margin-inline: auto; }
  .hero { border-left: 4px solid var(--hero); padding: 1.25rem 1.5rem; background: var(--surface); border-radius: 6px; margin-bottom: 2rem; }
  .hero h1 { font-family: var(--font-mono); font-size: 2rem; margin: 0.4em 0 0.2em; }
  .hero-meta { display: flex; align-items: center; gap: 0.5rem; }
  .verb { font-family: var(--font-serif); font-size: 1.15rem; margin: 0.5em 0 0.7em; }
  .play h2, .prose h2 { font-family: var(--font-mono); }
  .play { margin: 2.5rem auto; max-width: 70rem; }
  .prose pre { white-space: pre-wrap; }
</style>
```

- [ ] **Step 2: Verify**

```bash
npm run dev -- --port 4321 &
sleep 4
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:4321/p/asteroids-rotate-thrust/
kill %1
```

Expected: `200`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/p/[id].astro
git commit -m "feat: primitive detail page"
```

---

### Task 20: Smoke test — verify all 33 + landing build

**Files:** (none — verification only)

- [ ] **Step 1: Run a production build**

```bash
npm run build 2>&1 | tail -30
```

Expected: build completes with 0 errors; output lists 33 primitive pages + index/taxonomy/era/about.

- [ ] **Step 2: Spot-check that the build output exists**

```bash
test -f dist/index.html && test -f dist/p/asteroids-rotate-thrust/index.html && test -f dist/taxonomy/index.html && echo OK || echo FAIL
```

Expected: `OK`.

- [ ] **Step 3: Commit (no changes — verification only). Move on.**

---

### Task 21: (reserved — used at task 27/28 for client islands)

(skip — numbering preserved for cross-references)

---

## Phase 5 — Hub PWA (tasks 22–28)

### Task 22: Icon generator

**Files:**
- Create: `scripts/gen-icons.mjs`

- [ ] **Step 1: Install sharp**

```bash
npm install -D sharp
```

- [ ] **Step 2: Write the generator**

```js
// scripts/gen-icons.mjs <out-dir> <hex-color> <glyph-text>
// Produces icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon-180.png, favicon-32.png
// Solid background + monogram in white. No external assets. Used by both
// hub install icons and per-mini-game icons.

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [outDir, color = '#0d1117', glyph = 'GP'] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: node gen-icons.mjs <out-dir> [#hex] [glyph]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

function svg(size, padding) {
  const fs = Math.floor(size * 0.42);
  const safe = size - padding * 2;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='${size}' height='${size}' fill='${color}'/>
    <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle'
          font-family='monospace' font-size='${fs}' fill='#e6edf3' font-weight='700'>${glyph}</text>
  </svg>`;
}

async function emit(name, size, padding = 0) {
  await sharp(Buffer.from(svg(size, padding))).png().toFile(join(outDir, name));
}

await Promise.all([
  emit('icon-192.png', 192),
  emit('icon-512.png', 512),
  emit('icon-maskable-512.png', 512, 90),   // safe area for maskable
  emit('apple-touch-icon-180.png', 180),
  emit('favicon-32.png', 32),
]);

console.log(`icons: wrote into ${outDir}`);
```

- [ ] **Step 3: Generate hub icons**

```bash
node scripts/gen-icons.mjs public/icons "#0d1117" "GP"
ls public/icons/
```

Expected: 5 PNG files listed.

- [ ] **Step 4: Commit**

```bash
git add scripts/gen-icons.mjs public/icons/ package.json package-lock.json
git commit -m "feat: icon generator + hub icons"
```

---

### Task 23: Hub manifest

**Files:**
- Create: `public/manifest.webmanifest`

- [ ] **Step 1: Write the file**

```json
{
  "name": "Gaming Primitives",
  "short_name": "Primitives",
  "description": "A catalog of the irreducible verbs underneath thousands of games.",
  "start_url": "/?src=pwa",
  "scope": "/",
  "id": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui"],
  "orientation": "any",
  "background_color": "#0d1117",
  "theme_color": "#0d1117",
  "categories": ["games", "education", "reference"],
  "lang": "en",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add public/manifest.webmanifest
git commit -m "feat: hub manifest"
```

---

### Task 24: Hub service worker

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Write the SW**

```js
// Gaming Primitives hub SW. Hand-rolled, KikaCentroid-derived.
// Bump CACHE_VERSION when shipping a new build.
const CACHE_VERSION = 'v0.1.0';
const PRECACHE = `gp-hub-precache-${CACHE_VERSION}`;
const RUNTIME  = `gp-hub-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/taxonomy/',
  '/era/',
  '/about/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon-180.png',
  '/icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await cache.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: 'reload' })));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('gp-hub-') && k !== PRECACHE && k !== RUNTIME)
      .map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (_) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Mini-game scope is NOT ours — let those SWs handle it.
  if (url.pathname.startsWith('/g/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(navigationHandler(event));
    return;
  }
  if (req.destination === 'image') {
    event.respondWith(cacheFirst(req, RUNTIME));
    return;
  }
  if (req.destination === 'manifest') {
    event.respondWith(networkFirst(req, PRECACHE));
    return;
  }
  if (req.destination === 'style' || req.destination === 'script' || req.destination === 'font') {
    event.respondWith(staleWhileRevalidate(req, RUNTIME));
    return;
  }
  event.respondWith(cacheFirst(req, RUNTIME));
});

async function navigationHandler(event) {
  const cache = await caches.open(PRECACHE);
  try {
    const preload = event.preloadResponse ? await event.preloadResponse : null;
    const network = preload || await timeout(fetch(event.request), 3000);
    if (network && network.ok && network.type === 'basic') {
      cache.put(event.request, network.clone()).catch(() => {});
      return network;
    }
    throw new Error('nav not ok');
  } catch (_) {
    const cached = await cache.match(event.request) || await cache.match('/');
    if (cached) return cached;
    return cache.match('/offline.html');
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    if (req.destination === 'image') return transparentPng();
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req).then(res => {
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  }).catch(() => null);
  return cached || (await network) || (await cache.match(req));
}

function timeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

function transparentPng() {
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, { headers: { 'Content-Type': 'image/png' } });
}
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: hub service worker"
```

---

### Task 25: Hub offline page

**Files:**
- Create: `public/offline.html`

- [ ] **Step 1: Write the page**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Offline — Gaming Primitives</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0d1117; color: #e6edf3;
                 font-family: ui-monospace, "SF Mono", Menlo, monospace;
                 display: flex; align-items: center; justify-content: center; }
    main { max-width: 36rem; padding: 2rem; text-align: center; }
    h1 { font-size: 1.5rem; margin: 0 0 0.6rem; }
    p { color: #9aa4b2; line-height: 1.5; }
    a { color: #58a6ff; }
  </style>
</head>
<body>
  <main>
    <h1>You're offline.</h1>
    <p>This page or asset isn't in the cache yet. Reconnect to the network and try again. Pages you've already visited stay readable.</p>
    <p><a href="/">↩ home</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add public/offline.html
git commit -m "feat: hub offline fallback"
```

---

### Task 26: Reduced-motion + viewport additions verified

**Files:** none — verification only.

- [ ] **Step 1: Verify the head tags landed**

```bash
npm run build && grep -lc "apple-mobile-web-app-capable" dist/index.html dist/taxonomy/index.html
```

Expected: both files print `1`.

- [ ] **Step 2: Verify manifest is reachable**

```bash
test -f dist/manifest.webmanifest && cat dist/manifest.webmanifest | head -3
```

Expected: file exists, JSON visible.

---

### Task 27: InstallButton client island

**Files:**
- Create: `src/components/InstallButton.astro`
- Modify: `src/layouts/Base.astro` (mount the island)

- [ ] **Step 1: Write the island**

```astro
---
// Renders nothing server-side; the script captures beforeinstallprompt
// (Chrome/Edge/Android) and shows an iOS A2HS hint when appropriate.
---
<button id="gp-install" class="gp-install" hidden>Install</button>
<aside id="gp-ios-hint" class="gp-ios-hint" hidden>
  Install on iOS: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.
  <button class="gp-ios-close" aria-label="Dismiss">×</button>
</aside>
<script is:inline>
  (() => {
    let deferred;
    const btn = document.getElementById('gp-install');
    const hint = document.getElementById('gp-ios-hint');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferred = e;
      if (btn) btn.hidden = false;
    });
    if (btn) btn.addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt();
      try { await deferred.userChoice; } catch {}
      deferred = null;
      btn.hidden = true;
    });
    window.addEventListener('appinstalled', () => { if (btn) btn.hidden = true; });

    const ua = navigator.userAgent;
    const isIOS = /iP(hone|ad|od)/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    const isStandalone = navigator.standalone === true ||
                         matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isStandalone && hint && !localStorage.getItem('gp-ios-hint-dismissed')) {
      hint.hidden = false;
      hint.querySelector('.gp-ios-close')?.addEventListener('click', () => {
        hint.hidden = true;
        localStorage.setItem('gp-ios-hint-dismissed', '1');
      });
    }
  })();
</script>
<style>
  .gp-install { font-family: var(--font-mono); font-size: 0.85rem; background: var(--accent); color: #0d1117; border: 0; padding: 0.4em 0.9em; border-radius: 4px; cursor: pointer; }
  .gp-ios-hint { position: fixed; bottom: 1rem; left: 1rem; right: 1rem; max-width: 30rem; margin-inline: auto; background: var(--surface); border: 1px solid var(--border); padding: 0.7rem 1rem; border-radius: 6px; font-family: var(--font-mono); font-size: 0.85rem; }
  .gp-ios-close { background: transparent; color: var(--fg-muted); border: 0; font-size: 1.2rem; cursor: pointer; float: right; }
</style>
```

- [ ] **Step 2: Mount in Base layout — modify topbar block**

In `src/layouts/Base.astro`, change the `<nav class="topnav">` section to:

```astro
---
import '../styles/tokens.css';
import '../styles/prose.css';
import InstallButton from '../components/InstallButton.astro';
// ... existing props
---
<!-- inside <header class="topbar"> -->
<nav class="topnav">
  <a href="/taxonomy/">taxonomy</a>
  <a href="/era/">era</a>
  <a href="/about/">about</a>
  <InstallButton />
</nav>
```

- [ ] **Step 3: Verify**

```bash
npm run build && grep -c 'beforeinstallprompt' dist/index.html
```

Expected: ≥ 1.

- [ ] **Step 4: Commit**

```bash
git add src/components/InstallButton.astro src/layouts/Base.astro
git commit -m "feat: install button + iOS A2HS hint"
```

---

### Task 28: UpdateToast client island

**Files:**
- Create: `src/components/UpdateToast.astro`
- Modify: `src/layouts/Base.astro` (mount it)

- [ ] **Step 1: Write the island**

```astro
---
---
<aside id="gp-update" class="gp-update" hidden>
  <span>New version available.</span>
  <button id="gp-update-btn">Refresh</button>
</aside>
<script is:inline>
  (() => {
    if (!('serviceWorker' in navigator)) return;
    const toast = document.getElementById('gp-update');
    const btn = document.getElementById('gp-update-btn');
    let waiting = null;
    navigator.serviceWorker.getRegistration('/').then(reg => {
      if (!reg) return;
      const promote = () => {
        if (reg.waiting) { waiting = reg.waiting; toast.hidden = false; }
      };
      promote();
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) promote();
        });
      });
    });
    btn?.addEventListener('click', () => {
      if (!waiting) return;
      waiting.postMessage({ type: 'SKIP_WAITING' });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  })();
</script>
<style>
  .gp-update { position: fixed; top: 1rem; right: 1rem; background: var(--surface); border: 1px solid var(--accent); padding: 0.6rem 0.8rem; border-radius: 6px; font-family: var(--font-mono); font-size: 0.85rem; display: flex; align-items: center; gap: 0.6rem; }
  .gp-update button { background: var(--accent); color: #0d1117; border: 0; padding: 0.2em 0.7em; border-radius: 3px; cursor: pointer; font-family: inherit; }
</style>
```

- [ ] **Step 2: Mount in Base.astro**

Add `<UpdateToast />` import + insertion just before `</body>`:

```astro
import UpdateToast from '../components/UpdateToast.astro';
// ...
<UpdateToast />
</body>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/UpdateToast.astro src/layouts/Base.astro
git commit -m "feat: update toast"
```

---

## Phase 6 — Mini-game PWA template (tasks 29–31)

### Task 29: Mini-game template skeleton

**Files:**
- Create: `templates/minigame-pwa/index.html`
- Create: `templates/minigame-pwa/game.js`
- Create: `templates/minigame-pwa/style.css`
- Create: `templates/minigame-pwa/manifest.webmanifest`
- Create: `templates/minigame-pwa/sw.js`
- Create: `templates/minigame-pwa/offline.html`
- Create: `templates/minigame-pwa/README.md`

- [ ] **Step 1: index.html**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="__ERA_COLOR__">
  <meta name="description" content="__NAME__ — playable demo of the __NAME__ primitive.">

  <title>__NAME__</title>

  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="icons/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="icons/apple-touch-icon-180.png" sizes="180x180">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="__NAME__">

  <link rel="preload" as="style" href="style.css?v=__VERSION__">
  <link rel="stylesheet" href="style.css?v=__VERSION__">
</head>
<body>
  <header class="toolbar" role="banner">
    <span class="brand">__NAME__ <span class="ver">v__VERSION__</span></span>
    <span class="spacer"></span>
    <button id="btn-install" class="tbtn" hidden>Install</button>
    <button id="btn-fullscreen" class="tbtn" aria-label="Fullscreen">⛶</button>
  </header>

  <p id="ios-hint" class="ios-hint" hidden>
    Install: tap Share, then <strong>Add to Home Screen</strong>.
    <button id="ios-hint-close" aria-label="Dismiss">×</button>
  </p>

  <main id="stage" class="stage">
    <canvas id="canvas" aria-label="__NAME__ playfield"></canvas>
    <div id="hud" class="hud"></div>
  </main>

  <script type="module" src="game.js?v=__VERSION__"></script>
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js', { scope: './' }).catch(()=>{});
      });
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: game.js (template body that build agents fill in)**

```js
// Primitive: __ID__
// Player verb: __VERB__
// Mechanism summary: filled by build agent. Keep tick() readable.

// --- State -------------------------------------------------------------
const state = {
  // build agent: fill this in
};

// --- Tick --------------------------------------------------------------
function tick(dt) {
  // mechanism: build agent fills this with the primitive's actual loop
}

// --- Render ------------------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const stage = document.getElementById('stage');
  const w = stage.clientWidth, h = stage.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function render() {
  // build agent fills this
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- Input -------------------------------------------------------------
function bindInput() {
  // build agent fills this
}

// --- Fullscreen toggle -------------------------------------------------
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  const stage = document.getElementById('stage');
  if (!document.fullscreenElement) {
    (stage.requestFullscreen?.() ?? stage.webkitRequestFullscreen?.());
  } else {
    document.exitFullscreen?.();
  }
});

// --- Pause on blur -----------------------------------------------------
let paused = false;
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
});

// --- Boot --------------------------------------------------------------
function boot() {
  resize();
  window.addEventListener('resize', resize);
  bindInput();

  let last = performance.now();
  function frame(t) {
    const dt = Math.min(50, t - last) / 1000;
    last = t;
    if (!paused) tick(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
boot();
```

- [ ] **Step 3: style.css**

```css
:root {
  --bg: __ERA_COLOR__;
  --fg: #ffffff;
  --hud: rgba(0,0,0,0.55);
}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #000; color: var(--fg); font-family: ui-monospace, "SF Mono", Menlo, monospace; -webkit-text-size-adjust: 100%; }

.toolbar { display: flex; align-items: center; padding: 0.4rem 0.6rem; background: rgba(0,0,0,0.5); position: fixed; top: 0; left: 0; right: 0; z-index: 10; }
.brand { font-weight: 700; font-size: 0.9rem; }
.ver { font-weight: 400; color: rgba(255,255,255,0.6); margin-left: 0.4rem; font-size: 0.8em; }
.spacer { flex: 1; }
.tbtn { background: rgba(255,255,255,0.1); color: var(--fg); border: 1px solid rgba(255,255,255,0.2); padding: 0.25em 0.6em; border-radius: 3px; font-family: inherit; font-size: 0.85rem; cursor: pointer; margin-left: 0.4rem; }

.stage { position: fixed; inset: 0; padding-top: env(safe-area-inset-top, 0); padding-bottom: env(safe-area-inset-bottom, 0); background: var(--bg); }
#canvas { width: 100%; height: 100%; display: block; touch-action: none; }
.hud { position: fixed; bottom: 0.6rem; left: 0.8rem; right: 0.8rem; font-size: 0.85rem; color: var(--fg); pointer-events: none; }

.ios-hint { position: fixed; top: 3rem; left: 0.8rem; right: 0.8rem; padding: 0.6rem 0.8rem; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 0.85rem; z-index: 11; }
.ios-hint button { background: transparent; color: var(--fg); border: 0; font-size: 1.1rem; cursor: pointer; float: right; }

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 4: manifest.webmanifest**

```json
{
  "name": "__NAME__",
  "short_name": "__SHORT__",
  "description": "Playable demo of the __NAME__ primitive.",
  "start_url": "./?src=pwa",
  "scope": "./",
  "id": "./",
  "display": "fullscreen",
  "display_override": ["fullscreen", "standalone", "minimal-ui"],
  "orientation": "__ORIENTATION__",
  "background_color": "__ERA_COLOR__",
  "theme_color": "__ERA_COLOR__",
  "categories": ["games", "education"],
  "lang": "en",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 5: sw.js (KikaCentroid-derived, paths relative)**

```js
const CACHE_VERSION = 'v__VERSION__';
const PRECACHE = `__ID___precache_${CACHE_VERSION}`;
const RUNTIME  = `__ID___runtime_${CACHE_VERSION}`;

const ASSET_VER = CACHE_VERSION.replace(/^v/, '');

const PRECACHE_URLS = [
  './',
  './index.html',
  `./style.css?v=${ASSET_VER}`,
  `./game.js?v=${ASSET_VER}`,
  './offline.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await cache.addAll(PRECACHE_URLS.map(u => new Request(u, { cache: 'reload' })));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('__ID___') && k !== PRECACHE && k !== RUNTIME)
      .map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (_) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') { event.respondWith(navigationHandler(event)); return; }
  if (req.destination === 'image') { event.respondWith(cacheFirst(req, RUNTIME)); return; }
  if (req.destination === 'manifest') { event.respondWith(networkFirst(req, PRECACHE)); return; }
  if (req.destination === 'style' || req.destination === 'script') {
    event.respondWith(staleWhileRevalidate(req, PRECACHE)); return;
  }
  event.respondWith(cacheFirst(req, RUNTIME));
});

async function navigationHandler(event) {
  const cache = await caches.open(PRECACHE);
  try {
    const preload = event.preloadResponse ? await event.preloadResponse : null;
    const network = preload || await timeout(fetch(event.request), 3000);
    if (network && network.ok && network.type === 'basic') {
      cache.put(event.request, network.clone()).catch(() => {});
      const idxHref = new URL('./index.html', self.location).href;
      if (event.request.url !== idxHref) cache.put('./index.html', network.clone()).catch(() => {});
      return network;
    }
    throw new Error('nav not ok');
  } catch (_) {
    const cached = await cache.match(event.request)
                || await cache.match('./index.html')
                || await cache.match('./');
    if (cached) return cached;
    return cache.match('./offline.html');
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    if (req.destination === 'image') return transparentPng();
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req).then(res => {
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  }).catch(() => null);
  return cached || (await network) || (await cache.match(req));
}

function timeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

function transparentPng() {
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, { headers: { 'Content-Type': 'image/png' } });
}
```

- [ ] **Step 6: offline.html**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>__NAME__ — offline</title>
  <style>
    html, body { margin: 0; height: 100%; background: #000; color: #fff;
                 font-family: ui-monospace, "SF Mono", Menlo, monospace;
                 display: flex; align-items: center; justify-content: center; padding: 1rem; }
    main { text-align: center; }
    h1 { font-size: 1.2rem; }
    p { color: rgba(255,255,255,0.7); line-height: 1.5; }
  </style>
</head>
<body>
  <main>
    <h1>Offline</h1>
    <p>This game's first load needs network. Reconnect and try again.</p>
  </main>
</body>
</html>
```

- [ ] **Step 7: README.md (template)**

```markdown
# __NAME__

**Player verb**: __VERB__

**Canonical originator**: __GAME__ (__YEAR__, __PLATFORM__) — __DEVELOPER__

## How to play
(filled by build agent)

## What to notice
(filled by build agent)

## The mechanism
(filled by build agent — link back to research.md)

## Code map
- `index.html` — boot
- `game.js` — the primitive
- `style.css` — visuals
- `sw.js` — offline shell

Read `game.js`. Interesting parts are commented `// mechanism:`.
```

- [ ] **Step 8: Commit**

```bash
git add templates/minigame-pwa/
git commit -m "feat: minigame PWA template (KikaCentroid-derived)"
```

---

### Task 30: `new-minigame.sh` scaffolder

**Files:**
- Create: `scripts/new-minigame.sh`

- [ ] **Step 1: Write the script**

```bash
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
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/new-minigame.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/new-minigame.sh
git commit -m "feat: new-minigame.sh scaffolder"
```

---

### Task 31: Smoke-test `new-minigame.sh` with a throwaway primitive

**Files:**
- Create: `tests/new-minigame.test.sh`

- [ ] **Step 1: Write the integration test**

```bash
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
```

- [ ] **Step 2: Run it**

```bash
chmod +x tests/new-minigame.test.sh
tests/new-minigame.test.sh
```

Expected: prints `scaffolded ...` then `OK`.

- [ ] **Step 3: Commit**

```bash
git add tests/new-minigame.test.sh
git commit -m "test: new-minigame.sh smoke test"
```

---

## Phase 7 — PM agent dispatch (tasks 32–33)

### Task 32: `pm-agent.sh` wave runner

**Files:**
- Create: `scripts/pm-agent.sh`
- Create: `research-notes/.gitkeep`

- [ ] **Step 1: Create research-notes dir**

```bash
mkdir -p research-notes
touch research-notes/.gitkeep
```

- [ ] **Step 2: Write pm-agent.sh**

```bash
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
```

- [ ] **Step 3: Make executable**

```bash
chmod +x scripts/pm-agent.sh
```

- [ ] **Step 4: Commit**

```bash
git add scripts/pm-agent.sh research-notes/.gitkeep
git commit -m "feat: pm-agent.sh wave runner"
```

---

### Task 33: `build-dispatch-msg.sh` (per-wave dispatch prompts)

**Files:**
- Create: `scripts/build-dispatch-msg.sh`

- [ ] **Step 1: Write the dispatcher**

```bash
#!/usr/bin/env bash
# Emits the canonical dispatch prompt for a given wave per CLI-RUNBOOK.md.
# Output goes to stdout; pm-agent.sh pipes it to `claude -p`.
set -euo pipefail
WAVE=$1; shift || true

case "$WAVE" in
  research)
    IDS=${1:?usage: build-dispatch-msg.sh research <id1,id2,...>}
    cat <<EOF
Read BRIEF.md, schema.md, style-guide.md, references/sources.md (note: sources.md is the file at repo root), and agent-prompts/02-research.md.

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
```

- [ ] **Step 2: Make executable + smoke test**

```bash
chmod +x scripts/build-dispatch-msg.sh
scripts/build-dispatch-msg.sh research asteroids-rotate-thrust | head -8
```

Expected: prints the dispatch prompt.

- [ ] **Step 3: Commit**

```bash
git add scripts/build-dispatch-msg.sh
git commit -m "feat: per-wave dispatch prompts"
```

---

## Phase 8 — Update agent prompt 06 with PWA gates (task 34)

### Task 34: Add PWA quality gates to agent-prompts/06-minigame-build.md

**Files:**
- Modify: `agent-prompts/06-minigame-build.md`

- [ ] **Step 1: Append a new section at the end of the file**

Add to the end of `agent-prompts/06-minigame-build.md`:

```markdown

## v1 PWA delivery additions (overrides where conflicting)

The mini-game lives at `public/g/{id}/` and is scaffolded by `scripts/new-minigame.sh {id}` from `templates/minigame-pwa/`. The template already provides:

- `index.html` (viewport, iOS PWA tags, fullscreen button, SW registration)
- `style.css` (era-color theming, fullscreen stage, reduced-motion respect)
- `manifest.webmanifest` (display: fullscreen, orientation from spec.md)
- `sw.js` (hand-rolled, NetworkFirst nav, SWR JS/CSS, CacheFirst images, offline.html fallback)
- `offline.html`, `icons/` (generated)

**You only write `game.js` and fill `README.md`.** Do NOT modify the other files. If you need to change them, the template itself is wrong — flag the issue in your wave summary so the human can update the template once for all games.

### Additional quality gates

The 8 base gates in this prompt still apply. Add these 4 for v1:

- [ ] Lighthouse Installability check passes in Chrome (human verifies)
- [ ] Game loads and plays after toggling network offline in DevTools (human verifies)
- [ ] Fullscreen toggle works on real iOS Safari + portrait/landscape per spec.md (human verifies on device)
- [ ] `prefers-reduced-motion: reduce` disables non-essential animation in `game.js`

### Game.js shape (with template-supplied scaffolding)

The template's `game.js` already includes:
- canvas setup with DPR-aware resize
- fullscreen button binding
- pause-on-blur via visibilitychange
- requestAnimationFrame loop with dt clamping

Your job: fill `state`, `tick(dt)`, `render()`, `bindInput()`. Keep the structure. Read the file before overwriting — do not delete the boot/resize/pause-on-blur plumbing.
```

- [ ] **Step 2: Commit**

```bash
git add agent-prompts/06-minigame-build.md
git commit -m "docs: add v1 PWA gates and template contract to agent-prompts/06"
```

---

## Phase 9 — Demo content waves (tasks 35–39)

> **Each of these tasks runs a `claude -p` wave. The wave produces markdown + (for build) game.js. After each wave, you (the human) review the diff and approve. The plan-executor agent's role is to run the script, capture the output, and report the diff for review — not to evaluate research quality (you do that).**

### Task 35: Research wave — asteroids + qix + baba

**Files modified by agent dispatch:**
- `src/content/primitives/asteroids-rotate-thrust/research.md`
- `src/content/primitives/qix-area-claim/research.md`
- `src/content/primitives/baba-is-you-rewrite/research.md`
- `src/content/primitives/{id}/stub.md` (status → researched)
- `references/citations.bib`
- `research-queue.md`

- [ ] **Step 1: Run the research wave**

```bash
scripts/pm-agent.sh research asteroids-rotate-thrust,qix-area-claim,baba-is-you-rewrite
```

Expected: prints dispatch prompt; Claude runs 3 sub-agents in parallel; each writes `research.md` for its primitive. Summary lands in `research-notes/wave-research-<date>.md`.

- [ ] **Step 2: Human review checklist**

For each of the 3 `research.md`:

- [ ] All 9 required sections present (player verb, canonical originator, variations, algorithm, hooks, convergence, mini-game scope, references, frontmatter)
- [ ] ≥ 4 citations, ≥ 2 Tier-1 sources per `sources.md`
- [ ] `## Algorithm / math` section is concrete (pseudocode/equations), not hand-wavy
- [ ] Wordcount 800–1500
- [ ] Wikilinks in convergence section
- [ ] Stub frontmatter status: researched

If any fail: redispatch just those ids with a correction note.

- [ ] **Step 3: Verify schema still passes**

```bash
npx astro check 2>&1 | grep -i "primitive\|content" | head
```

Expected: no content-collection errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "wave-research: asteroids, qix, baba — researched"
```

---

### Task 36: Spec wave — asteroids + qix + baba

**Files modified by agent dispatch:**
- `src/content/primitives/{asteroids-rotate-thrust,qix-area-claim,baba-is-you-rewrite}/spec.md`
- `src/content/primitives/{id}/stub.md` (status → speced)
- `research-queue.md`

- [ ] **Step 1: Run**

```bash
scripts/pm-agent.sh spec asteroids-rotate-thrust,qix-area-claim,baba-is-you-rewrite
```

- [ ] **Step 2: Human review**

For each `spec.md`:

- [ ] Reduced ruleset ≤ 7 rules
- [ ] `orientation` frontmatter present: auto, portrait, or landscape
- [ ] `target_loc` ≤ 400
- [ ] State model pseudocode present
- [ ] Out-of-scope list present
- [ ] Visual language ≤ 5 colors specified
- [ ] Wordcount 400–700

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "wave-spec: asteroids, qix, baba — speced"
```

---

### Task 37: Build wave — asteroids + qix + baba

**Files modified by agent dispatch:**
- `public/g/asteroids-rotate-thrust/` (full PWA scaffolded + game.js + README written)
- `public/g/qix-area-claim/`
- `public/g/baba-is-you-rewrite/`
- `src/content/primitives/{id}/stub.md` (status → built)
- `research-notes/build-log.md`

- [ ] **Step 1: Run**

```bash
scripts/pm-agent.sh build asteroids-rotate-thrust,qix-area-claim,baba-is-you-rewrite
```

- [ ] **Step 2: Programmatic verification per game**

For each of the 3 ids `<id>`:

```bash
ID=asteroids-rotate-thrust  # repeat with qix-area-claim, baba-is-you-rewrite
test -f public/g/$ID/index.html
test -f public/g/$ID/game.js
test -f public/g/$ID/manifest.webmanifest
test -f public/g/$ID/sw.js
test -f public/g/$ID/offline.html
test -f public/g/$ID/icons/icon-192.png
node -e "JSON.parse(require('fs').readFileSync('public/g/$ID/manifest.webmanifest','utf8'))"
! grep -RIn '__ID__\|__NAME__\|__ERA_COLOR__\|__VERSION__' public/g/$ID/
echo "$ID OK"
```

Each should print `<id> OK`.

- [ ] **Step 3: Human playthrough**

```bash
npm run dev -- --port 4321 &
sleep 4
open http://localhost:4321/g/asteroids-rotate-thrust/
open http://localhost:4321/g/qix-area-claim/
open http://localhost:4321/g/baba-is-you-rewrite/
```

For each, verify in browser:
- [ ] Plays at 60 fps for ≥ 30 seconds
- [ ] Fullscreen button works
- [ ] Pause-on-blur works (switch tabs and back)
- [ ] No console errors
- [ ] Resize doesn't crash
- [ ] `chrome://serviceworker-internals` lists the SW; toggle offline → game reloads cleanly

Kill dev server: `kill %1`

- [ ] **Step 4: iOS device test** (optional but recommended before tagging v1)

On a real iPhone, visit each game's URL, install to home screen, verify fullscreen + orientation + offline.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "wave-build: asteroids, qix, baba — built as installable PWAs"
```

---

### Task 38: Hub now renders 3 demos inline

**Files:** none — the primitive detail page already reads `status: built` and embeds the iframe.

- [ ] **Step 1: Verify**

```bash
npm run build
grep -l 'game-embed' dist/p/asteroids-rotate-thrust/index.html dist/p/qix-area-claim/index.html dist/p/baba-is-you-rewrite/index.html
```

Expected: all 3 files print their path (i.e., the GameEmbed component rendered).

- [ ] **Step 2: Visual check**

```bash
npm run dev -- --port 4321 &
sleep 4
open http://localhost:4321/p/asteroids-rotate-thrust/
kill %1
```

Confirm the page shows the iframe with the game inside.

---

## Phase 10 — Quality gates and tag v1.0.0 (tasks 39–41)

### Task 39: Production build green

- [ ] **Step 1: Full build**

```bash
npm run build 2>&1 | tee /tmp/gp-build.log | tail -20
```

Expected: 0 errors. ~37 routes built (33 primitive pages + index, taxonomy, era, about).

- [ ] **Step 2: Run unit tests**

```bash
npm test
```

Expected: all green.

- [ ] **Step 3: Run new-minigame smoke test**

```bash
tests/new-minigame.test.sh
```

Expected: `OK`.

---

### Task 40: Lighthouse installability spot-check

- [ ] **Step 1: Serve the production build**

```bash
npx http-server dist -p 4322 -c-1 &
sleep 2
```

- [ ] **Step 2: Run Lighthouse for hub + one game** (manual via Chrome DevTools)

Open Chrome → DevTools → Lighthouse → check "Installable" → run on:
- `http://localhost:4322/`
- `http://localhost:4322/g/asteroids-rotate-thrust/`

Verify both pass the Installable audit. Best Practices and CWV scores should be green; record any reds.

- [ ] **Step 3: Stop server**

```bash
kill %1
```

---

### Task 41: Update README + tag v1.0.0

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Append a "Running v1" section to README.md**

Append this section after the existing "Repository layout" section in `README.md`:

```markdown

## Running v1 (added 2026-05)

Requirements: Node 24, npm 10.

```
npm install
npm run dev -- --port 4321
open http://localhost:4321/
```

To run a research/spec/build wave for additional primitives:

```
scripts/pm-agent.sh research <id1,id2,...>
scripts/pm-agent.sh spec    <id1,id2,...>
scripts/pm-agent.sh build   <id1,id2,...>
```

Each wave writes a summary to `research-notes/wave-<wave>-<date>.md` and stops for human review. Approve → `git commit`. Reject → `git checkout -- .`.

To scaffold a new mini-game PWA from the template (without an agent):

```
scripts/new-minigame.sh <id>
```

The script copies `templates/minigame-pwa/` into `public/g/<id>/`, substitutes placeholders from `src/content/primitives/<id>/stub.md`, and generates the icon set.

v1 ships with three fully playable demos: `asteroids-rotate-thrust`, `qix-area-claim`, `baba-is-you-rewrite`. The other 30 primitives render as research-stub cards.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README v1 run instructions"
```

- [ ] **Step 3: Tag**

```bash
git tag -a v1.0.0 -m "v1: 33 stub cards + 3 playable PWA demos (asteroids, qix, baba)"
git tag --list
```

Expected: `v1.0.0` listed.

---

## Cross-cut: deban sync at end

After v1 is tagged, run `/deban sync` so the open questions surfaced during init are closed/converted to decisions/dead-ends in role files. (Manual step, not automated.)

---

## Self-review (run inline, fix as found)

**1. Spec coverage:**
- [x] Hub PWA — tasks 1–28
- [x] Mini-game PWA template lifted from KikaCentroid — task 29
- [x] new-minigame.sh — task 30
- [x] pm-agent.sh + dispatch prompts — tasks 32–33
- [x] Agent-prompt-06 PWA gates added — task 34
- [x] 33 stubs rendered as cards — tasks 8, 14, 15, 16
- [x] 3 demos built via wave loop — tasks 35–37
- [x] Hub embeds games via iframe — task 18, verified task 38
- [x] Era palette + glyphs + visual language — tasks 9, 10, 12
- [x] Install affordance (both hub and per-game) — task 27 (hub), template (per-game)
- [x] Update toast — task 28 (hub), template carries the pattern per-game
- [x] Reduced-motion handling — task 9, template
- [x] Project memory init done before plan — (already committed)
- [x] Local-only first hosting — no deploy tasks; explicit non-goal

**2. Placeholder scan:** no TBD/TODO/"similar to". All code blocks complete. ✓

**3. Type consistency:**
- `Era` exported from `content/config.ts`, imported in `eras.ts` and `EraGlyph.astro` ✓
- `loadExtras` signature matches between `content-loader.ts` and `p/[id].astro` usage ✓
- `status` enum values match between schema, gen-stubs.mjs, and PrimitiveCard badge styles ✓
- Manifest `orientation` values: schema allows auto/portrait/landscape; new-minigame.sh translates `auto` → `any` for the manifest field (manifests don't accept "auto") ✓

No issues found.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-11-gaming-primitives-v1-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for Phases 1–6 (direct code), with you reviewing between phases.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

Which approach? (Either way, Phases 7–9 — the agent waves at tasks 35–37 — are gated on your review by design, regardless of execution mode.)
