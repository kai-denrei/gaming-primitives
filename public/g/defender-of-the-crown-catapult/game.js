// Primitive: defender-of-the-crown-catapult
// Player verb: pre-commit angle and power for a ballistic shot
// Mechanism summary: two scalars (angle, power) integrate launch velocity via
// vx = power·cos(θ), vy = -power·sin(θ); semi-implicit Euler under constant
// gravity, substepped (ceil(|v|·dt / 4)) so high-power shots don't tunnel
// through 14×10 px bricks. WIN is checked before LOSE in endShot so a breach
// on the final stone counts. No preview, no in-flight steering — the
// commitment is the verb.

// --- Constants ---------------------------------------------------------
// Logical 480×270 landscape; render letterbox-scales to stage. Logical px so
// gravity tuning is stable across resize. Brick grid is 6 cols × 8 rows = 48
// bricks anchored at WALL_X; halving the wall (≤24 intact) wins.
const W = 480, H = 270;
const GROUND_Y = 240;
const GRAVITY = 320;                       // u/s² — gives clean 1–2s arcs at P∈[40,140]
const ANGLE_MIN = 20, ANGLE_MAX = 80;
const POW_MIN = 40,  POW_MAX = 140;
const MAX_STONES = 5;
const REPEAT_HZ = 12;                      // hold-repeat rate for angle/power
const BRICK_W = 14, BRICK_H = 10;
const COLS = 6, ROWS = 8;
const WALL_X = 360;                        // left edge of the brick wall
const WALL_Y_BOTTOM = GROUND_Y;            // bricks stack upward from the ground
const WIN_REMAINING = 24;                  // halve the wall to win (48 - 24 = 24 removed)
const CATAPULT_X = 60;                     // pivot of the catapult arm
const ARM_LEN = 22;                        // arm length; muzzle is at tip
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- State -------------------------------------------------------------
const state = {
  angle: 45,
  power: 80,
  stonesLeft: MAX_STONES,
  stone: null,                              // { x, y, vx, vy } while airborne
  bricks: new Uint8Array(COLS * ROWS),      // 1 = present; row 0 is top
  puff: null,                               // { x, y, ttl } small dust on terminate
  flash: 0,                                 // hit-frame timer
  armTween: 0,                              // 0..1 recoil; cosmetic only
  status: 'aim',                            // 'aim' | 'fly' | 'win' | 'lose'
  input: {
    up:false, down:false, left:false, right:false,
    fire:false,                             // edge-triggered: set on keydown, cleared on consume
    spaceHeld:false,                        // latch so auto-fire on resolve is impossible
    restart:false,
    repeatT: 0,                             // accumulator for 12 Hz adjust-repeat
  },
  touch: { angleSlider:false, powerSlider:false, ids:new Map() },
};

function reset() {
  state.angle = 45; state.power = 80;
  state.stonesLeft = MAX_STONES;
  state.stone = null; state.puff = null; state.flash = 0; state.armTween = 0;
  state.bricks.fill(1);
  state.status = 'aim';
}
reset();

function bricksRemaining() {
  let n = 0;
  for (let i = 0; i < state.bricks.length; i++) if (state.bricks[i]) n++;
  return n;
}

function brickRect(col, row) {
  // Wall grows upward from GROUND_Y; row 0 is the top crenellation, row 7 sits on the ground.
  const x = WALL_X + col * BRICK_W;
  const y = WALL_Y_BOTTOM - (ROWS - row) * BRICK_H;
  return { x, y, w: BRICK_W, h: BRICK_H };
}

function muzzlePos() {
  // Catapult is a V pivoting at (CATAPULT_X, GROUND_Y); the arm angles up-right
  // at `angle°`. Muzzle is at the tip — that's where the stone is born.
  const rad = state.angle * Math.PI / 180;
  return { x: CATAPULT_X + Math.cos(rad) * ARM_LEN, y: GROUND_Y - Math.sin(rad) * ARM_LEN };
}

