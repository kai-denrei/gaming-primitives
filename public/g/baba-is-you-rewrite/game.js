// Primitive: baba-is-you-rewrite
// Player verb: push word-tiles to rewrite game rules
// Mechanism summary: each keypress runs one atomic turn — snapshot, push from
// every YOU, then re-parse the grid both axes for SUBJECT-IS-PREDICATE triples,
// recompute object properties, win-check. The world's rules ARE the geometry,
// so any push is a potential edit to the rulebook.

// --- Constants ---------------------------------------------------------
const W = 12, H = 9, CELL = 48, STAGE_W = W * CELL, STAGE_H = H * CELL;
const SLIDE_DUR = 0.08, UNDO_CAP = 50;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tile kinds. OBJ_* render as solid squares; W_* render as bordered word-tiles.
// First char encodes the category so IS_OBJECT/IS_WORD are O(1) checks.
const OBJ_BABA='OBABA',OBJ_FLAG='OFLAG',OBJ_WALL='OWALL',OBJ_ROCK='OROCK';
const W_BABA='WBABA',W_FLAG='WFLAG',W_WALL='WWALL',W_ROCK='WROCK';
const W_IS='WIS',W_YOU='WYOU',W_WIN='WWIN',W_STOP='WSTOP',W_PUSH='WPUSH';
const NOUNS = { [W_BABA]: OBJ_BABA, [W_FLAG]: OBJ_FLAG, [W_WALL]: OBJ_WALL, [W_ROCK]: OBJ_ROCK };
const PROPS = new Set([W_YOU, W_WIN, W_STOP, W_PUSH]);
const IS_OBJECT = (k) => k && k[0] === 'O';
const IS_WORD   = (k) => k && k[0] === 'W';
const COLORS = { [OBJ_BABA]:'#ff85a1', [OBJ_FLAG]:'#ffd23f', [OBJ_WALL]:'#5a6271', [OBJ_ROCK]:'#8b6f47' };
const LETTER = { [OBJ_BABA]:'B', [OBJ_FLAG]:'F', [OBJ_WALL]:'W', [OBJ_ROCK]:'R' };
const WORD_LABEL = {
  [W_BABA]:'BABA',[W_FLAG]:'FLAG',[W_WALL]:'WALL',[W_ROCK]:'ROCK',
  [W_IS]:'IS',[W_YOU]:'YOU',[W_WIN]:'WIN',[W_STOP]:'STOP',[W_PUSH]:'PUSH',
};

// --- State -------------------------------------------------------------
// tiles: flat array of { kind, x, y, px, py }. px/py are the rendered float
// position (slide tween target = x*CELL,y*CELL). props is recomputed every
// turn from the grid geometry — that IS the rule set.
const state = {
  tiles: [], props: new Map(), history: [],
  status: 'play', slideT: 0, hint: 0, swipe: null,
};
const makeTile = (kind, x, y) => ({ kind, x, y, px: x * CELL, py: y * CELL });

// --- Level seed --------------------------------------------------------
// 12x9 hand-crafted level. BABA is OUTSIDE the wall fortress around FLAG.
// Win path: push STOP-word down off the WALL-IS-STOP row, walls lose STOP
// property next turn, BABA walks through the now-walkable walls to the FLAG.
// Other sentences (BABA IS YOU, FLAG IS WIN, ROCK IS PUSH) are intact starters.
function loadLevel() {
  state.tiles.length = 0; state.history.length = 0;
  state.status = 'play'; state.slideT = 0; state.hint = 0;
  const T = (k, x, y) => state.tiles.push(makeTile(k, x, y));
  // Top edge sentences: BABA IS YOU (1..3,0), FLAG IS WIN (8..10,0).
  T(W_BABA,1,0); T(W_IS,2,0); T(W_YOU,3,0);
  T(W_FLAG,8,0); T(W_IS,9,0); T(W_WIN,10,0);
  // Wall fortress (x=6..10, y=2..6) enclosing the FLAG.
  for (let x = 6; x <= 10; x++) { T(OBJ_WALL,x,2); T(OBJ_WALL,x,6); }
  for (let y = 3; y <= 5; y++) { T(OBJ_WALL,6,y); T(OBJ_WALL,10,y); }
  T(OBJ_BABA,3,4); T(OBJ_FLAG,8,4); T(OBJ_ROCK,7,7);
  // Bottom sentences. Push STOP at (3,7) DOWN to break WALL IS STOP — the
  // wall fortress becomes walkable next turn. ROCK IS PUSH is intact filler.
  T(W_WALL,1,7); T(W_IS,2,7); T(W_STOP,3,7);
  T(W_ROCK,8,8); T(W_IS,9,8); T(W_PUSH,10,8);
  parseRules();
}

