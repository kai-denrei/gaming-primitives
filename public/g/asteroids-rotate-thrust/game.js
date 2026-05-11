// Primitive: asteroids-rotate-thrust
// Player verb: combine angular and linear thrust with screen-wrap topology
// Mechanism summary: ship integrates rotation, thrust along facing, and
// multiplicative friction via semi-implicit Euler with dt-scaled steps;
// everything wraps on a torus; bullets fly at fixed muzzle speed along the
// current facing (not velocity); asteroid hits fission large->medium->small.

// --- Constants ---------------------------------------------------------
// FRICTION is a *rate* for exp(-k·dt) decay so glide-to-stop is framerate
// independent. THRUST and ROT_RATE are tuned so a full rotation takes ~2 s
// and the ship reaches V_MAX in ~1.5 s — Logg's 1979 cabinet feel.
const W = 1000, H = 750;         // logical playfield; render scales to canvas
const ROT_RATE = 3.2;            // rad/s
const THRUST   = 220;            // u/s^2
const FRICTION = 0.6;            // 1/s — v *= exp(-FRICTION*dt)
const V_MAX    = 360;            // u/s, magnitude clamp
const MUZZLE   = 480;            // u/s, bullet ground speed (no v-inheritance)
const BULLET_TTL = 1.0;          // s, range ≈ 480 u (≈ half-screen)
const BULLET_CAP = 4;
const SHIP_R   = 8;
const SIZES    = [10, 22, 40];   // small=0, medium=1, large=2 collision radii
const REDUCED  = matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- State -------------------------------------------------------------
const state = {
  ship: null, bullets: [], asteroids: [], flashes: [],
  wave: 0, cleared: 0,
  input: { L:false, R:false, T:false, fired:false, restart:false,
           touches:new Map(), zonesOn:false }
};

function reset() {
  state.ship = { x: W/2, y: H/2, vx: 0, vy: 0, dir: -Math.PI/2,
                 thrust:false, alive:true, flame:0 };
  state.bullets.length = 0; state.flashes.length = 0;
  state.wave = 0; state.cleared = 0;
  spawnWave(++state.wave);
}

function spawnWave(n) {
  // mechanism: N+2 large rocks spawn on field edges with a guard radius
  // around the ship so the player isn't insta-killed on re-spawn.
  state.asteroids.length = 0;
  for (let i = 0; i < n + 2; i++) {
    let x, y, tries = 0;
    do {
      if (Math.random() < 0.5) { x = Math.random()*W; y = Math.random()<0.5 ? 0 : H; }
      else                     { y = Math.random()*H; x = Math.random()<0.5 ? 0 : W; }
      tries++;
    } while (tries < 16 && torusDist(x, y, state.ship.x, state.ship.y) < SIZES[2]*3);
    const ang = Math.random()*Math.PI*2;
    const spd = 40 + Math.random()*40 + n*4;
    state.asteroids.push(makeRock(x, y, Math.cos(ang)*spd, Math.sin(ang)*spd, 2));
  }
}

function makeRock(x, y, vx, vy, size) {
  // mechanism: irregular n-gon with vertex radii jittered around SIZES[size];
  // stored as ratios so we don't recompute trig on render.
  const n = 7 + (Math.random()*5 | 0), verts = [];
  for (let i = 0; i < n; i++) verts.push(0.7 + Math.random()*0.6);
  return { x, y, vx, vy, size, r: SIZES[size], verts,
           spin: (Math.random()-0.5)*0.6, rot: Math.random()*Math.PI*2 };
}

