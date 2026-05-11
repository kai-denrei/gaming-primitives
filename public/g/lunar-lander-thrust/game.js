// Primitive: lunar-lander-thrust
// Player verb: apply fuel-limited vector thrust under gravity to null velocity at a target
// Mechanism summary: semi-implicit Euler integrates gravity + tilt-rotated engine
// thrust per tick; fuel drains while thrust is held; terrain is a midpoint-displaced
// heightmap with one stamped-flat pad; touchdown sampled per-frame against the
// interpolated ridge — win iff overlapping the pad with |vx|,|vy|,|θ| all within
// the soft-landing limits, else crash. R resets state to the same terrain seed.

// --- Constants ---------------------------------------------------------
// Tuned in logical units; the playfield is 480×320 and render letterboxes into
// the stage. Constants are per-second so dt-scaling makes the feel framerate
// independent. The TWR is high enough (T_MAG/G ≈ 2.55) that a single late
// suicide burn cleanly nulls a long fall — the canonical Atari feel.
const W = 480, H = 320;
const G          = 18;     // u/s²  downward
const T_MAG      = 46;     // u/s²  along lander up-axis
const BURN_RATE  = 22;     // fuel/s at full throttle (binary hold)
const ROT_RATE   = 2.6;    // rad/s
const V_SAFE_X   = 14;     // u/s   horizontal touchdown limit
const V_SAFE_Y   = 22;     // u/s   vertical touchdown limit
const TILT_SAFE  = 0.18;   // rad   ≈ 10.3°
const FUEL_START = 100;
const N_TERRAIN  = 31;     // ridge vertices; linear interp between
const PAD_W      = 80;     // pad width in world units
const REDUCED    = matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- State -------------------------------------------------------------
const state = {
  lander: null,
  terrain: new Float32Array(N_TERRAIN),
  pad: { x0: 0, x1: 0, y: 0 },
  fuel: FUEL_START,
  input: { rotL:false, rotR:false, thrust:false, restart:false,
           touches:new Map(), zonesOn:false },
  status: 'play',   // 'play' | 'win' | 'dead'
  flash: 0,         // crash flash timer, seconds
  flame: 0,         // flicker phase for engine
};

// mechanism: a tiny LCG keyed to a fixed seed gives midpoint-displacement a
// deterministic ridge. R restarts reuse the same seed (per spec), so retries
// rehearse the same problem rather than re-rolling the world.
const TERRAIN_SEED = 0x4C414E44; // 'LAND'
function lcg(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff; }

function genTerrain() {
  // mechanism: midpoint-displacement on the column index. Endpoints anchor
  // mid-screen, each midpoint = avg(neighbours) + noise; amplitude halves per
  // pass so the ridge picks up low-frequency hills with high-frequency teeth.
  const rnd = lcg(TERRAIN_SEED);
  const t = state.terrain;
  for (let i = 0; i < N_TERRAIN; i++) t[i] = 0;
  t[0] = H * 0.78; t[N_TERRAIN-1] = H * 0.72;
  let step = N_TERRAIN - 1, amp = H * 0.18;
  while (step > 1) {
    const half = step >> 1;
    for (let i = half; i < N_TERRAIN; i += step) {
      const a = t[i-half], b = t[Math.min(N_TERRAIN-1, i+half)];
      t[i] = (a + b) / 2 + (rnd() - 0.5) * 2 * amp;
    }
    step = half; amp *= 0.55;
  }
  // Clamp into the lower 60% of the field so the lander has room to fall.
  for (let i = 0; i < N_TERRAIN; i++) t[i] = Math.max(H*0.45, Math.min(H*0.92, t[i]));

  // mechanism: stamp one flat pad of PAD_W width starting at a deterministic
  // column. Setting equal heights across the pad columns makes terrainAt(x)
  // return a constant slab there — that flat slab is the win surface.
  const padCol = 9 + ((rnd() * 10) | 0);     // columns 9..18 (mid-field)
  const padHeight = t[padCol];
  const dx = W / (N_TERRAIN - 1);
  const padCols = Math.max(2, Math.ceil(PAD_W / dx));
  for (let i = padCol; i < Math.min(N_TERRAIN, padCol + padCols); i++) t[i] = padHeight;
  state.pad.x0 = padCol * dx;
  state.pad.x1 = (padCol + padCols - 1) * dx;
  state.pad.y  = padHeight;
}

function reset() {
  genTerrain();
  state.lander = { x: W/2, y: 28, vx: 8, vy: 0, theta: 0 };
  state.fuel = FUEL_START;
  state.status = 'play';
  state.flash = 0;
  state.flame = 0;
}

