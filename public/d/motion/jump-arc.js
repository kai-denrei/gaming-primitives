// Motion: jump-arc — gravity + auto-jump at interval; horizontal drift bounces off walls.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const FLOOR_Y = H - 40;
const R = 12;

export function init(ctx, params, env) {
  const state = {
    x: W / 2,
    y: FLOOR_Y - R,
    vx: 90,
    vy: 0,
    gravity: params.gravity,
    jumpV: params.jump_velocity,
    interval: params.auto_jump_interval,
    sinceJump: 0,
    grounded: true,
  };

  function tick(dt) {
    state.sinceJump += dt;
    if (state.grounded && state.sinceJump >= state.interval) {
      state.sinceJump = 0;
      state.vy = -state.jumpV;
      state.grounded = false;
      // every few jumps reverse horizontal drift for variety
      if (Math.random() < 0.25) state.vx = -state.vx;
    }

    state.vy += state.gravity * dt;
    state.x += state.vx * dt;
    state.y += state.vy * dt;

    if (state.x < R) { state.x = R; state.vx = -state.vx; }
    if (state.x > W - R) { state.x = W - R; state.vx = -state.vx; }

    if (state.y >= FLOOR_Y - R) {
      state.y = FLOOR_Y - R;
      state.vy = 0;
      state.grounded = true;
    } else {
      state.grounded = false;
    }

    // Render
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Floor
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    ctx.strokeStyle = '#2a2a3a';
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(W, FLOOR_Y);
    ctx.stroke();

    // Player
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(state.x, state.y, R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.gravity = params.gravity;
  state.jumpV = params.jump_velocity;
  state.interval = params.auto_jump_interval;
}