// --- Tick --------------------------------------------------------------
function tick(dt) {
  const s = state.ship, inp = state.input;

  if (s.alive) {
    // mechanism: rotation is a held-input integrator. Direction is a float
    // radian; sin/cos handle wrap so we don't normalise.
    if (inp.L) s.dir -= ROT_RATE * dt;
    if (inp.R) s.dir += ROT_RATE * dt;

    // mechanism: thrust decomposes via sin/cos of facing — the line you
    // shoot and the line you accelerate are the same vector, but velocity is
    // accumulated, so they diverge over time. This is the *inertial debt*.
    s.thrust = inp.T;
    if (s.thrust) {
      s.vx += Math.cos(s.dir) * THRUST * dt;
      s.vy += Math.sin(s.dir) * THRUST * dt;
      s.flame = REDUCED ? 1 : (s.flame + dt*30) % 1;
    } else s.flame = 0;

    // mechanism: exp(-k·dt) is the framerate-independent equivalent of the
    // original's per-frame `v *= FRICTION`. Without this, a 30fps device
    // would have stronger friction than a 144fps device.
    const decay = Math.exp(-FRICTION * dt);
    s.vx *= decay; s.vy *= decay;

    // mechanism: magnitude clamp keeps the ship from drifting faster than
    // bullets, which would otherwise let the player outrun their own shots.
    const m = Math.hypot(s.vx, s.vy);
    if (m > V_MAX) { s.vx = s.vx/m * V_MAX; s.vy = s.vy/m * V_MAX; }

    s.x = mod(s.x + s.vx*dt, W);
    s.y = mod(s.y + s.vy*dt, H);

    // mechanism: edge-triggered fire (one shot per Space press) with cap
    // BULLET_CAP. Bullet velocity is world-frame muzzle, not ship+muzzle —
    // Logg deliberately omitted velocity inheritance.
    if (inp.fired && state.bullets.length < BULLET_CAP) {
      state.bullets.push({
        x: s.x + Math.cos(s.dir)*SIZES[0], y: s.y + Math.sin(s.dir)*SIZES[0],
        vx: Math.cos(s.dir)*MUZZLE, vy: Math.sin(s.dir)*MUZZLE, ttl: BULLET_TTL });
    }
  } else if (inp.restart) reset();
  inp.fired = false; inp.restart = false;

  // mechanism: bullets and asteroids share the wrapped-Euler scheme.
  // Bullets expire by TTL; asteroids never expire — only fission or persist.
  for (const b of state.bullets) {
    b.x = mod(b.x + b.vx*dt, W); b.y = mod(b.y + b.vy*dt, H); b.ttl -= dt;
  }
  for (let i = state.bullets.length-1; i >= 0; i--)
    if (state.bullets[i].ttl <= 0) state.bullets.splice(i, 1);
  for (const a of state.asteroids) {
    a.x = mod(a.x + a.vx*dt, W); a.y = mod(a.y + a.vy*dt, H); a.rot += a.spin*dt;
  }

  // mechanism: bullet↔asteroid uses *toroidal* distance so a shot just past
  // the right edge can hit a rock just inside the left edge. The naive
  // Euclidean test misses wrap-edge kills and feels broken.
  for (let i = state.asteroids.length-1; i >= 0; i--) {
    const a = state.asteroids[i];
    for (let j = state.bullets.length-1; j >= 0; j--) {
      if (torusDist(a.x, a.y, state.bullets[j].x, state.bullets[j].y) < a.r) {
        state.bullets.splice(j, 1);
        fission(i, a);
        state.cleared++;
        if (!REDUCED) state.flashes.push({ x:a.x, y:a.y, ttl: 0.08 });
        break;
      }
    }
  }
  // mechanism: ship↔asteroid is a forgiving point-vs-circle test on the
  // torus (the original used per-vertex point-in-polygon — sharper, meaner).
  if (s.alive) for (const a of state.asteroids)
    if (torusDist(a.x, a.y, s.x, s.y) < a.r + SHIP_R) { s.alive = false; break; }

  for (let i = state.flashes.length-1; i >= 0; i--) {
    state.flashes[i].ttl -= dt;
    if (state.flashes[i].ttl <= 0) state.flashes.splice(i, 1);
  }
  if (state.asteroids.length === 0) spawnWave(++state.wave);
}

function fission(idx, a) {
  // mechanism: large → 2 mediums, medium → 2 smalls, small → vanish. Children
  // inherit position, get a random heading, and a per-size speed boost so the
  // late-level swarm is faster than the opening — that's the curve which
  // makes a cleared wave feel like an emergent fight against acceleration.
  state.asteroids.splice(idx, 1);
  if (a.size === 0) return;
  const sp = Math.hypot(a.vx, a.vy) * 1.4 + 20;
  for (let k = 0; k < 2; k++) {
    const ang = Math.random()*Math.PI*2;
    state.asteroids.push(makeRock(a.x, a.y, Math.cos(ang)*sp, Math.sin(ang)*sp, a.size-1));
  }
}

