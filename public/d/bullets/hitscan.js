// Bullets: hitscan — instant line trace. Beam flashes for beam_duration after each fire.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SHOOTER_X = 80;
const SHOOTER_Y = H / 2;
const TARGET_R = 9;

function seedTarget(state) {
  state.target = { x: W * 0.7, y: SHOOTER_Y, vx: 90, vy: 70, hue: 320 };
}

export function init(ctx, params, env) {
  const state = {
    target: null,
    fireRate: params.fire_rate,
    beamDuration: params.beam_duration,
    sinceFire: 0,
    flashRemaining: 0,
    flashEnd: null, // {x, y}
  };
  seedTarget(state);

  function tick(dt) {
    const t = state.target;
    t.x += t.vx * dt; t.y += t.vy * dt;
    if (t.x < TARGET_R || t.x > W - TARGET_R) t.vx = -t.vx;
    if (t.y < TARGET_R || t.y > H - TARGET_R) t.vy = -t.vy;
    t.x = Math.max(TARGET_R, Math.min(W - TARGET_R, t.x));
    t.y = Math.max(TARGET_R, Math.min(H - TARGET_R, t.y));

    state.sinceFire += dt;
    const period = 1 / state.fireRate;
    while (state.sinceFire >= period) {
      state.sinceFire -= period;
      state.flashRemaining = state.beamDuration;
      state.flashEnd = { x: t.x, y: t.y };
    }

    if (state.flashRemaining > 0) state.flashRemaining = Math.max(0, state.flashRemaining - dt);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // beam — fade with remaining flash
    if (state.flashRemaining > 0 && state.flashEnd) {
      const k = state.flashRemaining / state.beamDuration;
      ctx.strokeStyle = `rgba(57, 255, 20, ${k.toFixed(3)})`;
      ctx.lineWidth = 2 + 2 * k;
      ctx.beginPath();
      ctx.moveTo(SHOOTER_X + 12, SHOOTER_Y);
      ctx.lineTo(state.flashEnd.x, state.flashEnd.y);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // target
    ctx.fillStyle = `hsl(${t.hue} 70% 60%)`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, TARGET_R, 0, Math.PI * 2);
    ctx.fill();

    // shooter
    ctx.fillStyle = '#e6edf3';
    ctx.beginPath();
    ctx.moveTo(SHOOTER_X + 12, SHOOTER_Y);
    ctx.lineTo(SHOOTER_X - 8, SHOOTER_Y - 10);
    ctx.lineTo(SHOOTER_X - 8, SHOOTER_Y + 10);
    ctx.closePath();
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.fireRate = params.fire_rate;
  state.beamDuration = params.beam_duration;
  // clamp current flash if duration shrank below remaining
  if (state.flashRemaining > state.beamDuration) state.flashRemaining = state.beamDuration;
}
