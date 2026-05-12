# Gaming Primitives v2 — Plan 1: Migration + Topology MVP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot the project headline from applied primitives to pure-mechanism family pages. Migrate existing applied work to `/a/`, scaffold a 14-family pure-primitive catalog at `/p/` with all families browsable (most stubbed), and ship the first MVP family — **Topology** — fully playable with 3 working variants (bounded · torus-wrap · bounce).

**Architecture:** Two Astro content collections — `applied/` (renamed from `primitives/`, 33 entries unchanged) and `primitives/` (new, 14 families × N variants). New page routes: `/p/` (pure index), `/p/[slug]/` (family page *or* redirect to `/a/[slug]/` for old applied URLs), `/a/` and `/a/[id]/`. Pure-primitive family pages mount a single canvas demo via `<PrimitiveDemo>`, dynamically importing a tiny variant module from `public/d/<family>/<variant>.js`. Bidirectional cross-links (applied→primitive `decomposition:`, primitive→applied `in_the_wild:`) verified at build time by a vitest integrity check.

**Tech Stack:** Astro 5 (content collections + content layer API), TypeScript, vanilla JS for variant modules, native `<input type=range>` for knobs, Astro's built-in `<Code>` (Shiki, server-rendered, zero runtime JS) for the code panel. No new npm deps. Vitest for integrity tests. Node 24.x.

**Plan scope:** Migration + Infra + Topology family + 11 family stubs. **Out of scope** (separate plans): Motion family (Plan 2), Bullets family (Plan 3), agent-prompt automation (`scripts/pm-agent.sh wave-primitive-*`), decomposition backfill for unbuilt applied stubs.

---

## File structure (created / modified by this plan)

```
gaming-primitives/
├── src/
│   ├── content.config.ts                                   [modify — tasks 2, 7]
│   ├── content/
│   │   ├── applied/                                        [renamed from primitives/ — task 1]
│   │   │   └── <33 existing dirs>/{stub,research,spec}.md
│   │   └── primitives/                                     [created — tasks 8–9]
│   │       ├── motion/{family.md, variants/*.md}           [stubbed — task 8]
│   │       ├── bullets/{family.md, variants/*.md}          [stubbed — task 8]
│   │       ├── topology/{family.md, variants/*.md}         [BUILT — task 18]
│   │       └── …11 more families (stubbed)
│   ├── pages/
│   │   ├── a/
│   │   │   ├── [id].astro                                  [moved from p/[id].astro — task 3]
│   │   │   └── index.astro                                 [created — task 5]
│   │   └── p/
│   │       ├── index.astro                                 [created — task 11]
│   │       └── [slug].astro                                [created — task 12]
│   ├── components/
│   │   ├── FamilyCard.astro                                [created — task 10]
│   │   ├── PrimitiveDemo.astro                             [created — task 16]
│   │   ├── PrimitiveKnob.astro                             [created — task 15]
│   │   ├── VariantTabs.astro                               [created — task 17]
│   │   └── GameEmbed.astro                                 [modify — task 4]
│   └── layouts/Base.astro                                  [modify — task 24]
├── public/
│   └── d/
│       ├── runner.js                                       [created — task 14]
│       └── topology/
│           ├── bounded.js                                  [created — task 19]
│           ├── torus-wrap.js                               [created — task 20]
│           └── bounce.js                                   [created — task 21]
├── scripts/
│   └── check-cross-links.mjs                               [created — task 23]
└── tests/
    └── cross-links.test.ts                                 [created — task 23]
```

---

## Phase A — Migration (Tasks 1–6)

### Task 1: Rename content collection directory `primitives/` → `applied/`

**Files:**
- Move: `src/content/primitives/` → `src/content/applied/`

- [ ] **Step 1: Move the directory**

```bash
git mv src/content/primitives src/content/applied
git status   # confirm 33 stub.md entries marked as renamed
```

- [ ] **Step 2: Verify file count**

```bash
find src/content/applied -name "stub.md" | wc -l
```
Expected: `33`

- [ ] **Step 3: Commit the rename only (no schema change yet)**

```bash
git commit -m "refactor: rename content/primitives/ → content/applied/

Pivot toward v2: pure primitives become the headline at /p/,
existing applied primitives relocate to /a/. This commit moves
the files only; schema rename follows in the next commit."
```

---

### Task 2: Update content.config.ts: rename collection `primitives` → `applied`

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Edit the collections export**

Find:
```ts
export const collections = {
  primitives: defineCollection({
    loader: glob({
      pattern: '**/stub.md',
      base: './src/content/primitives',
      generateId: ({ entry }) => entry.replace(/\/stub\.md$/, '').replace(/\.md$/, ''),
    }),
    schema: primitiveStub,
  }),
};
```

Replace with:
```ts
export const collections = {
  applied: defineCollection({
    loader: glob({
      pattern: '**/stub.md',
      base: './src/content/applied',
      generateId: ({ entry }) => entry.replace(/\/stub\.md$/, '').replace(/\.md$/, ''),
    }),
    schema: primitiveStub,
  }),
};
```

- [ ] **Step 2: Run build to verify the renamed collection still loads**

```bash
npm run build 2>&1 | tail -10
```
Expected: `[build] Complete!` with no schema errors. Existing 33 entries enumerated.

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "refactor: rename content collection key to 'applied'"
```

---

### Task 3: Move page route `/p/[id]` → `/a/[id]`, update collection reference

**Files:**
- Move: `src/pages/p/[id].astro` → `src/pages/a/[id].astro`

- [ ] **Step 1: Move the file**

```bash
mkdir -p src/pages/a
git mv src/pages/p/[id].astro src/pages/a/[id].astro
```

- [ ] **Step 2: Update collection reference inside the file**

In `src/pages/a/[id].astro`, find every `getCollection('primitives')` and replace with `getCollection('applied')`. Find every internal href containing `/p/${...}` and replace with `/a/${...}`.

- [ ] **Step 3: Run build, click through one applied page**

```bash
npm run build 2>&1 | tail -5
npm run preview &
sleep 2
curl -s http://localhost:4321/a/asteroids-rotate-thrust/ | grep -oE '<title>[^<]+</title>'
kill %1 2>/dev/null
```
Expected: `<title>Asteroids Rotate-Thrust — Gaming Primitives</title>` (or similar — confirm page renders).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move applied detail page /p/[id] → /a/[id]"
```

---

### Task 4: Rewrite internal `/p/<id>/` links → `/a/<id>/`

**Files:**
- Modify: `src/components/GameEmbed.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/taxonomy.astro`
- Modify: `src/pages/era.astro`

- [ ] **Step 1: Find all current references**

```bash
grep -rn "/p/" src/ --include="*.astro" --include="*.ts"
```

Note every occurrence. The likely list:
- `GameEmbed.astro:` iframe `src` uses `g/`, not `p/`; should already be correct. Recheck.
- `index.astro:` "featured row" linking to applied entries
- `taxonomy.astro:` clicked card → `/p/<id>/`
- `era.astro:` era timeline entries

- [ ] **Step 2: Replace each occurrence in source**

For each file in the grep list, replace template-literal `\`${base}p/${entry.id}/\`` → `\`${base}a/${entry.id}/\``.

Also update any `getCollection('primitives')` → `getCollection('applied')`.

- [ ] **Step 3: Build and re-grep**

```bash
npm run build 2>&1 | tail -3
grep -rn "/p/" src/ --include="*.astro" --include="*.ts"
```
Expected: build succeeds. No leftover `/p/<id>/` references except where intentional (the `[slug].astro` redirect handler, coming in Task 12).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: rewrite internal links /p/<id>/ → /a/<id>/"
```

---

### Task 5: Create `src/pages/a/index.astro` (applied catalog index)

**Files:**
- Create: `src/pages/a/index.astro`

- [ ] **Step 1: Create the file**

```astro
---
import Base from '../../layouts/Base.astro';
import { getCollection } from 'astro:content';

const applied = (await getCollection('applied'))
  .filter(e => e.id !== '__test__' && !e.id.startsWith('__test__/'))
  .sort((a, b) => a.data.canonical_year - b.data.canonical_year);
const builtCount = applied.filter(p => p.data.status === 'built').length;
const base = import.meta.env.BASE_URL;
---
<Base title="Applied Primitives">
  <section class="hero">
    <h1>Applied Primitives</h1>
    <p class="lede">
      Each entry is one historical game compressed to its irreducible verb —
      a minimal but playable demo of the primitive in its native context.
    </p>
    <p class="metadata">
      {builtCount} of {applied.length} playable.
    </p>
  </section>

  <ul class="applied-list">
    {applied.map(entry => (
      <li class={`applied-item status-${entry.data.status}`}>
        <a href={`${base}a/${entry.id}/`}>
          <span class="year">{entry.data.canonical_year}</span>
          <span class="name">{entry.data.name}</span>
          <span class="verb">— {entry.data.player_verb}</span>
          <span class="status-badge">{entry.data.status}</span>
        </a>
      </li>
    ))}
  </ul>
</Base>

