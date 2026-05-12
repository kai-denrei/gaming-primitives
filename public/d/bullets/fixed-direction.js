// Bullets: fixed-direction — shooter at bottom, bullets fly straight up at fixed cadence.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SHOOTER_X = W / 2;
const SHOOTER_Y = H - 30;
const BULLET_R = 3;

export function init(ctx, params, env) {
  const state = {
    bullets: [],
    fireRate: params.fire_rate,
    bulletSpeed: params.bullet_speed,
    sinceFire: 0,
  };

  function tick(dt) {
    state.sinceFire += dt;
    const period = 1 / state.fireRate;
    while (state.sinceFire >= period) {
      state.sinceFire -= period;
      state.bullets.push({ x: SHOOTER_X, y: SHOOTER_Y - 14 });
    }

    for (const b of state.bullets) b.y -= state.bulletSpeed * dt;
    state.bullets = state.bullets.filter(b => b.y > -BULLET_R);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // bullets
    ctx.fillStyle = '#39ff14';
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // shooter (upward-pointing triangle)
    ctx.fillStyle = '#e6edf3';
    ctx.beginPath();
    ctx.moveTo(SHOOTER_X, SHOOTER_Y - 12);
    ctx.lineTo(SHOOTER_X - 10, SHOOTER_Y + 8);
    ctx.lineTo(SHOOTER_X + 10, SHOOTER_Y + 8);
    ctx.closePath();
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.fireRate = params.fire_rate;
  state.bulletSpeed = params.bullet_speed;
}
