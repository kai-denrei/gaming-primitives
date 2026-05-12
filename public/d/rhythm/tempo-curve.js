// Rhythm: tempo-curve — BPM ramps from start to end over a cycle on a chosen curve, then resets.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2 - 20;
const BASE_R = 50;
const STEPS = 5;            // discrete steps for 'stepped' curve

function curveAt(t, mode) {
  // t in [0,1] → blend factor in [0,1]
  if (mode === 'exponential') {
    // ease-in: slow start, fast finish
    return t * t;
  }
  if (mode === 'stepped') {
    return Math.floor(t * STEPS) / (STEPS - 1 || 1);  // 0, 0.25, 0.5, 0.75, 1
  }
  return t; // linear
}

function bpmAt(state, t) {
  const k = curveAt(t, state.curve);
  return state.startBpm + (state.endBpm - state.startBpm) * k;
}

export function init(ctx, params, env) {
  const state = {
    startBpm: params.start_bpm,
    endBpm: params.end_bpm,
    cycle: params.cycle_seconds,
    curve: params.curve,
    cycleT: 0,           // 0..cycle seconds
    sincePulse: 0,
    beatIndex: 0,
    history: [],         // sampled BPM over current cycle for graph
    historyAccum: 0,     // throttle history sampling
  };

  function tick(dt) {
    state.cycleT += dt;
    state.sincePulse += dt;
    if (state.cycleT >= state.cycle) {
      state.cycleT -= state.cycle;
      state.history = [];   // reset graph at cycle boundary
      state.beatIndex = 0;
    }

    const t = state.cycleT / state.cycle;
    const currentBpm = bpmAt(state, t);
    const beatPeriod = 60 / currentBpm;

    while (state.sincePulse >= beatPeriod) {
      state.sincePulse -= beatPeriod;
      state.beatIndex += 1;
    }

    // Sample history ~50 times per cycle
    state.historyAccum += dt;
    if (state.historyAccum >= state.cycle / 80) {
      state.history.push({ t, bpm: currentBpm });
      state.historyAccum = 0;
    }

    // Pulse envelope (1 at strike → 0)
    const env01 = Math.max(0, 1 - state.sincePulse / beatPeriod);
    const scale = 1 + 0.3 * env01;
    const r = BASE_R * scale;

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Pulse circle
    ctx.fillStyle = `rgba(57,255,20,${0.3 + 0.5 * env01})`;
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CX, CY, BASE_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    // HUD: current BPM
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 22px ui-monospace, Menlo, monospace';
    ctx.fillText(`${currentBpm.toFixed(0)} BPM`, 20, 32);
    ctx.font = '12px ui-monospace, Menlo, monospace';
    ctx.fillText(
      `${state.startBpm} → ${state.endBpm} · cycle ${state.cycle.toFixed(1)}s · ${state.curve}`,
      20, 50
    );
    ctx.fillText(`beats this cycle: ${state.beatIndex}`, 20, 68);

    // Cycle progress bar
    const pbW = 200, pbX = 20, pbY = 84;
    ctx.strokeStyle = '#2a2a3a';
    ctx.strokeRect(pbX + 0.5, pbY + 0.5, pbW - 1, 8);
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(pbX + 1, pbY + 1, (pbW - 2) * t, 6);

    // Mini graph (top-right) — curve traced out so far
    const gx = W - 200, gy = 20, gw = 180, gh = 90;
    ctx.fillStyle = '#1a1a24';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = '#2a2a3a';
    ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);
    ctx.fillStyle = '#e6edf3';
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.fillText('bpm vs t', gx + 4, gy + 12);
    // Range for graph
    const lo = Math.min(state.startBpm, state.endBpm);
    const hi = Math.max(state.startBpm, state.endBpm);
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < state.history.length; i++) {
      const p = state.history[i];
      const px = gx + 4 + (gw - 8) * p.t;
      const py = gy + gh - 4 - (gh - 16) * ((p.bpm - lo) / Math.max(0.0001, hi - lo));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Any change to start/end/cycle/curve is structural — reset cycle phase + graph so the new shape is visible.
  const structural =
    state.startBpm !== params.start_bpm ||
    state.endBpm !== params.end_bpm ||
    state.cycle !== params.cycle_seconds ||
    state.curve !== params.curve;
  state.startBpm = params.start_bpm;
  state.endBpm = params.end_bpm;
  state.cycle = params.cycle_seconds;
  state.curve = params.curve;
  if (structural) {
    state.cycleT = 0;
    state.sincePulse = 0;
    state.beatIndex = 0;
    state.history = [];
    state.historyAccum = 0;
  }
}
