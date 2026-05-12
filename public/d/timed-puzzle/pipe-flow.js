// timed-puzzle/pipe-flow — grid of pipe tiles. A flow front advances from the
// source (top-left) along connected pipes at flow_rate tiles/sec. Auto-pilot
// rotates tiles ahead of the front so the path reaches the sink (bottom-right).
// Dead-end on mismatch → red flash; reach sink → green flash; either way re-seed.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

// Each pipe is a 4-bit mask of open sides: N=1 E=2 S=4 W=8.
const N = 1, E = 2, S = 4, WST = 8;

// Pipe shape templates (rotations enumerated as 4 entries each).
const SHAPES = [
  // straight: N-S, then E-W
  [N | S, E | WST],
  // L-bend (90° elbow): NE, ES, SW, WN
  [N | E, E | S, S | WST, WST | N],
  // T-junction: 4 rotations
  [N | E | S, E | S | WST, S | WST | N, WST | N | E],
  // cross: only 1
  [N | E | S | WST],
];

const OPP = { [N]: S, [E]: WST, [S]: N, [WST]: E };

function randShape() {
  const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return s[Math.floor(Math.random() * s.length)];
}

// Rotate mask 90° clockwise: N→E, E→S, S→W, W→N.
function rot(mask) {
  let out = 0;
  if (mask & N)   out |= E;
  if (mask & E)   out |= S;
  if (mask & S)   out |= WST;
  if (mask & WST) out |= N;
  return out;
}

// Enumerate the 4 rotations of a given mask (deduped).
function rotations(mask) {
  const set = new Set();
  let m = mask;
  for (let i = 0; i < 4; i++) { set.add(m); m = rot(m); }
  return [...set];
}

function seed(state) {
  const gw = state.gridW, gh = state.gridH;
  state.cell = Math.min(Math.floor((W - 60) / gw), Math.floor((H - 80) / gh));
  state.offsetX = Math.floor((W - state.cell * gw) / 2);
  state.offsetY = Math.floor((H - state.cell * gh) / 2);
  state.tiles = new Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) state.tiles[i] = randShape();
  state.flowPath = [{ x: 0, y: 0, from: WST }];   // (0,0) entered from west
  state.flowProgress = 0;                          // 0..1 within current tile
  state.endState = null;                           // null | 'sink' | 'dead'
  state.endAt = -10;
  state.elapsed = 0;
  state.rotateFlash = -10;
  state.rotateFlashIdx = -1;
}

function tileAt(state, x, y) {
  return state.tiles[y * state.gridW + x];
}
function setTile(state, x, y, m) {
  state.tiles[y * state.gridW + x] = m;
}

// Given a flow entry-side `from` and the tile mask, return the exit-side, or 0.
function exitSide(mask, from) {
  if (!(mask & from)) return 0;
  // Pipe must have at least 2 openings AND `from` AND one other side.
  for (const side of [N, E, S, WST]) {
    if (side === from) continue;
    if (mask & side) return side;
  }
  return 0;
}

function sideDelta(side) {
  if (side === N) return { dx: 0, dy: -1 };
  if (side === S) return { dx: 0, dy:  1 };
  if (side === E) return { dx: 1, dy:  0 };
  return { dx: -1, dy: 0 };
}

