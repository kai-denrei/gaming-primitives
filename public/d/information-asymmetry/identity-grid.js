// Information asymmetry: identity-grid — entities with hidden features revealed one at a time.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const COLORS = ['#e54848', '#39c759', '#3a8cf5', '#f5c63a', '#b45cf0'];
const COLOR_NAMES = ['red', 'green', 'blue', 'yellow', 'purple'];
const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'pentagon'];
const FEATURES = ['color', 'shape', 'number'];

function seed(state, cell_count, feature_count) {
  state.cells = [];
  state.feature_count = feature_count;
  state.active_features = FEATURES.slice(0, feature_count);
  for (let i = 0; i < cell_count; i++) {
    const features = {
      color: (Math.random() * COLORS.length) | 0,
      shape: (Math.random() * SHAPES.length) | 0,
      number: 1 + ((Math.random() * 9) | 0),
    };
    const revealed = {};
    for (const f of state.active_features) revealed[f] = false;
    state.cells.push({ features, revealed });
  }
  state.timer = 0;
  state.flash = 0;
}

function unrevealedSlots(state) {
  const slots = [];
  for (let i = 0; i < state.cells.length; i++) {
    for (const f of state.active_features) {
      if (!state.cells[i].revealed[f]) slots.push({ cell: i, feature: f });
    }
  }
  return slots;
}

function revealOne(state) {
  const slots = unrevealedSlots(state);
  if (slots.length === 0) return false;
  const pick = slots[(Math.random() * slots.length) | 0];
  state.cells[pick.cell].revealed[pick.feature] = true;
  return true;
}

function solvedCount(state) {
  let n = 0;
  for (const c of state.cells) {
    let all = true;
    for (const f of state.active_features) if (!c.revealed[f]) { all = false; break; }
    if (all) n++;
  }
  return n;
}

export function init(ctx, params, env) {
  const state = {
    cell_count: params.cell_count,
    feature_count: params.feature_count,
    reveal_interval: params.reveal_interval,
    cells: [], active_features: [], timer: 0, flash: 0,
  };
  seed(state, params.cell_count, params.feature_count);

  function tick(dt) {
    state.timer += dt;
    if (state.timer >= state.reveal_interval) {
      state.timer = 0;
      if (!revealOne(state)) {
        state.flash = 0.6;
      }
    }
    if (state.flash > 0) {
      state.flash -= dt;
      if (state.flash <= 0) {
        state.flash = 0;
        seed(state, state.cell_count, state.feature_count);
      }
    }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(57, 255, 20, ${state.flash * 0.4})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Layout grid.
    const n = state.cells.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const pad = 30;
    const top = 50;
    const cellW = Math.min(120, (W - pad * (cols + 1)) / cols);
    const cellH = Math.min(110, (H - top - pad * (rows + 1)) / rows);
    const startX = (W - (cols * cellW + (cols - 1) * pad)) / 2;

    for (let i = 0; i < n; i++) {
      const r = (i / cols) | 0, c = i % cols;
      const x = startX + c * (cellW + pad);
      const y = top + r * (cellH + pad);
      drawCell(ctx, x, y, cellW, cellH, state.cells[i], state.active_features);
    }

    const solved = solvedCount(state);
    ctx.fillStyle = '#e6edf3';
    ctx.font = '16px ui-monospace, monospace';
    ctx.fillText(`Solved: ${solved}/${n}    interval:${state.reveal_interval.toFixed(1)}s    features:${state.feature_count}`, 12, 24);
  }

  return { state, tick, LOGICAL };
}

function drawCell(ctx, x, y, w, h, cell, active) {
  ctx.fillStyle = '#1a1f2a';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#2a2a3a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  // Color swatch (top half) or "?".
  const sw = w * 0.5, sh = h * 0.45;
  const sx = x + (w - sw) / 2, sy = y + 8;
  if (active.includes('color') && cell.revealed.color) {
    ctx.fillStyle = COLORS[cell.features.color];
    drawShape(ctx, sx + sw / 2, sy + sh / 2, Math.min(sw, sh) / 2 - 2,
              (active.includes('shape') && cell.revealed.shape) ? SHAPES[cell.features.shape] : 'square');
  } else {
    ctx.fillStyle = '#666';
    drawShape(ctx, sx + sw / 2, sy + sh / 2, Math.min(sw, sh) / 2 - 2,
              (active.includes('shape') && cell.revealed.shape) ? SHAPES[cell.features.shape] : 'square');
    ctx.fillStyle = '#0d1117';
    ctx.font = `${Math.min(sw, sh) * 0.4}px ui-monospace, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', sx + sw / 2, sy + sh / 2);
  }

  // Number / shape labels.
  ctx.font = '14px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const labelY = y + h - 10;
  let label = '';
  if (active.includes('number')) {
    label += cell.revealed.number ? `#${cell.features.number}` : '#?';
  }
  if (active.includes('shape')) {
    label += (label ? '  ' : '') + (cell.revealed.shape ? SHAPES[cell.features.shape].slice(0, 4) : 'shp?');
  }
  ctx.fillStyle = '#e6edf3';
  ctx.fillText(label, x + w / 2, labelY);
  ctx.textAlign = 'left';
}

function drawShape(ctx, cx, cy, r, shape) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === 'square') {
    ctx.rect(cx - r, cy - r, r * 2, r * 2);
  } else if (shape === 'triangle') {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.closePath();
  } else if (shape === 'diamond') {
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
    ctx.closePath();
  } else if (shape === 'pentagon') {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  ctx.fill();
}

export function applyParams(state, params) {
  const reseed = state.cell_count !== params.cell_count || state.feature_count !== params.feature_count;
  state.cell_count = params.cell_count;
  state.feature_count = params.feature_count;
  state.reveal_interval = params.reveal_interval;
  if (reseed) seed(state, params.cell_count, params.feature_count);
}