<style>
  .hero { max-width: 38rem; margin: 3rem auto 1.5rem; }
  .hero h1 { font-family: var(--font-mono); font-size: 2rem; margin-bottom: 0.4em; }
  .lede { font-family: var(--font-serif); font-size: 1.1rem; line-height: 1.5; }
  .applied-list { list-style: none; padding: 0; max-width: 48rem; margin: 0 auto; }
  .applied-item { border-bottom: 1px solid var(--border); padding: 0.6rem 0; }
  .applied-item a { display: grid; grid-template-columns: 4rem 1fr auto; gap: 0.8rem; align-items: baseline; color: var(--fg); text-decoration: none; font-family: var(--font-mono); }
  .applied-item .year { color: var(--fg-muted); font-size: 0.85rem; }
  .applied-item .name { font-weight: 600; }
  .applied-item .verb { color: var(--fg-muted); font-size: 0.9rem; grid-column: 2; }
  .applied-item .status-badge { font-size: 0.7rem; padding: 0.1em 0.4em; border: 1px solid var(--border); border-radius: 3px; color: var(--fg-muted); }
  .status-built .status-badge { color: var(--accent, #6ed); border-color: var(--accent, #6ed); }
</style>
```

- [ ] **Step 2: Build and curl**

```bash
npm run build 2>&1 | tail -3
npm run preview &
sleep 2
curl -s http://localhost:4321/a/ | head -50
kill %1 2>/dev/null
```
Expected: HTML containing `Applied Primitives` heading and `<li class="applied-item">` rows.

- [ ] **Step 3: Commit**

```bash
git add src/pages/a/index.astro
git commit -m "feat: applied catalog index at /a/"
```

---

### Task 6: Verify migration end-to-end

- [ ] **Step 1: Full build + smoke each applied page**

```bash
npm run build 2>&1 | tail -3
ls dist/a/ | head -10                    # confirm 33 dirs at /a/
ls dist/a/asteroids-rotate-thrust/       # confirm index.html present
ls dist/a/qix-area-claim/
```
Expected: each applied directory has `index.html`.

- [ ] **Step 2: Verify mini-game embed paths**

```bash
grep -oE 'src="[^"]*g/[^"]+"' dist/a/asteroids-rotate-thrust/index.html | head -2
```
Expected: `src="/g/asteroids-rotate-thrust/"` (the embedded iframe path is unchanged).

- [ ] **Step 3: Run vitest**

```bash
npm test 2>&1 | tail -10
```
Expected: existing 2 tests still pass.

- [ ] **Step 4: Commit if any cleanup remains**

```bash
git status   # should be clean
```

---

## Phase B — Primitives schema + 14 family stubs (Tasks 7–9)

### Task 7: Define `primitives` collection schema in content.config.ts

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Add new schema definitions and collection**

Append to `src/content.config.ts`:

```ts
const knobSpec = z.discriminatedUnion('type', [
  z.object({ type: z.literal('float'),  id: z.string(), min: z.number(), max: z.number(), default: z.number(), step: z.number().optional(), unit: z.string().optional(), label: z.string().optional() }),
  z.object({ type: z.literal('int'),    id: z.string(), min: z.number().int(), max: z.number().int(), default: z.number().int(), step: z.number().int().optional(), unit: z.string().optional(), label: z.string().optional() }),
  z.object({ type: z.literal('toggle'), id: z.string(), default: z.boolean(), on_label: z.string(), off_label: z.string(), label: z.string().optional() }),
  z.object({ type: z.literal('enum'),   id: z.string(), options: z.array(z.string()).min(2), default: z.string(), label: z.string().optional() }),
]);

const inTheWild = z.array(z.object({
  applied: z.string(),   // applied/<id>
  note: z.string(),
}));

const primitiveFamily = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]+$/),
  name: z.string(),
  oneliner: z.string(),
  variants: z.array(z.string()).min(1),
});

const primitiveVariant = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]+$/),
  name: z.string(),
  status: z.enum(['built', 'stubbed']),
  description: z.string(),
  parameters: z.array(knobSpec).optional(),
  in_the_wild: inTheWild.optional(),
  code_anchor: z.string().optional(),
});
```

And add to `export const collections`:

```ts
  primitiveFamilies: defineCollection({
    loader: glob({
      pattern: '**/family.md',
      base: './src/content/primitives',
      generateId: ({ entry }) => entry.replace(/\/family\.md$/, ''),
    }),
    schema: primitiveFamily,
  }),
  primitiveVariants: defineCollection({
    loader: glob({
      pattern: '**/variants/*.md',
      base: './src/content/primitives',
      generateId: ({ entry }) => entry.replace(/\.md$/, ''),  // motion/variants/rotate-thrust
    }),
    schema: primitiveVariant,
  }),
```

- [ ] **Step 2: Also update applied schema to include optional decomposition**

In the existing `primitiveStub` definition, add:
```ts
  decomposition: z.array(z.object({
    family: z.string(),
    variant: z.string(),
    config: z.string().default(''),
  })).optional(),
```

- [ ] **Step 3: Run build — expect "no entries" warning but no crash**

```bash
npm run build 2>&1 | tail -10
```
Expected: build succeeds. Astro may log "0 entries in primitiveFamilies" — harmless.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts
git commit -m "feat(schema): primitiveFamilies + primitiveVariants collections, applied decomposition"
```

---

### Task 8: Create 14 family.md files

**Files:**
- Create: `src/content/primitives/<family>/family.md` × 14

- [ ] **Step 1: Create directories and family.md files**

```bash
cd src/content/primitives
mkdir -p motion bullets topology aiming collision camera pathfinding procedural rules-as-objects time-as-resource composition state-machines information-asymmetry nested-spaces
```

Create each file. Below the literal content of all 14:

**`motion/family.md`:**
```markdown
---
slug: motion
name: Motion
oneliner: How things move under player or AI input.
variants:
  - linear
  - eight-directional
  - rotate-thrust
  - drag-friction
  - jump-arc
  - follow-cursor
  - click-to-move
---
```

**`bullets/family.md`:**
```markdown
---
slug: bullets
name: Bullets
oneliner: How projectiles are spawned, aimed, and expire.
variants:
  - fixed-direction
  - aimed
  - spread-n
  - lifetime
  - velocity-inheritance
  - gravity-affected
  - homing
  - hitscan
---
```

**`topology/family.md`:**
```markdown
---
slug: topology
name: Topology
oneliner: What happens at the edge of the playfield.
variants:
  - bounded
  - torus-wrap
  - bounce
  - infinite-scroll
  - tile-grid
---
```

**`aiming/family.md`:**
```markdown
---
slug: aiming
name: Aiming
oneliner: How a weapon or actor selects a target direction.
variants:
  - fixed-angle
  - mouse-follow
  - predictive-lead
  - lock-on
  - rotation-rate-limited
---
```

**`collision/family.md`:**
```markdown
---
slug: collision
name: Collision
oneliner: How shapes test for intersection.
variants:
  - aabb
  - circle
  - point-in-polygon
  - swept
  - separating-axis
  - pixel-perfect
---
```

**`camera/family.md`:**
```markdown
---
slug: camera
name: Camera
oneliner: How the view follows the action.
variants:
  - fixed
  - follow
  - dead-zone
  - lerp
  - parallax
---
```

**`pathfinding/family.md`:**
```markdown
---
slug: pathfinding
name: Pathfinding
oneliner: How NPCs choose a route from A to B.
variants:
  - waypoint
  - a-star-grid
  - follow-leader
  - flocking
  - line-of-sight
---
```

**`procedural/family.md`:**
```markdown
---
slug: procedural
name: Procedural
oneliner: How content is generated rather than authored.
variants:
  - random-walk
  - perlin-terrain
  - l-system
  - cellular-automata
---
```

**`rules-as-objects/family.md`:**
```markdown
---
slug: rules-as-objects
name: Rules as Objects
oneliner: Game rules represented as in-world entities the player can manipulate.
variants:
  - push-tiles
  - parse-rules
  - mutate-rules
  - nested-rules
---
```

**`time-as-resource/family.md`:**
```markdown
---
slug: time-as-resource
name: Time as Resource
oneliner: Game state that the player rewinds, dilates, or commits.
variants:
  - bonfire-recovery
  - rewind
  - dilation
  - save-states
---
```

**`composition/family.md`:**
```markdown
---
slug: composition
name: Composition
oneliner: Building player capability from assembled parts (decks, slots, items).
variants:
  - deck-shuffle
  - deck-draw
  - slot-fit
  - evolution
---
```

**`state-machines/family.md`:**
```markdown
---
slug: state-machines
name: State Machines
oneliner: Entity behaviour modelled as discrete states with transitions.
variants:
  - fsm
  - behavior-tree
  - status-effects
  - resource-meters
---
```

**`information-asymmetry/family.md`:**
```markdown
---
slug: information-asymmetry
name: Information Asymmetry
oneliner: What the player and the system know differently.
variants:
  - fog-of-war
  - los-reveal
  - identity-grid
---
```

**`nested-spaces/family.md`:**
```markdown
---
slug: nested-spaces
name: Nested Spaces
oneliner: Levels or rooms that contain themselves recursively.
variants:
  - nested-rooms
  - portals
  - non-euclidean
---
```

