// Collision: separating-axis — SAT on two convex polygons.
// For each edge normal of both polys, project both onto axis;
// if any axis has no overlap, polys are disjoint.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

function regularPoly(n, r) {
  const verts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    verts.push({ x: Math.cos(t) * r, y: Math.sin(t) * r });
  }
  return verts;
}

function makePoly(vertexCount, hue) {
  return {
    verts: regularPoly(vertexCount, 50 + Math.random() * 20),
    cx: 100 + Math.random() * (W - 200),
    cy: 80 + Math.random() * (H - 160),
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.4,
    vx: 0, vy: 0,
    hue,
  };
}

function worldVerts(p) {
  const cos = Math.cos(p.rot), sin = Math.sin(p.rot);
  return p.verts.map(v => ({ x: p.cx + v.x * cos - v.y * sin, y: p.cy + v.x * sin + v.y * cos }));
}

function project(verts, ax, ay) {
  let min = Infinity, max = -Infinity;
  for (const v of verts) {
    const d = v.x * ax + v.y * ay;
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return [min, max];
}

function sat(vertsA, vertsB) {
  const axes = [];
  for (const poly of [vertsA, vertsB]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const ex = b.x - a.x, ey = b.y - a.y;
      const len = Math.hypot(ex, ey) || 1;
      axes.push({ x: -ey / len, y: ex / len });
    }
  }
  for (const ax of axes) {
    const [aMin, aMax] = project(vertsA, ax.x, ax.y);
    const [bMin, bMax] = project(vertsB, ax.x, ax.y);
    if (aMax < bMin || bMax < aMin) return { hit: false, axes };
  }
  return { hit: true, axes };
}

function setSpeed(state, speed) {
  const ang = Math.random() * Math.PI * 2;
  state.polyA.vx = Math.cos(ang) * speed;
  state.polyA.vy = Math.sin(ang) * speed;
  state.polyB.vx = -Math.cos(ang) * speed * 0.8;
  state.polyB.vy = -Math.sin(ang) * speed * 0.8;
  state.speed = speed;
}

export function init(ctx, params, env) {
  const state = {
    polyA: makePoly(params.poly_a_size, 200),
    polyB: makePoly(params.poly_b_size, 30),
    sizeA: params.poly_a_size,
    sizeB: params.poly_b_size,
    speed: 0,
    flash: 0,
  };
  setSpeed(state, params.speed);

  function tick(dt) {
    for (const p of [state.polyA, state.polyB]) {
      p.cx += p.vx * dt;
      p.cy += p.vy * dt;
      p.rot += p.spin * dt;
      const bound = 60;
      if (p.cx < bound)       { p.cx = bound;     p.vx = -p.vx; }
      if (p.cx > W - bound)   { p.cx = W - bound; p.vx = -p.vx; }
      if (p.cy < bound)       { p.cy = bound;     p.vy = -p.vy; }
      if (p.cy > H - bound)   { p.cy = H - bound; p.vy = -p.vy; }
    }

    const wa = worldVerts(state.polyA);
    const wb = worldVerts(state.polyB);
    const result = sat(wa, wb);
    if (result.hit) state.flash = 0.15;
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // draw test axes faintly through midpoint between polys
    const mx = (state.polyA.cx + state.polyB.cx) / 2;
    const my = (state.polyA.cy + state.polyB.cy) / 2;
    ctx.strokeStyle = 'rgba(120, 120, 150, 0.18)';
    ctx.lineWidth = 1;
    for (const ax of result.axes) {
      ctx.beginPath();
      ctx.moveTo(mx - ax.x * 1000, my - ax.y * 1000);
      ctx.lineTo(mx + ax.x * 1000, my + ax.y * 1000);
      ctx.stroke();
    }

    for (const [poly, hue] of [[wa, state.polyA.hue], [wb, state.polyB.hue]]) {
      ctx.fillStyle = state.flash > 0 ? '#ff4444' : `hsl(${hue} 60% 55%)`;
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e6edf3';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (result.hit) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('HIT', 12, 24);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.poly_a_size !== state.sizeA) {
    state.polyA.verts = regularPoly(params.poly_a_size, 50 + Math.random() * 20);
    state.sizeA = params.poly_a_size;
  }
  if (params.poly_b_size !== state.sizeB) {
    state.polyB.verts = regularPoly(params.poly_b_size, 50 + Math.random() * 20);
    state.sizeB = params.poly_b_size;
  }
  if (params.speed !== state.speed && state.speed > 0) {
    const k = params.speed / state.speed;
    state.polyA.vx *= k; state.polyA.vy *= k;
    state.polyB.vx *= k; state.polyB.vy *= k;
    state.speed = params.speed;
  }
}
