// Collision: aabb — axis-aligned bounding box overlap test.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

function seed(state, n, speed) {
  state.boxes = [];
  for (let i = 0; i < n; i++) {
    const w = 40 + Math.random() * 50;
    const h = 30 + Math.random() * 50;
    const ang = Math.random() * Math.PI * 2;
    state.boxes.push({
      x: Math.random() * (W - w),
      y: Math.random() * (H - h),
      w, h,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      hue: (i * 71) % 360,
      flash: 0,
    });
  }
  state.speed = speed;
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function init(ctx, params, env) {
  const state = { boxes: [], speed: 0 };
  seed(state, params.box_count, params.speed);

  function tick(dt) {
    for (const b of state.boxes) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < 0)          { b.x = 0;         b.vx = -b.vx; }
      if (b.x + b.w > W)    { b.x = W - b.w;   b.vx = -b.vx; }
      if (b.y < 0)          { b.y = 0;         b.vy = -b.vy; }
      if (b.y + b.h > H)    { b.y = H - b.h;   b.vy = -b.vy; }
      if (b.flash > 0) b.flash = Math.max(0, b.flash - dt);
    }

    // pairwise AABB test
    let anyHit = false;
    for (let i = 0; i < state.boxes.length; i++) {
      for (let j = i + 1; j < state.boxes.length; j++) {
        if (overlap(state.boxes[i], state.boxes[j])) {
          state.boxes[i].flash = 0.15;
          state.boxes[j].flash = 0.15;
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

    for (const b of state.boxes) {
      ctx.fillStyle = b.flash > 0 ? '#ff4444' : `hsl(${b.hue} 60% 55%)`;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#e6edf3';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
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
  if (state.boxes.length !== params.box_count) {
    seed(state, params.box_count, params.speed);
    return;
  }
  if (params.speed !== state.speed && state.speed > 0) {
    const k = params.speed / state.speed;
    for (const b of state.boxes) { b.vx *= k; b.vy *= k; }
    state.speed = params.speed;
  }
}
