// Collision: circle — distance-squared test vs sum-of-radii.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

function seed(state, n, speed) {
  state.circles = [];
  for (let i = 0; i < n; i++) {
    const r = 14 + Math.random() * 16;
    const ang = Math.random() * Math.PI * 2;
    state.circles.push({
      x: r + Math.random() * (W - 2 * r),
      y: r + Math.random() * (H - 2 * r),
      r,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      hue: (i * 53) % 360,
      flash: 0,
    });
  }
  state.speed = speed;
}

export function init(ctx, params, env) {
  const state = { circles: [], speed: 0 };
  seed(state, params.circle_count, params.speed);

  function tick(dt) {
    for (const c of state.circles) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.x < c.r)         { c.x = c.r;       c.vx = -c.vx; }
      if (c.x > W - c.r)     { c.x = W - c.r;   c.vx = -c.vx; }
      if (c.y < c.r)         { c.y = c.r;       c.vy = -c.vy; }
      if (c.y > H - c.r)     { c.y = H - c.r;   c.vy = -c.vy; }
      if (c.flash > 0) c.flash = Math.max(0, c.flash - dt);
    }

    let anyHit = false;
    for (let i = 0; i < state.circles.length; i++) {
      for (let j = i + 1; j < state.circles.length; j++) {
        const a = state.circles[i], b = state.circles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const rs = a.r + b.r;
        if (dx * dx + dy * dy < rs * rs) {
          a.flash = 0.15; b.flash = 0.15;
          anyHit = true;
        }
      }
    }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    for (const c of state.circles) {
      ctx.fillStyle = c.flash > 0 ? '#ff4444' : `hsl(${c.hue} 60% 55%)`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e6edf3';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (anyHit) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('HIT', 12, 24);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (state.circles.length !== params.circle_count) {
    seed(state, params.circle_count, params.speed);
    return;
  }
  if (params.speed !== state.speed && state.speed > 0) {
    const k = params.speed / state.speed;
    for (const c of state.circles) { c.vx *= k; c.vy *= k; }
    state.speed = params.speed;
  }
}
