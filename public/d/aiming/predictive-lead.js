// Aiming: predictive-lead — aim at where the target will be when the shot arrives.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;
const TARGET_R = 10;
const SHOOTER_R = 12;
const AIM_LEN = 380;

function seedTarget(state, speed) {
  // a moving target that crosses the playfield then bounces
  state.target = {
    x: 120, y: 100,
    vx: speed, vy: speed * 0.4,
  };
  state.speed = speed;
}

function rescale(state, newSpeed) {
  const cur = Math.hypot(state.target.vx, state.target.vy) || 1;
  const k = newSpeed / cur;
  state.target.vx *= k;
  state.target.vy *= k;
  state.speed = newSpeed;
}

export function init(ctx, params, env) {
  const state = { target: null, speed: 0, projSpeed: params.projectile_speed };
  seedTarget(state, params.target_speed);

  function tick(dt) {
    const t = state.target;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    if (t.x < TARGET_R || t.x > W - TARGET_R) t.vx = -t.vx;
    if (t.y < TARGET_R || t.y > H - TARGET_R) t.vy = -t.vy;
    t.x = Math.max(TARGET_R, Math.min(W - TARGET_R, t.x));
    t.y = Math.max(TARGET_R, Math.min(H - TARGET_R, t.y));

    // iterative lead: solve t such that |target + v·t - shooter| = projSpeed·t
    let leadT = 0;
    for (let i = 0; i < 2; i++) {
      const px = t.x + t.vx * leadT;
      const py = t.y + t.vy * leadT;
      const dist = Math.hypot(px - CX, py - CY);
      leadT = dist / state.projSpeed;
    }
    const aimX = t.x + t.vx * leadT;
    const aimY = t.y + t.vy * leadT;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // dotted direct line to current target (for contrast)
    ctx.strokeStyle = '#3a3a4a';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // predicted aim line — solid
    const dx = aimX - CX, dy = aimY - CY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + ux * AIM_LEN, CY + uy * AIM_LEN);
    ctx.stroke();

    // predicted impact crosshair
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(aimX, aimY, 8, 0, Math.PI * 2);
    ctx.stroke();

    // target
    ctx.fillStyle = `hsl(${(t.x + t.y) % 360} 70% 60%)`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, TARGET_R, 0, Math.PI * 2);
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
  state.projSpeed = params.projectile_speed;
  if (params.target_speed !== state.speed) rescale(state, params.target_speed);
}
