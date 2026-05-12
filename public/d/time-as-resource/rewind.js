// Time-as-resource: rewind — bouncing entity, periodic backwards-replay through history.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const MAX_HISTORY = 600;

function seed(state) {
  state.entity = { x: W / 2, y: H / 2, vx: 170, vy: 110 };
  state.history = [];
  state.mode = 'forward';
  state.timer = 0;
  state.rewindLeft = 0;
}

function pushHistory(state) {
  const e = state.entity;
  state.history.push({ x: e.x, y: e.y, vx: e.vx, vy: e.vy });
  if (state.history.length > MAX_HISTORY) state.history.shift();
}

export function init(ctx, params, env) {
  const state = {
    rewind_interval: params.rewind_interval,
    rewind_duration: params.rewind_duration,
  };
  seed(state);

  function tick(dt) {
    state.timer += dt;

    if (state.mode === 'forward') {
      const e = state.entity;
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.x < 14)      { e.x = 14;      e.vx = Math.abs(e.vx); }
      if (e.x > W - 14)  { e.x = W - 14;  e.vx = -Math.abs(e.vx); }
      if (e.y < 14)      { e.y = 14;      e.vy = Math.abs(e.vy); }
      if (e.y > H - 14)  { e.y = H - 14;  e.vy = -Math.abs(e.vy); }
      pushHistory(state);

      if (state.timer >= state.rewind_interval && state.history.length > 30) {
        state.mode = 'rewind';
        state.timer = 0;
        state.rewindLeft = state.rewind_duration;
      }
    } else {
      // rewind: step backwards through history
      const stepsPerSec = state.history.length / Math.max(0.1, state.rewind_duration);
      const stepsThisFrame = Math.max(1, Math.round(stepsPerSec * dt));
      for (let i = 0; i < stepsThisFrame && state.history.length > 1; i++) {
        state.history.pop();
      }
      const last = state.history[state.history.length - 1];
      if (last) {
        state.entity.x = last.x;
        state.entity.y = last.y;
        state.entity.vx = last.vx;
        state.entity.vy = last.vy;
      }
      state.rewindLeft -= dt;
      if (state.rewindLeft <= 0 || state.history.length <= 1) {
        state.mode = 'forward';
        state.timer = 0;
      }
    }

    // ── render
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    if (state.mode === 'rewind') {
      ctx.fillStyle = 'rgba(56, 139, 253, 0.12)';
      ctx.fillRect(0, 0, W, H);
    }

    // Trail
    if (state.history.length > 1) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = state.mode === 'rewind' ? '#58a6ff' : 'rgba(57, 255, 20, 0.35)';
      ctx.beginPath();
      for (let i = 0; i < state.history.length; i++) {
        const p = state.history[i];
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Entity
    ctx.fillStyle = state.mode === 'rewind' ? '#58a6ff' : '#39ff14';
    ctx.beginPath(); ctx.arc(state.entity.x, state.entity.y, 10, 0, Math.PI * 2); ctx.fill();

    // Overlay
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    if (state.mode === 'rewind') {
      ctx.fillStyle = '#58a6ff';
      ctx.font = 'bold 18px ui-monospace, monospace';
      ctx.fillText('◀ REWINDING', 16, 28);
    } else {
      ctx.fillText(`forward — rewind in ${Math.max(0, state.rewind_interval - state.timer).toFixed(1)}s`, 16, 24);
    }
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`history ${state.history.length}/${MAX_HISTORY}`, 16, H - 14);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.rewind_interval = params.rewind_interval;
  state.rewind_duration = params.rewind_duration;
}
