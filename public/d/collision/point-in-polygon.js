// Collision: point-in-polygon — ray cast east, count edge crossings, odd = inside.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;

function buildPolygon(n) {
  const verts = [];
  const baseR = 130;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    // irregular radius — pseudo-random but stable
    const jitter = 0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + n * 0.3));
    const r = baseR * jitter;
    verts.push({ x: Math.cos(t) * r, y: Math.sin(t) * r });
  }
  return verts;
}

function seedPoints(state, n, speed) {
  state.points = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.points.push({
      x: 10 + Math.random() * (W - 20),
      y: 10 + Math.random() * (H - 20),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
    });
  }
  state.pointSpeed = speed;
}

function inside(px, py, poly) {
  // ray cast east; count edges crossed
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    if (((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      c = !c;
    }
  }
  return c;
}

export function init(ctx, params, env) {
  const state = {
    poly: buildPolygon(params.vertex_count),
    vertexCount: params.vertex_count,
    points: [],
    pointSpeed: 0,
    rot: 0,
  };
  seedPoints(state, params.point_count, params.point_speed);

  function tick(dt) {
    state.rot += dt * 0.2;
    const cos = Math.cos(state.rot), sin = Math.sin(state.rot);
    const worldPoly = state.poly.map(v => ({
      x: CX + v.x * cos - v.y * sin,
      y: CY + v.x * sin + v.y * cos,
    }));

    for (const p of state.points) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0)     { p.x = 0;     p.vx = -p.vx; }
      if (p.x > W)     { p.x = W;     p.vx = -p.vx; }
      if (p.y < 0)     { p.y = 0;     p.vy = -p.vy; }
      if (p.y > H)     { p.y = H;     p.vy = -p.vy; }
    }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // polygon outline
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(worldPoly[0].x, worldPoly[0].y);
    for (let i = 1; i < worldPoly.length; i++) ctx.lineTo(worldPoly[i].x, worldPoly[i].y);
    ctx.closePath();
    ctx.stroke();

    let anyInside = false;
    for (const p of state.points) {
      const isIn = inside(p.x, p.y, worldPoly);
      if (isIn) anyInside = true;
      ctx.fillStyle = isIn ? '#39ff14' : '#ff4444';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (anyInside) {
      ctx.fillStyle = '#39ff14';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('HIT', 12, 24);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.vertex_count !== state.vertexCount) {
    state.poly = buildPolygon(params.vertex_count);
    state.vertexCount = params.vertex_count;
  }
  if (state.points.length !== params.point_count) {
    seedPoints(state, params.point_count, params.point_speed);
    return;
  }
  if (params.point_speed !== state.pointSpeed && state.pointSpeed > 0) {
    const k = params.point_speed / state.pointSpeed;
    for (const p of state.points) { p.vx *= k; p.vy *= k; }
    state.pointSpeed = params.point_speed;
  }
}
