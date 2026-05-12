---
project: gaming-primitives
spec: v2
created: 2026-05-12
status: approved-by-user-pending
supersedes: 2026-05-11-gaming-primitives-v1-design.md (extends, does not replace)
---

# Gaming Primitives v2 — Pure-Primitive Catalog

## Goal

Reframe the headline of *gaming-primitives* from a catalog of applied primitives (Asteroids, Qix, Lunar Lander as minimal-but-recognisable PWAs) to a catalog of **pure primitives** — interactive family-of-variants pages in the style of [Game Mechanic Explorer](https://gamemechanicexplorer.com/) — with the existing applied work relocated to a secondary tab. v2 ships three pure-primitive family pages end-to-end and seeds the rest of a 14-family taxonomy as browsable stubs.

## Locked decisions

| Decision | Choice |
|---|---|
| Role of pure primitives | **Primary** — headline catalog at `/p/`. Applied primitives become "and here it is in a real game" at `/a/`. |
| Granularity of a pure primitive | **Family of variants** — one URL = one family page = 3–10 toggleable variants on the same page (e.g. `/p/bullets/` covers fixed → aimed → spread → lifetime → velocity-inheritance). |
| Voice | **Neutral engineering** in the body, with a small *In the wild* sidebar per variant linking to applied uses ("→ Off in Asteroids (Logg, 1979); on in Defender (Jarvis, 1981)"). Cultural memory survives without dominating engineering reference. |
| MVP scope | **3 built families + 11 stubs**. Catalog feels real from day one; built families validate the architecture. |
| Taxonomy | **14 families**: GME-derived engine spine (Motion, Bullets, Topology, Aiming, Collision, Camera, Pathfinding, Procedural) + modern-mechanic axes (Rules-as-Objects, Time-as-Resource, Composition, State Machines, Information Asymmetry, Nested Spaces). |
| URL space | **`/p/` = pure (headline), `/a/` = applied (relocated)**. Old `/p/<applied-id>/` paths return meta-refresh redirects to `/a/<applied-id>/`. |
| MVP build order | **Topology → Motion → Bullets** (smallest family first to validate the architecture). |
| Cross-linking | **Bidirectional, hand-authored** in content frontmatter. Build-time check fails on dangling references. |

## Taxonomy (14 families)

| # | Family | Variants (3–10) | MVP |
|---|---|---|---|
| 1 | **Motion** | linear · 8-dir · rotate-thrust · drag/friction · jump-arc · follow-cursor · click-to-move | ✅ #2 |
| 2 | **Bullets** | fixed-dir · aimed · spread-N · lifetime · velocity-inheritance · gravity · homing · hitscan | ✅ #3 |
| 3 | **Topology** | bounded · torus-wrap · bounce · infinite-scroll · tile-grid | ✅ #1 |
| 4 | **Aiming** | fixed · mouse · predictive-lead · lock-on · rotation-rate-limited | stub |
| 5 | **Collision** | AABB · circle · point-in-poly · swept · SAT · pixel-perfect | stub |
| 6 | **Camera** | fixed · follow · dead-zone · lerp · parallax | stub |
| 7 | **Pathfinding** | waypoint · A*-grid · follow-leader · flocking · line-of-sight | stub |
| 8 | **Procedural** | random-walk · perlin-terrain · l-system · cellular-automata | stub |
| 9 | **Rules-as-Objects** | push-tiles · parse-rules · mutate-rules · nested-rules | stub (Baba, Sokoban) |
| 10 | **Time-as-Resource** | bonfire-recovery · rewind · dilation · save-states | stub (Souls, Braid) |
| 11 | **Composition** | deck-shuffle · deck-draw · slot-fit · evolution | stub (StS, Vampire Survivors) |
| 12 | **State Machines** | FSM · behavior-tree · status-effects · resource-meters | stub |
| 13 | **Information Asymmetry** | fog-of-war · LOS-reveal · identity-grid | stub (Obra Dinn, Wordle) |
| 14 | **Nested Spaces** | nested-rooms · portals · non-Euclidean | stub (Parabox, Antichamber) |

MVP families chosen so every current applied game maps cleanly into them: Topology covers Asteroids' torus + Pong's bounce + tile-grids for Boulder Dash and QIX; Motion covers all six built minigames; Bullets covers Asteroids + Space Invaders + Defender + Robotron's spread.

## Architecture

### Information architecture

```
/                            Hero + 3 featured pure families + applied mini-row
/p/                          Pure index (headline taxonomy)
/p/<family>/                 Family page — variant tabs, canvas, knobs, code panel, "in the wild"
/a/                          Applied index (relocated from /p/)
/a/<applied-id>/             Applied detail (iframe minigame + decomposition section)
/era/                        Era timeline — applied-only
/about/                      About + two-layer framing
/g/<id>/                     Mini-game PWAs — unchanged URL, embedded in /a/ pages
/p/<applied-id>/             Meta-refresh redirect → /a/<applied-id>/ (old URLs)
```

Top nav: `Primitives | Applied | Era | About | Install`. "Primitives" is the new primary.

### Content collections

```
src/content/
  applied/                   (RENAMED from primitives/ — 33 stubs, 6 built)
    asteroids-rotate-thrust/
      stub.md  research.md  spec.md
  primitives/                (NEW — the headline)
    motion/
      family.md              (slug, name, oneliner, status, variant list)
      variants/
        rotate-thrust.md     (one variant per file)
        linear.md            …
    bullets/  topology/  …   (14 families total, 11 stub directories at v2 release)
```

### Schemas

**`applied/<id>/stub.md`** — adds a `decomposition:` block:
```yaml
decomposition:
  - { family: motion,   variant: rotate-thrust,        config: "k=0.6, v_max=360" }
  - { family: bullets,  variant: velocity-inheritance, config: "off" }
  - { family: topology, variant: torus-wrap,           config: "" }
```

**`primitives/<family>/family.md`**:
```yaml
slug: motion
name: Motion
oneliner: "How things move under player or AI input."
variants: [linear, rotate-thrust, drag-friction, jump-arc, follow-cursor, click-to-move]
```

Note: a family has **no authored `status`** field. The family is "built" iff ≥1 of its listed variants has `status: built`; otherwise "stubbed". This avoids drift between family.md and the variant files.

**`primitives/<family>/variants/<variant>.md`**:
```yaml
slug: rotate-thrust
name: Rotate-Thrust
status: built | stubbed
description: "Inertial heading + thrust along facing."
parameters:
  - { type: float,  id: rot_rate, min: 0.5, max: 6.0, default: 3.2, unit: rad/s, label: rotation }
  - { type: float,  id: friction, min: 0,   max: 2,   default: 0.6, unit: 1/s,    label: friction }
  - { type: float,  id: thrust,   min: 50,  max: 500, default: 220, unit: u/s²,   label: thrust }
  - { type: float,  id: v_max,    min: 100, max: 600, default: 360, unit: u/s,    label: max-velocity }
in_the_wild:
  - { applied: asteroids-rotate-thrust, note: "Logg 1979 — torus-wrap, k=0.6" }
  - { applied: lunar-lander-thrust,     note: "Patel/Sanderson 1979 — gravity, no wrap" }
code_anchor: public/d/motion/rotate-thrust.js
```

### Demo source layout

```
public/d/<family>/<variant>.js     One tiny module per variant — runs in the page,
                                   also displayed verbatim in the code panel.
public/d/runner.js                 Shared canvas + knob mounter, dynamically imports
                                   variant modules on tab activation.
src/components/PrimitiveDemo.astro One component per page; reads frontmatter,
                                   server-renders chrome, hydrates runner.js.
```

**Single source of truth:** the `.js` file the demo loads is the `.js` the code panel displays (imported with `?raw`).

### Module contract

Every `public/d/<family>/<variant>.js` exports:
```js
export const LOGICAL = { w: 800, h: 450 };   // logical resolution

export function init(ctx, params, env) {
  // ctx: 2D canvas context
  // params: { id: value, ... }   current knob values
  // env: { canvas, reducedMotion, requestPause, requestResume }
  // returns: function tick(dt) { ... }   called by runner each frame
}

export function applyParams(state, params) {
  // Either retune live (smooth) or reseed (clear state) — module's call.
}
```

## Page templates

**Family page (`/p/<family>/`)** — single canvas, swappable variant:

```
Header: family name + one-liner
Variant tabs: horizontal scroll on mobile, scroll-snap, hash-routed (#variant)
Section: active variant name + description
Demo card:
  canvas (16:9, ≤50vh on mobile)
  parameter knobs (slider / toggle / segmented per type)
  Reset + Toggle-code buttons
"In the wild" chips: → /a/<applied-id>/ with parameter notes
Code panel: <pre><code>raw variant.js</code></pre>, Prism-highlighted server-side
```

**Stubbed family page** — same chrome, but instead of a live demo card, a grid of variant cards. Each card: name, one-line description, "Planned" badge, "Mentioned in: …" applied uses.

**Applied detail (`/a/<applied-id>/`)** — current layout + new *Decomposition* section before research/spec links. Each row chips to `/p/<family>/#<variant>`, listing the config that game uses.

## Demo widget — concrete behaviours

- **Variant tabs:** `<nav role=tablist>`; horizontal scroll w/ `scroll-snap`; URL hash drives active state. Default selection: if `window.location.hash` matches a built variant slug, that one; otherwise the first variant with `status: built`; if no variant is built (stubbed family), the page renders the grid-of-cards layout instead of an active tab strip. Tab change cancels active rAF loop, clears canvas, dynamic-imports new variant module, calls `init()`, starts new loop.
- **Canvas:** DPR-scaled, `touch-action: none`; logical resolution from module's `LOGICAL` export; `aspect-ratio` container; `max-height: 50vh` on mobile.
- **Parameter knobs:**
  - `float`/`int` → native `<input type=range>` with numeric readout; `min-height: 44px` for touch.
  - `toggle` → labelled pill switch.
  - `enum` → segmented control.
  - All bidirectional: change → `applyParams()` on active module; reset → reload defaults.
- **Code panel:** Astro 5 / Vite supports `import code from '<path>?raw'` for build-time text inlining. Render as `<pre><code class="language-js">{code}</code></pre>` and pre-process with Prism's `Prism.highlight()` at build time so no runtime JS is needed for highlighting.
- **Pause/resume:** `document.visibilitychange` → pause rAF; tab focus → resume.
- **Reduced motion:** module reads `matchMedia('(prefers-reduced-motion: reduce)')` and disables decorative animation.
- **Accessibility:** WAI-ARIA tab pattern (arrow-key navigation); native range inputs (keyboard accessible); `aria-expanded` on code-panel toggle.

## Migration runbook (single commit)

1. `git mv src/content/primitives → src/content/applied`. Update `src/content/config.ts` (or equivalent) so the renamed collection retains its schema.
2. **Create new `src/content/primitives/` directory**, populate with 14 family directories. Each family directory:
   - `family.md` (slug, name, oneliner, variants list)
   - `variants/` subdirectory with one `.md` file per listed variant, `status: stubbed` for now (no parameters / code_anchor / in_the_wild required on stubs)
3. `git mv src/pages/p/[id].astro → src/pages/a/[id].astro`
4. Add `src/pages/p/index.astro` (pure index, lists 14 families with built/stub badges).
5. Add `src/pages/p/[family].astro` (family page, reads `family.md` + glob of variants).
6. Add `src/pages/a/index.astro` (applied index — moved from old `src/pages/p/index.astro` if it existed; otherwise new).
7. Add build step: for each `applied/<id>/` entry, emit `dist/p/<id>/index.html` with `<meta http-equiv="refresh" content="0; url=/a/<id>/">` + `<link rel="canonical" href="/a/<id>/">`.
8. Rewrite internal links in `GameEmbed.astro`, `src/pages/index.astro`, `src/pages/taxonomy.astro`, `src/pages/era.astro`: `/p/<id>/` → `/a/<id>/`.
9. Confirm: `/g/<id>/` mini-game URLs stay; back-button `../../` from minigame still resolves to hub root.
10. Build → preview → manual click-through every applied page; verify redirect from old `/p/<id>/` URLs.

**Risk:** tiny. Project too new for SEO indexing; six pages live; meta-refresh stubs cover external links. No 301 — GH Pages static can't issue them.

## MVP build sequence

| # | Family | Variants | Why |
|---|---|---|---|
| 1 | **Topology** | bounded · torus-wrap · bounce | Smallest family — 3 variants. Validates the *entire* stack (tabs, knobs, code panel, "in the wild", mobile audit) on the cheapest possible footprint. If the demo contract is wrong, found out after 3 days, not 10. |
| 2 | **Motion** | linear · rotate-thrust · drag-friction · jump-arc | Backs every current applied minigame. Sliders teach feel directly — high "wow per slider." |
| 3 | **Bullets** | fixed · aimed · spread-N · velocity-inheritance · lifetime | Toggling inheritance live IS the demo that viscerally explains Logg's 1979 design call. Compounds with Motion + Topology (compose all three to reproduce Asteroids' core feel inside a single mechanism page). |