function terrainAt(x) {
  // mechanism: linear interp between heightmap columns. The collision
  // probe uses this, not a polygon test — same as the original Atari ROM's
  // per-column lookup.
  const dx = W / (N_TERRAIN - 1);
  const f = Math.max(0, Math.min(N_TERRAIN - 1.0001, x / dx));
  const i = f | 0;
  const u = f - i;
  return state.terrain[i] * (1 - u) + state.terrain[i+1] * u;
}

// --- Tick --------------------------------------------------------------
function tick(dt) {
  const inp = state.input;
  if (inp.restart) { reset(); inp.restart = false; return; }
  if (state.status !== 'play') { state.flash = Math.max(0, state.flash - dt); return; }

  const L = state.lander;

  // mechanism: rotation is a held-input integrator; the lander keeps its angle
  // when released (no auto-level). θ=0 means engine pushes straight up.
  if (inp.rotL) L.theta -= ROT_RATE * dt;
  if (inp.rotR) L.theta += ROT_RATE * dt;

  // mechanism: gravity is a free constant; thrust is a paid vector along the
  // lander's local up-axis. ax = sin θ · T, ay = -cos θ · T (screen-y grows
  // downward). Fuel gates the engine — empty tank means free fall.
  let ax = 0, ay = G;
  const thrusting = inp.thrust && state.fuel > 0;
  if (thrusting) {
    ax += Math.sin(L.theta) * T_MAG;
    ay -= Math.cos(L.theta) * T_MAG;
    state.fuel = Math.max(0, state.fuel - BURN_RATE * dt);
  }
  state.flame = thrusting ? (REDUCED ? 1 : (state.flame + dt * 28) % 1) : 0;

  // mechanism: semi-implicit (symplectic) Euler — update velocity first, then
  // position. Explicit Euler under constant gravity is energy-gain and visibly
  // springy; symplectic is stable and matches the cabinet's feel.
  L.vx += ax * dt; L.vy += ay * dt;
  L.x  += L.vx * dt; L.y += L.vy * dt;
  L.x = Math.max(4, Math.min(W - 4, L.x));

  // mechanism: terrain test sample-per-frame at the new x. The lander is
  // small (~14 px) and frame dt is clamped at 50 ms, so a single substep is
  // sufficient — the heightmap is C0-continuous so we never tunnel a ridge.
  const groundY = terrainAt(L.x);
  if (L.y >= groundY) {
    L.y = groundY;
    const onPad = L.x >= state.pad.x0 && L.x <= state.pad.x1
               && Math.abs(groundY - state.pad.y) < 0.5;
    const soft  = onPad
               && Math.abs(L.vx) < V_SAFE_X
               && Math.abs(L.vy) < V_SAFE_Y
               && Math.abs(L.theta) < TILT_SAFE;
    state.status = soft ? 'win' : 'dead';
    if (!soft && !REDUCED) state.flash = 0.25;
    L.vx = 0; L.vy = 0;   // freeze on contact; no jitter, no slide
  }
}

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
  // Letterbox the logical 480×320 into the stage; the orange CSS bg shows
  // around the edges as a frame, the playfield itself is black.
  const sc = Math.min(cw / W, ch / H);
  const ox = (cw - W*sc) / 2, oy = (ch - H*sc) / 2;

  ctx.fillStyle = '#ff5e3a'; ctx.fillRect(0, 0, cw, ch);
  ctx.save();
  ctx.translate(ox, oy); ctx.scale(sc, sc);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

  // Crash flash: a single-frame red wash over the playfield.
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,94,58,${state.flash * 2})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Terrain ridge as one polyline; pad segment over-stroked in arcade orange.
  ctx.lineWidth = 1.5 / sc;
  ctx.strokeStyle = '#e8e8f0';
  const dx = W / (N_TERRAIN - 1);
  ctx.beginPath();
  ctx.moveTo(0, state.terrain[0]);
  for (let i = 1; i < N_TERRAIN; i++) ctx.lineTo(i * dx, state.terrain[i]);
  ctx.stroke();
  ctx.strokeStyle = '#ff5e3a';
  ctx.beginPath();
  ctx.moveTo(state.pad.x0, state.pad.y);
  ctx.lineTo(state.pad.x1, state.pad.y);
  ctx.stroke();

  drawLander();

  // HUD: altitude above local terrain, vx, vy, fuel bar. Top-left, dim mono.
  ctx.fillStyle = '#888'; ctx.font = `${11/sc}px ui-monospace, monospace`;
  const L = state.lander;
  const alt = Math.max(0, terrainAt(L.x) - L.y);
  ctx.fillText(`alt ${alt.toFixed(0).padStart(3,' ')}  vx ${L.vx.toFixed(0).padStart(3,' ')}  vy ${L.vy.toFixed(0).padStart(3,' ')}`, 6, 14);
  ctx.fillText(`fuel`, 6, 28);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1 / sc;
  ctx.strokeRect(30, 21, 60, 8);
  ctx.fillStyle = state.fuel < 20 ? '#ff5e3a' : '#888';
  ctx.fillRect(30, 21, 60 * (state.fuel / FUEL_START), 8);

  if (state.status !== 'play') {
    ctx.fillStyle = state.status === 'win' ? '#e8e8f0' : '#ff5e3a';
    ctx.font = `${18/sc}px ui-monospace, monospace`;
    const msg = state.status === 'win' ? 'TOUCHDOWN — press R' : 'CRASH — press R';
    ctx.fillText(msg, (W - ctx.measureText(msg).width)/2, H/2);
  }

  if (state.input.zonesOn) drawTouchHints();
  ctx.restore();
}

