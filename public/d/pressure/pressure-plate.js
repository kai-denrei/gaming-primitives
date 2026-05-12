// Pressure: pressure-plate — sustained weight on a tile triggers a state change.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const PLATE = 80;
const PX = (W - PLATE) / 2, PY = (H - PLATE) / 2;
const R = 8;

function seed(state, n) {
  state.agents = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    // spawn away from plate to make activation visible
    let x, y;
    do {
      x = R + Math.random() * (W - 2 * R);
      y = R + Math.random() * (H - 2 * R);
    } while (x > PX - 40 && x < PX + PLATE + 40 && y > PY - 40 && y < PY + PLATE + 40);
    state.agents.push({ x, y, vx: Math.cos(ang) * 90, vy: Math.sin(ang) * 90, hue: (i * 67) % 360 });
  }
}

function onPlate(a) {
  return a.x > PX && a.x < PX + PLATE && a.y > PY && a.y < PY + PLATE;
}

export function init(ctx, params, env) {
  const state = {
    agents: [],
    threshold: params.weight_threshold,
    holdDuration: params.hold_duration,
    latching: !!params.latching,
    holdTimer: 0,
    activated: false,
    latched: false,
  };
  seed(state, params.entity_count);

  function tick(dt) {
    for (const a of state.agents) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < R)         { a.x = R;     a.vx = -a.vx; }
      else if (a.x > W - R) { a.x = W - R; a.vx = -a.vx; }
      if (a.y < R)         { a.y = R;     a.vy = -a.vy; }
      else if (a.y > H - R) { a.y = H - R; a.vy = -a.vy; }
    }

    const weight = state.agents.reduce((n, a) => n + (onPlate(a) ? 1 : 0), 0);

    if (state.latched) {
      // already latched — stays on
    } else if (weight >= state.threshold) {
      state.holdTimer += dt;
      if (state.holdTimer >= state.holdDuration) {
        state.activated = true;
        if (state.latching) state.latched = true;
      }
    } else {
      // Weight dropped — reset hold timer; momentary turns off.
      state.holdTimer = 0;
      if (!state.latching) state.activated = false;
    }

    // Draw
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Plate
    const active = state.activated || state.latched;
    ctx.fillStyle = active ? '#39ff14' : '#2a2a3a';
    ctx.fillRect(PX, PY, PLATE, PLATE);
    ctx.strokeStyle = active ? '#39ff14' : '#e6edf3';
    ctx.lineWidth = 2;
    ctx.strokeRect(PX + 0.5, PY + 0.5, PLATE - 1, PLATE - 1);

    // Agents
    for (const a of state.agents) {
      const on = onPlate(a);
      ctx.fillStyle = on ? '#39ff14' : `hsl(${a.hue} 70% 60%)`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, R, 0, Math.PI * 2);
      ctx.fill();
    }

    // Status indicator (right of plate)
    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px system-ui, sans-serif';
    const sx = PX + PLATE + 16, sy = PY + 4;
    ctx.fillText(`weight ${weight}/${state.threshold}`, sx, sy + 14);
    const tFrac = Math.min(1, state.holdTimer / Math.max(0.0001, state.holdDuration));
    ctx.fillText(`hold ${state.holdTimer.toFixed(2)}s / ${state.holdDuration.toFixed(2)}s`, sx, sy + 32);
    // mini progress bar
    ctx.strokeStyle = '#e6edf3';
    ctx.strokeRect(sx + 0.5, sy + 40.5, 120, 8);
    ctx.fillStyle = active ? '#39ff14' : '#e6edf3';
    ctx.fillRect(sx + 1, sy + 41, 119 * tFrac, 6);
    ctx.fillStyle = active ? '#39ff14' : '#e6edf3';
    ctx.font = 'bold 14px system-ui, sans-serif';
    const stateLabel = state.latched ? 'LATCHED' : (active ? 'ACTIVE' : (state.latching ? 'idle (latching)' : 'idle (momentary)'));
    ctx.fillText(stateLabel, sx, sy + 70);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (state.agents.length !== params.entity_count) seed(state, params.entity_count);
  // Threshold change clears any in-progress hold and any latch (so the demo stays interpretable)
  if (state.threshold !== params.weight_threshold) {
    state.threshold = params.weight_threshold;
    state.holdTimer = 0;
    state.latched = false;
    state.activated = false;
  }
  state.holdDuration = params.hold_duration;
  if (state.latching !== !!params.latching) {
    state.latching = !!params.latching;
    state.latched = false;
    state.activated = false;
    state.holdTimer = 0;
  }
}
