// Primitive: defender-of-the-crown-catapult
// Player verb: drag the playfield to load the sling, release to launch.
// Mechanism: direct-impulse slingshot. Pull vector → launch velocity via a
// single PULL multiplier. Pointer events cover mouse and touch in one path;
// physics is semi-implicit Euler with substepping so high-power shots can't
// tunnel a 14-px brick. WIN before LOSE in endShot so a final-stone breach
// counts.

// --- Constants ---------------------------------------------------------
// Logical 480×270 landscape, letterbox-scaled to stage. Tunable feel knobs:
//   PULL      — how much velocity each logical drag-pixel grants
//   MAX_PULL  — clamp on drag distance (in logical px)
// At PULL=3.5, MAX_PULL=100, GRAVITY=320 and pivot/wall geometry below, the
// sweet spot for hitting the wall is ~70–80 px of drag at roughly 45°. Full
// draw overshoots; half draw falls short. That's the verb.
const W = 480, H = 270;
const GROUND_Y = 240;
const GRAVITY = 320;
const PULL = 3.5;
const MAX_PULL = 100;
const PIVOT = { x: 60, y: GROUND_Y - 10 };
const ARM_LEN = 22;
const REST_ARM_RAD = -Math.PI / 4;          // up-right resting pose

// Castle wall: 6 cols × 8 rows = 48 bricks. Halve to win (≤24 remaining).
const MAX_STONES = 5;
const BRICK_W = 14, BRICK_H = 10;
const COLS = 6, ROWS = 8;
const WALL_X = 240;
const WALL_Y_BOTTOM = GROUND_Y;
const WIN_REMAINING = 24;

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- State -------------------------------------------------------------
// drag and shot are nullable — their presence IS the state. No FSM needed
// beyond a status enum for the win/lose banner.
const state = {
  drag: null,                 // { ox, oy, dx, dy } in LOGICAL px (post-letterbox)
  shot: null,                 // { x, y, vx, vy } while airborne
  stonesLeft: MAX_STONES,
  bricks: new Uint8Array(COLS * ROWS),
  puff: null,                 // { x, y, ttl } small dust on terminate
  flash: 0,
  status: 'aim',              // 'aim' | 'fly' | 'win' | 'lose'
};

function reset() {
  state.drag = null;
  state.shot = null;
  state.stonesLeft = MAX_STONES;
  state.bricks.fill(1);
  state.puff = null;
  state.flash = 0;
  state.status = 'aim';
}
reset();

function bricksRemaining() {
  let n = 0;
  for (let i = 0; i < state.bricks.length; i++) if (state.bricks[i]) n++;
  return n;
}

function brickRect(col, row) {
  const x = WALL_X + col * BRICK_W;
  const y = WALL_Y_BOTTOM - (ROWS - row) * BRICK_H;
  return { x, y, w: BRICK_W, h: BRICK_H };
}

// --- Tick --------------------------------------------------------------
function tick(dt) {
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
  if (state.puff) { state.puff.ttl -= dt; if (state.puff.ttl <= 0) state.puff = null; }

  if (state.status !== 'fly') return;

  const s = state.shot;
  if (!s) { state.status = 'aim'; return; }

  // mechanism: substep so a high-power shot can't tunnel a 14-px brick in
  // one tick. ceil(speed·dt / 4) → at most one quarter-brick per sub-step.
  const speed = Math.hypot(s.vx, s.vy);
  const steps = Math.max(1, Math.ceil(speed * dt / 4));
  const sdt = dt / steps;
  for (let i = 0; i < steps && state.status === 'fly'; i++) {
    s.vy += GRAVITY * sdt;                       // semi-implicit: v before x
    s.x  += s.vx * sdt;
    s.y  += s.vy * sdt;
    if (s.y >= GROUND_Y)        { endShot('ground'); break; }
    if (s.x < 0 || s.x > W)     { endShot('off');    break; }
    const hit = brickHitAt(s.x, s.y);
    if (hit) { removeBrick(hit, s); endShot('hit'); break; }
  }
}

function launch() {
  // mechanism: direct impulse. Pull vector flips sign → launch velocity.
  // Stone is born at the pivot's cup (10 px above pivot) so it visibly
  // leaves the catapult, not the ground.
  const d = state.drag;
  if (!d || (d.dx === 0 && d.dy === 0)) { state.drag = null; return; }
  state.shot = {
    x: PIVOT.x,
    y: PIVOT.y - 6,
    vx: -d.dx * PULL,
    vy: -d.dy * PULL,
  };
  state.drag = null;
  state.stonesLeft -= 1;
  state.status = 'fly';
}

