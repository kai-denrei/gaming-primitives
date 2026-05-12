// Aiming: fixed-angle — weapon points along a constant heading regardless of target position.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;
const ORBIT_R = 140;
const TARGET_R = 10;
const SHOOTER_R = 12;
const AIM_LEN = 320;

function seed(state, speed) {
  state.target = { theta: 0 };
  state.speed = speed;
}

export function init(ctx, params, env) {
  const state = { angle: 0, speed: 0, target: null };
  state.angle = (params.angle_deg * Math.PI) / 180;
  seed(state, params.target_speed);

  function tick(dt) {
    // omega so that linear speed at radius matches target_speed
    const omega = state.speed / ORBIT_R;
    state.target.theta += omega * dt;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // aim line — fixed
    const ax = CX + Math.cos(state.angle) * AIM_LEN;
    const ay = CY + Math.sin(state.angle) * AIM_LEN;
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // target
    const tx = CX + Math.cos(state.target.theta) * ORBIT_R;
    const ty = CY + Math.sin(state.target.theta) * ORBIT_R;
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
  state.angle = (params.angle_deg * Math.PI) / 180;
  state.speed = params.target_speed;
}
