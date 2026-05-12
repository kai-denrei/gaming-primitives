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
  const nameHost = rootEl.querySelector('.variant-name');
  const itwBadge = rootEl.querySelector('.itw-badge');
  const itwModal = rootEl.querySelector('.itw-modal');
  const itwTitle = itwModal?.querySelector('.itw-modal-title');
  const itwList = itwModal?.querySelector('.itw-modal-list');
  const itwClose = itwModal?.querySelector('.itw-modal-close');
  const base = rootEl.dataset.base || '/';

  let active = null;          // current variant module instance
  let currentMod = null;
  let currentActiveSlug = null;
  let rafId = null;
  let lastT = 0;
  let paused = false;
  let currentParams = {};

  // Hash contract:
  //   #<slug>              variant active
  //   #<slug>/wild         variant active + in-the-wild modal open
  //   #<slug>/code         variant active + code panel open
  function parseHash() {
    const raw = location.hash.slice(1);
    if (!raw) return [null, null];
    const [slug, mod] = raw.split('/');
    return [slug || null, mod || null];
  }
  function syncHash() {
    if (!currentActiveSlug) return;
    let mod = null;
    if (itwModal && itwModal.open) mod = 'wild';
    else if (codeHost && codeHost.open) mod = 'code';
    const newHash = mod ? `#${currentActiveSlug}/${mod}` : `#${currentActiveSlug}`;
    if (location.hash !== newHash) history.replaceState(null, '', newHash);
  }
  function openItwModalFor(slug) {
    const variant = variants.find(v => v.slug === slug);
    if (!variant?.in_the_wild?.length || !itwModal) return;
    itwTitle.textContent = `In the wild — ${variant.name}`;
    itwList.innerHTML = '';
    for (const use of variant.in_the_wild) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'itw-applied';
      a.textContent = use.applied;
      a.href = `${base}a/${use.applied}/`;
      li.appendChild(a);
      const note = document.createElement('div');
      note.className = 'itw-note';
      note.textContent = use.note;
      li.appendChild(note);
      itwList.appendChild(li);
    }
    if (typeof itwModal.showModal === 'function') itwModal.showModal();
    else itwModal.setAttribute('open', '');
    syncHash();
  }

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
    tabHost.querySelectorAll('[data-slug]').forEach(b => {
      const isActive = b.dataset.slug === slug;
      b.dataset.active = String(isActive);
      b.setAttribute('aria-selected', String(isActive));
    });

    // Active variant header — name + "+N" in-the-wild badge
    if (nameHost) nameHost.textContent = variant.name;
    if (itwBadge) {
      const n = (variant.in_the_wild || []).length;
      if (n > 0) {
        itwBadge.hidden = false;
        itwBadge.textContent = `+${n}`;
        itwBadge.dataset.slug = slug;
      } else {
        itwBadge.hidden = true;
      }
    }

    // Reset knobs from the new variant's defaults
    knobHost.innerHTML = '';
    currentParams = defaultsFor(variant.parameters);

    // Dynamic-import the module. Use import.meta.url so the path resolves
    // relative to where runner.js was served from — works under any base path
    // (root in dev, /gaming-primitives/ on GH Pages). A bare absolute `/d/...`
    // would 404 under a non-root base.
    let mod;
    try {
      const url = new URL(`./${family}/${slug}.js`, import.meta.url).href;
      mod = await import(url);
    } catch (err) {
      console.error(`[primitive-demo] failed to load variant '${slug}' in '${family}':`, err);
      return;
    }
    currentMod = mod;

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

    currentActiveSlug = slug;
    syncHash();
  }

  // Tab clicks
  tabHost.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-slug]');
    if (btn) activate(btn.dataset.slug);
  });

  // In-the-wild modal: badge opens for active variant. Close button +
  // backdrop dismiss. URL hash reflects open/close state via syncHash().
  if (itwBadge && itwModal && itwList && itwTitle) {
    itwBadge.addEventListener('click', () => {
      const slug = itwBadge.dataset.slug;
      openItwModalFor(slug);
    });
    itwClose?.addEventListener('click', () => itwModal.close());
    // Tap outside the dialog content (on the backdrop) closes it.
    itwModal.addEventListener('click', (e) => {
      if (e.target === itwModal) itwModal.close();
    });
    // Dialog 'close' fires on dialog.close(), ESC, etc. Reflect in URL.
    itwModal.addEventListener('close', () => syncHash());
  }

  // Code panel open/close → URL reflects via syncHash().
  if (codeHost) {
    codeHost.addEventListener('toggle', () => syncHash());
  }

  // Hash change (back/forward, manual URL edit, deep-link from elsewhere).
  // Reconcile variant + section modifiers with current state.
  addEventListener('hashchange', async () => {
    const [slug, mod] = parseHash();
    if (slug && builtSlugs.has(slug) && slug !== currentActiveSlug) {
      await activate(slug);
    }
    if (mod === 'wild' && currentActiveSlug && itwModal && !itwModal.open) {
      openItwModalFor(currentActiveSlug);
    } else if (mod !== 'wild' && itwModal?.open) {
      itwModal.close();
    }
    if (mod === 'code' && codeHost && !codeHost.open) {
      codeHost.open = true;
    } else if (mod !== 'code' && codeHost?.open) {
      codeHost.open = false;
    }
  });

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    lastT = performance.now();
  });

  // Resize: re-size canvas without reseeding state
  window.addEventListener('resize', () => {
    if (currentMod) sizeCanvas(currentMod.LOGICAL);
  });

  // Initial: parse URL hash for slug + optional modifier (wild|code).
  // Falls back to the first built variant when hash is empty or unrecognized.
  const [hashSlug, hashMod] = parseHash();
  const initial = hashSlug && builtSlugs.has(hashSlug)
    ? hashSlug
    : variants.find(v => builtSlugs.has(v.slug))?.slug;
  if (initial) {
    await activate(initial);
    if (hashMod === 'wild') openItwModalFor(initial);
    else if (hashMod === 'code' && codeHost) codeHost.open = true;
  }
}

// Auto-mount any <primitive-demo data-family="..."> on the page.
document.querySelectorAll('[data-primitive-demo]').forEach(mountDemo);
