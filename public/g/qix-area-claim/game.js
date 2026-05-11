// Primitive: qix-area-claim
// Player verb: ride the boundary, peel into the void, close a polygon to claim
// the side the Qix isn't on.
// Mechanism summary: cell grid (VOID/BOUNDARY/CLAIMED/DRAWING). Marker walks
// only adjacent BOUNDARY|CLAIMED cells while not drawing; Space + heading
// commits to DRAWING and forced-motion. On contact with BOUNDARY|CLAIMED, the
// trail promotes to BOUNDARY and a single 4-flood from the Qix's cell defines
// reachable VOID — everything still VOID becomes CLAIMED. Win at 75%.

// --- Constants ---------------------------------------------------------
const W = 200, H = 150;
const VOID = 0, BOUNDARY = 1, CLAIMED = 2, DRAWING = 3;
const TARGET_PERCENT = 0.75;
const MARKER_SPEED = 60;            // cells/sec
const QIX_SPEED    = 70;            // cells/sec
const QIX_LEN      = 14;            // cells
const QIX_OMEGA    = 3.0;           // rad/sec
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- State -------------------------------------------------------------
const state = {
  grid: new Uint8Array(W * H),
  marker: { gx: 0, gy: 0, dx: 0, dy: 0, drawing: false, sub: 0 },
  trail: [],
  qix: { x: W/2, y: H/2, vx: 0, vy: 0, angle: 0 },
  input: { up:false, down:false, left:false, right:false, draw:false, restart:false },
  claimed: 0,
  status: 'play',
  touches: new Map(),
};

function idx(x, y) { return y * W + x; }

function reset() {
  // mechanism: outer ring is BOUNDARY; the marker's home graph is the
  // 1-cell-thick rectangle. Slide-walking restricts motion to BOUNDARY|CLAIMED
  // cells, so this ring is the only initial track until the first claim.
  state.grid.fill(VOID);
  for (let x = 0; x < W; x++) { state.grid[idx(x,0)] = BOUNDARY; state.grid[idx(x,H-1)] = BOUNDARY; }
  for (let y = 0; y < H; y++) { state.grid[idx(0,y)] = BOUNDARY; state.grid[idx(W-1,y)] = BOUNDARY; }
  const m = state.marker;
  m.gx = 0; m.gy = 0; m.dx = 0; m.dy = 0; m.drawing = false; m.sub = 0;
  state.trail.length = 0;
  const a = Math.random() * Math.PI * 2;
  state.qix.x = W/2; state.qix.y = H/2;
  state.qix.vx = Math.cos(a) * QIX_SPEED; state.qix.vy = Math.sin(a) * QIX_SPEED;
  state.qix.angle = 0;
  state.claimed = 0; state.status = 'play';
}
reset();

