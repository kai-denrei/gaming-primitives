// Procedural: perlin-terrain — multi-octave value noise heightmap with animated regen.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CELL = 4;
const GW = Math.floor(W / CELL);   // 200
const GH = Math.floor(H / CELL);   // 112

// Deterministic 2D hash → [0, 1).
function hash2(x, y, seed) {
  let h = (x * 374761393) ^ (y * 668265263) ^ (seed * 1442695040888963407);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t) { return t * t * (3 - 2 * t); }

// Value noise: bilinearly interpolate a hashed lattice at cell-spacing 1/freq.
function valueNoise(x, y, freq, seed) {
  const px = x * freq, py = y * freq;
  const xi = Math.floor(px), yi = Math.floor(py);
  const xf = px - xi, yf = py - yi;
  const a = hash2(xi,     yi,     seed);
  const b = hash2(xi + 1, yi,     seed);
  const c = hash2(xi,     yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const u = smooth(xf), v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function noiseAt(x, y, octaves, baseFreq, seed) {
  let sum = 0, amp = 1, freq = baseFreq, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x, y, freq, seed + o * 17) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function buildHeights(state, seed) {
  state.heights = new Float32Array(GW * GH);
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      state.heights[y * GW + x] = noiseAt(x, y, state.octaves, state.frequency, seed);
    }
  }
}

function colorFor(h) {
  if (h < 0.2) return '#1e4ec1';
  if (h < 0.4) return '#39ff14';
  if (h < 0.7) return '#aaaaaa';
  return '#ffffff';
}

function paletteIdx(h) {
  if (h < 0.2) return 0;
  if (h < 0.4) return 1;
  if (h < 0.7) return 2;
  return 3;
}

export function init(ctx, params, env) {
  const state = {
    octaves: params.octaves,
    frequency: params.frequency,
    regen_interval: params.regen_interval,
    heights: null, prevHeights: null,
    seed: Math.floor(Math.random() * 1e9),
    elapsed: 0, morphT: 1,                          // 1 = settled
  };
  buildHeights(state, state.seed);

  function tick(dt) {
    state.elapsed += dt;
    if (state.elapsed >= state.regen_interval) {
      state.prevHeights = state.heights;
      state.seed = Math.floor(Math.random() * 1e9);
      buildHeights(state, state.seed);
      state.morphT = 0;
      state.elapsed = 0;
    }
    if (state.morphT < 1) state.morphT = Math.min(1, state.morphT + dt / 1.5);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    const t = state.morphT;
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const i = y * GW + x;
        let h = state.heights[i];
        if (state.prevHeights && t < 1) h = state.prevHeights[i] * (1 - t) + h * t;
        ctx.fillStyle = colorFor(h);
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    // HUD.
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(8, 8, 280, 22);
    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`octaves: ${state.octaves}   freq: ${state.frequency.toFixed(3)}   regen: ${(state.regen_interval - state.elapsed).toFixed(1)}s`, 12, 23);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  const rebuild = params.octaves !== state.octaves || params.frequency !== state.frequency;
  state.octaves = params.octaves;
  state.frequency = params.frequency;
  state.regen_interval = params.regen_interval;
  if (rebuild) {
    state.prevHeights = null;
    state.morphT = 1;
    buildHeights(state, state.seed);
  }
}
