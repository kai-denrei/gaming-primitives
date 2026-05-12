// Procedural: random-walk — each walker carves a per-hue trail on a tile grid.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const TILE = 8;
const COLS = Math.floor(W / TILE);
const ROWS = Math.floor(H / TILE);

function seedWalkers(state) {
  state.grid = new Int8Array(COLS * ROWS); // 0 = empty, else walker index + 1
  state.walkers = [];
  state.steps = 0;
  state.elapsed = 0;
  for (let i = 0; i < state.walker_count; i++) {
    const c = Math.floor(Math.random() * COLS);
    const r = Math.floor(Math.random() * ROWS);
    state.walkers.push({ c, r, hue: i * 60 });
    state.grid[r * COLS + c] = i + 1;
  }
}

function stepWalkers(state) {
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let i = 0; i < state.walkers.length; i++) {
    const w = state.walkers[i];
    const [dc, dr] = dirs[(Math.random() * 4) | 0];
    w.c = (w.c + dc + COLS) % COLS;
    w.r = (w.r + dr + ROWS) % ROWS;
    state.grid[w.r * COLS + w.c] = i + 1;
  }
  state.steps++;
}

export function init(ctx, params, env) {
  const state = {
    walker_count: params.walker_count,
    step_size: params.step_size,
    regen_interval: params.regen_interval,
    grid: null, walkers: [],
    elapsed: 0, sinceStep: 0, steps: 0,
  };
  seedWalkers(state);

  function tick(dt) {
    state.elapsed += dt;
    state.sinceStep += dt;
    const stepHz = state.step_size * 12;            // step_size scales how fast walkers move
    const stepPeriod = 1 / stepHz;
    while (state.sinceStep >= stepPeriod) {
      stepWalkers(state);
      state.sinceStep -= stepPeriod;
    }
    if (state.elapsed >= state.regen_interval) seedWalkers(state);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Painted tiles.
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = state.grid[r * COLS + c];
        if (!v) continue;
        const w = state.walkers[v - 1];
        ctx.fillStyle = `hsl(${w.hue} 70% 60%)`;
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      }
    }

    // Walker heads (brighter pip).
    for (const w of state.walkers) {
      ctx.fillStyle = `hsl(${w.hue} 90% 80%)`;
      ctx.fillRect(w.c * TILE, w.r * TILE, TILE, TILE);
      ctx.strokeStyle = '#0d1117';
      ctx.lineWidth = 1;
      ctx.strokeRect(w.c * TILE + 0.5, w.r * TILE + 0.5, TILE - 1, TILE - 1);
    }

    // HUD.
    const rate = (state.steps / Math.max(0.01, state.elapsed)).toFixed(0);
    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`walkers: ${state.walkers.length}   steps/s: ${rate}   regen in: ${(state.regen_interval - state.elapsed).toFixed(1)}s`, 12, 22);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  const reseed = params.walker_count !== state.walker_count;
  state.walker_count = params.walker_count;
  state.step_size = params.step_size;
  state.regen_interval = params.regen_interval;
  if (reseed) seedWalkers(state);
}
