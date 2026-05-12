// Bullets: homing — each bullet steers toward its nearest target with rate-limited rotation.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SHOOTER_X = 80;
const SHOOTER_Y = H / 2;
const BULLET_R = 3;
const TARGET_R = 9;
const FIRE_RATE = 1.2;

function seedTargets(state, n) {
  state.targets = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.targets.push({
      x: W * 0.55 + Math.random() * (W * 0.35),
      y: 60 + Math.random() * (H - 120),
      vx: Math.cos(ang) * 80,
      vy: Math.sin(ang) * 80,
      hue: (i * 97) % 360,
    });
  }
}

export function init(ctx, params, env) {
  const state = {
    bullets: [],
    targets: [],
    turnRate: params.turn_rate,
    bulletSpeed: params.bullet_speed,
    targetCount: params.target_count,
    sinceFire: 0,
  };
  seedTargets(state, state.targetCount);

  function tick(dt) {
    // target physics
    for (const t of state.targets) {
      t.x += t.vx * dt; t.y += t.vy * dt;
      if (t.x < TARGET_R || t.x > W - TARGET_R) t.vx = -t.vx;
      if (t.y < TARGET_R || t.y > H - TARGET_R) t.vy = -t.vy;
      t.x = Math.max(TARGET_R, Math.min(W - TARGET_R, t.x));
      t.y = Math.max(TARGET_R, Math.min(H - TARGET_R, t.y));
    }

    state.sinceFire += dt;
    const period = 1 / FIRE_RATE;
    while (state.sinceFire >= period) {
      state.sinceFire -= period;
      state.bullets.push({
        x: SHOOTER_X + 14, y: SHOOTER_Y,
        heading: 0,
        age: 0,
      });
    }

    for (const b of state.bullets) {
      // find nearest
      let best = null, bd = Infinity;
      for (const t of state.targets) {
        const d = Math.hypot(t.x - b.x, t.y - b.y);
        if (d < bd) { bd = d; best = t; }
      }
      if (best) {
        const desired = Math.atan2(best.y - b.y, best.x - b.x);
        let diff = desired - b.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const maxStep = state.turnRate * dt;
        const step = Math.max(-maxStep, Math.min(maxStep, diff));
        b.heading += step;
      }
      b.x += Math.cos(b.heading) * state.bulletSpeed * dt;
      b.y += Math.sin(b.heading) * state.bulletSpeed * dt;
      b.age += dt;
    }
    state.bullets = state.bullets.filter(b => b.age < 4 && b.x > -10 && b.x < W + 10 && b.y > -10 && b.y < H + 10);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // targets
    for (const t of state.targets) {
      ctx.fillStyle = `hsl(${t.hue} 70% 60%)`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, TARGET_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // bullets
    ctx.fillStyle = '#39ff14';
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
      ctx.fill();
    }

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
  if (state.targetCount !== params.target_count) {
    state.targetCount = params.target_count;
    seedTargets(state, state.targetCount);
  }
  state.turnRate = params.turn_rate;
  state.bulletSpeed = params.bullet_speed;
}