// --- Rule parse + properties --------------------------------------------
// mechanism: parseRules() is the heart. Scan every row L→R and every column
// T→B for any 3-cell window [SUBJECT, IS, PREDICATE] where SUBJECT is a noun
// word and PREDICATE is a noun word or property word. Each hit emits one rule.
// We only implement the PROPERTY branch (NOUN-IS-PROP); NOUN-IS-NOUN
// substitution is out of scope per spec. Properties refresh from scratch so a
// rule destroyed by the player's last push truly disappears.
function parseRules() {
  state.props.clear();
  const grid = buildGrid();
  // Horizontal: every row L→R, every i from 0..W-3.
  for (let y = 0; y < H; y++)
    for (let x = 0; x <= W - 3; x++)
      tryTriple(grid[x][y], grid[x+1][y], grid[x+2][y]);
  // Vertical: every column T→B, every i from 0..H-3.
  for (let x = 0; x < W; x++)
    for (let y = 0; y <= H - 3; y++)
      tryTriple(grid[x][y], grid[x][y+1], grid[x][y+2]);
}

function buildGrid() {
  // Cell holds an array of word-kinds present (object tiles ignored — only
  // word tiles participate in sentences). Multiple words per cell would all be
  // tried; in practice the level never stacks words.
  const g = Array.from({ length: W }, () => Array.from({ length: H }, () => []));
  for (const t of state.tiles) if (IS_WORD(t.kind)) g[t.x][t.y].push(t.kind);
  return g;
}

function tryTriple(a, b, c) {
  // SUBJECT must be a noun word; verb must be IS; predicate noun or prop.
  for (const s of a) {
    if (!(s in NOUNS)) continue;
    for (const v of b) {
      if (v !== W_IS) continue;
      for (const p of c) {
        const subj = NOUNS[s];
        if (PROPS.has(p)) {
          if (!state.props.has(subj)) state.props.set(subj, new Set());
          state.props.get(subj).add(p);
        }
        // NOUN-IS-NOUN substitution intentionally skipped (spec out-of-scope).
      }
    }
  }
}

function hasProp(kind, prop) {
  const s = state.props.get(kind);
  return s ? s.has(prop) : false;
}

// Word tiles are implicitly PUSH; object tiles are PUSH only if a rule says so.
// STOP-vs-PUSH precedence: a tile that is BOTH STOP and PUSH is pushable —
// the spec resolves the ambiguity in favour of motion (per Hempuli's own
// rule of thumb: PUSH wins over STOP for the bearer of both).
function isPushable(t) {
  if (IS_WORD(t.kind)) return true;
  return hasProp(t.kind, W_PUSH);
}
function isStop(t) {
  if (IS_WORD(t.kind)) return false;        // words are never STOP unless ruled
  return hasProp(t.kind, W_STOP) && !hasProp(t.kind, W_PUSH);
}

// --- Step (one turn) ---------------------------------------------------
// mechanism: input → snapshot → for each YOU object, attemptMove → reparse
// → apply derived properties → win-check. The order is atomic: rules are
// the geometry AFTER all pushes have settled, so a chain of pushes that
// reconfigures a sentence takes effect on the NEXT turn — never mid-turn.
function step(dx, dy) {
  if (state.status !== 'play') return;
  snapshot();
  const yous = state.tiles
    .filter(t => IS_OBJECT(t.kind) && hasProp(t.kind, W_YOU))
    .sort((a, b) => a.y - b.y || a.x - b.x);     // deterministic top-left order
  let moved = false;
  for (const o of yous) if (attemptMove(o, dx, dy)) moved = true;
  if (!moved) { state.history.pop(); return; }   // no change → drop snapshot
  parseRules();
  if (checkWin()) state.status = 'win';
  if (!REDUCED) state.slideT = SLIDE_DUR;
}

// mechanism: chain-push. Walk neighbours along (dx,dy) collecting every
// pushable tile in the way. Hit STOP → bail (nothing moves). Hit empty or
// out-of-bounds at chain head → out-of-bounds bails, empty commits. Then
// move chain back-to-front so each tile's target cell is vacated first.
function attemptMove(o, dx, dy) {
  const chain = [o];
  let cx = o.x + dx, cy = o.y + dy;
  while (true) {
    if (cx < 0 || cx >= W || cy < 0 || cy >= H) return false;
    const here = state.tiles.filter(t => t.x === cx && t.y === cy);
    if (here.some(isStop)) return false;
    const pushHere = here.filter(isPushable);
    if (pushHere.length === 0) break;            // empty-of-pushables → commit
    chain.push(...pushHere);
    cx += dx; cy += dy;
  }
  for (let i = chain.length - 1; i >= 0; i--) {
    chain[i].x += dx; chain[i].y += dy;
    // px/py left at old position so the slide tween animates to the new x*CELL.
  }
  return true;
}