function drawLander() {
  // mechanism: 14-px isoceles triangle with two leg ticks; θ=0 points up.
  // Flame is a smaller inverted triangle below; flicker omitted under
  // prefers-reduced-motion. After death we still draw the body in place so
  // the player sees where the impact happened.
  const L = state.lander;
  ctx.save();
  ctx.translate(L.x, L.y - 7);   // origin at body centre, feet ~7 px below
  ctx.rotate(L.theta);
  ctx.strokeStyle = '#e8e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -7); ctx.lineTo(6, 5); ctx.lineTo(-6, 5); ctx.closePath();
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, 5); ctx.lineTo(-7, 8); ctx.moveTo(5, 5); ctx.lineTo(7, 8); ctx.stroke();
  if (state.input.thrust && state.fuel > 0 && state.status === 'play' && (REDUCED || state.flame < 0.55)) {
    ctx.strokeStyle = '#ff5e3a';
    ctx.beginPath();
    ctx.moveTo(-3, 5); ctx.lineTo(0, 11 + (REDUCED ? 0 : state.flame*3)); ctx.lineTo(3, 5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTouchHints() {
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1 / 1;
  ctx.strokeRect(0, 0, W/3, H);
  ctx.strokeRect(W*2/3, 0, W/3, H);
  ctx.strokeRect(W/3, H*0.7, W/3, H*0.3);
}

// --- Input -------------------------------------------------------------
function bindInput() {
  const inp = state.input;
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if      (e.code === 'ArrowLeft')  inp.rotL = true;
    else if (e.code === 'ArrowRight') inp.rotR = true;
    else if (e.code === 'ArrowUp')    inp.thrust = true;
    else if (e.code === 'KeyR')       inp.restart = true;
  }, { passive: false });
  addEventListener('keyup', (e) => {
    if      (e.code === 'ArrowLeft')  inp.rotL = false;
    else if (e.code === 'ArrowRight') inp.rotR = false;
    else if (e.code === 'ArrowUp')    inp.thrust = false;
  }, { passive: false });
  // Clear held-input flags on blur so a stuck ArrowUp doesn't auto-thrust on
  // resume — explicit per spec "Failure modes".
  addEventListener('blur', () => { inp.rotL = inp.rotR = inp.thrust = false; });

  // Touch: left third = tilt ccw, right third = tilt cw, bottom-center pad =
  // thrust, two-finger tap (any time) = restart. preventDefault to suppress
  // tap-delay and viewport scroll.
  const stage = document.getElementById('stage');
  function zoneOf(t) {
    const r = stage.getBoundingClientRect();
    const x = (t.clientX - r.left) / r.width, y = (t.clientY - r.top) / r.height;
    if (y > 0.7 && x > 0.33 && x < 0.67) return 'thrust';
    if (x < 0.33) return 'left';
    if (x > 0.67) return 'right';
    return null;
  }
  function refreshHeld() {
    inp.rotL = inp.rotR = inp.thrust = false;
    for (const z of inp.touches.values()) {
      if (z === 'left')   inp.rotL = true;
      if (z === 'right')  inp.rotR = true;
      if (z === 'thrust') inp.thrust = true;
    }
    inp.zonesOn = inp.touches.size > 0;
  }
  stage.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length >= 2) { inp.restart = true; return; }
    for (const t of e.changedTouches) {
      const z = zoneOf(t); if (z) inp.touches.set(t.identifier, z);
    }
    refreshHeld();
  }, { passive:false });
  stage.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (inp.touches.has(t.identifier)) {
        const z = zoneOf(t); if (z) inp.touches.set(t.identifier, z);
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
  if (paused) state.input.rotL = state.input.rotR = state.input.thrust = false;
});

// --- Block default scroll for game keys --------------------------------
const PREVENT_KEYS = new Set([
  'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
  'Space','KeyW','KeyA','KeyS','KeyD','KeyR'
]);
addEventListener('keydown', (e) => { if (PREVENT_KEYS.has(e.code)) e.preventDefault(); }, { passive: false });
addEventListener('keyup',   (e) => { if (PREVENT_KEYS.has(e.code)) e.preventDefault(); }, { passive: false });

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
