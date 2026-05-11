// Primitive: boulder-dash-falling-rocks
// Player verb: dig dirt to reach a diamond quota while a gravity-on-grid
// cellular automaton drops rocks (and diamonds) the instant their support
// is removed.
// Mechanism summary: each keypress runs one logical turn — tryMove (dig/
// collect/horizontal-push) then scanPhysics() iterated to a fixed point.
// scanPhysics scans bottom-up: ROCK/DIAMOND with EMPTY below falls
// (FALLING); FALLING onto PLAYER kills; RESTING on ROCK/DIAMOND topples
// left-then-right into a side cell whose below is also EMPTY. tick(dt)
// only advances the 0.08 s render tween.

// --- Constants ---------------------------------------------------------
const W = 20, H = 14, CELL = 28;
const STAGE_W = W * CELL, STAGE_H = H * CELL;
const QUOTA = 4;
const SLIDE_DUR = 0.08;            // render tween, s
const SWIPE_THRESH = 24;           // px in stage-space
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EMPTY = 0, DIRT = 1, WALL = 2, ROCK = 3, DIAMOND = 4, PLAYER = 5, EXIT = 6;

// --- Seed level --------------------------------------------------------
// 20x14 hand-authored. Demonstrates dig (every step), push (R at (9,10)
// into empty pocket (10,10)), cascade (3-rock stack col 13 rows 3..5
// falls when keystone (13,6) is dug from the side; bottom rock lands on
// diamond (13,7)), crush (collect (13,7) then step DOWN -> rock above
// lands on you next scan), and quota+exit (4 reachable diamonds, 2
// unreachable in sealed chamber at (5..6,8), quota=4, exit (18,12)).
// Glyphs: # WALL, . DIRT, o EMPTY, R ROCK, D DIAMOND, P PLAYER, X EXIT.
const LEVEL = [
  '####################', // 0
  '#P............D....#', // 1   easy diamond at (14,1)
  '#..................#', // 2
  '#............R.....#', // 3   cascade column top
  '#............R.....#', // 4
  '#............R.....#', // 5
  '#..................#', // 6   row of dirt — the keystone supporting the stack
  '#...####.....D.....#', // 7   chamber wall + diamond beneath cascade at (13,7)
  '#...#DD#...........#', // 8   unreachable diamonds in sealed chamber
  '#...####...........#', // 9
  '#........RoD.......#', // 10  push-rock at (9,10), pocket at (10,10), diamond at (11,10)
  '#..................#', // 11
  '#...D.............X#', // 12  diamond (4,12) + exit (18,12)
  '####################', // 13
];

// --- State -------------------------------------------------------------
// tile[y*W+x] = code; falling[i] = 1 marks an airborne ROCK/DIAMOND; only
// FALLING cells can crush. Idle timer surfaces a "press R" hint after 4 s
// of no progress. pulse drives the exit pulse.
const state = {
  tile: new Uint8Array(W * H),
  falling: new Uint8Array(W * H),
  player: { x: 0, y: 0, alive: true },
  collected: 0,
  status: 'play',                       // 'play' | 'win' | 'dead'
  anim: { from: null, t: 0 },
  idle: 0, pulse: 0, swipe: null,
};
const idx = (x, y) => y * W + x;

function loadLevel() {
  state.tile.fill(EMPTY);
  state.falling.fill(0);
  state.collected = 0;
  state.status = 'play';
  state.anim.from = null;
  state.anim.t = 0;
  state.idle = 0;
  for (let y = 0; y < H; y++) {
    const row = LEVEL[y];
    for (let x = 0; x < W; x++) {
      const c = row[x];
      let t = EMPTY;
      if      (c === '#') t = WALL;
      else if (c === '.') t = DIRT;
      else if (c === 'R') t = ROCK;
      else if (c === 'D') t = DIAMOND;
      else if (c === 'X') t = EXIT;
      else if (c === 'P') { t = PLAYER; state.player.x = x; state.player.y = y; }
      // 'o' stays EMPTY
      state.tile[idx(x, y)] = t;
    }
  }
  state.player.alive = true;
}
loadLevel();