- [ ] **Step 2: Verify all 14 family.md files exist**

```bash
ls src/content/primitives/*/family.md | wc -l
```
Expected: `14`

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -10
```
Expected: build succeeds. Warning if variant files are missing — handled in task 9.

- [ ] **Step 4: Commit**

```bash
git add src/content/primitives
git commit -m "feat(content): 14 pure-primitive family.md scaffolds"
```

---

### Task 9: Create variant.md stubs for every variant in every family

**Files:**
- Create: `src/content/primitives/<family>/variants/<variant>.md` (many — ~70 total)

- [ ] **Step 1: Create the variants/ directories**

```bash
cd src/content/primitives
for f in */; do mkdir -p "$f/variants"; done
```

- [ ] **Step 2: For every variant listed in every family.md, create a stub variant.md**

Each stub file follows this template — name and slug derived from the variant key:

```markdown
---
slug: <variant-slug>
name: <Title Case Name>
status: stubbed
description: <one sentence about the mechanic>
---

(content will be authored when this variant reaches the build wave)
```

Below are the explicit per-file contents. Create them all:

**`motion/variants/linear.md`:**
```markdown
---
slug: linear
name: Linear
status: stubbed
description: Position integrates velocity each tick; no acceleration, no friction.
---
```

**`motion/variants/eight-directional.md`:**
```markdown
---
slug: eight-directional
name: Eight-Directional
status: stubbed
description: Heading snaps to 8 compass directions from key input.
---
```

**`motion/variants/rotate-thrust.md`:**
```markdown
---
slug: rotate-thrust
name: Rotate-Thrust
status: stubbed
description: Inertial heading + thrust along facing; the Asteroids family.
---
```

**`motion/variants/drag-friction.md`:**
```markdown
---
slug: drag-friction
name: Drag / Friction
status: stubbed
description: Velocity decays as v *= exp(-k·dt); framerate-independent glide-to-stop.
---
```

**`motion/variants/jump-arc.md`:**
```markdown
---
slug: jump-arc
name: Jump-Arc
status: stubbed
description: Vertical impulse + gravity; the platformer parabola.
---
```

**`motion/variants/follow-cursor.md`:**
```markdown
---
slug: follow-cursor
name: Follow-Cursor
status: stubbed
description: Position lerps toward the pointer each frame.
---
```

**`motion/variants/click-to-move.md`:**
```markdown
---
slug: click-to-move
name: Click-to-Move
status: stubbed
description: Click a destination; entity walks to it on a path.
---
```

**`bullets/variants/fixed-direction.md`:**
```markdown
---
slug: fixed-direction
name: Fixed Direction
status: stubbed
description: Bullets fire along a constant world-frame vector.
---
```

**`bullets/variants/aimed.md`:**
```markdown
---
slug: aimed
name: Aimed
status: stubbed
description: Bullets fire along the firing entity's facing.
---
```

**`bullets/variants/spread-n.md`:**
```markdown
---
slug: spread-n
name: Spread-N
status: stubbed
description: N bullets fan out within an arc on each shot.
---
```

**`bullets/variants/lifetime.md`:**
```markdown
---
slug: lifetime
name: Lifetime
status: stubbed
description: Each bullet expires after a fixed TTL; defines effective range.
---
```

**`bullets/variants/velocity-inheritance.md`:**
```markdown
---
slug: velocity-inheritance
name: Velocity Inheritance
status: stubbed
description: Bullet velocity = muzzle vector ± firing platform velocity; the Logg vs Jarvis choice.
---
```

**`bullets/variants/gravity-affected.md`:**
```markdown
---
slug: gravity-affected
name: Gravity-Affected
status: stubbed
description: Bullets fall under constant gravity — Worms, Scorched Earth.
---
```

**`bullets/variants/homing.md`:**
```markdown
---
slug: homing
name: Homing
status: stubbed
description: Bullets steer toward a target with rate-limited rotation.
---
```

**`bullets/variants/hitscan.md`:**
```markdown
---
slug: hitscan
name: Hitscan
status: stubbed
description: No projectile — a ray is cast and resolved on the same frame.
---
```

**`topology/variants/bounded.md`:**
```markdown
---
slug: bounded
name: Bounded
status: stubbed
description: Position clamped at the edges; velocity zeroed on contact.
---
```

**`topology/variants/torus-wrap.md`:**
```markdown
---
slug: torus-wrap
name: Torus-Wrap
status: stubbed
description: Position wraps modulo edge; the Asteroids playfield.
---
```

**`topology/variants/bounce.md`:**
```markdown
---
slug: bounce
name: Bounce
status: stubbed
description: Position clamped and velocity reflected; the Pong wall.
---
```

**`topology/variants/infinite-scroll.md`:**
```markdown
---
slug: infinite-scroll
name: Infinite Scroll
status: stubbed
description: World extends indefinitely; the camera follows, the world generates ahead.
---
```

**`topology/variants/tile-grid.md`:**
```markdown
---
slug: tile-grid
name: Tile-Grid
status: stubbed
description: Discrete cells with adjacency rules.
---
```

For the remaining 11 families (aiming, collision, camera, pathfinding, procedural, rules-as-objects, time-as-resource, composition, state-machines, information-asymmetry, nested-spaces), repeat the pattern: each variant gets a stub `variants/<slug>.md` with `status: stubbed` and a one-sentence `description`. Full list to create (write each):

- `aiming/variants/{fixed-angle,mouse-follow,predictive-lead,lock-on,rotation-rate-limited}.md`
- `collision/variants/{aabb,circle,point-in-polygon,swept,separating-axis,pixel-perfect}.md`
- `camera/variants/{fixed,follow,dead-zone,lerp,parallax}.md`
- `pathfinding/variants/{waypoint,a-star-grid,follow-leader,flocking,line-of-sight}.md`
- `procedural/variants/{random-walk,perlin-terrain,l-system,cellular-automata}.md`
- `rules-as-objects/variants/{push-tiles,parse-rules,mutate-rules,nested-rules}.md`
- `time-as-resource/variants/{bonfire-recovery,rewind,dilation,save-states}.md`
- `composition/variants/{deck-shuffle,deck-draw,slot-fit,evolution}.md`
- `state-machines/variants/{fsm,behavior-tree,status-effects,resource-meters}.md`
- `information-asymmetry/variants/{fog-of-war,los-reveal,identity-grid}.md`
- `nested-spaces/variants/{nested-rooms,portals,non-euclidean}.md`

Each one-sentence `description` is the engineer's call — short and specific. Examples for the trickier ones:
- `aiming/predictive-lead`: "Aim at where the target will be, not where it is."
- `collision/separating-axis`: "Test for a separating hyperplane between two convex shapes."
- `time-as-resource/rewind`: "Player undoes time within a finite window."

- [ ] **Step 3: Count and build**

```bash
find src/content/primitives -name "*.md" -path "*/variants/*" | wc -l
npm run build 2>&1 | tail -10
```
Expected: ~70 variant files. Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/content/primitives
git commit -m "feat(content): variant stubs for all 14 pure-primitive families"
```

---

## Phase C — Pure index + family page chrome (Tasks 10–13)

### Task 10: Create `src/components/FamilyCard.astro`

**Files:**
- Create: `src/components/FamilyCard.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface Props {
  slug: string;
  name: string;
  oneliner: string;
  variantCount: number;
  builtCount: number;
}
const { slug, name, oneliner, variantCount, builtCount } = Astro.props;
const base = import.meta.env.BASE_URL;
const isBuilt = builtCount > 0;
---
<a class:list={["family-card", { "is-built": isBuilt, "is-stub": !isBuilt }]} href={`${base}p/${slug}/`}>
  <h3>{name}</h3>
  <p class="oneliner">{oneliner}</p>
  <p class="meta">
    <span class="count">{builtCount}/{variantCount}</span>
    <span class="badge">{isBuilt ? 'playable' : 'planned'}</span>
  </p>
</a>

<style>
  .family-card {
    display: block;
    padding: 1rem 1.2rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--fg);
    text-decoration: none;
    background: var(--bg-card, transparent);
  }
  .family-card:hover { border-color: var(--accent, #6ed); }
  .family-card h3 { font-family: var(--font-mono); font-size: 1.1rem; margin: 0 0 0.3em; }
  .family-card .oneliner { font-family: var(--font-serif); font-size: 0.95rem; color: var(--fg-muted); margin: 0 0 0.5em; line-height: 1.4; }
  .family-card .meta { font-family: var(--font-mono); font-size: 0.75rem; color: var(--fg-muted); margin: 0; display: flex; gap: 0.6em; }
  .family-card .badge { padding: 0.05em 0.4em; border: 1px solid var(--border); border-radius: 3px; }
  .is-built .badge { color: var(--accent, #6ed); border-color: var(--accent, #6ed); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FamilyCard.astro
git commit -m "feat: FamilyCard component"
```

---

### Task 11: Create `src/pages/p/index.astro` (pure-primitive catalog home)

**Files:**
- Create: `src/pages/p/index.astro`

- [ ] **Step 1: Create the file**