// mechanism: win if any YOU-tagged object shares a cell with a WIN-tagged
// object (or itself is both, e.g. BABA IS WIN as a degenerate self-win).
function checkWin() {
  const yous = state.tiles.filter(t => IS_OBJECT(t.kind) && hasProp(t.kind, W_YOU));
  const wins = state.tiles.filter(t => IS_OBJECT(t.kind) && hasProp(t.kind, W_WIN));
  for (const y of yous) for (const w of wins)
    if (y.x === w.x && y.y === w.y) return true;
  return false;
}

// --- Undo / restart ----------------------------------------------------
function snapshot() {
  // Cheap structural copy: kind+x+y per tile. Status NOT captured — undo from
  // a win state still works because step() refuses to run while won. Capped at
  // UNDO_CAP entries; shift the oldest if we'd exceed the cap.
  state.history.push(state.tiles.map(t => ({ kind: t.kind, x: t.x, y: t.y })));
  if (state.history.length > UNDO_CAP) state.history.shift();
}
function undo() {
  const s = state.history.pop();
  if (!s) return;
  state.tiles = s.map(t => ({ ...t, px: t.x * CELL, py: t.y * CELL }));
  state.status = 'play';
  state.slideT = 0;
  parseRules();
}
function restart() { loadLevel(); }

// --- Tick (only animates the slide tween) ------------------------------
function tick(dt) {
  // mechanism: turn-based — tick has no game logic. It only walks px/py
  // toward x*CELL,y*CELL with an ease-out cubic over SLIDE_DUR seconds, then
  // snaps. Reduced-motion or a frame-skip (dt clamped at 50ms) lands instantly.
  if (state.slideT > 0) state.slideT = Math.max(0, state.slideT - dt);
  const tnorm = REDUCED || state.slideT === 0 ? 1 : 1 - state.slideT / SLIDE_DUR;
  const ease = 1 - Math.pow(1 - tnorm, 3);
  for (const t of state.tiles) {
    const tx = t.x * CELL, ty = t.y * CELL;
    t.px += (tx - t.px) * ease; t.py += (ty - t.py) * ease;
    if (state.slideT === 0) { t.px = tx; t.py = ty; }
  }
  const hasYou = state.tiles.some(t => IS_OBJECT(t.kind) && hasProp(t.kind, W_YOU));
  state.hint = hasYou ? 0 : Math.min(3, state.hint + dt);
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
  // Fit 576x432 into stage with aspect preserved; letterbox is bg dark.
  const sc = Math.min(cw / STAGE_W, ch / STAGE_H);
  const ox = (cw - STAGE_W * sc) / 2, oy = (ch - STAGE_H * sc) / 2;

  ctx.fillStyle = '#0e0e14'; ctx.fillRect(0, 0, cw, ch);
  ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc);

  ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL,STAGE_H); ctx.stroke(); }
  for (let y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(STAGE_W,y*CELL); ctx.stroke(); }

  // Objects rendered first so word tiles on top remain readable when stacked.
  const ordered = [...state.tiles].sort((a, b) => Number(IS_WORD(a.kind)) - Number(IS_WORD(b.kind)));
  for (const t of ordered) drawTile(t);

  if (!REDUCED) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 220);
    ctx.strokeStyle = `rgba(255,133,161,${0.4 + 0.6 * pulse})`; ctx.lineWidth = 2;
    for (const t of state.tiles)
      if (IS_OBJECT(t.kind) && hasProp(t.kind, W_YOU))
        ctx.strokeRect(t.px + 3, t.py + 3, CELL - 6, CELL - 6);
  }

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (state.status === 'win') {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, STAGE_H/2 - 40, STAGE_W, 80);
    ctx.fillStyle = '#ffd23f'; ctx.font = `bold ${CELL*0.45}px ui-monospace, monospace`;
    ctx.fillText('YOU WIN — press R', STAGE_W/2, STAGE_H/2);
  }
  if (state.hint > 2) {
    ctx.fillStyle = 'rgba(232,232,240,0.7)';
    ctx.font = `${CELL*0.25}px ui-monospace, monospace`;
    ctx.fillText('no YOU — press Z to undo', STAGE_W/2, STAGE_H - 20);
  }
  ctx.restore();
  drawTouchUI(cw, ch);
}