**Gates:** each family ships → GH Pages deploy → real-iPhone audit (portrait + landscape) → fixes → THEN start next family.

**Estimate:** 3–5 days per family. Three families = ~2 weeks focused, more like 3 with iteration.

## Authoring workflow

Adapts existing `pm-agent.sh wave-<n>` model. Three changes:

1. **Research wave shrinks** for pure primitives. Mechanic + 2–4 famous applications, 300–500 words. Tier-1 citation requirement drops.
2. **Spec wave outputs knob spec + module contract** (LOGICAL, init, applyParams) inline in YAML. Implementation-prescriptive at finer grain than current spec.md.
3. **Build wave** produces `public/d/<family>/<variant>.js` — no PWA shell. Lighter than current mini-game build.

```
scripts/pm-agent.sh wave-primitive-research <family>/<variant>
scripts/pm-agent.sh wave-primitive-spec     <family>/<variant>
scripts/pm-agent.sh wave-primitive-build    <family>/<variant>
```

New agent prompts under `agent-prompts/primitive-*.md`; existing applied prompts unchanged.

**Cross-link authorship:**
- `in_the_wild` chips: hand-authored in spec wave.
- `decomposition:` block in `applied/<id>/stub.md`: hand-authored. Existing 33 applied stubs need a **one-time backfill** to add this block. Backfill can be a manual session per applied entry; some applied stubs (unbuilt ones) can defer to when they're built.
- **Build-time check:** every chip in either direction must resolve. Fail build on dangling references.