```astro
---
import Base from '../../layouts/Base.astro';
import FamilyCard from '../../components/FamilyCard.astro';
import { getCollection } from 'astro:content';

const families = (await getCollection('primitiveFamilies')).sort((a, b) => a.data.name.localeCompare(b.data.name));
const variants = await getCollection('primitiveVariants');

function builtCount(familySlug: string) {
  return variants.filter(v => v.id.startsWith(`${familySlug}/variants/`) && v.data.status === 'built').length;
}

const totalBuilt = families.reduce((n, f) => n + builtCount(f.data.slug), 0);
const totalVariants = variants.length;
---
<Base title="Gaming Primitives">
  <section class="hero">
    <h1>Gaming Primitives</h1>
    <p class="lede">
      The irreducible mechanisms underneath thousands of games.
      Each family page presents a row of variants you can tinker with
      — slide a parameter, swap a topology, watch the feel change.
    </p>
    <p class="metadata">
      {totalBuilt} of {totalVariants} variants playable across {families.length} families.
    </p>
  </section>

  <ul class="families">
    {families.map(f => (
      <li>
        <FamilyCard
          slug={f.data.slug}
          name={f.data.name}
          oneliner={f.data.oneliner}
          variantCount={f.data.variants.length}
          builtCount={builtCount(f.data.slug)}
        />
      </li>
    ))}
  </ul>
</Base>

<style>
  .hero { max-width: 38rem; margin: 3rem auto 2rem; }
  .hero h1 { font-family: var(--font-mono); font-size: 2.4rem; margin-bottom: 0.4em; }
  .lede { font-family: var(--font-serif); font-size: 1.2rem; line-height: 1.5; }
  .families { list-style: none; padding: 0; max-width: 64rem; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1rem; }
  .families li { margin: 0; }
</style>
```

- [ ] **Step 2: Build and verify**

```bash
npm run build 2>&1 | tail -3
ls dist/p/                # expect: index.html (no family dirs yet — they need task 12)
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/p/index.astro
git commit -m "feat: pure-primitive catalog index at /p/"
```

---

### Task 12: Create `src/pages/p/[slug].astro` (family page *or* redirect)

**Files:**
- Create: `src/pages/p/[slug].astro`

- [ ] **Step 1: Create the file**

```astro
---
import Base from '../../layouts/Base.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const families = await getCollection('primitiveFamilies');
  const applied = await getCollection('applied');
  const variants = await getCollection('primitiveVariants');

  const familyPaths = families.map(f => ({
    params: { slug: f.data.slug },
    props: {
      kind: 'family' as const,
      family: f,
      variants: variants.filter(v => v.id.startsWith(`${f.data.slug}/variants/`)),
    },
  }));

  const familySlugs = new Set(families.map(f => f.data.slug));
  const redirectPaths = applied
    .filter(a => !familySlugs.has(a.id))   // collision-proof: never shadow a family
    .map(a => ({
      params: { slug: a.id },
      props: { kind: 'redirect' as const, target: `/a/${a.id}/` },
    }));

  return [...familyPaths, ...redirectPaths];
}

const base = import.meta.env.BASE_URL;
const props = Astro.props;
---
{props.kind === 'redirect' && (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta http-equiv="refresh" content={`0; url=${base}${props.target.replace(/^\//, '')}`} />
      <link rel="canonical" href={`${base}${props.target.replace(/^\//, '')}`} />
      <title>Moved — Gaming Primitives</title>
    </head>
    <body>
      <p>This page has moved. <a href={`${base}${props.target.replace(/^\//, '')}`}>Continue to the new location</a>.</p>
    </body>
  </html>
)}
{props.kind === 'family' && (
  <Base title={`${props.family.data.name} — Gaming Primitives`}>
    <section class="family-hero">
      <p class="crumb"><a href={`${base}p/`}>← all primitives</a></p>
      <h1>{props.family.data.name}</h1>
      <p class="oneliner">{props.family.data.oneliner}</p>
    </section>

    {props.variants.filter(v => v.data.status === 'built').length === 0 ? (
      <section class="stub-grid">
        <p class="planned-note">This family is planned. The variants below describe what will land here.</p>
        <ul>
          {props.variants.sort((a, b) => a.data.slug.localeCompare(b.data.slug)).map(v => (
            <li class="stub-card">
              <h3>{v.data.name}</h3>
              <p>{v.data.description}</p>
              <p class="badge">Planned</p>
            </li>
          ))}
        </ul>
      </section>
    ) : (
      <section class="built-demo">
        <p class="todo">[demo widget mounts here — Tasks 14–17]</p>
        <ul>
          {props.variants.map(v => (
            <li>
              <strong>{v.data.name}</strong> — <em>{v.data.status}</em>
            </li>
          ))}
        </ul>
      </section>
    )}
  </Base>
)}

<style>
  .family-hero { max-width: 48rem; margin: 2rem auto 1.5rem; }
  .family-hero .crumb { font-family: var(--font-mono); font-size: 0.85rem; }
  .family-hero .crumb a { color: var(--fg-muted); text-decoration: none; }
  .family-hero h1 { font-family: var(--font-mono); font-size: 2rem; margin: 0.2em 0; }
  .family-hero .oneliner { font-family: var(--font-serif); font-size: 1.1rem; color: var(--fg-muted); }
  .stub-grid { max-width: 64rem; margin: 0 auto; }
  .planned-note { font-family: var(--font-mono); color: var(--fg-muted); }
  .stub-grid ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; }
  .stub-card { border: 1px solid var(--border); border-radius: 6px; padding: 1rem; }
  .stub-card h3 { font-family: var(--font-mono); margin: 0 0 0.3em; font-size: 1rem; }
  .stub-card p { margin: 0; font-family: var(--font-serif); font-size: 0.95rem; line-height: 1.4; }
  .stub-card .badge { font-family: var(--font-mono); font-size: 0.7rem; color: var(--fg-muted); margin-top: 0.5em; }
  .built-demo { max-width: 56rem; margin: 0 auto; }
</style>
```

- [ ] **Step 2: Build and verify both routes work**

```bash
npm run build 2>&1 | tail -3
ls dist/p/                                # expect: index.html, 14 family dirs, 33 applied-redirect dirs (minus collisions)
ls dist/p/topology/ dist/p/asteroids-rotate-thrust/  # both have index.html
grep -oE 'meta http-equiv="refresh"[^>]*' dist/p/asteroids-rotate-thrust/index.html | head
```
Expected: applied-redirect page contains `meta http-equiv="refresh" content="0; url=/a/asteroids-rotate-thrust/"`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/p/[slug].astro
git commit -m "feat: /p/[slug] handles family pages + legacy applied redirects"
```

---

### Task 13: Smoke the new pure-primitive catalog end-to-end

- [ ] **Step 1: Build and click through**

```bash
npm run build 2>&1 | tail -3
npm run preview &
sleep 2

# Pure index
curl -s http://localhost:4321/p/ | grep -oE '<h1>[^<]+</h1>'
# Expect: <h1>Gaming Primitives</h1>

# A stub family page
curl -s http://localhost:4321/p/motion/ | grep -E "planned-note|<h1>"
# Expect: hero h1, planned-note paragraph, 7 stub-cards

# Old applied URL → redirect HTML
curl -s http://localhost:4321/p/qix-area-claim/ | grep -E "http-equiv"
# Expect: meta refresh tag

# Applied catalog index
curl -s http://localhost:4321/a/ | grep -oE '<h1>[^<]+</h1>'
# Expect: <h1>Applied Primitives</h1>

# Applied detail still works
curl -s http://localhost:4321/a/qix-area-claim/ | grep -oE '<title>[^<]+</title>'

kill %1 2>/dev/null
```

- [ ] **Step 2: Tag commit as a stable checkpoint**

```bash
git tag v2-phase-c-complete
```

(No additional commit — this verifies the prior commits cohere.)

---

## Phase D — Demo widget runtime (Tasks 14–17)

### Task 14: Create `public/d/runner.js` (shared runtime)

**Files:**
- Create: `public/d/runner.js`

- [ ] **Step 1: Write the runner**