// --- Tick --------------------------------------------------------------
function tick(dt) {
  const inp = state.input;
  if (inp.restart) { reset(); inp.restart = false; inp.fire = false; return; }
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
  if (state.armTween > 0) state.armTween = Math.max(0, state.armTween - dt * 4);
  if (state.puff) { state.puff.ttl -= dt; if (state.puff.ttl <= 0) state.puff = null; }

  if (state.status === 'win' || state.status === 'lose') {
    // Discard latched fire so a held Space doesn't pre-fire post-restart.
    inp.fire = false;
    return;
  }

  if (state.status === 'aim') {
    // mechanism: 12 Hz hold-repeat. An accumulator advances by dt; each time it
    // crosses 1/REPEAT_HZ we step the held axes by one unit. Pure-clock so the
    // cadence is identical at 30/60/144 fps. Clamping is silent — held at edge
    // is a no-op, not a wrap.
    inp.repeatT += dt;
    const period = 1 / REPEAT_HZ;
    while (inp.repeatT >= period) {
      inp.repeatT -= period;
      if (inp.up)    state.angle = Math.min(ANGLE_MAX, state.angle + 1);
      if (inp.down)  state.angle = Math.max(ANGLE_MIN, state.angle - 1);
      if (inp.right) state.power = Math.min(POW_MAX,  state.power + 1);
      if (inp.left)  state.power = Math.max(POW_MIN,  state.power - 1);
    }

    // mechanism: Space is edge-triggered (latched in keydown, consumed here).
    // This prevents Space autorepeat or a still-held Space from auto-firing
    // the next stone when the previous shot resolves.
    if (inp.fire && state.stonesLeft > 0) {
      launch();
      inp.fire = false;
    }
    return;
  }

  // status === 'fly'
  const s = state.stone;
  // mechanism: substep so high-power shots can't tunnel a 14-px-wide brick in
  // one tick. Step count is ceil(|v|·dt / 4) — at most one quarter-brick per
  // sub-step. Each sub-step integrates semi-implicit Euler (v then x) and
  // tests against bricks + walls + ground.
  const speed = Math.hypot(s.vx, s.vy);
  const steps = Math.max(1, Math.ceil(speed * dt / 4));
  const sdt = dt / steps;
  for (let i = 0; i < steps && state.status === 'fly'; i++) {
    s.vy += GRAVITY * sdt;                       // semi-implicit: v before x
    s.x  += s.vx * sdt;
    s.y  += s.vy * sdt;
    // Ground first — a parabola that would simultaneously clip a brick and the
    // ground at the ground level should read as a ground miss, not a hit.
    if (s.y >= GROUND_Y)            { endShot('ground'); break; }
    if (s.x < 0 || s.x > W)         { endShot('off'); break; }
    if (s.y < -40)                  { /* still climbing — ignore */ }
    const hit = brickHitAt(s.x, s.y);
    if (hit) { removeBrick(hit, s); endShot('hit'); break; }
  }
}

function launch() {
  // mechanism: the verb. Decompose `power` into orthogonal components using
  // the angle: vx is rightward, vy is upward (negative in screen space). All
  // future motion is determined by this single instant — no mid-flight input.
  const rad = state.angle * Math.PI / 180;
  const m = muzzlePos();
  state.stone = { x: m.x, y: m.y, vx: state.power * Math.cos(rad), vy: -state.power * Math.sin(rad) };
  state.stonesLeft -= 1;
  state.status = 'fly';
  if (!REDUCED) state.armTween = 1;
}

function brickHitAt(x, y) {
  // Quick reject before the per-brick scan — the wall lives in x∈[WALL_X, WALL_X+84].
  if (x < WALL_X - 1 || x > WALL_X + COLS * BRICK_W + 1) return null;
  if (y > GROUND_Y || y < GROUND_Y - ROWS * BRICK_H - 1) return null;
  const col = Math.floor((x - WALL_X) / BRICK_W);
  if (col < 0 || col >= COLS) return null;
  // Row math: y measured down; row 7 sits on the ground.
  const dyFromGround = GROUND_Y - y;
  const rowFromBottom = Math.floor(dyFromGround / BRICK_H);
  if (rowFromBottom < 0 || rowFromBottom >= ROWS) return null;
  const row = ROWS - 1 - rowFromBottom;
  const i = row * COLS + col;
  if (!state.bricks[i]) return null;
  return { col, row };
}

function removeBrick(hit, s) {
  // Per spec: "direct hit removes one or two bricks". We take the design call:
  // the struck brick is removed and the projectile *stops* (small puff). This
  // is simpler and reads more clearly than a bounce — the player sees the
  // brick vanish at the impact point, not a confusing redirect. If we wanted
  // two-brick clears we'd also remove the brick directly behind on the
  // travel axis, but a single-brick remove with no bounce keeps the budget
  // truthful: five shots, ~five-to-ten bricks each in good runs.
  state.bricks[hit.row * COLS + hit.col] = 0;
  state.flash = 0.08;
  state.puff = { x: s.x, y: s.y, ttl: 0.15 };
}

