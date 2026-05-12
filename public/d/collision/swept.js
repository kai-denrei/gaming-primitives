// Collision: swept — fast box vs static AABBs using swept-AABB (slab) intersection.
// For each static obstacle, intersect the moving box's motion ray against the
// Minkowski-expanded obstacle (obstacle inflated by moving box's half-extents).

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const MOVER = { w: 28, h: 22 };

function buildStatics(n) {
  const obstacles = [];
  // arranged across playfield, deterministic-ish
  for (let i = 0; i < n; i++) {
    const w = 60 + Math.random() * 50;
    const h = 40 + Math.random() * 50;
    obstacles.push({
      x: 120 + i * 130 + Math.random() * 30,
      y: 80 + Math.random() * (H - 180),
      w, h,
    });
  }
  return obstacles;
}

function spawnMover(speed) {
  const ang = Math.random() * Math.PI * 2;
  return {
    x: W / 2 - MOVER.w / 2,
    y: H / 2 - MOVER.h / 2,
    w: MOVER.w, h: MOVER.h,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    flash: 0,
  };
}

// swept-AABB: returns t in [0,1] of first contact along (vx*dt, vy*dt), or null.
function sweptAABB(m, ob, dx, dy) {
  // Treat moving box as a point against an obstacle inflated by m's size.
  // Use m's min corner as the point.
  const px = m.x;
  const py = m.y;
  const ex = { x: ob.x - m.w, y: ob.y - m.h, w: ob.w + m.w, h: ob.h + m.h };

  let tEnterX, tExitX, tEnterY, tExitY;
  if (dx === 0) {
    if (px < ex.x || px > ex.x + ex.w) return null;
    tEnterX = -Infinity; tExitX = Infinity;
  } else {
    const t1 = (ex.x - px) / dx;
    const t2 = (ex.x + ex.w - px) / dx;
    tEnterX = Math.min(t1, t2);
    tExitX = Math.max(t1, t2);
  }
  if (dy === 0) {
    if (py < ex.y || py > ex.y + ex.h) return null;
    tEnterY = -Infinity; tExitY = Infinity;
  } else {
    const t1 = (ex.y - py) / dy;
    const t2 = (ex.y + ex.h - py) / dy;
    tEnterY = Math.min(t1, t2);
    tExitY = Math.max(t1, t2);
  }

  const tEnter = Math.max(tEnterX, tEnterY);
  const tExit = Math.min(tExitX, tExitY);
  if (tEnter > tExit || tExit < 0 || tEnter > 1) return null;
  return Math.max(tEnter, 0);
}

export function init(ctx, params, env) {
  const state = {
    mover: spawnMover(params.box_speed),
    statics: buildStatics(params.static_count),
    speed: params.box_speed,
    staticCount: params.static_count,
  };

  function tick(dt) {
    const m = state.mover;
    const dx = m.vx * dt, dy = m.vy * dt;

    // visualize swept volume (gray AABB from current → target)
    const sx = Math.min(m.x, m.x + dx);
    const sy = Math.min(m.y, m.y + dy);
    const sw = Math.abs(dx) + m.w;
    const sh = Math.abs(dy) + m.h;

    // find earliest swept-AABB collision among statics
    let bestT = 1, hitOb = null;
    for (const ob of state.statics) {
      const t = sweptAABB(m, ob, dx, dy);
      if (t !== null && t < bestT) { bestT = t; hitOb = ob; }
    }

    if (hitOb) {
      // advance to contact, then reflect simply (swap component with larger penetration distance)
      m.x += dx * bestT;
      m.y += dy * bestT;
      // pick reflection axis by checking which side is touched
      const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
      const obcx = hitOb.x + hitOb.w / 2, obcy = hitOb.y + hitOb.h / 2;
      const ddx = (cx - obcx) / (hitOb.w / 2 + m.w / 2);
      const ddy = (cy - obcy) / (hitOb.h / 2 + m.h / 2);
      if (Math.abs(ddx) > Math.abs(ddy)) m.vx = -m.vx; else m.vy = -m.vy;
      m.flash = 0.15;
    } else {
      m.x += dx;
      m.y += dy;
    }

    // playfield bounds
    if (m.x < 0)       { m.x = 0;       m.vx = -m.vx; }
    if (m.x + m.w > W) { m.x = W - m.w; m.vx = -m.vx; }
    if (m.y < 0)       { m.y = 0;       m.vy = -m.vy; }
    if (m.y + m.h > H) { m.y = H - m.h; m.vy = -m.vy; }
    if (m.flash > 0) m.flash = Math.max(0, m.flash - dt);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // swept volume
    ctx.fillStyle = 'rgba(120, 120, 140, 0.18)';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = 'rgba(160, 160, 180, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);

    // statics
    for (const ob of state.statics) {
      ctx.fillStyle = `hsl(220 25% 35%)`;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = '#e6edf3';
      ctx.strokeRect(ob.x + 0.5, ob.y + 0.5, ob.w - 1, ob.h - 1);
    }

    // mover
    ctx.fillStyle = m.flash > 0 ? '#ff4444' : '#39ff14';
    ctx.fillRect(m.x, m.y, m.w, m.h);

    if (hitOb) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('HIT', 12, 24);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.static_count !== state.staticCount) {
    state.statics = buildStatics(params.static_count);
    state.staticCount = params.static_count;
  }
  if (params.box_speed !== state.speed && state.speed > 0) {
    const k = params.box_speed / state.speed;
    state.mover.vx *= k;
    state.mover.vy *= k;
    state.speed = params.box_speed;
  }
}
