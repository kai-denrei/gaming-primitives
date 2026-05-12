// Bullets: aimed — shooter centred, bullets fire along the current aim vector toward a target.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;
const TARGET_R = 9;
const BULLET_R = 3;
const BULLET_SPEED = 360;

function seedTarget(state) {
  state.target = { x: 120, y: 80, vx: 140, vy: 90, hue: 200 };
  state.nextRandom = 0;
}

export function init(ctx, params, env) {
  const state = {
    bullets: [],
    fireRate: params.fire_rate,
    mode: params.aim_target,
    sinceFire: 0,
    target: null,
    nextRandom: 0,
  };
  seedTarget(state);

  function tick(dt) {
    const t = state.target;
    if (state.mode === 'moving') {
      t.x += t.vx * dt; t.y += t.vy * dt;
      if (t.x < TARGET_R || t.x > W - TARGET_R) t.vx = -t.vx;
      if (t.y < TARGET_R || t.y > H - TARGET_R) t.vy = -t.vy;
      t.x = Math.max(TARGET_R, Math.min(W - TARGET_R, t.x));
      t.y = Math.max(TARGET_R, Math.min(H - TARGET_R, t.y));
    } else {
      // random: teleport every 0.6s
      state.nextRandom -= dt;
      if (state.nextRandom <= 0) {
        t.x = 60 + Math.random() * (W - 120);
        t.y = 60 + Math.random() * (H - 120);
        state.nextRandom = 0.6;
      }
    }

    state.sinceFire += dt;
    const period = 1 / state.fireRate;
    while (state.sinceFire >= period) {
      state.sinceFire -= period;
      const dx = t.x - CX, dy = t.y - CY;
      const len = Math.hypot(dx, dy) || 1;
      state.bullets.push({
        x: CX, y: CY,
        vx: (dx / len) * BULLET_SPEED,
        vy: (dy / len) * BULLET_SPEED,
      });
    }

    for (const b of state.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
    state.bullets = state.bullets.filter(b => b.x > -10 && b.x < W + 10 && b.y > -10 && b.y < H + 10);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // aim line (dim)
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // target
    ctx.fillStyle = `hsl(${t.hue} 70% 60%)`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, TARGET_R, 0, Math.PI * 2);
    ctx.fill();

    // bullets
    ctx.fillStyle = '#39ff14';
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // shooter (centre dot)
    ctx.fillStyle = '#e6edf3';
    ctx.beginPath();
    ctx.arc(CX, CY, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.fireRate = params.fire_rate;
  if (state.mode !== params.aim_target) {
    state.mode = params.aim_target;
    state.nextRandom = 0;
  }
}
