// timed-puzzle/pattern-match-race — NxN grid of colored gems. Auto-pilot finds
// a valid swap (creates 3+ run), executes it, matches clear, gems above fall,
// new gems spawn at top. Cascades resolve up to MAX_CASCADE depth.
// Time bar depletes; matches refill it. Time-out → re-seed.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const MAX_CASCADE = 8;
const GEM_HUES = [0, 60, 120, 180, 240, 300, 30]; // red, yellow, green, cyan, blue, magenta, orange

function rng(state) { return Math.floor(Math.random() * state.colors); }

function seed(state) {
  const n = state.gridSize;
  state.grid = new Array(n * n);
  // Fill with no initial 3-in-a-row by resampling collisions.
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let g, tries = 0;
      do {
        g = rng(state);
        tries++;
        if (tries > 20) break;
      } while (
        (x >= 2 && state.grid[y * n + x - 1] === g && state.grid[y * n + x - 2] === g) ||
        (y >= 2 && state.grid[(y - 1) * n + x] === g && state.grid[(y - 2) * n + x] === g)
      );
      state.grid[y * n + x] = g;
    }
  }
  state.cellSize = Math.min(Math.floor((W - 200) / n), Math.floor((H - 80) / n));
  state.offsetX = Math.floor((W - state.cellSize * n) / 2);
  state.offsetY = Math.floor((H - state.cellSize * n) / 2);
  state.timeLeft = state.totalTime;
  state.score = 0;
  state.combos = 0;
  state.nextSwapAt = 0;
  state.elapsed = 0;
  state.endState = null;
  state.endAt = -10;
  state.lastSwap = null;          // { a:idx, b:idx, t } for highlight
  state.flashCells = [];          // [{idx, until}]
}

function at(state, x, y) {
  return state.grid[y * state.gridSize + x];
}
function setAt(state, x, y, v) {
  state.grid[y * state.gridSize + x] = v;
}

// Find all match groups on the current grid; return Set of cell indices.
function findMatches(state) {
  const n = state.gridSize;
  const marked = new Set();
  // Horizontal
  for (let y = 0; y < n; y++) {
    let run = 1;
    for (let x = 1; x <= n; x++) {
      const same = x < n && at(state, x, y) === at(state, x - 1, y) && at(state, x, y) >= 0;
      if (same) run++;
      else {
        if (run >= 3) {
          for (let k = 0; k < run; k++) marked.add(y * n + (x - 1 - k));
        }
        run = 1;
      }
    }
  }
  // Vertical
  for (let x = 0; x < n; x++) {
    let run = 1;
    for (let y = 1; y <= n; y++) {
      const same = y < n && at(state, x, y) === at(state, x, y - 1) && at(state, x, y) >= 0;
      if (same) run++;
      else {
        if (run >= 3) {
          for (let k = 0; k < run; k++) marked.add((y - 1 - k) * n + x);
        }
        run = 1;
      }
    }
  }
  return marked;
}

// Apply cascade: remove matched cells, drop above, fill new at top.
// Returns the number of cells cleared.
function resolveCascade(state) {
  const n = state.gridSize;
  let cleared = 0;
  for (let depth = 0; depth < MAX_CASCADE; depth++) {
    const matches = findMatches(state);
    if (matches.size === 0) break;
    cleared += matches.size;
    // Flash the matched cells
    for (const idx of matches) state.flashCells.push({ idx, until: state.elapsed + 0.25 });
    // Mark cleared
    for (const idx of matches) state.grid[idx] = -1;
    // Drop: for each column, compact non-(-1) values toward bottom, fill -1 above.
    for (let x = 0; x < n; x++) {
      let writeY = n - 1;
      for (let y = n - 1; y >= 0; y--) {
        if (at(state, x, y) >= 0) {
          if (writeY !== y) {
            setAt(state, x, writeY, at(state, x, y));
            setAt(state, x, y, -1);
          }
          writeY--;
        }
      }
      // Fill remaining top cells
      for (let y = writeY; y >= 0; y--) setAt(state, x, y, rng(state));
    }
    state.combos++;
  }
  return cleared;
}

// Test a swap (just simulate, restore). Returns match-count.
function testSwap(state, x1, y1, x2, y2) {
  const a = at(state, x1, y1), b = at(state, x2, y2);
  setAt(state, x1, y1, b);
  setAt(state, x2, y2, a);
  const m = findMatches(state);
  setAt(state, x1, y1, a);
  setAt(state, x2, y2, b);
  return m.size;
}