// --- Step (one turn) ---------------------------------------------------
// mechanism: one fresh keydown → tryMove resolves intent, then
// scanPhysics() is iterated to a fixed point so the entire cascade plays
// out atomically in one turn. Win is set inside tryMove (EXIT entry);
// death is detected after the cascade settles. Guard bound is generous —
// the seed level converges in <10 passes.
function step(dx, dy) {
  if (state.status !== 'play') return;
  const before = state.tile.slice();
  if (!tryMove(dx, dy)) return;
  let guard = 0;
  while (scanPhysics() && guard++ < 200) {}
  if (!state.player.alive) state.status = 'dead';
  state.anim.from = REDUCED ? null : before;
  state.anim.t = REDUCED ? 0 : SLIDE_DUR;
  state.idle = 0;
}

// mechanism: target cell decides. EMPTY/DIRT/DIAMOND -> walk (DIRT
// disappears, DIAMOND +1 collected). ROCK -> horizontal-only push iff
// beyond is EMPTY (pushed rock's FALLING flag cleared so it never
// inherits stale momentum). EXIT -> win iff quota met. WALL or anything
// else -> blocked.
function tryMove(dx, dy) {
  const p = state.player;
  const nx = p.x + dx, ny = p.y + dy;
  if (nx < 0 || nx >= W || ny < 0 || ny >= H) return false;
  const t = state.tile[idx(nx, ny)];
  if (t === WALL) return false;
  if (t === ROCK) {
    if (dy !== 0) return false;                       // vertical push forbidden
    const bx = nx + dx;
    if (bx < 0 || bx >= W || state.tile[idx(bx, ny)] !== EMPTY) return false;
    state.tile[idx(bx, ny)] = ROCK;
    state.falling[idx(bx, ny)] = 0;                   // pushed rock starts at rest
  } else if (t === EXIT) {
    if (state.collected < QUOTA) return false;
    state.status = 'win';
  } else if (t === DIAMOND) state.collected++;
  state.tile[idx(nx, ny)] = PLAYER;
  state.tile[idx(p.x, p.y)] = EMPTY;
  p.x = nx; p.y = ny;
  return true;
}

// mechanism: scanPhysics is the cellular-automaton heart. Bottom-up
// (y descending) with a per-pass scanned[] bitmap so each tile moves at
// most one cell per pass — the central Boulder Dash invariant. The four
// transitions per ROCK/DIAMOND at (x,y):
//   below=EMPTY            -> fall one row, FALLING set on destination.
//   FALLING + below=PLAYER -> CRUSH. Classic kill: rock that was airborne
//                             before this scan resolves onto the player.
//   FALLING + below=other  -> land, FALLING cleared. changed=true so the
//                             next pass can topple if surface is R/D.
//   RESTING + below=R/D    -> topple left-then-right into (x±1,y) iff
//                             that cell AND (x±1,y+1) are both EMPTY.
// The outer loop in step() iterates this to a fixed point so the whole
// cascade plays out in one keypress.
const scanned = new Uint8Array(W * H);
function scanPhysics() {
  let changed = false;
  scanned.fill(0);
  for (let y = H - 2; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const i = idx(x, y);
      if (scanned[i]) continue;
      const t = state.tile[i];
      if (t !== ROCK && t !== DIAMOND) continue;
      const bi = idx(x, y + 1);
      const b = state.tile[bi];
      if (b === EMPTY) {
        // Fall one cell. scanned[] guards against same-pass re-fall.
        state.tile[bi] = t; state.falling[bi] = 1;
        state.tile[i] = EMPTY; state.falling[i] = 0;
        scanned[bi] = 1; changed = true;
      } else if (state.falling[i] && b === PLAYER) {
        // CRUSH — airborne rock resolves onto player.
        state.player.alive = false;
        state.tile[bi] = t; state.falling[bi] = 0;
        state.tile[i] = EMPTY; state.falling[i] = 0;
        scanned[bi] = 1; changed = true;
      } else if (state.falling[i]) {
        // Land on solid. changed=true so next pass can check for topple.
        state.falling[i] = 0; changed = true;
      } else if (b === ROCK || b === DIAMOND) {
        // Resting on a round surface — try topple left, then right.
        if (tryTopple(x, y, -1, t) || tryTopple(x, y, +1, t)) changed = true;
      }
    }
  }
  return changed;
}