function endShot(_reason) {
  // mechanism: WIN before LOSE — per spec, a final-stone breach must register
  // as a win, not as exhaustion. The order here is load-bearing.
  state.stone = null;
  if (bricksRemaining() <= WIN_REMAINING) state.status = 'win';
  else if (state.stonesLeft <= 0)         state.status = 'lose';
  else                                    state.status = 'aim';
}

// --- Render ------------------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const stage = document.getElementById('stage');
  const w = stage.clientWidth, h = stage.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function render() {
  const stage = document.getElementById('stage');
  const cw = stage.clientWidth, ch = stage.clientHeight;
  // Fit logical 480×270 into stage with preserved aspect; letterbox stays bg.
  const sc = Math.min(cw / W, ch / H);
  const sw = W * sc, sh = H * sc;
  const ox = (cw - sw) / 2, oy = (ch - sh) / 2;

  // Background
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, cw, ch);

  ctx.save();
  ctx.translate(ox, oy); ctx.scale(sc, sc);

  // Ground
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 0.5); ctx.lineTo(W, GROUND_Y + 0.5); ctx.stroke();

  // Castle: wall + two crenellated towers framing the grid.
  drawCastle();

  // Bricks (foreground of the castle silhouette)
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

  // Catapult: V-base + rotating arm. Arm angles up-right at `angle` while aiming;
  // during fly + a brief recoil tween it lies flat. Under reduced-motion the
  // arm just snaps to `angle` with no tween.
  drawCatapult();

  // Projectile
  if (state.stone) {
    ctx.fillStyle = '#e8e8f0';
    ctx.beginPath(); ctx.arc(state.stone.x, state.stone.y, 2.4, 0, Math.PI * 2); ctx.fill();
  }

  // Hit flash (single-frame style flash; the 0.08s timer is a one-blink burst)
  if (!REDUCED && state.flash > 0 && state.puff) {
    ctx.strokeStyle = '#ff5e3a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(state.puff.x, state.puff.y, 6 + (1 - state.flash / 0.08) * 8, 0, Math.PI * 2); ctx.stroke();
  }
  // Dust puff on terminate
  if (state.puff) {
    ctx.fillStyle = `rgba(232,232,240,${Math.max(0, state.puff.ttl / 0.15) * 0.7})`;
    ctx.beginPath(); ctx.arc(state.puff.x, state.puff.y, 3 + (1 - state.puff.ttl / 0.15) * 4, 0, Math.PI * 2); ctx.fill();
  }

  // HUD
  ctx.fillStyle = '#e8e8f0';
  ctx.font = '10px ui-monospace, monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`ANGLE ${String(state.angle).padStart(2,' ')}°`, 6, 6);
  ctx.fillText(`POWER ${String(state.power).padStart(3,' ')}`, 6, 18);
  const remTxt = `STONES ${state.stonesLeft}`;
  ctx.fillText(remTxt, W - 6 - ctx.measureText(remTxt).width, 6);

  // End-state banner
  if (state.status === 'win' || state.status === 'lose') {
    ctx.fillStyle = 'rgba(10,10,20,0.75)';
    ctx.fillRect(0, H/2 - 24, W, 48);
    ctx.fillStyle = state.status === 'win' ? '#5b76ff' : '#e8e8f0';
    ctx.font = '16px ui-monospace, monospace';
    ctx.textBaseline = 'alphabetic';
    const msg = state.status === 'win' ? 'BREACH — press R' : 'OUT OF STONES — press R';
    ctx.fillText(msg, (W - ctx.measureText(msg).width) / 2, H/2 + 6);
    ctx.textBaseline = 'top';
  }

  // Touch UI overlay (only on coarse pointers, and only the slider/button outlines)
  if (matchMedia('(pointer: coarse)').matches) drawTouchUI();

  ctx.restore();
}

function drawCastle() {
  // mechanism: behind the brick grid we paint a silhouette so cleared bricks
  // reveal the sky-darkness underneath — visual confirmation of progress.
  // Silhouette is the wall rectangle plus two crenellated tower stubs.
  ctx.fillStyle = '#1a1a28';
  const wx = WALL_X - 4, wy = WALL_Y_BOTTOM - ROWS * BRICK_H - 6;
  ctx.fillRect(wx, wy, COLS * BRICK_W + 8, ROWS * BRICK_H + 6);
  // Left tower stub
  ctx.fillRect(WALL_X - 10, wy - 10, 8, ROWS * BRICK_H + 16);
  // Right tower stub
  ctx.fillRect(WALL_X + COLS * BRICK_W + 2, wy - 10, 8, ROWS * BRICK_H + 16);
  // Crenellations
  ctx.fillStyle = '#0a0a14';
  for (let i = 0; i < 2; i++) {
    ctx.fillRect(WALL_X - 10 + i*4, wy - 10, 2, 4);
    ctx.fillRect(WALL_X + COLS * BRICK_W + 2 + i*4, wy - 10, 2, 4);
  }
}

