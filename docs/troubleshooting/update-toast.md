# Troubleshooting log — the "New version available" toast saga

> **Status:** Resolved at commit TBD (CSS specificity fix). Documented after the fact so the next time someone hits a stuck-toast bug they can skip the dead ends.

The `UpdateToast` component shows a "New version available · Refresh" banner when the Service Worker has a `waiting` SW installed. It existed since v1. It looked correct in dev. In production on iPhone PWA it accumulated four overlapping bugs that took five iterations to fully unstuck. Each fix surfaced the next bug.

## Symptoms (in the order they were reported)

| # | Symptom | Reported by | What it actually was |
|---|---|---|---|
| 1 | Title "Gaming Primitives" rendering behind iOS clock | iPhone screenshot, 12:10 | Toolbar lacked `padding-top: env(safe-area-inset-top)` — already fixed in an earlier round but the **toast itself** had the same bug |
| 2 | Toast refresh button hidden behind iOS battery/5G icons | iPhone screenshot, 12:18 | `UpdateToast.astro` had bare `top: 1rem` — no safe-area-inset-top |
| 3 | Toast tappable but Refresh does nothing | iPhone screenshot, 12:24 | (A) `getRegistration('/')` queried wrong scope on GH Pages (real scope is `/gaming-primitives/`); (B) `waiting` reference captured at page-load was stale by click time |
| 4 | Variant demo canvas blank below tabs on all family pages | iPhone screenshot, 12:24 | `runner.js` did `import('/d/<family>/<variant>.js')` — root-absolute path that 404'd on GH Pages |
| 5 | "New version available" appears across **three browsers** and X dismiss button does nothing | text report, 12:32-ish | CSS specificity bug — `[hidden]` attribute and `.gp-update` class have **identical specificity** `(0,1,0)`, so `display: flex` on the class outranked `display: none` on `[hidden]` by cascade order. `toast.hidden = true` wrote the attribute correctly but the CSS kept the element visible. |

## Commit timeline of fixes

| Commit | Fix | Bug addressed |
|---|---|---|
| `7c6d5eb` | Earlier toolbar safe-area-top | #1 (toolbar) |
| `34bb5d0` | `UpdateToast` `top: calc(1rem + env(safe-area-inset-top))` + footer versioning (`v{pkg} · {sha} · {date}`) | #2 |
| `0110cf4` | `getRegistration()` scope fix (drop the `'/'` arg); re-fetch reg at click time; 2s fallback reload | #3 |
| `ab510a0` | `runner.js` dynamic import uses `new URL(..., import.meta.url)` so it resolves relative to where runner.js was served; `CACHE_VERSION` bump v0.1.0 → v0.2.1; click + pointerup belt-and-suspenders | #4 + further #3 hardening |
| `71c106c` | Dismiss × button + 24h localStorage memo; `CACHE_VERSION` v0.2.1 → v0.2.2 | Escape hatch for #5 (didn't fix root cause) |
| this commit | `.gp-update[hidden] { display: none }` explicit rule + inline `style.display='none'` defensive backstop in JS | **Root cause of #5** |

## Why the CSS bug went unnoticed for so long

1. **Looked correct in dev.** Astro's dev server might render slightly differently or the cache state was different — the toast didn't even appear in dev because there was no waiting SW.
2. **Looked correct in screenshots.** When the toast was visible, that matched expectations. When the toast was supposed to be hidden, the developer never refreshed without a waiting SW to verify.
3. **The first hide path that "worked" was page reload.** Earlier, clicking Refresh actually navigated. The page reloaded. The new page's HTML had `hidden` attribute set again from SSR. So the toast briefly stayed hidden on reload — but only because *the element was re-rendered with the hidden attribute as default initial state, and CSS hadn't kicked in yet*. As soon as the script ran and detected a new waiting SW, it'd set `hidden = false` again. The cascade bug was masked.
4. **One-browser testing.** This was reported by Gerald on iOS PWA. The pattern of "tried on three browsers" was the key signal that this was a CSS-level bug, not a runtime-state bug.

## Hypotheses we ruled out (with reasoning)

### "Stuck SW lifecycle / phantom waiting SW"
**Hypothesis**: The SW is endlessly re-installing because something about sw.js or PRECACHE_URLS changes between requests, so the browser perpetually flags a new version waiting.

