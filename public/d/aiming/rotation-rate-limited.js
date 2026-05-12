// Aiming: rotation-rate-limited — aim heading chases ideal angle capped at rotation_rate rad/s.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;
const ORBIT_R = 150;
const TARGET_R = 10;
const SHOOTER_R = 12;
const AIM_LEN = 320;

function seed(state, speed) {
  state.target = { theta: 0 };
  state.speed = speed;
}

function angleDelta(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

export function init(ctx, params, env) {
  const state = {
    aim: 0,                // current aim heading
    rate: params.rotation_rate,
    speed: 0,
    target: null,
  };
  seed(state, params.target_speed);

  function tick(dt) {
    const omega = state.speed / ORBIT_R;
    state.target.theta += omega * dt;

    const tx = CX + Math.cos(state.target.theta) * ORBIT_R;
    const ty = CY + Math.sin(state.target.theta) * ORBIT_R;
    const ideal = Math.atan2(ty - CY, tx - CX);

    const delta = angleDelta(state.aim, ideal);
    const step = Math.max(-state.rate * dt, Math.min(state.rate * dt, delta));
    state.aim += step;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // ideal aim — dotted ghost
    ctx.strokeStyle = '#3a3a4a';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + Math.cos(ideal) * AIM_LEN, CY + Math.sin(ideal) * AIM_LEN);
    ctx.stroke();
    ctx.setLineDash([]);

    // current aim — solid
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + Math.cos(state.aim) * AIM_LEN, CY + Math.sin(state.aim) * AIM_LEN);
    ctx.stroke();

    // target
    ctx.fillStyle = `hsl(${(state.target.theta * 180 / Math.PI) % 360} 70% 60%)`;
    ctx.beginPath();
    ctx.arc(tx, ty, TARGET_R, 0, Math.PI * 2);
    ctx.fill();

    // shooter
    ctx.fillStyle = '#e6edf3';
    ctx.beginPath();
    ctx.arc(CX, CY, SHOOTER_R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.rate = params.rotation_rate;
  state.speed = params.target_speed;
}
