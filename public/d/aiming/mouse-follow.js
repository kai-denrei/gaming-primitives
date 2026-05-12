// Aiming: mouse-follow — aim vector tracks the cursor position each frame.
// Note: pointer listener is attached to env.canvas. runner.js has no teardown hook
// so listeners may persist across tab swaps; same canvas though, so it's fine in practice.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;
const ORBIT_R = 160;
const TARGET_R = 10;
const SHOOTER_R = 12;

function seed(state, speed) {
  state.target = { theta: Math.random() * Math.PI * 2 };
  state.speed = speed;
}

export function init(ctx, params, env) {
  const state = {
    aim: { x: CX + 200, y: CY },   // logical-space aim point
    smoothed: { x: CX + 200, y: CY },
    smoothing: params.aim_smoothing,
    speed: 0,
    target: null,
  };
  seed(state, params.target_speed);

  const canvas = env.canvas;
  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    state.aim.x = nx * W;
    state.aim.y = ny * H;
  }
  canvas.addEventListener('pointermove', onMove);

  function tick(dt) {
    const omega = state.speed / ORBIT_R;
    state.target.theta += omega * dt;

    // exponential smoothing toward raw aim. smoothing=0 ⇒ instant.
    const k = state.smoothing > 0 ? 1 - Math.exp(-dt / (state.smoothing * 0.5 + 1e-6)) : 1;
    state.smoothed.x += (state.aim.x - state.smoothed.x) * k;
    state.smoothed.y += (state.aim.y - state.smoothed.y) * k;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // aim line — toward smoothed cursor
    const dx = state.smoothed.x - CX, dy = state.smoothed.y - CY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + ux * 320, CY + uy * 320);
    ctx.stroke();

    // cursor marker
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(state.smoothed.x, state.smoothed.y, 6, 0, Math.PI * 2);
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
  state.smoothing = params.aim_smoothing;
  state.speed = params.target_speed;
}
