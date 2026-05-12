// Bullets: lifetime — each bullet expires after a fixed TTL. Range = speed * TTL.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SHOOTER_X = 80;
const SHOOTER_Y = H / 2;
const BULLET_R = 3;
const FIRE_RATE = 3;

export function init(ctx, params, env) {
  const state = {
    bullets: [],
    lifetime: params.lifetime,
    bulletSpeed: params.bullet_speed,
    sinceFire: 0,
    t: 0,
  };

  function tick(dt) {
    state.t += dt;
    const aim = Math.sin(state.t * 0.6) * 0.6;

    state.sinceFire += dt;
    const period = 1 / FIRE_RATE;
    while (state.sinceFire >= period) {
      state.sinceFire -= period;
      state.bullets.push({
        x: SHOOTER_X + 14, y: SHOOTER_Y,
        vx: Math.cos(aim) * state.bulletSpeed,
        vy: Math.sin(aim) * state.bulletSpeed,
        age: 0,
      });
    }

    for (const b of state.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.age += dt;
    }
    state.bullets = state.bullets.filter(b => b.age < state.lifetime && b.x < W + 10 && b.x > -10 && b.y > -10 && b.y < H + 10);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // expected-range arc
    const range = state.bulletSpeed * state.lifetime;
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.arc(SHOOTER_X, SHOOTER_Y, range, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // bullets — fade with age
    for (const b of state.bullets) {
      const k = 1 - b.age / state.lifetime;
      ctx.fillStyle = `rgba(57, 255, 20, ${k.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // shooter
    ctx.fillStyle = '#e6edf3';
    ctx.save();
    ctx.translate(SHOOTER_X, SHOOTER_Y);
    ctx.rotate(aim);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.lifetime = params.lifetime;
  state.bulletSpeed = params.bullet_speed;
}