function brickHitAt(x, y) {
  if (x < WALL_X - 1 || x > WALL_X + COLS * BRICK_W + 1) return null;
  if (y > GROUND_Y || y < GROUND_Y - ROWS * BRICK_H - 1) return null;
  const col = Math.floor((x - WALL_X) / BRICK_W);
  if (col < 0 || col >= COLS) return null;
  const dyFromGround = GROUND_Y - y;
  const rowFromBottom = Math.floor(dyFromGround / BRICK_H);
  if (rowFromBottom < 0 || rowFromBottom >= ROWS) return null;
  const row = ROWS - 1 - rowFromBottom;
  const i = row * COLS + col;
  if (!state.bricks[i]) return null;
  return { col, row };
}

function removeBrick(hit, s) {
  state.bricks[hit.row * COLS + hit.col] = 0;
  state.flash = 0.08;
  state.puff = { x: s.x, y: s.y, ttl: 0.15 };
}

function endShot(_reason) {
  // mechanism: WIN before LOSE — a final-stone breach must register as a
  // win, not as exhaustion. Order is load-bearing.
  state.shot = null;
  if (bricksRemaining() <= WIN_REMAINING)   state.status = 'win';
  else if (state.stonesLeft <= 0)           state.status = 'lose';
  else                                      state.status = 'aim';
}

// --- Render ------------------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let scale = 1, offsetX = 0, offsetY = 0;     // letterbox transform (set by resize)

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const stage = document.getElementById('stage');
  const cw = stage.clientWidth, ch = stage.clientHeight;
  canvas.width  = Math.floor(cw * dpr);
  canvas.height = Math.floor(ch * dpr);
  canvas.style.width  = cw + 'px';
  canvas.style.height = ch + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scale   = Math.min(cw / W, ch / H);
  offsetX = (cw - W * scale) / 2;
  offsetY = (ch - H * scale) / 2;
}

function clientToLogical(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (clientX - r.left - offsetX) / scale,
    y: (clientY - r.top  - offsetY) / scale,
  };
}