```js
// public/d/runner.js
// Shared runtime for every pure-primitive variant demo.
// Reads spec from the parent <primitive-demo> element's data attributes,
// dynamic-imports the active variant module, runs its tick function,
// mounts knobs that update the variant live, and routes the active
// variant via URL hash.

const DEMOS = new WeakSet();   // guards against double-mount on Astro view transitions

export async function mountDemo(rootEl) {
  if (DEMOS.has(rootEl)) return;
  DEMOS.add(rootEl);

  const family = rootEl.dataset.family;
  const variantsAttr = rootEl.dataset.variants;   // JSON: [{slug, name, parameters, codePath}]
  const variants = JSON.parse(variantsAttr);
  const builtSlugs = new Set(variants.filter(v => v.parameters).map(v => v.slug));

  const canvas = rootEl.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const knobHost = rootEl.querySelector('.demo-knobs');
  const tabHost = rootEl.querySelector('.variant-tabs');
  const codeHost = rootEl.querySelector('.code-panel');

  let active = null;          // current variant module instance
  let rafId = null;
  let lastT = 0;
  let paused = false;
  let currentParams = {};

  function sizeCanvas(logical) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.height = `${rect.width * (logical.h / logical.w)}px`;
    ctx.setTransform(dpr * (rect.width / logical.w), 0, 0, dpr * (rect.width / logical.w), 0, 0);
  }

  function frame(t) {
    if (paused || !active) { rafId = requestAnimationFrame(frame); return; }
    const dt = Math.min(50, t - lastT) / 1000;
    lastT = t;
    active.tick(dt);
    rafId = requestAnimationFrame(frame);
  }

  function defaultsFor(spec) {
    const out = {};
    for (const p of spec) out[p.id] = p.default;
    return out;
  }

  function buildKnob(spec, onChange) {
    const wrap = document.createElement('div');
    wrap.className = `knob knob-${spec.type}`;
    const label = document.createElement('label');
    label.textContent = spec.label || spec.id;
    wrap.appendChild(label);

    let input, readout;
    if (spec.type === 'float' || spec.type === 'int') {
      input = document.createElement('input');
      input.type = 'range';
      input.min = spec.min;
      input.max = spec.max;
      input.step = spec.step ?? (spec.type === 'int' ? 1 : (spec.max - spec.min) / 200);
      input.value = spec.default;
      readout = document.createElement('span');
      readout.className = 'knob-readout';
      const fmt = () => readout.textContent = `${input.value}${spec.unit ? ' ' + spec.unit : ''}`;
      fmt();
      input.addEventListener('input', () => { fmt(); onChange(spec.id, spec.type === 'int' ? parseInt(input.value, 10) : parseFloat(input.value)); });
    } else if (spec.type === 'toggle') {
      input = document.createElement('button');
      input.type = 'button';
      input.className = 'knob-toggle';
      let on = !!spec.default;
      const sync = () => { input.dataset.on = String(on); input.textContent = on ? spec.on_label : spec.off_label; };
      sync();
      input.addEventListener('click', () => { on = !on; sync(); onChange(spec.id, on); });
    } else if (spec.type === 'enum') {
      input = document.createElement('div');
      input.className = 'knob-enum';
      for (const opt of spec.options) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt;
        btn.dataset.on = String(opt === spec.default);
        btn.addEventListener('click', () => {
          input.querySelectorAll('button').forEach(b => b.dataset.on = String(b === btn));
          onChange(spec.id, opt);
        });
        input.appendChild(btn);
      }
    }
    wrap.appendChild(input);
    if (readout) wrap.appendChild(readout);
    return wrap;
  }

  async function activate(slug) {
    if (!builtSlugs.has(slug)) return;
    const variant = variants.find(v => v.slug === slug);

    // Tear down previous
    if (rafId) cancelAnimationFrame(rafId);
    active = null;

    // Visual: active tab class
    tabHost.querySelectorAll('[data-slug]').forEach(b => b.dataset.active = String(b.dataset.slug === slug));

    // Reset knobs from the new variant's defaults
    knobHost.innerHTML = '';
    currentParams = defaultsFor(variant.parameters);

    // Dynamic-import the module
    const mod = await import(`/d/${family}/${slug}.js`);

    // Knob mount with live-apply
    for (const p of variant.parameters) {
      const node = buildKnob(p, (id, val) => {
        currentParams[id] = val;
        mod.applyParams?.(active.state, currentParams);
      });
      knobHost.appendChild(node);
    }

    // Initialize and start loop
    sizeCanvas(mod.LOGICAL);
    const env = {
      canvas, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      requestPause() { paused = true; }, requestResume() { paused = false; },
    };
    active = mod.init(ctx, currentParams, env);
    lastT = performance.now();
    paused = false;
    rafId = requestAnimationFrame(frame);

    // Update code panel
    codeHost.dataset.activeSlug = slug;
    codeHost.querySelectorAll('pre').forEach(pre => {
      pre.hidden = pre.dataset.slug !== slug;
    });

    // URL hash
    if (location.hash !== `#${slug}`) history.replaceState(null, '', `#${slug}`);
  }

  // Tab clicks
  tabHost.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-slug]');
    if (btn) activate(btn.dataset.slug);
  });

  // Hash change (deep links from applied decomposition chips)
  addEventListener('hashchange', () => {
    const slug = location.hash.slice(1);
    if (slug && builtSlugs.has(slug)) activate(slug);
  });

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    lastT = performance.now();
  });

  // Resize: re-size canvas without reseeding state
  window.addEventListener('resize', () => {
    if (active) sizeCanvas(active.LOGICAL ?? { w: 800, h: 450 });
  });

  // Initial: URL hash → first built → nothing
  const initial = builtSlugs.has(location.hash.slice(1))
    ? location.hash.slice(1)
    : variants.find(v => builtSlugs.has(v.slug))?.slug;
  if (initial) activate(initial);
}

// Auto-mount any <primitive-demo data-family="..."> on the page.
document.querySelectorAll('[data-primitive-demo]').forEach(mountDemo);
```

- [ ] **Step 2: Smoke-load the script (syntax check)**

```bash
node --check public/d/runner.js && echo "runner.js syntax OK"
```
Expected: `runner.js syntax OK`.

- [ ] **Step 3: Commit**

```bash
git add public/d/runner.js
git commit -m "feat: pure-primitive demo runtime (runner.js)"
```

---

### Task 15: Create `src/components/PrimitiveKnob.astro`

**Note:** The runtime in Task 14 builds knobs dynamically from JS. This component is the *server-rendered placeholder* for the knob row inside the demo card; the runtime replaces children when a variant activates. Keeping the component thin means consistent markup across SSR and client mount.

**Files:**
- Create: `src/components/PrimitiveKnob.astro`

- [ ] **Step 1: Create the file**

```astro
---
// Placeholder host. Runtime injects actual knob nodes.
---
<div class="demo-knobs" role="group" aria-label="Demo parameters"></div>