// Find a swap. Returns { x1, y1, x2, y2, count } or null if no swap works.
function findSwap(state, preferBest) {
  const n = state.gridSize;
  const candidates = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (x + 1 < n) {
        const c = testSwap(state, x, y, x + 1, y);
        if (c > 0) candidates.push({ x1: x, y1: y, x2: x + 1, y2: y, count: c });
      }
      if (y + 1 < n) {
        const c = testSwap(state, x, y, x, y + 1);
        if (c > 0) candidates.push({ x1: x, y1: y, x2: x, y2: y + 1, count: c });
      }
    }
  }
  if (!candidates.length) return null;
  if (preferBest) {
    candidates.sort((a, b) => b.count - a.count);
    return candidates[0];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function init(ctx, params, env) {
  const state = {
    gridSize: params.grid_size,
    colors: params.gem_colors,
    totalTime: params.time_seconds,
    autoSkill: params.auto_skill,
  };
  seed(state);

  function tick(dt) {
    state.elapsed += dt;

    if (state.endState) {
      if (state.elapsed - state.endAt > 1.5) seed(state);
      draw();
      return;
    }

    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.endState = 'time';
      state.endAt = state.elapsed;
      draw();
      return;
    }

    // Auto-pilot swaps roughly every 0.45s.
    if (state.elapsed >= state.nextSwapAt) {
      const preferBest = Math.random() < state.autoSkill;
      const swap = findSwap(state, preferBest);
      if (swap) {
        const a = at(state, swap.x1, swap.y1), b = at(state, swap.x2, swap.y2);
        setAt(state, swap.x1, swap.y1, b);
        setAt(state, swap.x2, swap.y2, a);
        state.lastSwap = { a: swap.y1 * state.gridSize + swap.x1, b: swap.y2 * state.gridSize + swap.x2, t: state.elapsed };
        state.combos = 0;
        const cleared = resolveCascade(state);
        state.score += cleared * (1 + state.combos * 0.5);
        // Refill timer by some amount per cleared gem; cap at totalTime.
        state.timeLeft = Math.min(state.totalTime, state.timeLeft + cleared * 0.4);
      } else {
        // No valid swap (shouldn't happen often) → shake & resample one cell
        const n = state.gridSize;
        setAt(state, Math.floor(Math.random() * n), Math.floor(Math.random() * n), rng(state));
      }
      state.nextSwapAt = state.elapsed + 0.45 + Math.random() * 0.15;
    }

    draw();
  }

  function drawGem(cx, cy, size, colorIdx) {
    const hue = GEM_HUES[colorIdx % GEM_HUES.length];
    const r = size * 0.42;
    // gradient-ish: outer ring darker, inner brighter
    ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsl(${hue}, 80%, 65%)`;
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `hsl(${hue}, 60%, 30%)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function draw() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    const n = state.gridSize;
    const c = state.cellSize;
    const ox = state.offsetX, oy = state.offsetY;

    // Board background
    ctx.fillStyle = '#161b22';
    ctx.fillRect(ox - 4, oy - 4, c * n + 8, c * n + 8);
    ctx.strokeStyle = '#2a2a3a';
    ctx.strokeRect(ox - 3.5, oy - 3.5, c * n + 7, c * n + 7);

    // Cells
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const px = ox + x * c, py = oy + y * c;
        ctx.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(px, py, c, c);
        const v = at(state, x, y);
        if (v >= 0) drawGem(px + c / 2, py + c / 2, c, v);
      }
    }

    // Match flashes
    state.flashCells = state.flashCells.filter(f => state.elapsed < f.until);
    for (const f of state.flashCells) {
      const x = f.idx % n, y = Math.floor(f.idx / n);
      const px = ox + x * c, py = oy + y * c;
      const a = Math.max(0, (f.until - state.elapsed) / 0.25);
      ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.55})`;
      ctx.fillRect(px, py, c, c);
    }

    // Swap highlight
    if (state.lastSwap && state.elapsed - state.lastSwap.t < 0.3) {
      const a = 1 - (state.elapsed - state.lastSwap.t) / 0.3;
      for (const idx of [state.lastSwap.a, state.lastSwap.b]) {
        const x = idx % n, y = Math.floor(idx / n);
        const px = ox + x * c, py = oy + y * c;
        ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, c - 2, c - 2);
      }
    }

    // Time bar at top
    const barX = 16, barY = 8, barW = W - 32, barH = 12;
    const frac = state.timeLeft / state.totalTime;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#2a2a3a';
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
    const timerColor = frac > 0.5 ? '#39ff14' : frac > 0.25 ? '#ffd23f' : '#ff4444';
    ctx.fillStyle = timerColor;
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * frac, barH - 2);

    // End screen
    if (state.endState) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(0, H / 2 - 36, W, 72);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0d1117';
      ctx.font = 'bold 36px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TIME OUT', W / 2, H / 2 + 12);
    }

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`score ${Math.floor(state.score)}`, 16, H - 14);
    ctx.textAlign = 'right';
    ctx.fillText(`${state.timeLeft.toFixed(1)}s  ·  ${n}×${n}  ·  ${state.colors} colors`, W - 16, H - 14);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // grid_size and gem_colors are structural; time_seconds and auto_skill live.
  if (params.grid_size !== state.gridSize || params.gem_colors !== state.colors) {
    state.gridSize = params.grid_size;
    state.colors = params.gem_colors;
    state.totalTime = params.time_seconds;
    state.autoSkill = params.auto_skill;
    seed(state);
    return;
  }
  state.totalTime = params.time_seconds;
  state.autoSkill = params.auto_skill;
}
