# Agent 06 — Mini-game Build

You take one `primitives/{id}/spec.md` and produce a working in-browser mini-game in `primitives/{id}/minigame/`.

## Your inputs

- `primitives/{id}/spec.md` (must have `status: speced`)
- `primitives/{id}/research.md` (for context on the primitive)
- `BRIEF.md`, `schema.md`, `style-guide.md`

## Your output

```
primitives/{id}/minigame/
├── index.html          # standalone entry
├── game.js             # the primitive (canonical filename)
├── style.css           # optional, only if non-trivial styling
└── README.md           # how to run, controls, what to look for
```

For `tech: webgl` or `tech: three.js`, additional files are allowed but must be vendored locally (no CDN at runtime for the seed; CDN is okay during development if approved).

## Rules

- **Vanilla.** No frameworks. No build step. No transpilation. ES modules okay if everything is local files.
- **Single HTML file entry.** `index.html` must run by opening directly in a browser (file://) or via any static server.
- **No tracking, no analytics, no remote calls.**
- **No IP.** No recognizable copyrighted sprites, fonts, names, sounds. Use abstract shapes, original SVG icons, system fonts.
- **Comment the primitive.** Comments should explain *the mechanism*, not the syntax. Bad: `// loop through pieces`. Good: `// Tetris line-clear: rows that are fully non-empty are removed and rows above fall by one. Implemented as filter-then-pad to avoid O(rows²) shifts.`
- **Frame-rate independent.** Use `requestAnimationFrame` and `dt` from timestamps. No setInterval game loops.
- **Pause on blur.** When the tab loses focus, stop updating physics (rendering can continue if cheap).
- **Resize-safe.** Canvas resizes to window or container; gameplay coordinates are independent of pixel size where possible.
- **Mobile-aware.** If the spec calls for it, add touch controls. Otherwise, ensure the game at least doesn't crash on mobile.

## Code shape

`game.js` is the primitive. Structure:

```js
// Primitive: {id}
// Player verb: {one sentence}
// Mechanism summary: {2–3 sentences pointing at the lines below}

// --- State -----------------------------------------------------------------
const state = { /* per spec */ };

// --- Tick ------------------------------------------------------------------
function tick(dt) {
  /* mechanism here, commented */
}

// --- Render ----------------------------------------------------------------
function render() { /* */ }

// --- Input -----------------------------------------------------------------
function bindInput() { /* */ }

// --- Boot ------------------------------------------------------------------
function boot() {
  bindInput();
  let last = performance.now();
  function frame(t) {
    const dt = Math.min(50, t - last) / 1000; // clamp to avoid huge jumps
    last = t;
    tick(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
boot();
```

Adapt as needed, but keep the **shape readable**. Someone reading the source should see the mechanism in `tick()` within 30 seconds.

## README per game

```markdown
# {Primitive Name}

**Player verb**: {sentence from research.md}

**Canonical originator**: {Game} ({YYYY}, {Platform})

## How to play

{Controls. 3–6 bullets.}

## What to notice

{2–3 sentences. What the primitive feels like. What to try to break the demo.}

## The mechanism

{4–6 sentences. Plain-English explanation of what's in `tick()`. Link to research.md.}

## Code map

- `index.html` — boot
- `game.js` — the primitive (≤ {N} lines)
- `style.css` — visuals

Read `game.js`. The interesting parts are commented `// mechanism:`.
```

## Quality gates before you ship

- [ ] Game runs from `file://` (open `index.html` directly in browser).
- [ ] Game runs at 60fps on a mid-range laptop.
- [ ] Game doesn't crash on window resize.
- [ ] Game doesn't crash on tab blur/focus.
- [ ] No console errors or warnings on a clean load.
- [ ] Code is under the line budget in `spec.md`.
- [ ] `game.js` has a `// Primitive:` header and `// mechanism:` comments where the primitive lives.
- [ ] `README.md` is filled in.
- [ ] No remote resources at runtime.

If any gate fails, fix before declaring done.

## What "done" means

1. All quality gates pass.
2. The mini-game appears in `mini-games/index.html` gallery (run `mini-games/regenerate-gallery.sh` or update by hand if no script exists yet).
3. The stub's `status` advances to `built`.
4. Append a line to `research-notes/build-log.md`:
   `{date} — {id} — LOC: N — tech: {tech} — notes: ...`

## Failure modes

- **Adding features beyond the spec.** Re-read the `Out of scope` section.
- **Pulling in a framework "for convenience".** Don't. The spec said vanilla.
- **Pretty over legible.** This is educational. Beautiful is great, but unreadable code is a failure.
- **No comments where the primitive lives.** Without comments at `tick()`, the source is useless as a teaching artifact.
- **CDN-loaded dependencies.** Anything fetched at runtime is a failure for the seed deliverable.
