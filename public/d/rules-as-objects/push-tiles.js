// Rules-as-objects: push-tiles — player tile auto-walks; pushes blocks into empty cells, chains.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const COLS = 12, ROWS = 8;
const CELL = 36;
const GRID_X = 24, GRID_Y = (H - ROWS * CELL) / 2;

const DIRS = [
  { dx:  1, dy:  0, name: '→' },
  { dx: -1, dy:  0, name: '←' },
  { dx:  0, dy:  1, name: '↓' },
  { dx:  0, dy: -1, name: '↑' },
];

function inBounds(x, y) { return x >= 0 && x < COLS && y >= 0 && y < ROWS; }

function blockAt(state, x, y) {
  return state.blocks.find(b => b.x === x && b.y === y);
}

function seed(state, block_count) {
  state.player = { x: 1, y: (ROWS / 2) | 0 };
  state.blocks = [];
  const used = new Set([`${state.player.x},${state.player.y}`]);
  let tries = 0;
  while (state.blocks.length < block_count && tries++ < 200) {
    const x = 2 + ((Math.random() * (COLS - 4)) | 0);
    const y = 1 + ((Math.random() * (ROWS - 2)) | 0);
    const k = `${x},${y}`;
    if (used.has(k)) continue;
    used.add(k);
    state.blocks.push({ x, y, hue: (state.blocks.length * 53 + 200) % 360 });
  }
  state.timer = 0;
  state.lastDir = null;
  state.flash = 0;
  state.chain = 0;
}

function tryMove(state, dx, dy) {
  // Determine push chain: cells player.x+dx, .., until empty or wall
  const p = state.player;
  const tx = p.x + dx, ty = p.y + dy;
  if (!inBounds(tx, ty)) return false;
  const chain = [];
  let cx = tx, cy = ty;
  while (inBounds(cx, cy) && blockAt(state, cx, cy)) {
    chain.push(blockAt(state, cx, cy));
    cx += dx; cy += dy;
  }
  if (chain.length > 0) {
    if (!inBounds(cx, cy)) return false;
    // Shift all chain blocks by (dx,dy), in reverse order
    for (let i = chain.length - 1; i >= 0; i--) {
      chain[i].x += dx; chain[i].y += dy;
    }
    state.chain = chain.length;
    state.flash = 0.25;
  } else {
    state.chain = 0;
  }
  p.x = tx; p.y = ty;
  return true;
}

export function init(ctx, params, env) {
  const state = {
    blocks: [], player: { x: 0, y: 0 },
    block_count: params.block_count, move_interval: params.move_interval,
    timer: 0, lastDir: null, flash: 0, chain: 0,
  };
  seed(state, params.block_count);

  function step() {
    // Shuffle directions, try in random order until one succeeds (so movement keeps flowing)
    const order = [0, 1, 2, 3];
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (const idx of order) {
      const d = DIRS[idx];
      if (tryMove(state, d.dx, d.dy)) { state.lastDir = d.name; return; }
    }
  }

  function tick(dt) {
    state.timer += dt;
    if (state.timer >= state.move_interval) {
      state.timer = 0;
      step();
    }
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(GRID_X, GRID_Y + r * CELL + 0.5);
      ctx.lineTo(GRID_X + COLS * CELL, GRID_Y + r * CELL + 0.5);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(GRID_X + c * CELL + 0.5, GRID_Y);
      ctx.lineTo(GRID_X + c * CELL + 0.5, GRID_Y + ROWS * CELL);
      ctx.stroke();
    }

    // Blocks
    for (const b of state.blocks) drawTile(ctx, b.x, b.y, `hsl(${b.hue} 55% 45%)`, '#e6edf3', 'B');

    // Player (whichever is YOU)
    drawTile(ctx, state.player.x, state.player.y, '#1f2937', '#39ff14', 'P', true);

    // Right panel
    const px = GRID_X + COLS * CELL + 16, py = GRID_Y;
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillText('PUSH-TILES', px, py + 14);
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('player auto-walks.', px, py + 36);
    ctx.fillText('walks into a block →', px, py + 52);
    ctx.fillText('pushes if cell beyond', px, py + 68);
    ctx.fillText('is empty (else blocked).', px, py + 84);
    ctx.fillText('chain pushes propagate.', px, py + 100);

    ctx.fillStyle = '#e6edf3';
    ctx.fillText(`dir:   ${state.lastDir ?? '·'}`, px, py + 140);
    ctx.fillText(`blocks: ${state.blocks.length}`, px, py + 158);
    ctx.fillStyle = state.chain > 0 ? '#39ff14' : '#9ca3af';
    ctx.fillText(`chain:  ${state.chain}`, px, py + 176);
  }

  return { state, tick, LOGICAL };
}

function drawTile(ctx, gx, gy, fill, stroke, glyph, thick) {
  const x = GRID_X + gx * CELL + 3, y = GRID_Y + gy * CELL + 3;
  const w = CELL - 6, h = CELL - 6;
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, 5); ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = thick ? 2 : 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 5); ctx.stroke();
  ctx.fillStyle = stroke;
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(glyph, x + w / 2, y + h / 2 + 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
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
  const reseed = state.block_count !== params.block_count;
  state.block_count = params.block_count;
  state.move_interval = params.move_interval;
  if (reseed) seed(state, params.block_count);
}