function torusDist(ax, ay, bx, by) {
  // mechanism: per-axis min of |Δ| and W-|Δ|, then Euclidean. Without this,
  // collision tests at the wrap seam are off by up to W units.
  let dx = Math.abs(ax - bx); if (dx > W/2) dx = W - dx;
  let dy = Math.abs(ay - by); if (dy > H/2) dy = H - dy;
  return Math.hypot(dx, dy);
}
function mod(v, m) { return ((v % m) + m) % m; }

// --- Render ------------------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const stage = document.getElementById('stage');
  const w = stage.clientWidth, h = stage.clientHeight;
  canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function render() {
  const stage = document.getElementById('stage');
  const cw = stage.clientWidth, ch = stage.clientHeight;
  // Fit logical 1000×750 into stage with preserved aspect; letterbox stays black.
  const sc = Math.min(cw / W, ch / H);
  const ox = (cw - W*sc) / 2, oy = (ch - H*sc) / 2;

  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
  ctx.save();
  ctx.translate(ox, oy); ctx.scale(sc, sc);
  ctx.lineWidth = 1.5 / sc;
  ctx.strokeStyle = '#fff';

  for (const a of state.asteroids) drawWrapped(a.x, a.y, a.r, () => drawRock(a));
  for (const b of state.bullets)   drawWrapped(b.x, b.y, 3,  drawBullet);
  if (state.ship.alive) drawWrapped(state.ship.x, state.ship.y, 16, drawShip);

  if (!REDUCED) {
    ctx.strokeStyle = '#ff5e3a';
    for (const f of state.flashes) { ctx.beginPath(); ctx.arc(f.x, f.y, 14, 0, Math.PI*2); ctx.stroke(); }
  }

  ctx.fillStyle = '#222'; ctx.font = `${12/sc}px ui-monospace, monospace`;
  ctx.fillText(`cleared ${state.cleared}  wave ${state.wave}`, 8, 16);

  if (!state.ship.alive) {
    ctx.fillStyle = '#fff'; ctx.font = `${20/sc}px ui-monospace, monospace`;
    const msg = 'press R or two-finger tap to restart';
    ctx.fillText(msg, (W - ctx.measureText(msg).width)/2, H/2);
  }
  if (state.input.zonesOn) drawTouchHints();
  ctx.restore();
}

function drawWrapped(x, y, r, fn) {
  // Draw the shape, then ghost-copies offset by ±W or ±H if within r of an
  // edge. Avoids visual pop at the wrap seam.
  const dx = (x < r) ? W : (x > W-r) ? -W : 0;
  const dy = (y < r) ? H : (y > H-r) ? -H : 0;
  const xs = dx ? [0, dx] : [0], ys = dy ? [0, dy] : [0];
  for (const ix of xs) for (const iy of ys) {
    ctx.save(); ctx.translate(x + ix, y + iy); fn(); ctx.restore();
  }
}
function drawShip() {
  const s = state.ship;
  ctx.rotate(s.dir);
  ctx.beginPath();
  ctx.moveTo(14, 0); ctx.lineTo(-8, -7); ctx.lineTo(-5, 0); ctx.lineTo(-8, 7);
  ctx.closePath(); ctx.stroke();
  if (s.thrust && (REDUCED || s.flame < 0.5)) {
    ctx.strokeStyle = '#ff5e3a';
    ctx.beginPath();
    ctx.moveTo(-5, -4); ctx.lineTo(-12, 0); ctx.lineTo(-5, 4);
    ctx.stroke();
    ctx.strokeStyle = '#fff';
  }
}
function drawRock(a) {
  ctx.rotate(a.rot);
  ctx.beginPath();
  const n = a.verts.length;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2, rr = a.r * a.verts[i];
    const x = Math.cos(ang)*rr, y = Math.sin(ang)*rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.stroke();
}
function drawBullet() { ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI*2); ctx.stroke(); }
function drawTouchHints() {
  ctx.strokeStyle = '#222';
  ctx.strokeRect(0, 0, W/3, H);
  ctx.strokeRect(W*2/3, 0, W/3, H);
  ctx.strokeRect(W/3, H*0.65, W/3, H*0.35);
  ctx.strokeStyle = '#fff';
}