## Performance & accessibility

- Family page initial weight target: **<25 KB gzipped** (runner.js + first-variant module + Prism CSS). Variant modules lazy-loaded on tab activation.
- Variant modules: target **<10 KB each, <200 LOC**, no external deps.
- ARIA tab pattern on variant tabs; native `<input type=range>` for keyboard slider access; `aria-expanded` on code-panel toggle; respect `prefers-reduced-motion`.

## Out of scope (deferred)

- Era axis for pure primitives (mechanisms don't have eras — only their applied uses do).
- Live code editing in code panel.
- Saving/sharing custom knob configurations.
- Server-side persistence / user accounts.
- i18n.
- Cross-primitive composition tinker (e.g., "apply Topology to Motion" — implied by URL hash but not yet a UI affordance).

## Definition of done (v2)

- [ ] `/p/` index renders 14 family stubs (3 with "Built" badge, 11 with "Planned").
- [ ] `/p/topology/`, `/p/motion/`, `/p/bullets/` each render with variant tabs, working demos, knobs, code panel, "in the wild" chips.
- [ ] Every applied stub has a `decomposition:` block (or stub-deferred marker).
- [ ] `/p/<applied-id>/` URLs redirect (meta-refresh) to `/a/<applied-id>/`.
- [ ] All cross-link chips resolve (build-time check passing).
- [ ] Real-iPhone audit: portrait + landscape clean on each MVP family.
- [ ] No regression on the six existing mini-game PWAs.

## Risks

- **Hand-authored bidirectional links drift.** Mitigation: build-time check; CI fails on dangling references. Lower-effort than a graph DB and gives us most of the safety.
- **Module contract churn.** Topology-first build order is the mitigation — find the wrong contract after 3 days, not 10.
- **Backfilling `decomposition:` for 33 applied stubs is non-trivial.** Mitigation: only require it for *built* applied entries (6 of them). Stubbed applied entries get the block added when they reach build wave.
- **Demo bundle size creep.** Mitigation: bundle audit per family build; reject >10 KB variant modules without justification.
