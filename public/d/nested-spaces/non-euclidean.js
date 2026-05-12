// Nested-spaces: non-euclidean — agent walks a circle in WORLD frame, but the
// world rotates per unit traveled, so the path traces a spiral on the screen.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CIRCLE_R = 110, AGENT_R = 6;

export function init(ctx, params, env) {
  const state = {
    rotation_per_step: params.rotation_per_step,
    agent_speed: params.agent_speed,
    world_rotation: 0,
    agent_ang: 0,           // angle of agent inside the (rotating) world frame
    trail: [],              // screen-frame positions for the spiral path
    t: 0,
  };

  function tick(dt) {
    state.t += dt;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Faint stationary reference grid (screen frame).
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    const step = 40;
    ctx.beginPath();
    for (let x = 0; x <= W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = 0; y <= H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();

    // Advance agent along its world-frame circle.
    const ds = state.agent_speed * dt;
    state.agent_ang += ds / CIRCLE_R;
    state.world_rotation += state.rotation_per_step * ds;

    // Agent's WORLD-frame position (constant circle).
    const wx = Math.cos(state.agent_ang) * CIRCLE_R;
    const wy = Math.sin(state.agent_ang) * CIRCLE_R;

    // Screen-frame position after world rotation.
    const c = Math.cos(state.world_rotation), s = Math.sin(state.world_rotation);
    const sx = W / 2 + (wx * c - wy * s);
    const sy = H / 2 + (wx * s + wy * c);

    // Record spiral trail in screen frame.
    state.trail.push({ x: sx, y: sy });
    if (state.trail.length > 1200) state.trail.shift();

    // Draw the rotating world frame (the agent's "intended" circle).
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(state.world_rotation);
    ctx.strokeStyle = '#5a8dee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, CIRCLE_R, 0, Math.PI * 2);
    ctx.stroke();
    // World axis tick.
    ctx.strokeStyle = '#5a8dee88';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(CIRCLE_R + 12, 0);
    ctx.stroke();
    ctx.restore();

    // Draw the spiral trail (screen frame).
    ctx.strokeStyle = '#39ff1488';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i++) {
      const p = state.trail[i];
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Agent dot (screen frame).
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(sx, sy, AGENT_R, 0, Math.PI * 2);
    ctx.fill();

    // Legend.
    ctx.fillStyle = '#888';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('blue ring: intended circle (world frame)', 12, H - 28);
    ctx.fillText('green trail: actual path (screen frame)', 12, H - 12);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.rotation_per_step = params.rotation_per_step;
  state.agent_speed = params.agent_speed;
}