// --- Input -------------------------------------------------------------
function bindInput() {
  const inp = state.input;
  // Keys the game claims — preventDefault on each to stop the page scrolling
  // (ArrowUp/Down/Space scroll the viewport by default) and to keep WASD
  // out of any future text-field focus race.
  const GAME_KEYS = new Set([
    'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space',
    'KeyA','KeyD','KeyW','KeyS','KeyR'
  ]);
  addEventListener('keydown', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    // WASD mirrors arrows; ArrowDown/KeyS are inert in play but still claimed.
    if      (e.code === 'ArrowLeft'  || e.code === 'KeyA') inp.L = true;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') inp.R = true;
    else if (e.code === 'ArrowUp'    || e.code === 'KeyW') inp.T = true;
    else if (e.code === 'Space')                            inp.fired = true;
    else if (e.code === 'KeyR')                             inp.restart = true;
  }, { passive: false });
  addEventListener('keyup', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if      (e.code === 'ArrowLeft'  || e.code === 'KeyA') inp.L = false;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') inp.R = false;
    else if (e.code === 'ArrowUp'    || e.code === 'KeyW') inp.T = false;
  }, { passive: false });
  // Reset held flags on blur so a stuck key doesn't auto-thrust on resume.
  addEventListener('blur', () => { inp.L = inp.R = inp.T = false; });

  // Touch zones: left third = rotate L, right third = rotate R, bottom-center
  // pad = thrust, top-right FAB area = fire (tap-edge). Two-finger tap while
  // dead = restart. Zones render only while a touch is active.
  const stage = document.getElementById('stage');
  function zoneOf(t) {
    const r = stage.getBoundingClientRect();
    const x = (t.clientX - r.left) / r.width, y = (t.clientY - r.top) / r.height;
    if (x > 0.78 && y < 0.18) return 'fire';
    if (y > 0.65 && x > 0.33 && x < 0.67) return 'thrust';
    if (x < 0.33) return 'left';
    if (x > 0.67) return 'right';
    return null;
  }
  function refreshHeld() {
    inp.L = inp.R = inp.T = false;
    for (const z of inp.touches.values()) {
      if (z === 'left')   inp.L = true;
      if (z === 'right')  inp.R = true;
      if (z === 'thrust') inp.T = true;
    }
    inp.zonesOn = inp.touches.size > 0;
  }
  stage.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!state.ship.alive && e.touches.length >= 2) { inp.restart = true; return; }
    for (const t of e.changedTouches) {
      const z = zoneOf(t);
      if (z === 'fire') { inp.fired = true; continue; }
      if (z) inp.touches.set(t.identifier, z);
    }
    refreshHeld();
  }, { passive:false });
  stage.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (inp.touches.has(t.identifier)) {
        const z = zoneOf(t);
        if (z && z !== 'fire') inp.touches.set(t.identifier, z);
      }
    }
    refreshHeld();
  }, { passive:false });
  function endTouch(e) {
    for (const t of e.changedTouches) inp.touches.delete(t.identifier);
    refreshHeld();
  }
  stage.addEventListener('touchend', endTouch);
  stage.addEventListener('touchcancel', endTouch);
}

// --- Fullscreen toggle -------------------------------------------------
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  const stage = document.getElementById('stage');
  if (!document.fullscreenElement) (stage.requestFullscreen?.() ?? stage.webkitRequestFullscreen?.());
  else document.exitFullscreen?.();
});

// --- Pause on blur -----------------------------------------------------
let paused = false;
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  if (paused) state.input.L = state.input.R = state.input.T = false;
});

// --- Boot --------------------------------------------------------------
function boot() {
  resize(); window.addEventListener('resize', resize);
  bindInput(); reset();
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