// --- Tick --------------------------------------------------------------
function tick(dt) {
  const inp = state.input;
  if (inp.restart) { reset(); inp.restart = false; return; }
  if (state.status !== 'play') return;

  // Heading from 4-way input; 4-way snap prefers vertical when both axes held.
  let hx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  let hy = (inp.down  ? 1 : 0) - (inp.up   ? 1 : 0);
  if (hx && hy) hx = 0;
  const m = state.marker;

  if (!m.drawing) {
    // mechanism: boundary-walk. Step only to neighbours of state BOUNDARY or
    // CLAIMED. Heading into VOID with Space held commits to DRAW: paint the
    // entered cell DRAWING and seed the trail.
    m.sub += MARKER_SPEED * dt;
    while (m.sub >= 1) {
      m.sub -= 1;
      if (!hx && !hy) break;
      const nx = m.gx + hx, ny = m.gy + hy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) break;
      const cs = state.grid[idx(nx, ny)];
      if (cs === BOUNDARY || cs === CLAIMED) { m.gx = nx; m.gy = ny; }
      else if (cs === VOID && inp.draw) {
        m.drawing = true; m.dx = hx; m.dy = hy;
        m.gx = nx; m.gy = ny;
        state.grid[idx(nx, ny)] = DRAWING;
        state.trail.length = 0; state.trail.push({ x: nx, y: ny });
      } else break;
    }
  } else {
    // mechanism: forced-motion draw. Marker advances at constant speed in its
    // last heading; the player can turn but cannot stop. Crossing own trail =
    // death. Substep at most 1 cell so we never skip a thin wall.
    if (hx || hy) { m.dx = hx; m.dy = hy; }
    m.sub += MARKER_SPEED * dt;
    while (m.sub >= 1 && m.drawing && state.status === 'play') {
      m.sub -= 1;
      const nx = m.gx + m.dx, ny = m.gy + m.dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) { die(); break; }
      const cs = state.grid[idx(nx, ny)];
      if (cs === DRAWING) { die(); break; }
      if (cs === VOID) {
        m.gx = nx; m.gy = ny;
        state.grid[idx(nx, ny)] = DRAWING;
        state.trail.push({ x: nx, y: ny });
      } else { m.gx = nx; m.gy = ny; closePolygon(); break; }
    }
  }

  // mechanism: Qix integrates linear motion; the segment rotates about its
  // midpoint. Bounce on any non-VOID cell — BOUNDARY ring, CLAIMED islands,
  // live DRAWING trail. Per-bounce angle perturbation prevents periodic orbits.
  if (!REDUCED) state.qix.angle += QIX_OMEGA * dt;
  const nx = state.qix.x + state.qix.vx * dt, ny = state.qix.y + state.qix.vy * dt;
  if (!isVoidCell(nx, state.qix.y)) state.qix.vx = -state.qix.vx;
  if (!isVoidCell(state.qix.x, ny)) state.qix.vy = -state.qix.vy;
  // Apply perturbation only on a bounce so straight glides stay quiet.
  if (state.qix.vx * (nx - state.qix.x) < 0 || state.qix.vy * (ny - state.qix.y) < 0) {
    const a = Math.atan2(state.qix.vy, state.qix.vx) + (Math.random() - 0.5) * 0.3;
    state.qix.vx = Math.cos(a) * QIX_SPEED; state.qix.vy = Math.sin(a) * QIX_SPEED;
  }
  state.qix.x += state.qix.vx * dt; state.qix.y += state.qix.vy * dt;
  // Clamp so it can't drift outside the field if a bounce was missed.
  state.qix.x = Math.max(0.5, Math.min(W - 1.5, state.qix.x));
  state.qix.y = Math.max(0.5, Math.min(H - 1.5, state.qix.y));

  // mechanism: trail-kill. Rasterise the segment via Bresenham; if any cell
  // touched is DRAWING, the run ends.
  if (m.drawing) {
    const c = Math.cos(state.qix.angle) * QIX_LEN/2;
    const s = Math.sin(state.qix.angle) * QIX_LEN/2;
    if (segmentHitsDrawing(state.qix.x + c, state.qix.y + s, state.qix.x - c, state.qix.y - s)) die();
  }
}

function isVoidCell(fx, fy) {
  const x = Math.floor(fx), y = Math.floor(fy);
  if (x < 0 || x >= W || y < 0 || y >= H) return false;
  return state.grid[idx(x, y)] === VOID;
}

function die() {
  // Revert in-flight trail to VOID so the corpse view is clean, then 'dead'.
  for (const c of state.trail) state.grid[idx(c.x, c.y)] = VOID;
  state.trail.length = 0;
  state.marker.drawing = false;
  state.status = 'dead';
}

function segmentHitsDrawing(x0, y0, x1, y1) {
  // Integer Bresenham over cells — DRAWING fills the cell so cell-stack
  // testing suffices.
  let cx = Math.floor(x0), cy = Math.floor(y0);
  const ex = Math.floor(x1), ey = Math.floor(y1);
  const dx = Math.abs(ex - cx), dy = Math.abs(ey - cy);
  const sx = cx < ex ? 1 : -1, sy = cy < ey ? 1 : -1;
  let err = dx - dy, n = dx + dy + 1;
  while (n-- > 0) {
    if (cx >= 0 && cx < W && cy >= 0 && cy < H && state.grid[idx(cx, cy)] === DRAWING) return true;
    if (cx === ex && cy === ey) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 <  dx) { err += dx; cy += sy; }
  }
  return false;
}