export function init(ctx, params, env) {
  const state = {
    gridW: params.grid_w,
    gridH: params.grid_h,
    flowRate: params.flow_rate,
    autoSkill: params.auto_skill,
  };
  seed(state);

  // Try to advance the flow front by one tile. Returns 'cont' | 'sink' | 'dead'.
  function advance() {
    const cur = state.flowPath[state.flowPath.length - 1];
    const t = tileAt(state, cur.x, cur.y);
    const exit = exitSide(t, cur.from);
    if (!exit) return 'dead';
    const d = sideDelta(exit);
    const nx = cur.x + d.dx, ny = cur.y + d.dy;
    if (nx < 0 || nx >= state.gridW || ny < 0 || ny >= state.gridH) {
      // Out-of-bounds — only legal if reaching the sink (bottom-right exit E).
      if (cur.x === state.gridW - 1 && cur.y === state.gridH - 1 && exit === E) return 'sink';
      return 'dead';
    }
    state.flowPath.push({ x: nx, y: ny, from: OPP[exit] });
    return 'cont';
  }

  // Auto-pilot: rotate ONE tile ahead of the flow front so it can be entered.
  // Predict where the flow will land next, then rotate that tile to align.
  function tryRotateAhead() {
    const cur = state.flowPath[state.flowPath.length - 1];
    const t = tileAt(state, cur.x, cur.y);
    const exit = exitSide(t, cur.from);
    if (!exit) return;
    const d = sideDelta(exit);
    const nx = cur.x + d.dx, ny = cur.y + d.dy;
    if (nx < 0 || nx >= state.gridW || ny < 0 || ny >= state.gridH) return;

    const needFrom = OPP[exit];                 // the side the next tile must accept
    const mask = tileAt(state, nx, ny);
    const rots = rotations(mask);

    // Score each rotation: must include `needFrom`. Prefer rotations that ALSO
    // direct flow toward the sink (bottom-right) — heuristic for auto-skill.
    const sinkDX = (state.gridW - 1) - nx;
    const sinkDY = (state.gridH - 1) - ny;
    let candidates = [];
    for (const m of rots) {
      if (!(m & needFrom)) continue;
      const ex = exitSide(m, needFrom);
      if (!ex) continue;
      const dd = sideDelta(ex);
      // Reward exits that move toward the sink, penalize wall-pointing exits.
      let score = 0;
      if (dd.dx > 0 && sinkDX > 0) score += 2;
      if (dd.dy > 0 && sinkDY > 0) score += 2;
      if (dd.dx < 0 && sinkDX >= 0) score -= 1;
      if (dd.dy < 0 && sinkDY >= 0) score -= 1;
      // Wall check
      const nnx = nx + dd.dx, nny = ny + dd.dy;
      const offGrid = nnx < 0 || nnx >= state.gridW || nny < 0 || nny >= state.gridH;
      const atSink = nx === state.gridW - 1 && ny === state.gridH - 1 && ex === E;
      if (offGrid && !atSink) score -= 5;
      candidates.push({ m, score });
    }
    if (!candidates.length) return; // no rotation works; flow will hit dead-end
    candidates.sort((a, b) => b.score - a.score);
    // auto_skill picks the best; otherwise random among valid.
    const pick = Math.random() < state.autoSkill
      ? candidates[0]
      : candidates[Math.floor(Math.random() * candidates.length)];
    if (pick.m !== mask) {
      setTile(state, nx, ny, pick.m);
      state.rotateFlash = state.elapsed;
      state.rotateFlashIdx = ny * state.gridW + nx;
    }
  }

  function tick(dt) {
    state.elapsed += dt;

    if (state.endState) {
      if (state.elapsed - state.endAt > 1.2) seed(state);
      draw();
      return;
    }

    state.flowProgress += dt * state.flowRate;
    while (state.flowProgress >= 1 && !state.endState) {
      state.flowProgress -= 1;
      // Look ahead BEFORE the front commits to the next tile.
      tryRotateAhead();
      const res = advance();
      if (res === 'sink') { state.endState = 'sink'; state.endAt = state.elapsed; }
      else if (res === 'dead') { state.endState = 'dead'; state.endAt = state.elapsed; }
    }

    draw();
  }

  function drawPipe(cx, cy, size, mask, alpha = 1) {
    const half = size / 2;
    const t = Math.max(4, Math.floor(size / 5));
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#9aa4b2';
    ctx.lineWidth = t;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    if (mask & N) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - half); }
    if (mask & S) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + half); }
    if (mask & E) { ctx.moveTo(cx, cy); ctx.lineTo(cx + half, cy); }
    if (mask & WST) { ctx.moveTo(cx, cy); ctx.lineTo(cx - half, cy); }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawWaterSegment(cx, cy, size, fromSide, toSide, frac) {
    // Draw a water trail from the `fromSide` midpoint toward `toSide` midpoint,
    // truncated to `frac` of the way.
    const half = size / 2;
    const t = Math.max(3, Math.floor(size / 6));
    ctx.strokeStyle = '#5ee7df';
    ctx.lineWidth = t;
    ctx.lineCap = 'round';
    const start = sideMid(cx, cy, half, fromSide);
    const end   = sideMid(cx, cy, half, toSide);
    const mx = cx, my = cy;
    // Draw piecewise: from start to center, then center to (end * frac of remaining).
    if (frac <= 0.5) {
      const f = frac / 0.5;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(start.x + (mx - start.x) * f, start.y + (my - start.y) * f);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y); ctx.lineTo(mx, my); ctx.stroke();
      const f = (frac - 0.5) / 0.5;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + (end.x - mx) * f, my + (end.y - my) * f);
      ctx.stroke();
    }
  }
  function sideMid(cx, cy, half, side) {
    if (side === N) return { x: cx, y: cy - half };
    if (side === S) return { x: cx, y: cy + half };
    if (side === E) return { x: cx + half, y: cy };
    return { x: cx - half, y: cy };
  }
  function drawFullWaterTile(cx, cy, size, mask) {
    const half = size / 2;
    const t = Math.max(3, Math.floor(size / 6));
    ctx.strokeStyle = '#5ee7df';
    ctx.lineWidth = t;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (mask & N) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - half); }
    if (mask & S) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + half); }
    if (mask & E) { ctx.moveTo(cx, cy); ctx.lineTo(cx + half, cy); }
    if (mask & WST) { ctx.moveTo(cx, cy); ctx.lineTo(cx - half, cy); }
    ctx.stroke();
  }

  function draw() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    const c = state.cell;

    // Tiles + pipe shapes
    for (let y = 0; y < state.gridH; y++) {
      for (let x = 0; x < state.gridW; x++) {
        const px = state.offsetX + x * c;
        const py = state.offsetY + y * c;
        // tile box
        ctx.fillStyle = '#161b22';
        ctx.fillRect(px + 1, py + 1, c - 2, c - 2);
        const idx = y * state.gridW + x;
        const flashing = state.rotateFlashIdx === idx && state.elapsed - state.rotateFlash < 0.2;
        if (flashing) {
          const a = 1 - (state.elapsed - state.rotateFlash) / 0.2;
          ctx.fillStyle = `rgba(255, 210, 63, ${a * 0.3})`;
          ctx.fillRect(px + 1, py + 1, c - 2, c - 2);
        }
        drawPipe(px + c / 2, py + c / 2, c - 6, state.tiles[idx]);
      }
    }

    // Source marker (top-left arrow into the grid)
    ctx.fillStyle = '#5ee7df';
    {
      const sx = state.offsetX - 8;
      const sy = state.offsetY + c / 2;
      ctx.beginPath();
      ctx.moveTo(sx - 8, sy - 6);
      ctx.lineTo(sx - 8, sy + 6);
      ctx.lineTo(sx, sy);
      ctx.closePath();
      ctx.fill();
    }
    // Sink marker (bottom-right arrow out)
    {
      const sx = state.offsetX + c * state.gridW + 8;
      const sy = state.offsetY + c * state.gridH - c / 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 6);
      ctx.lineTo(sx, sy + 6);
      ctx.lineTo(sx + 8, sy);
      ctx.closePath();
      ctx.fill();
    }

    // Water trail along committed path
    for (let i = 0; i < state.flowPath.length; i++) {
      const seg = state.flowPath[i];
      const px = state.offsetX + seg.x * c;
      const py = state.offsetY + seg.y * c;
      const t = tileAt(state, seg.x, seg.y);
      const exit = exitSide(t, seg.from);
      const isHead = i === state.flowPath.length - 1 && !state.endState;
      if (isHead && exit) {
        drawWaterSegment(px + c / 2, py + c / 2, c - 6, seg.from, exit, state.flowProgress);
      } else if (exit) {
        // Fully filled segment
        const half = (c - 6) / 2;
        const t2 = Math.max(3, Math.floor((c - 6) / 6));
        ctx.strokeStyle = '#5ee7df';
        ctx.lineWidth = t2;
        ctx.lineCap = 'round';
        const startP = sideMid(px + c / 2, py + c / 2, half, seg.from);
        const endP   = sideMid(px + c / 2, py + c / 2, half, exit);
        ctx.beginPath();
        ctx.moveTo(startP.x, startP.y);
        ctx.lineTo(px + c / 2, py + c / 2);
        ctx.lineTo(endP.x, endP.y);
        ctx.stroke();
      } else if (!exit && state.endState === 'dead' && i === state.flowPath.length - 1) {
        // partial dribble — just draw entry stub
        const half = (c - 6) / 2;
        const t2 = Math.max(3, Math.floor((c - 6) / 6));
        ctx.strokeStyle = '#5ee7df';
        ctx.lineWidth = t2;
        ctx.lineCap = 'round';
        const startP = sideMid(px + c / 2, py + c / 2, half, seg.from);
        ctx.beginPath();
        ctx.moveTo(startP.x, startP.y);
        ctx.lineTo(px + c / 2, py + c / 2);
        ctx.stroke();
      }
    }

    // End state overlay
    if (state.endState) {
      const t = state.elapsed - state.endAt;
      const alpha = Math.max(0, 0.6 - t * 0.4);
      ctx.fillStyle = state.endState === 'sink' ? `rgba(57, 255, 20, ${alpha})` : `rgba(255, 68, 68, ${alpha})`;
      ctx.fillRect(state.offsetX, state.offsetY, c * state.gridW, c * state.gridH);
      ctx.fillStyle = state.endState === 'sink' ? '#39ff14' : '#ff4444';
      ctx.font = 'bold 24px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.endState === 'sink' ? 'CONNECTED' : 'DEAD END', W / 2, H / 2);
    }

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${state.gridW}×${state.gridH}  ·  flow ${state.flowRate.toFixed(1)} t/s  ·  skill ${(state.autoSkill * 100).toFixed(0)}%`, 12, 18);
    ctx.textAlign = 'right';
    ctx.fillText(`tiles ${state.flowPath.length}/${state.gridW * state.gridH}`, W - 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // grid_w / grid_h are structural; flow_rate and auto_skill are live.
  if (params.grid_w !== state.gridW || params.grid_h !== state.gridH) {
    state.gridW = params.grid_w;
    state.gridH = params.grid_h;
    state.flowRate = params.flow_rate;
    state.autoSkill = params.auto_skill;
    seed(state);
    return;
  }
  state.flowRate = params.flow_rate;
  state.autoSkill = params.auto_skill;
}