function drawTile(t) {
  const x = t.px, y = t.py, k = t.kind;
  if (IS_OBJECT(k)) {
    // Solid coloured square with a centred initial letter.
    ctx.fillStyle = COLORS[k];
    ctx.fillRect(x + 4, y + 4, CELL - 8, CELL - 8);
    ctx.fillStyle = '#0e0e14';
    ctx.font = `bold ${CELL * 0.55}px ui-monospace, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(LETTER[k], x + CELL/2, y + CELL/2 + 1);
  } else {
    // Word: filled bg in subject colour-ish + thin inner border + word label.
    const bg = NOUNS[k] ? COLORS[NOUNS[k]] : '#7a8aa6';
    ctx.fillStyle = '#1c1c28';
    ctx.fillRect(x + 4, y + 4, CELL - 8, CELL - 8);
    ctx.strokeStyle = bg; ctx.lineWidth = 2;
    ctx.strokeRect(x + 6, y + 6, CELL - 12, CELL - 12);
    ctx.fillStyle = bg;
    ctx.font = `bold ${WORD_LABEL[k].length > 3 ? CELL * 0.22 : CELL * 0.28}px ui-monospace, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(WORD_LABEL[k], x + CELL/2, y + CELL/2 + 1);
  }
}

function drawTouchUI(cw, ch) {
  // Two FAB buttons in bottom corners: UNDO left, RESTART right. Hit-tested
  // in screen-space (not the scaled stage transform) so they live above the
  // playfield letterbox.
  if (!matchMedia('(pointer: coarse)').matches) return;
  ctx.save();
  ctx.font = 'bold 12px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const r = 28;
  ctx.fillStyle = 'rgba(255,133,161,0.18)'; ctx.strokeStyle = '#ff85a1'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(r + 14, ch - r - 14, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8e8f0'; ctx.fillText('UNDO', r + 14, ch - r - 14);
  ctx.fillStyle = 'rgba(255,133,161,0.18)';
  ctx.beginPath(); ctx.arc(cw - r - 14, ch - r - 14, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8e8f0'; ctx.fillText('RST', cw - r - 14, ch - r - 14);
  ctx.restore();
}

// --- Input -------------------------------------------------------------
function bindInput() {
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if      (e.code === 'ArrowUp'    || e.code === 'KeyW') step(0, -1);
    else if (e.code === 'ArrowDown'  || e.code === 'KeyS') step(0, 1);
    else if (e.code === 'ArrowLeft'  || e.code === 'KeyA') step(-1, 0);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') step(1, 0);
    else if (e.code === 'Space') { if (state.status === 'play') { snapshot(); parseRules(); } }
    else if (e.code === 'KeyZ') undo();
    else if (e.code === 'KeyR') restart();
  });

  // Swipe: pointerdown → up. Threshold 24px in stage-space; only the dominant
  // axis counts. Tap on a FAB area instead = button press.
  const stage = document.getElementById('stage');
  function fabAt(cx, cy) {
    const r = 28, pad = 14;
    if ((cx - (r + pad)) ** 2 + (cy - (stage.clientHeight - r - pad)) ** 2 < r * r) return 'undo';
    if ((cx - (stage.clientWidth - r - pad)) ** 2 + (cy - (stage.clientHeight - r - pad)) ** 2 < r * r) return 'rst';
    return null;
  }
  stage.addEventListener('pointerdown', (e) => {
    const rect = stage.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const f = fabAt(sx, sy);
    if (f === 'undo') { undo(); return; }
    if (f === 'rst')  { restart(); return; }
    state.swipe = { id: e.pointerId, x: sx, y: sy };
  }, { passive: false });
  stage.addEventListener('pointerup', (e) => {
    const s = state.swipe; if (!s || s.id !== e.pointerId) return;
    const rect = stage.getBoundingClientRect();
    const dx = (e.clientX - rect.left) - s.x, dy = (e.clientY - rect.top) - s.y;
    state.swipe = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) step(Math.sign(dx), 0);
    else                              step(0, Math.sign(dy));
  }, { passive: false });
  stage.addEventListener('pointercancel', () => { state.swipe = null; });
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
  // Clear any in-flight swipe so a held pointer doesn't fire on resume.
  if (paused) state.swipe = null;
});

// --- Block default scroll for game keys --------------------------------
const PREVENT_KEYS = new Set([
  'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
  'Space','KeyW','KeyA','KeyS','KeyD','KeyR','KeyZ'
]);
addEventListener('keydown', (e) => { if (PREVENT_KEYS.has(e.code)) e.preventDefault(); }, { passive: false });
addEventListener('keyup',   (e) => { if (PREVENT_KEYS.has(e.code)) e.preventDefault(); }, { passive: false });

// --- Boot --------------------------------------------------------------
function boot() {
  resize();
  window.addEventListener('resize', resize);
  bindInput();
  loadLevel();

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