function closePolygon() {
  // mechanism: Gendel single-flood. Promote trail to BOUNDARY, 4-flood from
  // the Qix's cell across VOID. Anything still VOID after the flood is the
  // unreachable side — that side becomes CLAIMED. Degenerate trail (<3 cells)
  // is rejected as death so the player can't soft-lock with zero-area claims.
  const t = state.trail;
  if (t.length < 3) { die(); return; }

  for (const c of t) state.grid[idx(c.x, c.y)] = BOUNDARY;

  // Seed: Qix cell. If the Qix happens to sit on the freshly-promoted trail,
  // nudge it one cell along its velocity into real VOID.
  let sx = Math.max(0, Math.min(W-1, Math.floor(state.qix.x)));
  let sy = Math.max(0, Math.min(H-1, Math.floor(state.qix.y)));
  if (state.grid[idx(sx, sy)] !== VOID) {
    sx = Math.max(0, Math.min(W-1, sx + (Math.sign(state.qix.vx) || 1)));
    sy = Math.max(0, Math.min(H-1, sy + (Math.sign(state.qix.vy) || 0)));
  }

  const visited = new Uint8Array(W * H);
  if (state.grid[idx(sx, sy)] === VOID) {
    const stack = [sx, sy]; visited[idx(sx, sy)] = 1;
    const push = (x, y) => {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const i = idx(x, y);
      if (visited[i] || state.grid[i] !== VOID) return;
      visited[i] = 1; stack.push(x, y);
    };
    while (stack.length) {
      const y = stack.pop(), x = stack.pop();
      push(x+1, y); push(x-1, y); push(x, y+1); push(x, y-1);
    }
  }

  let gained = 0;
  for (let i = 0; i < state.grid.length; i++)
    if (state.grid[i] === VOID && !visited[i]) { state.grid[i] = CLAIMED; gained++; }
  state.claimed += gained;
  state.trail.length = 0;
  state.marker.drawing = false;
  state.marker.dx = 0; state.marker.dy = 0;
  if (state.claimed / (W * H) >= TARGET_PERCENT) state.status = 'win';
}

// --- Render ------------------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const offCanvas = document.createElement('canvas');
offCanvas.width = W; offCanvas.height = H;
const offCtx = offCanvas.getContext('2d');
const offImg = offCtx.createImageData(W, H);
const offBuf = new Uint32Array(offImg.data.buffer);

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
  const sc = Math.min(cw / W, ch / H);
  const sw = W * sc, sh = H * sc;
  const ox = (cw - sw) / 2, oy = (ch - sh) / 2;

  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);

  // mechanism: pack the grid as ABGR pixels into a 1:1 offscreen canvas,
  // then drawImage-scale. One putImageData/frame instead of 30k fillRects.
  for (let i = 0; i < state.grid.length; i++) {
    const g = state.grid[i];
    offBuf[i] = g === VOID ? 0xff140a0a : g === BOUNDARY ? 0xff3a2a2a : g === CLAIMED ? 0xff3fd2ff : 0xffc45eff;
  }
  offCtx.putImageData(offImg, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offCanvas, ox, oy, sw, sh);

  ctx.save();
  ctx.translate(ox, oy); ctx.scale(sc, sc);
  const m = state.marker;
  ctx.fillStyle = '#e8e8f0';
  ctx.beginPath();
  ctx.moveTo(m.gx + 0.5, m.gy - 1); ctx.lineTo(m.gx + 2, m.gy + 0.5);
  ctx.lineTo(m.gx + 0.5, m.gy + 2); ctx.lineTo(m.gx - 1, m.gy + 0.5);
  ctx.closePath(); ctx.fill();
  const c = Math.cos(state.qix.angle) * QIX_LEN/2, s = Math.sin(state.qix.angle) * QIX_LEN/2;
  ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(state.qix.x + c, state.qix.y + s);
  ctx.lineTo(state.qix.x - c, state.qix.y - s);
  ctx.stroke();
  ctx.restore();

  const pct = Math.floor(state.claimed / (W * H) * 100);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, cw, 22);
  ctx.fillStyle = 'rgba(255,210,63,0.55)'; ctx.fillRect(0, 0, cw * (pct / 100), 22);
  ctx.fillStyle = '#e8e8f0'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`${pct}% / ${Math.floor(TARGET_PERCENT*100)}%`, 8, 15);

  if (state.status !== 'play') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, ch/2 - 30, cw, 60);
    ctx.fillStyle = '#e8e8f0'; ctx.font = '18px ui-monospace, monospace';
    const msg = state.status === 'win' ? 'CLAIMED — press R' : 'DEAD — press R';
    ctx.fillText(msg, (cw - ctx.measureText(msg).width) / 2, ch/2 + 6);
  }
  if (matchMedia('(pointer: coarse)').matches) drawTouchUI(cw, ch);
}

