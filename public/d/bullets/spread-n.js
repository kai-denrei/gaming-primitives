// Bullets: spread-n — N bullets fan out within an arc around the aim direction.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SHOOTER_X = 80;
const SHOOTER_Y = H / 2;
const BULLET_R = 3;
const BULLET_SPEED = 320;

export function init(ctx, params, env) {
  const state = {
    bullets: [],
    bulletCount: params.bullet_count,
    spreadArc: (params.spread_arc * Math.PI) / 180,
    fireRate: params.fire_rate,
    sinceFire: 0,
    aim: 0, // radians, oscillates so the fan rotates
    t: 0,
  };

  function tick(dt) {
    state.t += dt;
    state.aim = Math.sin(state.t * 0.5) * 0.5; // slow sweep

    state.sinceFire += dt;
    const period = 1 / state.fireRate;
    while (state.sinceFire >= period) {
      state.sinceFire -= period;
      const n = state.bulletCount;
      const arc = state.spreadArc;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const ang = state.aim + (t - 0.5) * arc;
        state.bullets.push({
          x: SHOOTER_X + 14, y: SHOOTER_Y,
          vx: Math.cos(ang) * BULLET_SPEED,
          vy: Math.sin(ang) * BULLET_SPEED,
        });
      }
    }

    for (const b of state.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
    state.bullets = state.bullets.filter(b => b.x < W + 10 && b.y > -10 && b.y < H + 10);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // arc guide
    ctx.strokeStyle = '#2a2a3a';
    ctx.beginPath();
    ctx.arc(SHOOTER_X, SHOOTER_Y, 40, state.aim - state.spreadArc / 2, state.aim + state.spreadArc / 2);
    ctx.stroke();

    ctx.fillStyle = '#39ff14';
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // shooter triangle pointing right along aim
    ctx.fillStyle = '#e6edf3';
    ctx.save();
    ctx.translate(SHOOTER_X, SHOOTER_Y);
    ctx.rotate(state.aim);
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
  if (state.bulletCount !== params.bullet_count) {
    state.bulletCount = params.bullet_count;
    state.bullets = [];
  }
  state.spreadArc = (params.spread_arc * Math.PI) / 180;
  state.fireRate = params.fire_rate;
}