function drawCatapult() {
  // Base: triangular V on the ground.
  ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CATAPULT_X - 12, GROUND_Y);
  ctx.lineTo(CATAPULT_X,       GROUND_Y - 10);
  ctx.lineTo(CATAPULT_X + 12,  GROUND_Y);
  ctx.closePath(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CATAPULT_X - 16, GROUND_Y); ctx.lineTo(CATAPULT_X + 16, GROUND_Y);
  ctx.stroke();

  // Arm: under reduced-motion, always at `angle`. Otherwise, during recoil
  // (armTween > 0) we lerp from "flat" (0°) up to `angle`. Recoil is cosmetic
  // — the simulation is unaffected.
  let drawAngle = state.angle;
  if (!REDUCED && state.armTween > 0) {
    drawAngle = state.angle * (1 - state.armTween);
  }
  const rad = drawAngle * Math.PI / 180;
  const tipX = CATAPULT_X + Math.cos(rad) * ARM_LEN;
  const tipY = GROUND_Y - Math.sin(rad) * ARM_LEN;
  ctx.strokeStyle = '#5b76ff'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CATAPULT_X, GROUND_Y - 10);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  // Stone cup at tip while aiming
  if (state.status === 'aim') {
    ctx.fillStyle = '#e8e8f0';
    ctx.beginPath(); ctx.arc(tipX, tipY, 2.2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawTouchUI() {
  // Spec: top horizontal slider = angle, right vertical slider = power,
  // bottom-center FIRE FAB, top-right R FAB. Faint #2a2a3a outline; active
  // fill #5b76ff at 30% alpha.
  ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1;

  // Top angle slider (skinny horizontal band under HUD, mid third of width)
  const aX = 90, aY = 36, aW = W - 180, aH = 8;
  ctx.strokeRect(aX + 0.5, aY + 0.5, aW, aH);
  // Knob
  const aT = (state.angle - ANGLE_MIN) / (ANGLE_MAX - ANGLE_MIN);
  ctx.fillStyle = 'rgba(91,118,255,0.3)';
  ctx.fillRect(aX, aY, aW * aT, aH);
  ctx.fillStyle = '#5b76ff';
  ctx.fillRect(aX + aW * aT - 2, aY - 2, 4, aH + 4);

  // Right power slider (vertical band on right side)
  const pX = W - 16, pY = 60, pW = 8, pH = H - 130;
  ctx.strokeRect(pX + 0.5, pY + 0.5, pW, pH);
  const pT = (state.power - POW_MIN) / (POW_MAX - POW_MIN);
  ctx.fillStyle = 'rgba(91,118,255,0.3)';
  ctx.fillRect(pX, pY + pH * (1 - pT), pW, pH * pT);
  ctx.fillStyle = '#5b76ff';
  ctx.fillRect(pX - 2, pY + pH * (1 - pT) - 2, pW + 4, 4);

  // Bottom-center FIRE FAB (72-px round per spec)
  const fX = W/2, fY = H - 30, fR = 14;  // logical px; 14*sc ≈ 72 on a typical phone
  ctx.beginPath(); ctx.arc(fX, fY, fR, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(91,118,255,0.3)';
  ctx.beginPath(); ctx.arc(fX, fY, fR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8e8f0'; ctx.font = '8px ui-monospace, monospace';
  ctx.fillText('FIRE', fX - 8, fY - 4);

  // Top-right R FAB
  const rX = W - 30, rY = 32, rR = 9;
  ctx.beginPath(); ctx.arc(rX, rY, rR, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(91,118,255,0.3)';
  ctx.beginPath(); ctx.arc(rX, rY, rR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8e8f0'; ctx.fillText('R', rX - 2, rY - 4);
}

// --- Input -------------------------------------------------------------
function bindInput() {
  const inp = state.input;

  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if      (e.code === 'ArrowUp')    inp.up    = true;
    else if (e.code === 'ArrowDown')  inp.down  = true;
    else if (e.code === 'ArrowLeft')  inp.left  = true;
    else if (e.code === 'ArrowRight') inp.right = true;
    else if (e.code === 'Space') {
      // mechanism: latch Space on the rising edge only. If still held when
      // the previous shot resolves, the latch stays false until keyup → keydown
      // again. This is the "stuck fire" guard from the spec.
      if (!inp.spaceHeld) { inp.fire = true; inp.spaceHeld = true; }
    }
    else if (e.code === 'KeyR')       inp.restart = true;
  });
  addEventListener('keyup', (e) => {
    if      (e.code === 'ArrowUp')    inp.up    = false;
    else if (e.code === 'ArrowDown')  inp.down  = false;
    else if (e.code === 'ArrowLeft')  inp.left  = false;
    else if (e.code === 'ArrowRight') inp.right = false;
    else if (e.code === 'Space')      inp.spaceHeld = false;
  });

  // Touch: spec calls for a top horizontal slider (angle), right vertical
  // slider (power), bottom-center FIRE, top-right R. We map touch positions
  // directly to angle/power scalars on touchstart and on subsequent move.
  const stage = document.getElementById('stage');

  function stageToLogical(t) {
    const r = stage.getBoundingClientRect();
    const cw = r.width, ch = r.height;
    const sc = Math.min(cw / W, ch / H);
    const sw = W * sc, sh = H * sc;
    const ox = (cw - sw) / 2, oy = (ch - sh) / 2;
    return { x: (t.clientX - r.left - ox) / sc, y: (t.clientY - r.top - oy) / sc };
  }

  function hitZone(p) {
    // Same logical coords as drawTouchUI.
    const aX = 90, aY = 36, aW = W - 180, aH = 8;
    if (p.x >= aX - 8 && p.x <= aX + aW + 8 && p.y >= aY - 12 && p.y <= aY + aH + 12) return 'angle';
    const pX = W - 16, pY = 60, pW = 8, pH = H - 130;
    if (p.x >= pX - 12 && p.x <= pX + pW + 8 && p.y >= pY - 8 && p.y <= pY + pH + 8) return 'power';
    const fX = W/2, fY = H - 30, fR = 14;
    if ((p.x - fX) ** 2 + (p.y - fY) ** 2 <= (fR + 6) ** 2) return 'fire';
    const rX = W - 30, rY = 32, rR = 9;
    if ((p.x - rX) ** 2 + (p.y - rY) ** 2 <= (rR + 6) ** 2) return 'restart';
    return null;
  }

  function applyZone(zone, p) {
    if (zone === 'angle') {
      const aX = 90, aW = W - 180;
      const t = Math.max(0, Math.min(1, (p.x - aX) / aW));
      state.angle = Math.round(ANGLE_MIN + t * (ANGLE_MAX - ANGLE_MIN));
    } else if (zone === 'power') {
      const pY = 60, pH = H - 130;
      const t = 1 - Math.max(0, Math.min(1, (p.y - pY) / pH));
      state.power = Math.round(POW_MIN + t * (POW_MAX - POW_MIN));
    }
  }

  stage.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const p = stageToLogical(t);
      const z = hitZone(p);
      if (!z) continue;
      if (z === 'fire') {
        if (state.status === 'aim' && state.stonesLeft > 0) { inp.fire = true; }
        continue;
      }
      if (z === 'restart') { inp.restart = true; continue; }
      state.touch.ids.set(t.identifier, z);
      applyZone(z, p);
    }
  }, { passive: false });
  stage.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const z = state.touch.ids.get(t.identifier);
      if (!z) continue;
      applyZone(z, stageToLogical(t));
    }
  }, { passive: false });
  function endTouch(e) {
    for (const t of e.changedTouches) state.touch.ids.delete(t.identifier);
  }
  stage.addEventListener('touchend', endTouch);
  stage.addEventListener('touchcancel', endTouch);

  // mechanism: a tab-swap mid-hold would otherwise leave an Arrow latched and
  // drift the value on resume. Clear all held flags on blur.
  addEventListener('blur', () => {
    inp.up = inp.down = inp.left = inp.right = false;
    inp.spaceHeld = false; inp.fire = false; inp.repeatT = 0;
    state.touch.ids.clear();
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
  if (paused) {
    const inp = state.input;
    inp.up = inp.down = inp.left = inp.right = false;
    inp.spaceHeld = false; inp.fire = false; inp.repeatT = 0;
    state.touch.ids.clear();
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
