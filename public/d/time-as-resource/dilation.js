// Time-as-resource: dilation — entities run normally, periodic slowmo dilates world dt.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const N = 5;

function seed(state) {
  state.entities = [];
  for (let i = 0; i < N; i++) {
    state.entities.push({
      x: 40 + Math.random() * (W - 80),
      y: 40 + Math.random() * (H - 80),
      vx: (Math.random() - 0.5) * 280,
      vy: (Math.random() - 0.5) * 220,
      hue: (i * 67) % 360,
      pulse: Math.random() * Math.PI * 2,
    });
  }
}

export function init(ctx, params, env) {
  const state = {
    slowmo_interval: params.slowmo_interval,
    slowmo_duration: params.slowmo_duration,
    slowmo_factor: params.slowmo_factor,
    timer: 0,
    slowLeft: 0,
    uiClock: 0,
  };
  seed(state);

  function tick(realDt) {
    // UI clock is independent of world time
    state.uiClock += realDt;

    // Decide world time scale
    if (state.slowLeft > 0) {
      state.slowLeft -= realDt;
      if (state.slowLeft <= 0) { state.slowLeft = 0; state.timer = 0; }
    } else {
      state.timer += realDt;
      if (state.timer >= state.slowmo_interval) {
        state.slowLeft = state.slowmo_duration;
      }
    }
    const scale = state.slowLeft > 0 ? state.slowmo_factor : 1;
    const dt = realDt * scale;

    // World physics — animations & motion both slow because they use the scaled dt
    for (const e of state.entities) {
      e.x += e.vx * dt; e.y += e.vy * dt;
      e.pulse += dt * 6;
      if (e.x < 12)     { e.x = 12;     e.vx = Math.abs(e.vx); }
      if (e.x > W - 12) { e.x = W - 12; e.vx = -Math.abs(e.vx); }
      if (e.y < 12)     { e.y = 12;     e.vy = Math.abs(e.vy); }
      if (e.y > H - 12) { e.y = H - 12; e.vy = -Math.abs(e.vy); }
    }

    // ── render
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    if (state.slowLeft > 0) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.16)';
      ctx.fillRect(0, 0, W, H);
    }

    for (const e of state.entities) {
      const r = 12 + Math.sin(e.pulse) * 3;  // animation also slows
      ctx.fillStyle = `hsl(${e.hue} 70% 60%)`;
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = state.slowLeft > 0 ? '#a855f7' : '#1f2937';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Overlay — uses uiClock so it never slows
    if (state.slowLeft > 0) {
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 18px ui-monospace, monospace';
      ctx.fillText('◐ SLOW-MO', 16, 28);
      ctx.fillStyle = '#e6edf3';
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillText(`world × ${state.slowmo_factor.toFixed(2)}  —  ${state.slowLeft.toFixed(1)}s left`, 16, 46);
    } else {
      ctx.fillStyle = '#e6edf3';
      ctx.font = '13px ui-monospace, monospace';
      ctx.fillText(`normal — slowmo in ${Math.max(0, state.slowmo_interval - state.timer).toFixed(1)}s`, 16, 24);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.slowmo_interval = params.slowmo_interval;
  state.slowmo_duration = params.slowmo_duration;
  state.slowmo_factor = params.slowmo_factor;
}
