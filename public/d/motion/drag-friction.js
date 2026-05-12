// Motion: drag-friction — periodic random impulse, velocity decays exponentially.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const R = 11;

function applyImpulse(state) {
  const ang = Math.random() * Math.PI * 2;
  state.vx += Math.cos(ang) * state.impulse;
  state.vy += Math.sin(ang) * state.impulse;
  state.flashT = 0.15;
}

export function init(ctx, params, env) {
  const state = {
    x: W / 2, y: H / 2,
    vx: 0, vy: 0,
    friction: params.friction,
    interval: params.impulse_interval,
    impulse: params.impulse_strength,
    sinceImpulse: 0,
    flashT: 0,
  };

  function tick(dt) {
    state.sinceImpulse += dt;
    if (state.sinceImpulse >= state.interval) {
      state.sinceImpulse = 0;
      applyImpulse(state);
    }
    if (state.flashT > 0) state.flashT -= dt;

    const damp = Math.exp(-state.friction * dt);
    state.vx *= damp;
    state.vy *= damp;

    state.x += state.vx * dt;
    state.y += state.vy * dt;

    if (state.x < R) { state.x = R; state.vx = -state.vx; }
    if (state.x > W - R) { state.x = W - R; state.vx = -state.vx; }
    if (state.y < R) { state.y = R; state.vy = -state.vy; }
    if (state.y > H - R) { state.y = H - R; state.vy = -state.vy; }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Velocity vector
    const sp = Math.hypot(state.vx, state.vy);
    if (sp > 1) {
      const scale = 0.3;
      const tx = state.x + state.vx * scale;
      const ty = state.y + state.vy * scale;
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(state.x, state.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // arrowhead
      const ah = Math.atan2(state.vy, state.vx);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - Math.cos(ah - 0.4) * 8, ty - Math.sin(ah - 0.4) * 8);
      ctx.lineTo(tx - Math.cos(ah + 0.4) * 8, ty - Math.sin(ah + 0.4) * 8);
      ctx.closePath();
      ctx.fillStyle = '#39ff14';
      ctx.fill();
      ctx.lineWidth = 1;
    }

    // Player
    ctx.fillStyle = state.flashT > 0 ? '#ffffff' : '#39ff14';
    ctx.beginPath();
    ctx.arc(state.x, state.y, R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.friction = params.friction;
  state.interval = params.impulse_interval;
  state.impulse = params.impulse_strength;
}
