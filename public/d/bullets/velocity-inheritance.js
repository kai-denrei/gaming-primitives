// Bullets: velocity-inheritance — shooter slides L-R; bullets either ignore or inherit shooter velocity.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SHOOTER_Y = H - 40;
const BULLET_R = 3;
const BULLET_SPEED = 320; // vertical muzzle speed
const FIRE_RATE = 3;

export function init(ctx, params, env) {
  const state = {
    bullets: [],
    inherit: params.inherit,
    shooterSpeed: params.shooter_speed,
    sinceFire: 0,
    t: 0,
    shooterX: W / 2,
    shooterVx: 0,
  };

  function tick(dt) {
    state.t += dt;
    // shooter oscillates L-R
    state.shooterVx = Math.cos(state.t * 0.8) * state.shooterSpeed;
    state.shooterX += state.shooterVx * dt;
    if (state.shooterX < 40) { state.shooterX = 40; }
    if (state.shooterX > W - 40) { state.shooterX = W - 40; }

    state.sinceFire += dt;
    const period = 1 / FIRE_RATE;
    while (state.sinceFire >= period) {
      state.sinceFire -= period;
      state.bullets.push({
        x: state.shooterX,
        y: SHOOTER_Y - 14,
        vx: state.inherit ? state.shooterVx : 0,
        vy: -BULLET_SPEED,
      });
    }

    for (const b of state.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
    state.bullets = state.bullets.filter(b => b.y > -BULLET_R && b.x > -10 && b.x < W + 10);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // shooter track guide
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(40, SHOOTER_Y);
    ctx.lineTo(W - 40, SHOOTER_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // mode label
    ctx.fillStyle = state.inherit ? '#39ff14' : '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillText(state.inherit ? 'inherit: on (Defender)' : 'inherit: off (Asteroids)', 12, 22);

    // bullets
    ctx.fillStyle = '#39ff14';
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // shooter (triangle pointing up)
    ctx.fillStyle = '#e6edf3';
    ctx.beginPath();
    ctx.moveTo(state.shooterX, SHOOTER_Y - 12);
    ctx.lineTo(state.shooterX - 10, SHOOTER_Y + 8);
    ctx.lineTo(state.shooterX + 10, SHOOTER_Y + 8);
    ctx.closePath();
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.inherit = params.inherit;
  state.shooterSpeed = params.shooter_speed;
}
