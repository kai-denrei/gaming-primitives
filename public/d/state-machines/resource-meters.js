// State-machines: resource-meters — multiple regenerating pools with random drains.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

const METER_DEFS = [
  { name: 'HP',      color: '#ef4444', max: 100 },
  { name: 'Stamina', color: '#10b981', max: 100 },
  { name: 'Mana',    color: '#3b82f6', max: 100 },
  { name: 'Focus',   color: '#a855f7', max: 100 },
  { name: 'Heat',    color: '#f97316', max: 100 },
];
const SEGMENTS = 4;

function seedMeters(state, n) {
  state.meters = [];
  for (let i = 0; i < n; i++) {
    const def = METER_DEFS[i % METER_DEFS.length];
    state.meters.push({ ...def, value: def.max, pulse: 0 });
  }
}

function drainRandom(state) {
  if (!state.meters.length) return;
  const m = state.meters[(Math.random() * state.meters.length) | 0];
  const amt = m.max * (0.2 + Math.random() * 0.2);
  m.value = Math.max(0, m.value - amt);
  m.pulse = 0.5;
}

function drawCharacter(ctx) {
  // Simple humanoid: head + body in the left panel.
  const cx = 150, cy = H / 2;
  ctx.fillStyle = '#58a6ff';
  ctx.beginPath(); ctx.arc(cx, cy - 40, 24, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - 22, cy - 10, 44, 70);
  ctx.fillStyle = '#0d1117';
  ctx.beginPath(); ctx.arc(cx - 8, cy - 44, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 8, cy - 44, 3, 0, Math.PI * 2); ctx.fill();
}

function drawMeterBar(ctx, x, y, w, h, m) {
  // Background track
  ctx.fillStyle = '#1f2937'; ctx.fillRect(x, y, w, h);
  // Filled portion
  const frac = m.value / m.max;
  ctx.fillStyle = m.color; ctx.fillRect(x, y, w * frac, h);
  // Segment dividers
  ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 2;
  for (let i = 1; i < SEGMENTS; i++) {
    const sx = x + (w * i) / SEGMENTS;
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, y + h); ctx.stroke();
  }
  // Pulse outline when freshly drained
  if (m.pulse > 0) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${m.pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  } else {
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  // Label + numeric
  ctx.fillStyle = '#e6edf3';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(m.name, x, y - 6);
  ctx.textAlign = 'right';
  ctx.fillText(`${m.value.toFixed(0)} / ${m.max}`, x + w, y - 6);
  ctx.textAlign = 'left';
}

export function init(ctx, params, env) {
  const state = {
    regen_rate: params.regen_rate,
    drain_interval: params.drain_interval,
    meter_count: params.meter_count,
    timer: 0,
    meters: [],
  };
  seedMeters(state, state.meter_count);

  function tick(dt) {
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

    state.timer += dt;
    if (state.timer >= state.drain_interval) {
      state.timer = 0;
      drainRandom(state);
    }
    for (const m of state.meters) {
      m.value = Math.min(m.max, m.value + state.regen_rate * (m.max / 100) * 10 * dt);
      if (m.pulse > 0) m.pulse = Math.max(0, m.pulse - dt * 1.5);
    }

    drawCharacter(ctx);

    const x = 290, w = W - x - 30, h = 28;
    const totalH = state.meters.length * (h + 26);
    let y = (H - totalH) / 2 + 18;
    for (const m of state.meters) {
      drawMeterBar(ctx, x, y, w, h, m);
      y += h + 26;
    }

    // Header
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`regen ${state.regen_rate.toFixed(2)}/s   drain every ${state.drain_interval.toFixed(1)}s`, 290, 24);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.regen_rate = params.regen_rate;
  state.drain_interval = params.drain_interval;
  if (params.meter_count !== state.meter_count) {
    state.meter_count = params.meter_count;
    seedMeters(state, state.meter_count);
  }
}