function render() {
  const cw = canvas.clientWidth, ch = canvas.clientHeight;

  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, cw, ch);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Ground
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 0.5); ctx.lineTo(W, GROUND_Y + 0.5); ctx.stroke();

  drawCastle();

  // Bricks
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!state.bricks[r * COLS + c]) continue;
      const br = brickRect(c, r);
      ctx.fillStyle = '#7a8a99';
      ctx.fillRect(br.x, br.y, br.w, br.h);
      ctx.strokeStyle = '#5b76ff'; ctx.lineWidth = 1;
      ctx.strokeRect(br.x + 0.5, br.y + 0.5, br.w - 1, br.h - 1);
    }
  }

  drawCatapult();

  // Pull vector (dashed line from gesture origin to current pointer)
  if (state.drag && (state.drag.dx !== 0 || state.drag.dy !== 0)) {
    ctx.strokeStyle = '#d4a418'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(state.drag.ox, state.drag.oy);
    ctx.lineTo(state.drag.ox + state.drag.dx, state.drag.oy + state.drag.dy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Projectile
  if (state.shot) {
    ctx.fillStyle = '#e8e8f0';
    ctx.beginPath(); ctx.arc(state.shot.x, state.shot.y, 2.4, 0, Math.PI * 2); ctx.fill();
  }

  // Hit flash
  if (!REDUCED && state.flash > 0 && state.puff) {
    ctx.strokeStyle = '#ff5e3a'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(state.puff.x, state.puff.y, 6 + (1 - state.flash / 0.08) * 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (state.puff) {
    ctx.fillStyle = `rgba(232,232,240,${Math.max(0, state.puff.ttl / 0.15) * 0.7})`;
    ctx.beginPath();
    ctx.arc(state.puff.x, state.puff.y, 3 + (1 - state.puff.ttl / 0.15) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // HUD
  ctx.fillStyle = '#e8e8f0';
  ctx.font = '10px ui-monospace, monospace';
  ctx.textBaseline = 'top';
  const stonesTxt = `STONES ${state.stonesLeft}`;
  ctx.fillText(stonesTxt, 6, 6);
  if (state.status === 'aim' && !state.drag) {
    const hint = 'DRAG TO LOAD · RELEASE TO LAUNCH';
    ctx.fillStyle = 'rgba(232,232,240,0.45)';
    ctx.fillText(hint, (W - ctx.measureText(hint).width) / 2, H - 14);
  }

  // End-state banner
  if (state.status === 'win' || state.status === 'lose') {
    ctx.fillStyle = 'rgba(10,10,20,0.75)';
    ctx.fillRect(0, H/2 - 24, W, 48);
    ctx.fillStyle = state.status === 'win' ? '#5b76ff' : '#e8e8f0';
    ctx.font = '16px ui-monospace, monospace';
    ctx.textBaseline = 'alphabetic';
    const msg = state.status === 'win' ? 'BREACH — tap to reset' : 'OUT OF STONES — tap to reset';
    ctx.fillText(msg, (W - ctx.measureText(msg).width) / 2, H/2 + 6);
    ctx.textBaseline = 'top';
  }

  ctx.restore();
}

function drawCastle() {
  ctx.fillStyle = '#1a1a28';
  const wx = WALL_X - 4, wy = WALL_Y_BOTTOM - ROWS * BRICK_H - 6;
  ctx.fillRect(wx, wy, COLS * BRICK_W + 8, ROWS * BRICK_H + 6);
  ctx.fillRect(WALL_X - 10, wy - 10, 8, ROWS * BRICK_H + 16);
  ctx.fillRect(WALL_X + COLS * BRICK_W + 2, wy - 10, 8, ROWS * BRICK_H + 16);
  ctx.fillStyle = '#0a0a14';
  for (let i = 0; i < 2; i++) {
    ctx.fillRect(WALL_X - 10 + i*4, wy - 10, 2, 4);
    ctx.fillRect(WALL_X + COLS * BRICK_W + 2 + i*4, wy - 10, 2, 4);
  }
}

function drawCatapult() {
  // V-base
  ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PIVOT.x - 12, GROUND_Y);
  ctx.lineTo(PIVOT.x,       PIVOT.y);
  ctx.lineTo(PIVOT.x + 12,  GROUND_Y);
  ctx.closePath(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(PIVOT.x - 16, GROUND_Y); ctx.lineTo(PIVOT.x + 16, GROUND_Y);
  ctx.stroke();

  // Arm: rotates opposite the pull direction. Resting pose is up-right (-π/4),
  // so an unloaded catapult reads correctly. Cosmetic only — physics uses the
  // pull vector directly.
  const d = state.drag;
  const armRad = (d && (d.dx !== 0 || d.dy !== 0))
    ? Math.atan2(-d.dy, -d.dx)
    : REST_ARM_RAD;
  const tipX = PIVOT.x + Math.cos(armRad) * ARM_LEN;
  const tipY = PIVOT.y + Math.sin(armRad) * ARM_LEN;
  ctx.strokeStyle = '#5b76ff'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PIVOT.x, PIVOT.y);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.fillStyle = '#5b76ff';
  ctx.beginPath(); ctx.arc(tipX, tipY, 3, 0, Math.PI * 2); ctx.fill();

  // Loaded stone in cup whenever there's no shot in flight and we have ammo
  if (!state.shot && state.stonesLeft > 0 && state.status !== 'win' && state.status !== 'lose') {
    ctx.fillStyle = '#e8e8f0';
    ctx.beginPath(); ctx.arc(tipX, tipY, 2.2, 0, Math.PI * 2); ctx.fill();
  }
}

// --- Input -------------------------------------------------------------
function clampPull(dx, dy) {
  const d = Math.hypot(dx, dy);
  if (d <= MAX_PULL) return { dx, dy };
  return { dx: dx * MAX_PULL / d, dy: dy * MAX_PULL / d };
}

function bindInput() {
  let activePointer = null;

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    // End-state: any tap resets.
    if (state.status === 'win' || state.status === 'lose') { reset(); return; }
    // Mid-flight: ignore drag attempts.
    if (state.status === 'fly') return;
    if (state.stonesLeft <= 0) return;

    const p = clientToLogical(e.clientX, e.clientY);
    state.drag = { ox: p.x, oy: p.y, dx: 0, dy: 0 };
    activePointer = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activePointer || !state.drag) return;
    const p = clientToLogical(e.clientX, e.clientY);
    const c = clampPull(p.x - state.drag.ox, p.y - state.drag.oy);
    state.drag.dx = c.dx;
    state.drag.dy = c.dy;
  });

  function endDrag(e) {
    if (e.pointerId !== activePointer) return;
    activePointer = null;
    if (!state.drag) return;
    if (state.drag.dx === 0 && state.drag.dy === 0) { state.drag = null; return; }
    launch();
  }
  canvas.addEventListener('pointerup',     endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // Keyboard: R for restart (desktop convenience).
  addEventListener('keydown', (e) => {
    if (e.code === 'KeyR') { reset(); e.preventDefault(); }
  });

  // Clear in-progress drag on blur so a window-switch doesn't leave a stale gesture.
  addEventListener('blur', () => {
    if (state.drag) { state.drag = null; activePointer = null; }
  });
}

// --- Fullscreen toggle -------------------------------------------------
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  const stage = document.getElementById('stage');
  if (!document.fullscreenElement) {
    (stage.requestFullscreen?.() ?? stage.webkitRequestFullscreen?.());
  } else {
    document.exitFullscreen?.();
  }
});

// --- Pause on blur -----------------------------------------------------
let paused = false;
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  if (paused && state.drag) state.drag = null;
});

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
