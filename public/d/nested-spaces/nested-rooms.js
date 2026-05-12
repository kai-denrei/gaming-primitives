// Nested-spaces: nested-rooms — recursive rooms that contain themselves.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const OUTER_W = 600, OUTER_H = 340;

export function init(ctx, params, env) {
  const state = {
    nesting_depth: params.nesting_depth,
    inner_scale: params.inner_scale,
    rotation_rate: params.rotation_rate,
    t: 0,
    agent_ang: 0,
  };

  function drawRoom(level) {
    if (level >= state.nesting_depth) return;
    const hue = (level * 60) % 360;
    ctx.lineWidth = Math.max(1, 3 - level * 0.4);
    ctx.strokeStyle = `hsl(${hue} 70% 60%)`;
    ctx.fillStyle = `hsl(${hue} 60% 12%)`;
    ctx.fillRect(-OUTER_W / 2, -OUTER_H / 2, OUTER_W, OUTER_H);
    ctx.strokeRect(-OUTER_W / 2, -OUTER_H / 2, OUTER_W, OUTER_H);

    ctx.fillStyle = `hsl(${hue} 70% 70%)`;
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`level ${level + 1}`, -OUTER_W / 2 + 8, -OUTER_H / 2 + 6);

    ctx.save();
    ctx.rotate(state.rotation_rate * state.t * (level + 1) * 0.5);
    ctx.scale(state.inner_scale, state.inner_scale);
    drawRoom(level + 1);
    ctx.restore();
  }

  function tick(dt) {
    state.t += dt;
    state.agent_ang += dt * 0.8;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2, H / 2);
    drawRoom(0);
    ctx.restore();

    // Agent orbits on the OUTERMOST level only.
    const orbitR = Math.min(OUTER_W, OUTER_H) / 2 - 24;
    const ax = W / 2 + Math.cos(state.agent_ang) * orbitR;
    const ay = H / 2 + Math.sin(state.agent_ang) * orbitR * (OUTER_H / OUTER_W);
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(ax, ay, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.nesting_depth = params.nesting_depth;
  state.inner_scale = params.inner_scale;
  state.rotation_rate = params.rotation_rate;
}
