// Aiming: lock-on — snap aim to the nearest target inside lock_range; otherwise no aim line.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;
const TARGET_R = 9;
const SHOOTER_R = 12;

function seed(state, n, speed) {
  state.targets = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.targets.push({
      x: 60 + Math.random() * (W - 120),
      y: 60 + Math.random() * (H - 120),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      hue: (i * 67) % 360,
    });
  }
  state.speed = speed;
}

export function init(ctx, params, env) {
  const state = { targets: [], speed: 0, range: params.lock_range };
  seed(state, params.target_count, params.target_speed);

  function tick(dt) {
    // physics
    for (const t of state.targets) {
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      if (t.x < TARGET_R || t.x > W - TARGET_R) t.vx = -t.vx;
      if (t.y < TARGET_R || t.y > H - TARGET_R) t.vy = -t.vy;
      t.x = Math.max(TARGET_R, Math.min(W - TARGET_R, t.x));
      t.y = Math.max(TARGET_R, Math.min(H - TARGET_R, t.y));
    }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // lock range ring
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(CX, CY, state.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // find nearest within lock_range
    let best = null, bestD = Infinity;
    for (const t of state.targets) {
      const d = Math.hypot(t.x - CX, t.y - CY);
      if (d <= state.range && d < bestD) { bestD = d; best = t; }
    }

    if (best) {
      ctx.strokeStyle = '#e6edf3';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(best.x, best.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(best.x, best.y, TARGET_R + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // targets
    for (const t of state.targets) {
      ctx.fillStyle = `hsl(${t.hue} 70% 60%)`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, TARGET_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // shooter
    ctx.fillStyle = '#e6edf3';
    ctx.beginPath();
    ctx.arc(CX, CY, SHOOTER_R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (state.targets.length !== params.target_count) {
    seed(state, params.target_count, params.target_speed);
  } else if (params.target_speed !== state.speed && state.speed > 0) {
    const k = params.target_speed / state.speed;
    for (const t of state.targets) { t.vx *= k; t.vy *= k; }
    state.speed = params.target_speed;
  }
  state.range = params.lock_range;
}