// mechanism: topple slides a resting tile into (x+s,y). Both (x+s,y) and
// (x+s,y+1) must be EMPTY — otherwise we'd infinite-loop on neighbouring
// rocks. The toppled tile inherits FALLING; scanned[] prevents same-pass
// re-fall so the player one row down isn't skipped.
function tryTopple(x, y, s, t) {
  const nx = x + s;
  if (nx < 0 || nx >= W) return false;
  if (state.tile[idx(nx, y)] !== EMPTY) return false;
  if (state.tile[idx(nx, y + 1)] !== EMPTY) return false;
  const ni = idx(nx, y);
  state.tile[ni] = t;
  state.falling[ni] = 1;
  state.tile[idx(x, y)] = EMPTY;
  state.falling[idx(x, y)] = 0;
  scanned[ni] = 1;
  return true;
}

// --- Tick --------------------------------------------------------------
// mechanism: turn-based — tick only walks down the render tween and the
// idle hint + exit-pulse clocks. No game logic here.
function tick(dt) {
  if (state.anim.t > 0) state.anim.t = Math.max(0, state.anim.t - dt);
  if (state.status === 'play') state.idle += dt;
  state.pulse += dt;
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
  // Reserve top 28 px for HUD; fit stage in remaining area.
  const HUD = 28;
  const sc = Math.min(cw / STAGE_W, (ch - HUD) / STAGE_H);
  const sw = STAGE_W * sc, sh = STAGE_H * sc;
  const ox = (cw - sw) / 2, oy = HUD + ((ch - HUD) - sh) / 2;

  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, cw, ch);

  ctx.save();
  ctx.translate(ox, oy); ctx.scale(sc, sc);

  // Direct post-step render; the 0.08 s tween is short enough that a
  // one-frame snap reads as instant at 60 Hz, so no per-cell lerp.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = state.tile[idx(x, y)];
    if (t !== EMPTY) drawCell(x * CELL, y * CELL, t);
  }

  // Status overlays.
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (state.status === 'win' || state.status === 'dead') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, STAGE_H/2 - 32, STAGE_W, 64);
    ctx.fillStyle = state.status === 'win' ? '#5b76ff' : '#e85b5b';
    ctx.font = 'bold 22px ui-monospace, monospace';
    const msg = state.status === 'win' ? 'CLEARED — press R' : 'CRUSHED — press R';
    ctx.fillText(msg, STAGE_W / 2, STAGE_H / 2);
  } else if (state.idle > 4 && state.collected < QUOTA) {
    ctx.fillStyle = 'rgba(232,232,240,0.5)';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText('press R to restart', STAGE_W / 2, STAGE_H - 14);
  }

  ctx.restore();

  // HUD bar.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, cw, HUD);
  ctx.fillStyle = '#e8e8f0';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`${state.collected} / ${QUOTA}`, 12, HUD / 2);
  ctx.textAlign = 'right';
  ctx.fillText('arrows/WASD — step  ·  R — restart', cw - 12, HUD / 2);

  if (matchMedia('(pointer: coarse)').matches) drawTouchUI(cw, ch);
}

function drawCell(px, py, t) {
  const mx = px + CELL / 2, my = py + CELL / 2;
  if (t === WALL) {
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(px, py, CELL, CELL);
    ctx.fillStyle = '#4a4a5a'; ctx.fillRect(px + 2, py + 2, CELL - 4, 2);
  } else if (t === DIRT) {
    // Solid brown + 2-px crosshatch dots — era home-8bit stippling.
    ctx.fillStyle = '#5b3a1e'; ctx.fillRect(px, py, CELL, CELL);
    ctx.fillStyle = '#7a4f2a';
    for (let i = 3; i < CELL; i += 6) for (let j = 3; j < CELL; j += 6) ctx.fillRect(px + i, py + j, 2, 2);
  } else if (t === ROCK) {
    ctx.fillStyle = '#8a8a96'; octagon(px + 2, py + 2, CELL - 4);
    ctx.fillStyle = '#b8b8c4'; ctx.fillRect(px + 7, py + 7, 3, 3);
  } else if (t === DIAMOND) {
    const r = CELL / 2 - 3;
    ctx.fillStyle = '#5b76ff'; ctx.beginPath();
    ctx.moveTo(mx, my - r); ctx.lineTo(mx + r, my); ctx.lineTo(mx, my + r); ctx.lineTo(mx - r, my);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 4, my - 4, 3, 3);
  } else if (t === EXIT) {
    // Pulse #5b76ff <-> white at 1 Hz once quota is met; dim grey before.
    const open = state.collected >= QUOTA;
    if (open && !REDUCED) {
      const k = 0.5 + 0.5 * Math.sin(state.pulse * Math.PI * 2);
      ctx.fillStyle = `rgb(${91 + (255-91)*k},${118 + (255-118)*k},255)`;
    } else ctx.fillStyle = open ? '#5b76ff' : '#4a4a5a';
    ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 1;
    ctx.strokeRect(px + 4, py + 4, CELL - 8, CELL - 8);
  } else if (t === PLAYER) {
    ctx.fillStyle = '#e8e8f0';
    ctx.beginPath(); ctx.arc(mx, py + 9, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(mx - 4, py + 13, 8, 8);
    ctx.fillRect(mx - 4, py + 21, 3, 5);
    ctx.fillRect(mx + 1, py + 21, 3, 5);
  }
}

