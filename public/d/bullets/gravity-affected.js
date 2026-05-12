// Bullets: gravity-affected — parabola under constant downward acceleration.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SHOOTER_X = 80;
const GROUND_Y = H - 30;
const BULLET_R = 3;
const FIRE_RATE = 1.5;

export function init(ctx, params, env) {
  const state = {
    bullets: [],
    gravity: params.gravity,
    initialSpeed: params.initial_speed,
    launchAngle: params.launch_angle,
    sinceFire: 0,
  };

  function fire(s) {
    const ang = -(s.launchAngle * Math.PI) / 180; // negative -> up
    s.bullets.push({
      x: SHOOTER_X + 10,
      y: GROUND_Y - 14,
      vx: Math.cos(ang) * s.initialSpeed,
      vy: Math.sin(ang) * s.initialSpeed,
      trail: [],
    });
  }

  function tick(dt) {
    state.sinceFire += dt;
    const period = 1 / FIRE_RATE;
    while (state.sinceFire >= period) {
      state.sinceFire -= period;
      fire(state);
    }

    for (const b of state.bullets) {
      b.vy += state.gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 60) b.trail.shift();
    }
    state.bullets = state.bullets.filter(b => b.x < W + 10 && b.y < GROUND_Y + 2);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // ground
    ctx.strokeStyle = '#2a2a3a';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    // trails
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.4)';
    ctx.lineWidth = 1;
    for (const b of state.bullets) {
      if (b.trail.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(b.trail[0].x, b.trail[0].y);
      for (let i = 1; i < b.trail.length; i++) ctx.lineTo(b.trail[i].x, b.trail[i].y);
      ctx.stroke();
    }

    // bullets
    ctx.fillStyle = '#39ff14';
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // shooter (rotated triangle)
    const ang = -(state.launchAngle * Math.PI) / 180;
    ctx.fillStyle = '#e6edf3';
    ctx.save();
    ctx.translate(SHOOTER_X, GROUND_Y - 10);
    ctx.rotate(ang);
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
  state.gravity = params.gravity;
  state.initialSpeed = params.initial_speed;
  state.launchAngle = params.launch_angle;
}