<style>
  .demo-knobs { display: grid; gap: 0.6rem; padding: 0.8rem 0; }
  :global(.demo-knobs .knob) { display: grid; grid-template-columns: 8rem 1fr 4rem; gap: 0.6rem; align-items: center; font-family: var(--font-mono); font-size: 0.85rem; }
  :global(.demo-knobs .knob label) { color: var(--fg-muted); }
  :global(.demo-knobs input[type=range]) { width: 100%; min-height: 44px; }
  :global(.demo-knobs .knob-readout) { color: var(--fg); text-align: right; }
  :global(.demo-knobs .knob-toggle) { padding: 0.4em 0.8em; background: rgba(255,255,255,0.08); border: 1px solid var(--border); border-radius: 4px; color: var(--fg); cursor: pointer; }
  :global(.demo-knobs .knob-toggle[data-on=true]) { background: var(--accent, #6ed); color: #000; }
  :global(.demo-knobs .knob-enum) { display: inline-flex; gap: 2px; border: 1px solid var(--border); border-radius: 4px; padding: 2px; }
  :global(.demo-knobs .knob-enum button) { padding: 0.3em 0.7em; background: transparent; border: 0; color: var(--fg-muted); font-family: inherit; cursor: pointer; }
  :global(.demo-knobs .knob-enum button[data-on=true]) { background: var(--accent, #6ed); color: #000; }
  @media (max-width: 640px) {
    :global(.demo-knobs .knob) { grid-template-columns: 1fr; }
    :global(.demo-knobs .knob-readout) { text-align: left; }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PrimitiveKnob.astro
git commit -m "feat: PrimitiveKnob host component"
```

---

### Task 16: Create `src/components/PrimitiveDemo.astro`

**Files:**
- Create: `src/components/PrimitiveDemo.astro`

- [ ] **Step 1: Create the file**

```astro
---
import { Code } from 'astro:components';
import PrimitiveKnob from './PrimitiveKnob.astro';

interface VariantMeta {
  slug: string;
  name: string;
  description: string;
  status: 'built' | 'stubbed';
  parameters?: any[];
  in_the_wild?: { applied: string; note: string }[];
}
interface Props {
  family: string;
  variants: VariantMeta[];
}
const { family, variants } = Astro.props;

// Build-time: load the variant source code for the code panel.
const sources = import.meta.glob('/public/d/**/*.js', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
function srcFor(slug: string): string | undefined {
  return sources[`/public/d/${family}/${slug}.js`];
}

// Trim variants payload sent to the client — only what runner.js needs.
const wireVariants = variants.map(v => ({
  slug: v.slug,
  name: v.name,
  parameters: v.parameters ?? null,
}));

const base = import.meta.env.BASE_URL;
---
<section
  class="primitive-demo"
  data-primitive-demo
  data-family={family}
  data-variants={JSON.stringify(wireVariants)}
>
  <nav class="variant-tabs" role="tablist" aria-label="Variants">
    {variants.map(v => (
      <button
        type="button"
        role="tab"
        data-slug={v.slug}
        data-built={String(v.status === 'built')}
        aria-selected="false"
      >
        {v.name}
      </button>
    ))}
  </nav>

  <div class="demo-canvas">
    <canvas aria-label={`${family} variant demo`}></canvas>
  </div>

  <PrimitiveKnob />

  <section class="in-the-wild" aria-label="In the wild">
    {variants.filter(v => v.status === 'built' && v.in_the_wild?.length).map(v => (
      <details data-slug={v.slug}>
        <summary>In the wild — {v.name}</summary>
        <ul>
          {v.in_the_wild!.map(use => (
            <li><a href={`${base}a/${use.applied}/`}>{use.applied}</a> — {use.note}</li>
          ))}
        </ul>
      </details>
    ))}
  </section>

  <section class="code-panel" aria-label="Variant source code">
    {variants.filter(v => v.status === 'built').map(v => {
      const code = srcFor(v.slug);
      if (!code) return null;
      return (
        <pre data-slug={v.slug} hidden>
          <Code code={code} lang="js" theme="github-dark" />
        </pre>
      );
    })}
  </section>
</section>

<script src={`${base}d/runner.js`} type="module"></script>

<style>
  .primitive-demo { display: grid; gap: 1rem; }
  .variant-tabs { display: flex; gap: 0.4rem; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 0.4rem; }
  .variant-tabs button { flex: 0 0 auto; padding: 0.5em 1em; background: transparent; border: 1px solid var(--border); border-radius: 4px; color: var(--fg-muted); font-family: var(--font-mono); cursor: pointer; scroll-snap-align: start; min-height: 44px; }
  .variant-tabs button[aria-selected=true],
  .variant-tabs button[data-active=true] { color: var(--fg); border-color: var(--accent, #6ed); background: rgba(110,221,237,0.08); }
  .variant-tabs button[data-built=false] { opacity: 0.5; cursor: not-allowed; }
  .demo-canvas { aspect-ratio: 16/9; background: #0d1117; border-radius: 6px; overflow: hidden; }
  .demo-canvas canvas { display: block; width: 100%; touch-action: none; }
  .in-the-wild summary { font-family: var(--font-mono); font-size: 0.9rem; cursor: pointer; }
  .in-the-wild ul { font-family: var(--font-serif); margin: 0.4em 0 0; padding-left: 1.2rem; }
  .code-panel pre { margin: 0; max-height: 24rem; overflow: auto; border: 1px solid var(--border); border-radius: 6px; }
  @media (max-width: 640px) {
    .demo-canvas { max-height: 50vh; }
  }
</style>
```

- [ ] **Step 2: Build (no demos yet, but the SSR shell should compile)**

```bash
npm run build 2>&1 | tail -5
```
Expected: build succeeds. Astro may warn about empty variants — fine.

- [ ] **Step 3: Commit**

```bash
git add src/components/PrimitiveDemo.astro
git commit -m "feat: PrimitiveDemo Astro component (SSR shell + runner mount)"
```

---

### Task 17: Wire `PrimitiveDemo` into `[slug].astro` for built families

**Files:**
- Modify: `src/pages/p/[slug].astro`

- [ ] **Step 1: Replace the placeholder `built-demo` section**

Find:
```astro
      <section class="built-demo">
        <p class="todo">[demo widget mounts here — Tasks 14–17]</p>
        <ul>
          {props.variants.map(v => (
            <li>
              <strong>{v.data.name}</strong> — <em>{v.data.status}</em>
            </li>
          ))}
        </ul>
      </section>
```

Replace with:
```astro
      <PrimitiveDemo
        family={props.family.data.slug}
        variants={props.variants
          .sort((a, b) => props.family.data.variants.indexOf(a.data.slug) - props.family.data.variants.indexOf(b.data.slug))
          .map(v => ({
            slug: v.data.slug,
            name: v.data.name,
            description: v.data.description,
            status: v.data.status,
            parameters: v.data.parameters,
            in_the_wild: v.data.in_the_wild,
          }))
        }
      />
```

And add the import at the top:
```astro
import PrimitiveDemo from '../../components/PrimitiveDemo.astro';
```

- [ ] **Step 2: Build (still nothing built — but SSR path should branch correctly)**

```bash
npm run build 2>&1 | tail -3
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/p/[slug].astro
git commit -m "feat: mount PrimitiveDemo on built family pages"
```

---

## Phase E — Topology family build (Tasks 18–22)

### Task 18: Author the Topology family content (full, built status)

**Files:**
- Modify: `src/content/primitives/topology/variants/bounded.md`
- Modify: `src/content/primitives/topology/variants/torus-wrap.md`
- Modify: `src/content/primitives/topology/variants/bounce.md`

- [ ] **Step 1: Replace `bounded.md` with the full schema**

```markdown
---
slug: bounded
name: Bounded
status: built
description: Position clamped at the edges. Velocity is zeroed on contact — the wall stops you dead. The maze rule.
parameters:
  - { type: int,   id: agents,    min: 1,   max: 32,  default: 12,  label: agents }
  - { type: float, id: speed,     min: 30,  max: 300, default: 120, unit: u/s, label: speed }
  - { type: float, id: jitter,    min: 0,   max: 1,   default: 0.2, label: heading-jitter }
in_the_wild:
  - { applied: qix-area-claim,            note: "Marker walks the 1-cell-thick boundary; void clamps motion." }
  - { applied: boulder-dash-falling-rocks, note: "Cave walls clamp the rover." }
code_anchor: public/d/topology/bounded.js
---
```

- [ ] **Step 2: Replace `torus-wrap.md`**

```markdown
---
slug: torus-wrap
name: Torus-Wrap
status: built
description: Position wraps modulo the playfield edge. Left edge ↔ right edge, top ↔ bottom. The Asteroids playfield.
parameters:
  - { type: int,   id: agents,    min: 1,   max: 32,  default: 12,  label: agents }
  - { type: float, id: speed,     min: 30,  max: 300, default: 120, unit: u/s, label: speed }
  - { type: float, id: jitter,    min: 0,   max: 1,   default: 0.2, label: heading-jitter }
in_the_wild:
  - { applied: asteroids-rotate-thrust, note: "Logg 1979 — entire playfield wraps; collisions use toroidal distance." }
code_anchor: public/d/topology/torus-wrap.js
---
```

- [ ] **Step 3: Replace `bounce.md`**

```markdown
---
slug: bounce
name: Bounce
status: built
description: Position clamped at the edge; the velocity component normal to that edge is reflected. The Pong wall.
parameters:
  - { type: int,   id: agents,    min: 1,   max: 32,  default: 12,  label: agents }
  - { type: float, id: speed,     min: 30,  max: 300, default: 120, unit: u/s, label: speed }
  - { type: float, id: jitter,    min: 0,   max: 1,   default: 0.2, label: heading-jitter }
in_the_wild:
  - { applied: qix-area-claim, note: "The Qix segment bounces off non-VOID cells; per-bounce angle perturbation prevents periodic orbits." }
code_anchor: public/d/topology/bounce.js
---
```

- [ ] **Step 4: Build (will fail at code-load — modules don't exist yet)**

```bash
npm run build 2>&1 | tail -10
```
Expected: build *succeeds* — `?raw` glob just returns `undefined` for missing files; the page renders code-panel as empty. We add modules next.

- [ ] **Step 5: Commit**

```bash
git add src/content/primitives/topology/variants
git commit -m "feat(content): Topology family — bounded, torus-wrap, bounce (built)"
```

---

### Task 19: Create `public/d/topology/bounded.js`

**Files:**
- Create: `public/d/topology/bounded.js`

- [ ] **Step 1: Write the module**

```js
// Topology: bounded — position clamped, velocity zeroed on contact.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h, R = 6;

function seed(state, n, speed, jitter) {
  state.agents = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.agents.push({
      x: 20 + Math.random() * (W - 40),
      y: 20 + Math.random() * (H - 40),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      hue: (i * 47) % 360,
    });
  }
  state.jitter = jitter;
  state.speed = speed;
}

export function init(ctx, params, env) {
  const state = { agents: [], jitter: 0, speed: 0 };
  seed(state, params.agents, params.speed, params.jitter);

  function tick(dt) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    for (const a of state.agents) {
      // tiny heading jitter
      if (state.jitter > 0) {
        const ang = Math.atan2(a.vy, a.vx) + (Math.random() - 0.5) * state.jitter * dt;
        const s = Math.hypot(a.vx, a.vy);
        a.vx = Math.cos(ang) * s;
        a.vy = Math.sin(ang) * s;
      }
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // BOUNDED: clamp + zero velocity if we hit
      if (a.x < R)         { a.x = R;     a.vx = 0; a.vy = 0; }
      else if (a.x > W - R) { a.x = W - R; a.vx = 0; a.vy = 0; }
      if (a.y < R)         { a.y = R;     a.vx = 0; a.vy = 0; }
      else if (a.y > H - R) { a.y = H - R; a.vx = 0; a.vy = 0; }

      ctx.fillStyle = `hsl(${a.hue} 70% 60%)`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, R, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Re-seed on agent count change (different population); retune live for others
  if (state.agents.length !== params.agents) seed(state, params.agents, params.speed, params.jitter);
  state.jitter = params.jitter;
  // rescale speeds proportionally without re-seeding directions
  if (params.speed !== state.speed && state.speed > 0) {
    const k = params.speed / state.speed;
    for (const a of state.agents) { a.vx *= k; a.vy *= k; }
  }
  state.speed = params.speed;
}
```

- [ ] **Step 2: Syntax check**

```bash
node --check public/d/topology/bounded.js && echo "bounded.js OK"
```

- [ ] **Step 3: Commit**

```bash
git add public/d/topology/bounded.js
git commit -m "feat: topology/bounded variant module"
```

---

### Task 20: Create `public/d/topology/torus-wrap.js`

**Files:**
- Create: `public/d/topology/torus-wrap.js`

- [ ] **Step 1: Write the module**

```js
// Topology: torus-wrap — position wraps modulo edge.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h, R = 6;

function mod(v, m) { return ((v % m) + m) % m; }

function seed(state, n, speed, jitter) {
  state.agents = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.agents.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      hue: (i * 47) % 360,
    });
  }
  state.jitter = jitter;
  state.speed = speed;
}

export function init(ctx, params, env) {
  const state = { agents: [], jitter: 0, speed: 0 };
  seed(state, params.agents, params.speed, params.jitter);

  function tick(dt) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    for (const a of state.agents) {
      if (state.jitter > 0) {
        const ang = Math.atan2(a.vy, a.vx) + (Math.random() - 0.5) * state.jitter * dt;
        const s = Math.hypot(a.vx, a.vy);
        a.vx = Math.cos(ang) * s;
        a.vy = Math.sin(ang) * s;
      }
      a.x = mod(a.x + a.vx * dt, W);
      a.y = mod(a.y + a.vy * dt, H);

      // Draw twice if near the wrap seam — avoids visual pop
      const dx = a.x < R ? W : (a.x > W - R ? -W : 0);
      const dy = a.y < R ? H : (a.y > H - R ? -H : 0);
      for (const ox of (dx ? [0, dx] : [0])) for (const oy of (dy ? [0, dy] : [0])) {
        ctx.fillStyle = `hsl(${a.hue} 70% 60%)`;
        ctx.beginPath();
        ctx.arc(a.x + ox, a.y + oy, R, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (state.agents.length !== params.agents) seed(state, params.agents, params.speed, params.jitter);
  state.jitter = params.jitter;
  if (params.speed !== state.speed && state.speed > 0) {
    const k = params.speed / state.speed;
    for (const a of state.agents) { a.vx *= k; a.vy *= k; }
  }
  state.speed = params.speed;
}
```

- [ ] **Step 2: Syntax check + commit**

```bash
node --check public/d/topology/torus-wrap.js && echo "torus-wrap.js OK"
git add public/d/topology/torus-wrap.js
git commit -m "feat: topology/torus-wrap variant module"
```

---

### Task 21: Create `public/d/topology/bounce.js`

**Files:**
- Create: `public/d/topology/bounce.js`

- [ ] **Step 1: Write the module**

```js
// Topology: bounce — position clamped + velocity reflected on contact.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h, R = 6;

function seed(state, n, speed, jitter) {
  state.agents = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.agents.push({
      x: 20 + Math.random() * (W - 40),
      y: 20 + Math.random() * (H - 40),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      hue: (i * 47) % 360,
    });
  }
  state.jitter = jitter;
  state.speed = speed;
}

export function init(ctx, params, env) {
  const state = { agents: [], jitter: 0, speed: 0 };
  seed(state, params.agents, params.speed, params.jitter);

  function tick(dt) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    for (const a of state.agents) {
      if (state.jitter > 0) {
        const ang = Math.atan2(a.vy, a.vx) + (Math.random() - 0.5) * state.jitter * dt;
        const s = Math.hypot(a.vx, a.vy);
        a.vx = Math.cos(ang) * s;
        a.vy = Math.sin(ang) * s;
      }
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < R)         { a.x = R;     a.vx = -a.vx; }
      else if (a.x > W - R) { a.x = W - R; a.vx = -a.vx; }
      if (a.y < R)         { a.y = R;     a.vy = -a.vy; }
      else if (a.y > H - R) { a.y = H - R; a.vy = -a.vy; }

      ctx.fillStyle = `hsl(${a.hue} 70% 60%)`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, R, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (state.agents.length !== params.agents) seed(state, params.agents, params.speed, params.jitter);
  state.jitter = params.jitter;
  if (params.speed !== state.speed && state.speed > 0) {
    const k = params.speed / state.speed;
    for (const a of state.agents) { a.vx *= k; a.vy *= k; }
  }
  state.speed = params.speed;
}
```

- [ ] **Step 2: Syntax check + commit**

```bash
node --check public/d/topology/bounce.js && echo "bounce.js OK"
git add public/d/topology/bounce.js
git commit -m "feat: topology/bounce variant module"
```

---

### Task 22: End-to-end smoke: Topology family page works

- [ ] **Step 1: Full build**

```bash
npm run build 2>&1 | tail -5
```
Expected: succeeds.

- [ ] **Step 2: Preview + curl key markers**

```bash
npm run preview &
sleep 2

# Topology page loads
curl -s http://localhost:4321/p/topology/ -o /tmp/topology.html
grep -oE 'data-family="topology"' /tmp/topology.html | head
# Expect: data-family="topology"

grep -oE 'data-built="true"' /tmp/topology.html | wc -l
# Expect: 3 (bounded, torus-wrap, bounce)

# Variant source served verbatim from the static path
curl -s http://localhost:4321/d/topology/bounded.js | head -3
# Expect: the first three lines of bounded.js

# Code panel has 3 <pre> blocks
grep -oE '<pre data-slug="[^"]+"' /tmp/topology.html
# Expect: 3 <pre data-slug="bounded", "torus-wrap", "bounce"

kill %1 2>/dev/null
```

- [ ] **Step 3: Tag the checkpoint**

```bash
git tag v2-topology-rendered
```

---

## Phase F — Cross-link integrity (Tasks 23–24)

### Task 23: Build-time cross-link check (script + vitest)

**Files:**
- Create: `scripts/check-cross-links.mjs`
- Create: `tests/cross-links.test.ts`

- [ ] **Step 1: Write the failing test first**

`tests/cross-links.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

async function loadAllStubs(dir: string, filename: string): Promise<{ id: string; data: any }[]> {
  const out: { id: string; data: any }[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      const raw = await readFile(join(dir, entry.name, filename), 'utf-8');
      out.push({ id: entry.name, data: matter(raw).data });
    } catch {}
  }
  return out;
}

async function loadVariants(rootDir: string): Promise<{ family: string; slug: string; data: any }[]> {
  const out: { family: string; slug: string; data: any }[] = [];
  for (const fam of await readdir(rootDir, { withFileTypes: true })) {
    if (!fam.isDirectory()) continue;
    const variantsDir = join(rootDir, fam.name, 'variants');
    try {
      for (const file of await readdir(variantsDir)) {
        if (!file.endsWith('.md')) continue;
        const raw = await readFile(join(variantsDir, file), 'utf-8');
        out.push({ family: fam.name, slug: file.replace(/\.md$/, ''), data: matter(raw).data });
      }
    } catch {}
  }
  return out;
}

describe('cross-link integrity', () => {
  it('every applied.decomposition entry resolves to an existing family + variant', async () => {
    const applied = await loadAllStubs('src/content/applied', 'stub.md');
    const variants = await loadVariants('src/content/primitives');
    const variantSet = new Set(variants.map(v => `${v.family}/${v.slug}`));

    for (const a of applied) {
      for (const dec of (a.data.decomposition ?? [])) {
        expect(variantSet.has(`${dec.family}/${dec.variant}`), `${a.id} → ${dec.family}/${dec.variant} not found`).toBe(true);
      }
    }
  });

  it('every variant.in_the_wild entry resolves to an existing applied id', async () => {
    const applied = await loadAllStubs('src/content/applied', 'stub.md');
    const variants = await loadVariants('src/content/primitives');
    const appliedSet = new Set(applied.map(a => a.id));

    for (const v of variants) {
      for (const use of (v.data.in_the_wild ?? [])) {
        expect(appliedSet.has(use.applied), `${v.family}/${v.slug}.in_the_wild → ${use.applied} not found`).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Add gray-matter as devDep if missing**

```bash
grep '"gray-matter"' package.json || npm install --save-dev gray-matter
```

- [ ] **Step 3: Run the test (should pass — Topology in_the_wild references exist)**

```bash
npm test 2>&1 | tail -15
```
Expected: both new tests pass. Topology's in_the_wild references `asteroids-rotate-thrust`, `qix-area-claim`, `boulder-dash-falling-rocks` — all in applied/.

- [ ] **Step 4: Write the standalone CLI script for CI hooks**

`scripts/check-cross-links.mjs`:

```js
#!/usr/bin/env node
// Standalone CLI mirror of tests/cross-links.test.ts.
// Exits 0 on pass, 1 on any dangling reference.

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

async function loadAllStubs(dir, filename) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      const raw = await readFile(join(dir, entry.name, filename), 'utf-8');
      out.push({ id: entry.name, data: matter(raw).data });
    } catch {}
  }
  return out;
}

async function loadVariants(rootDir) {
  const out = [];
  for (const fam of await readdir(rootDir, { withFileTypes: true })) {
    if (!fam.isDirectory()) continue;
    const variantsDir = join(rootDir, fam.name, 'variants');
    try {
      for (const file of await readdir(variantsDir)) {
        if (!file.endsWith('.md')) continue;
        const raw = await readFile(join(variantsDir, file), 'utf-8');
        out.push({ family: fam.name, slug: file.replace(/\.md$/, ''), data: matter(raw).data });
      }
    } catch {}
  }
  return out;
}

const errors = [];
const applied = await loadAllStubs('src/content/applied', 'stub.md');
const variants = await loadVariants('src/content/primitives');
const appliedSet = new Set(applied.map(a => a.id));
const variantSet = new Set(variants.map(v => `${v.family}/${v.slug}`));

for (const a of applied) {
  for (const dec of (a.data.decomposition ?? [])) {
    if (!variantSet.has(`${dec.family}/${dec.variant}`)) {
      errors.push(`applied/${a.id} → ${dec.family}/${dec.variant} (decomposition)`);
    }
  }
}
for (const v of variants) {
  for (const use of (v.data.in_the_wild ?? [])) {
    if (!appliedSet.has(use.applied)) {
      errors.push(`primitives/${v.family}/${v.slug} → ${use.applied} (in_the_wild)`);
    }
  }
}

if (errors.length) {
  console.error('cross-link check FAILED:');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log(`cross-link check OK (${applied.length} applied, ${variants.length} variants)`);
```

- [ ] **Step 5: Wire script into npm scripts**

In `package.json` `"scripts"`, add:
```json
"check:links": "node scripts/check-cross-links.mjs"
```

- [ ] **Step 6: Run it**

```bash
npm run check:links
```
Expected: `cross-link check OK (33 applied, 70 variants)` (numbers may vary).

- [ ] **Step 7: Commit**

```bash
git add scripts/check-cross-links.mjs tests/cross-links.test.ts package.json package-lock.json
git commit -m "feat: cross-link integrity check (vitest + CLI script)"
```

---

### Task 24: Update top nav and home page for v2 framing

**Files:**
- Modify: `src/layouts/Base.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Update Base.astro top nav**

Find the `<nav class="topnav">` block. Replace its children with:

```astro
    <nav class="topnav">
      <a href={`${base}p/`}>primitives</a>
      <a href={`${base}a/`}>applied</a>
      <a href={`${base}era/`}>era</a>
      <a href={`${base}about/`}>about</a>
      <InstallButton />
    </nav>
```

- [ ] **Step 2: Update the home page hero to lead with pure primitives**

In `src/pages/index.astro`, replace the body of `<section class="hero">` with:

```astro
  <section class="hero">
    <h1>Gaming Primitives</h1>
    <p class="lede">
      A tinkerable catalog of the irreducible mechanisms underneath thousands of games.
      Slide a parameter, swap a topology, watch the feel change.
    </p>
    <p class="metadata">
      <a href={`${base}p/`}>Browse primitives</a> · <a href={`${base}a/`}>Browse applied</a> · <a href={`${base}era/`}>scroll the timeline</a>
    </p>
  </section>
```

Drop the old `primitives/builtCount/totalCount` logic from this file — that data now lives at `/p/` and `/a/`.

- [ ] **Step 3: Build + smoke**

```bash
npm run build 2>&1 | tail -3
npm run preview &
sleep 2
curl -s http://localhost:4321/ | grep -oE 'Browse primitives|Browse applied'
kill %1 2>/dev/null
```
Expected: both link labels present.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Base.astro src/pages/index.astro
git commit -m "feat: v2 nav — primitives | applied | era | about"
```

---

## Phase G — Ship (Task 25)

### Task 25: Mobile audit, push, merge to main

- [ ] **Step 1: Final full build + tests**

```bash
npm run build 2>&1 | tail -5
npm test 2>&1 | tail -5
npm run check:links
```
Expected: all green.

- [ ] **Step 2: Push the feature branch**

```bash
git push origin feat/v1-implementation 2>&1 | tail -3
```

- [ ] **Step 3: Open PR for human review**

```bash
gh pr create \
  --base main \
  --head feat/v1-implementation \
  --title "v2: pure-primitive catalog headline + Topology MVP family" \
  --body "$(cat <<'EOF'
## Summary
- Pivots `/p/` to be the pure-primitive catalog. Applied work relocates to `/a/`.
- Adds 14 family stubs, builds the **Topology** family fully (bounded, torus-wrap, bounce).
- Demo widget: variant tabs + parameter knobs + code panel + "in the wild" sidebar.
- Bidirectional cross-link integrity check.
- Legacy `/p/<applied-id>/` URLs return meta-refresh redirects to the new `/a/` paths.

## Test plan
- [ ] `/p/` lists 14 families; Topology shows 3/3 playable.
- [ ] `/p/topology/` runs the demo on a real iPhone — portrait + landscape.
- [ ] Tab switching between bounded → torus-wrap → bounce preserves agents/speed.
- [ ] Knob slides retune live (jitter, agents, speed).
- [ ] Old URL `/p/asteroids-rotate-thrust/` redirects to `/a/asteroids-rotate-thrust/`.
- [ ] `/a/` index lists 33 applied; six built ones still iframe their mini-games.
- [ ] `npm test` + `npm run check:links` both green.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: After Gerald merges, redeploy verification**

```bash
gh run list --branch main --limit 1 --json status,conclusion,workflowName
# Wait until conclusion: success
```

- [ ] **Step 5: Real-iPhone audit**

Open the deployed site on iPhone (PWA install of `gaming-primitives` hub if available, else Safari):
1. Navigate `/` → `/p/` → `/p/topology/`.
2. Confirm Topology demo runs at ≥30 fps, agents visible, no overflow.
3. Slide each knob; verify visible parameter changes.
4. Tap each variant tab; confirm switch + state seeded.
5. Confirm Code panel scroll works on mobile.
6. Confirm "In the wild" chips link to `/a/<id>/` correctly.
7. Navigate `/a/qix-area-claim/` — minigame iframe still loads.
8. Try old `/p/qix-area-claim/` from a Safari address bar — confirm redirect.

- [ ] **Step 6: Telegram Gerald the result**

```bash
source ~/.config/kainode/telegram.env && curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
  -d chat_id="496805857" \
  --data-urlencode "text=v2 Plan 1 shipped. /p/ is now the pure-primitive catalog; /p/topology/ has 3 working variants. /a/ holds the 33 applied entries with redirects from old URLs. Next plan: Motion family."
```

---

## Self-Review

**Spec coverage** (every requirement in `2026-05-12-pure-primitives-design.md` → task that implements it):

| Spec requirement | Task |
|---|---|
| Rename `primitives/` → `applied/` | 1–2 |
| Move `/p/[id]` → `/a/[id]` | 3 |
| `/a/` index | 5 |
| Rewrite internal links | 4 |
| New `primitives/` collection + schemas | 7 |
| 14 family stubs | 8–9 |
| `/p/` index with family list | 11 |
| `/p/[family]` page (stubbed grid + built demo branches) | 12, 17 |
| Meta-refresh redirects for old `/p/<applied-id>/` | 12 |
| Demo runtime (canvas, rAF, knobs, hash routing, visibility) | 14 |
| Knob spec (float/int/toggle/enum) | 14–15 |
| Astro `PrimitiveDemo` component (SSR shell + variant tabs + code panel via `?raw`) | 16 |
| Topology family content (3 variants, full schema) | 18 |
| 3 variant modules | 19–21 |
| Cross-link integrity (build-time check) | 23 |
| Top-nav `Primitives | Applied | Era | About` | 24 |
| Mobile audit | 25 |
| DoD: built badges, redirects, no regressions | 13, 22, 25 |

**Out of plan-scope (deferred to Plan 2 / 3 / 4):** Motion family build, Bullets family build, agent prompt automation, decomposition backfill for the 5 unbuilt-but-built (defender, lunar, boulder) applied stubs. The Topology in_the_wild references reach into the *built* applied set only — no dangling references at v2 ship.

**Placeholder scan:** no TBD/TODO/"add appropriate handling" — every step shows the exact code or command.

**Type consistency:** `primitiveFamilies` and `primitiveVariants` collection names match between Task 7 (definition), Task 11 (consumption), Task 12 (consumption), Task 23 (check). Field names (`slug`, `name`, `status`, `parameters`, `in_the_wild`, `description`, `variants`) match across schemas and consumers.

**One known fragility:** the `import.meta.glob` pattern `'/public/d/**/*.js'` in `PrimitiveDemo.astro` matches all variant sources — so the bundle gets every family's code at every family page. This is fine at the current scale (~3 variant files = ~6 KB raw), but **note for Plan 2**: once Motion + Bullets land, swap to `import.meta.glob` scoped per `family` slug, or pre-stringify per-page during component setup.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-12-v2-plan-1-migration-topology.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for plans this size (25 tasks) where each task is self-contained and the review cadence catches regressions early.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints. Faster for short runs; loses the per-task context-reset advantage.

**Which approach?**
