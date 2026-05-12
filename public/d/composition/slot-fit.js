// Composition: slot-fit — place variable-size items into a bounded slot grid.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SLOT_W = 70, SLOT_H = 80, SLOT_GAP = 8;
const FILL_COLOR = '#39ff14';
const EMPTY_COLOR = '#2a2a3a';

function gridDims(n) {
  // pick a roughly 2:1 grid; cols >= rows
  for (let rows = 1; rows <= 4; rows++) {
    if (rows * Math.ceil(n / rows) === n && Math.ceil(n / rows) <= 8) {
      return { rows, cols: n / rows };
    }
  }
  // fallback: 2 rows
  return { rows: 2, cols: Math.ceil(n / 2) };
}

function seed(state, slot_count) {
  const { rows, cols } = gridDims(slot_count);
  state.rows = rows; state.cols = cols;
  state.slots = new Array(rows * cols).fill(null); // each cell: item id or null
  state.items = [];
  state.nextItemId = 1;
  state.flash = 0;
  state.timer = 0;
}

function slotXY(state, idx) {
  const r = Math.floor(idx / state.cols);
  const c = idx % state.cols;
  const totalW = state.cols * SLOT_W + (state.cols - 1) * SLOT_GAP;
  const totalH = state.rows * SLOT_H + (state.rows - 1) * SLOT_GAP;
  const x0 = (W - totalW) / 2;
  const y0 = (H - totalH) / 2 + 10;
  return { x: x0 + c * (SLOT_W + SLOT_GAP), y: y0 + r * (SLOT_H + SLOT_GAP) };
}

// Greedy: find largest contiguous empty run on any row, place there if width fits.
// First-fit: scan rows top-to-bottom, place at first contiguous empty run that fits.
function tryPlace(state, width, algo) {
  const candidates = []; // {idx, runLen}
  for (let r = 0; r < state.rows; r++) {
    let runStart = -1, runLen = 0;
    for (let c = 0; c <= state.cols; c++) {
      const idx = r * state.cols + c;
      const empty = c < state.cols && state.slots[idx] === null;
      if (empty) {
        if (runStart < 0) runStart = idx;
        runLen++;
      } else {
        if (runLen >= width) candidates.push({ idx: runStart, runLen, row: r });
        runStart = -1; runLen = 0;
      }
    }
  }
  if (candidates.length === 0) return null;
  let pick;
  if (algo === 'greedy') {
    // largest run first, tie-break by lowest row
    candidates.sort((a, b) => b.runLen - a.runLen || a.row - b.row);
    pick = candidates[0];
  } else {
    // first-fit: top-leftmost
    candidates.sort((a, b) => a.idx - b.idx);
    pick = candidates[0];
  }
  return pick.idx;
}

function attemptPlace(state) {
  const width = 1 + ((Math.random() * 3) | 0); // 1..3
  const start = tryPlace(state, width, state.algo);
  if (start === null) {
    // No fit anywhere — animate clear
    state.flash = 0.4;
    setTimeout(() => {}, 0); // no-op; visual handled in tick via flash
    state.slots = new Array(state.rows * state.cols).fill(null);
    state.items = [];
    return;
  }
  const id = state.nextItemId++;
  state.items.push({ id, start, width, hue: ((id - 1) * 47) % 360, t: 0 });
  for (let k = 0; k < width; k++) state.slots[start + k] = id;
}

export function init(ctx, params, env) {
  const state = { rows: 0, cols: 0, slots: [], items: [], nextItemId: 1, algo: params.algo, interval: params.tick_interval, timer: 0, flash: 0, item_pool: params.item_count };
  seed(state, params.slot_count);

  function tick(dt) {
    state.timer += dt;
    if (state.timer >= state.interval) {
      state.timer = 0;
      attemptPlace(state);
    }
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
    for (const it of state.items) it.t = Math.min(0.3, it.t + dt);

    ctx.fillStyle = state.flash > 0 ? '#1a3a1a' : '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Draw empty slot frames
    for (let i = 0; i < state.slots.length; i++) {
      const p = slotXY(state, i);
      if (state.slots[i] === null) {
        ctx.fillStyle = EMPTY_COLOR;
        roundRect(ctx, p.x, p.y, SLOT_W, SLOT_H, 6); ctx.fill();
        ctx.strokeStyle = '#3a3a4a'; ctx.lineWidth = 1;
        roundRect(ctx, p.x + 0.5, p.y + 0.5, SLOT_W - 1, SLOT_H - 1, 6); ctx.stroke();
      }
    }

    // Draw items as merged blocks spanning their width
    for (const it of state.items) {
      const p0 = slotXY(state, it.start);
      const w = it.width * SLOT_W + (it.width - 1) * SLOT_GAP;
      const scale = Math.min(1, it.t / 0.3);
      const sw = w * scale, sh = SLOT_H * scale;
      const sx = p0.x + (w - sw) / 2, sy = p0.y + (SLOT_H - sh) / 2;
      ctx.fillStyle = FILL_COLOR;
      roundRect(ctx, sx, sy, sw, sh, 6); ctx.fill();
      ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 1;
      roundRect(ctx, sx + 0.5, sy + 0.5, sw - 1, sh - 1, 6); ctx.stroke();
      ctx.fillStyle = '#0d1117';
      ctx.font = '14px ui-monospace, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`#${it.id}·${it.width}`, p0.x + w / 2, p0.y + SLOT_H / 2);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    // HUD
    const used = state.slots.filter(s => s !== null).length;
    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`algo: ${state.algo}   slots: ${used}/${state.slots.length}`, 12, 22);
  }

  return { state, tick, LOGICAL };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

export function applyParams(state, params) {
  if (state.slots.length !== params.slot_count) seed(state, params.slot_count);
  state.algo = params.algo;
  state.interval = params.tick_interval;
  state.item_pool = params.item_count;
}