function octagon(x, y, s) {
  const c = s * 0.3;
  ctx.beginPath();
  ctx.moveTo(x + c, y); ctx.lineTo(x + s - c, y); ctx.lineTo(x + s, y + c);
  ctx.lineTo(x + s, y + s - c); ctx.lineTo(x + s - c, y + s); ctx.lineTo(x + c, y + s);
  ctx.lineTo(x, y + s - c); ctx.lineTo(x, y + c);
  ctx.closePath(); ctx.fill();
}

function drawTouchUI(cw, ch) {
  // Single bottom-right RST FAB. Movement is via swipe on the stage.
  const r = 26, pad = 14;
  ctx.fillStyle = 'rgba(91,118,255,0.18)';
  ctx.strokeStyle = '#5b76ff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cw - r - pad, ch - r - pad, r, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8e8f0';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillText('RST', cw - r - pad, ch - r - pad);
}

// --- Input -------------------------------------------------------------
function bindInput() {
  // mechanism: one step per fresh keydown — a held arrow would auto-repeat
  // through a cascade and skip turns through falling rocks, so e.repeat
  // is ignored unconditionally.
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if      (e.code === 'ArrowUp'    || e.code === 'KeyW') step(0, -1);
    else if (e.code === 'ArrowDown'  || e.code === 'KeyS') step(0, 1);
    else if (e.code === 'ArrowLeft'  || e.code === 'KeyA') step(-1, 0);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') step(1, 0);
    else if (e.code === 'KeyR') loadLevel();
  });

  // Touch: swipe-to-step on the stage with a 24-px threshold + RST FAB.
  // We use pointer events so a stylus or trackpad drag also works.
  const stage = document.getElementById('stage');
  function isFab(cx, cy) {
    const r = 26, pad = 14;
    return (cx - (stage.clientWidth - r - pad)) ** 2 +
           (cy - (stage.clientHeight - r - pad)) ** 2 < r * r;
  }
  stage.addEventListener('pointerdown', (e) => {
    const rect = stage.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (isFab(sx, sy)) { loadLevel(); return; }
    state.swipe = { id: e.pointerId, x: sx, y: sy };
  });
  stage.addEventListener('pointerup', (e) => {
    const s = state.swipe; if (!s || s.id !== e.pointerId) return;
    const rect = stage.getBoundingClientRect();
    const dx = (e.clientX - rect.left) - s.x;
    const dy = (e.clientY - rect.top) - s.y;
    state.swipe = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESH) return;
    if (Math.abs(dx) > Math.abs(dy)) step(Math.sign(dx), 0);
    else                              step(0, Math.sign(dy));
  });
  stage.addEventListener('pointercancel', () => { state.swipe = null; });
  // Prevent scroll-while-swipe.
  stage.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
  stage.addEventListener('touchmove',  (e) => { e.preventDefault(); }, { passive: false });
}

// --- Fullscreen + pause + scroll guard + boot --------------------------
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  const stage = document.getElementById('stage');
  if (!document.fullscreenElement) (stage.requestFullscreen?.() ?? stage.webkitRequestFullscreen?.());
  else document.exitFullscreen?.();
});
let paused = false;
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  if (paused) state.swipe = null;                     // drop in-flight pointer
});
const PREVENT_KEYS = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyR']);
addEventListener('keydown', (e) => { if (PREVENT_KEYS.has(e.code)) e.preventDefault(); }, { passive: false });
addEventListener('keyup',   (e) => { if (PREVENT_KEYS.has(e.code)) e.preventDefault(); }, { passive: false });

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
