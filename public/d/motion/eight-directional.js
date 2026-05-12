// Motion: eight-directional — heading snaps to 8 compass directions, reroll periodically.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const HALF = 12;

function pickDir(state) {
  const k = Math.floor(Math.random() * 8);
  state.dirIdx = k;
  const ang = (k * Math.PI) / 4;
  state.dx = Math.cos(ang);
  state.dy = Math.sin(ang);
}

export function init(ctx, params, env) {
  const state = {
    x: W / 2,
    y: H / 2,
    dirIdx: 0,
    dx: 1, dy: 0,
    speed: params.speed,
    changePeriod: params.auto_change_period,
    sinceChange: 0,
  };
  pickDir(state);

  function tick(dt) {
    state.sinceChange += dt;
    if (state.sinceChange >= state.changePeriod) {
      state.sinceChange = 0;
      pickDir(state);
    }

    state.x += state.dx * state.speed * dt;
    state.y += state.dy * state.speed * dt;

    if (state.x < HALF) { state.x = HALF; state.dx = -state.dx; }
    if (state.x > W - HALF) { state.x = W - HALF; state.dx = -state.dx; }
    if (state.y < HALF) { state.y = HALF; state.dy = -state.dy; }
    if (state.y > H - HALF) { state.y = H - HALF; state.dy = -state.dy; }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // 8 compass rose (faint)
    ctx.strokeStyle = '#1f2937';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(state.x, state.y);
      ctx.lineTo(state.x + Math.cos(a) * 24, state.y + Math.sin(a) * 24);
      ctx.stroke();
    }

    // active heading
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.5)';
    ctx.beginPath();
    ctx.moveTo(state.x, state.y);
    ctx.lineTo(state.x + state.dx * 32, state.y + state.dy * 32);
    ctx.stroke();

    // square player
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(state.x - HALF, state.y - HALF, HALF * 2, HALF * 2);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.speed = params.speed;
  state.changePeriod = params.auto_change_period;
}
