// Procedural: cellular-automata — toroidal grid, three rule sets, auto-reset on stable.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CELL = 10;
const COLS = Math.floor(W / CELL);   // 80
const ROWS = Math.floor(H / CELL);   // 45
const SIZE = COLS * ROWS;

// State values: 0 = off, 1 = on, 2 = dying (brian-brain).

function seed(state) {
  state.a = new Uint8Array(SIZE);
  state.b = new Uint8Array(SIZE);
  for (let i = 0; i < SIZE; i++) state.a[i] = Math.random() < state.density ? 1 : 0;
  state.gen = 0;
  state.stableSince = 0;
  state.hash = 0;
  state.lastHash = -1;
  state.lastHash2 = -1;
}

function neighbours(buf, c, r) {
  // 8-neighbour Moore, toroidal — count cells in state 1.
  let n = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nc = (c + dc + COLS) % COLS;
      const nr = (r + dr + ROWS) % ROWS;
      if (buf[nr * COLS + nc] === 1) n++;
    }
  }
  return n;
}

function step(state) {
  const a = state.a, b = state.b;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const cur = a[i];
      const n = neighbours(a, c, r);
      let nxt = 0;
      if (state.rule === 'game-of-life') {
        if (cur === 1) nxt = (n === 2 || n === 3) ? 1 : 0;
        else           nxt = (n === 3) ? 1 : 0;
      } else if (state.rule === 'seeds') {
        if (cur === 1) nxt = 0;                         // B2/S
        else           nxt = (n === 2) ? 1 : 0;
      } else { // brian-brain — 3-state
        if (cur === 1)      nxt = 2;                    // on → dying
        else if (cur === 2) nxt = 0;                    // dying → off
        else                nxt = (n === 2) ? 1 : 0;    // off & exactly 2 on → on
      }
      b[i] = nxt;
    }
  }
  state.a = b; state.b = a;
  state.gen++;

  // Stability detection: 2-step cycle hash check.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < SIZE; i++) { h ^= state.a[i]; h = (h * 16777619) >>> 0; }
  if (h === state.lastHash || h === state.lastHash2) {
    state.stableSince++;
  } else {
    state.stableSince = 0;
  }
  state.lastHash2 = state.lastHash;
  state.lastHash = h;
  if (state.stableSince > 6) seed(state);
}

export function init(ctx, params, env) {
  const state = {
    rule: params.rule,
    density: params.density,
    tick_rate: params.tick_rate,
    a: null, b: null,
    gen: 0, sinceStep: 0,
    stableSince: 0, lastHash: -1, lastHash2: -1,
  };
  seed(state);

  function tick(dt) {
    state.sinceStep += dt;
    const period = 1 / state.tick_rate;
    let steps = 0;
    while (state.sinceStep >= period && steps < 8) {
      step(state);
      state.sinceStep -= period;
      steps++;
    }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = state.a[r * COLS + c];
        if (v === 0) continue;
        ctx.fillStyle = v === 1 ? '#39ff14' : '#888888';
        ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
      }
    }

    // HUD.
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(8, 8, 320, 22);
    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`rule: ${state.rule}   gen: ${state.gen}   tick: ${state.tick_rate.toFixed(0)}hz`, 12, 23);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  const reseed = params.rule !== state.rule || params.density !== state.density;
  state.rule = params.rule;
  state.density = params.density;
  state.tick_rate = params.tick_rate;
  if (reseed) seed(state);
}
