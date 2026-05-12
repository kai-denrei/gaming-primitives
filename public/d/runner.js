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
  let currentMod = null;
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
    tabHost.querySelectorAll('[data-slug]').forEach(b => {
      const isActive = b.dataset.slug === slug;
      b.dataset.active = String(isActive);
      b.setAttribute('aria-selected', String(isActive));
    });

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
    if (currentMod) sizeCanvas(currentMod.LOGICAL);
  });

  // Initial: URL hash → first built → nothing
  const initial = builtSlugs.has(location.hash.slice(1))
    ? location.hash.slice(1)
    : variants.find(v => builtSlugs.has(v.slug))?.slug;
  if (initial) activate(initial);
}

// Auto-mount any <primitive-demo data-family="..."> on the page.
document.querySelectorAll('[data-primitive-demo]').forEach(mountDemo);
