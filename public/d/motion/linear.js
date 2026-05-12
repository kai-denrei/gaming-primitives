// Motion: linear — constant velocity, periodic random heading reroll, bounce on edges.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const R = 10;

function pickHeading(state) {
  state.heading = Math.random() * Math.PI * 2;
}

export function init(ctx, params, env) {
  const state = {
    x: W / 2,
    y: H / 2,
    heading: 0,
    speed: params.speed,
    changePeriod: params.direction_change_period,
    sinceChange: 0,
  };
  pickHeading(state);

  function tick(dt) {
    state.sinceChange += dt;
    if (state.sinceChange >= state.changePeriod) {
      state.sinceChange = 0;
      pickHeading(state);
    }

    const vx = Math.cos(state.heading) * state.speed;
    const vy = Math.sin(state.heading) * state.speed;
    state.x += vx * dt;
    state.y += vy * dt;

    if (state.x < R) { state.x = R; state.heading = Math.PI - state.heading; }
    if (state.x > W - R) { state.x = W - R; state.heading = Math.PI - state.heading; }
    if (state.y < R) { state.y = R; state.heading = -state.heading; }
    if (state.y > H - R) { state.y = H - R; state.heading = -state.heading; }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // velocity hint
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.4)';
    ctx.beginPath();
    ctx.moveTo(state.x, state.y);
    ctx.lineTo(state.x + Math.cos(state.heading) * 30, state.y + Math.sin(state.heading) * 30);
    ctx.stroke();

    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(state.x, state.y, R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.speed = params.speed;
  state.changePeriod = params.direction_change_period;
}