function drawTouchUI(cw, ch) {
  ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(255,210,63,0.18)';
  const px = 12, py = ch - 12 - 132, sz = 44;
  ctx.strokeRect(px + sz,    py,        sz, sz);  // up
  ctx.strokeRect(px,         py + sz,   sz, sz);  // left
  ctx.strokeRect(px + sz*2,  py + sz,   sz, sz);  // right
  ctx.strokeRect(px + sz,    py + sz*2, sz, sz);  // down
  const dx = cw - 12 - 56, dy = ch - 12 - 56;
  ctx.beginPath(); ctx.arc(dx + 28, dy + 28, 28, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#e8e8f0'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('DRAW', dx + 12, dy + 32);
  ctx.strokeRect(cw - 56, 28, 44, 30); ctx.fillText('R', cw - 38, 49);
}

// --- Input -------------------------------------------------------------
function bindInput() {
  const inp = state.input;
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if      (e.code === 'ArrowUp'    || e.code === 'KeyW') inp.up    = true;
    else if (e.code === 'ArrowDown'  || e.code === 'KeyS') inp.down  = true;
    else if (e.code === 'ArrowLeft'  || e.code === 'KeyA') inp.left  = true;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') inp.right = true;
    else if (e.code === 'Space')                           inp.draw  = true;
    else if (e.code === 'KeyR')                            inp.restart = true;
  });
  addEventListener('keyup', (e) => {
    if      (e.code === 'ArrowUp'    || e.code === 'KeyW') inp.up    = false;
    else if (e.code === 'ArrowDown'  || e.code === 'KeyS') inp.down  = false;
    else if (e.code === 'ArrowLeft'  || e.code === 'KeyA') inp.left  = false;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') inp.right = false;
    else if (e.code === 'Space')                           inp.draw  = false;
  });

  const stage = document.getElementById('stage');
  function zoneAt(t) {
    const r = stage.getBoundingClientRect();
    const x = t.clientX - r.left, y = t.clientY - r.top;
    const cw = r.width, ch = r.height, sz = 44;
    const px = 12, py = ch - 12 - 132;
    if (x >= px + sz   && x < px + sz*2 && y >= py        && y < py + sz)    return 'up';
    if (x >= px        && x < px + sz   && y >= py + sz   && y < py + sz*2)  return 'left';
    if (x >= px + sz*2 && x < px + sz*3 && y >= py + sz   && y < py + sz*2)  return 'right';
    if (x >= px + sz   && x < px + sz*2 && y >= py + sz*2 && y < py + sz*3)  return 'down';
    const dx = cw - 12 - 56, dy = ch - 12 - 56;
    if ((x - (dx+28))**2 + (y - (dy+28))**2 < 28*28) return 'draw';
    if (x >= cw - 56 && x < cw - 12 && y >= 28 && y < 58) return 'restart';
    return null;
  }
  function refresh() {
    inp.up = inp.down = inp.left = inp.right = inp.draw = false;
    for (const z of state.touches.values()) if (z !== 'restart') inp[z] = true;
  }
  stage.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const z = zoneAt(t);
      if (z === 'restart') { inp.restart = true; continue; }
      if (z) state.touches.set(t.identifier, z);
    }
    refresh();
  }, { passive: false });
  stage.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) if (state.touches.has(t.identifier)) {
      const z = zoneAt(t);
      if (z && z !== 'restart') state.touches.set(t.identifier, z);
    }
    refresh();
  }, { passive: false });
  const endTouch = (e) => {
    for (const t of e.changedTouches) state.touches.delete(t.identifier);
    refresh();
  };
  stage.addEventListener('touchend', endTouch);
  stage.addEventListener('touchcancel', endTouch);

  // Stuck Space across a tab swap would auto-draw on focus return.
  addEventListener('blur', () => {
    inp.up = inp.down = inp.left = inp.right = inp.draw = false;
    state.touches.clear();
  });
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
  if (paused) {
    const inp = state.input;
    inp.up = inp.down = inp.left = inp.right = inp.draw = false;
    state.touches.clear();
  }
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