**Why ruled out**: `public/sw.js` is a static file. GH Pages serves it bytewise identical between requests. The activate handler is correct. The install handler is correct. We bumped `CACHE_VERSION` twice (v0.1.0 → v0.2.1 → v0.2.2) but the deeper symptom (toast persisting after dismiss) didn't change.

### "iOS PWA-specific Service Worker bug"
**Hypothesis**: iOS has a known quirk where SW skipWaiting doesn't trigger controllerchange.

**Why ruled out**: The 2s setTimeout-reload fallback handles the case where controllerchange doesn't fire. Reload happens regardless. After reload the page IS the new version (footer SHA changed). So skipWaiting *did* work.

### "Cache headers / HTTP cache deadlock"
**Hypothesis**: Browser's HTTP cache or the SW's own cache is serving an old sw.js, creating a perpetual "new version detected" loop.

**Why ruled out**: SW updates ignore HTTP cache by default (`browser updateViaCache: 'imports'` is the default and applies to imported scripts, not the top-level SW file). Top-level SW file is fetched fresh on each navigation in scope.

### "Three browsers means it's server-side caching"
**Hypothesis**: GH Pages returning stale content somehow.

**Why ruled out**: GH Pages is just static file hosting. Same bytes for same URL. The fact that it appeared across browsers pointed at code, not infrastructure.

## The actual root cause (with receipts)

CSS specificity rule:
- `[hidden]` — UA stylesheet rule. Selector specificity: `(0,1,0)`.
- `.gp-update` — author CSS class selector. Specificity: `(0,1,0)`.
- Tie. Cascade order decides. UA rules come first; author rules win.

Original CSS:
```css
.gp-update {
  position: fixed;
  ...
  display: flex;  /* ← this beats [hidden]{display:none} */
}
```

So `<aside id="gp-update" class="gp-update" hidden>` rendered as `display: flex` (visible), and `toast.hidden = true` in JS wrote the attribute but visually nothing changed.

The fix:
```css
.gp-update[hidden] { display: none; }
.gp-update { ...; display: flex; }
```

Now `.gp-update[hidden]` has specificity `(0,2,0)` (one class + one attribute), beating the bare `.gp-update`'s `(0,1,0)`. When the attribute is set, the dismissed rule wins.

Belt + suspenders: also set `toast.style.display = 'none'` inline as a defensive backstop. Inline styles have specificity `(1,0,0,0)` — outranks any selector — so even if a future CSS rule re-introduces the bug, the inline backstop holds.

## Lessons

1. **`[hidden]` is not magic.** If you put `display: <anything>` on a class that targets the same element, you've broken the hidden attribute. The HTML spec assumes the UA rule wins; it does only when no equal-or-higher author rule says otherwise.
2. **"Tried three browsers"** is a fast signal: the bug is in your code, not the user's environment. Skip the "have you tried clearing cache" suggestions and look at the source.
3. **CACHE_VERSION bumps don't unstick SW lifecycle bugs**, they only force a different *path through* the lifecycle. If the toast is visually wrong, bumping versions doesn't help — the visual bug is independent.
4. **Two redundant hide paths beat one.** Use attribute + class + inline style if it's load-bearing UI that must hide. Specificity layered defense.
5. **Document specificity-trap fixes in CSS comments.** The next developer to touch `.gp-update` should see the `[hidden]` rule explained or they'll "clean it up" and reintroduce the bug.

## Verification steps

After this fix, the dismiss button:
1. Sets `[hidden]` attribute → `.gp-update[hidden]{display:none}` rule fires → element vanishes immediately.
2. Sets inline `style="display: none"` as backstop → overrules anything else.
3. Writes `gp_update_dismissed_until` to localStorage with 24h TTL.

On next page load:
1. Element renders with `hidden` attribute (SSR).
2. CSS `[hidden]` rule keeps it hidden by default.
3. Script reads localStorage; if within 24h dismiss window, `show()` never called.
4. If outside window AND there's a waiting SW, `show()` fires, clearing both attribute and inline style.

## Related files

- `src/components/UpdateToast.astro` — toast component
- `src/layouts/Base.astro` — mounts the toast in every page; renders footer version
- `public/sw.js` — hub service worker; SKIP_WAITING message handler
- `public/d/runner.js` — variant demo runtime; previously buggy import path
