// Pathfinding: line-of-sight — sentry tests an unobstructed ray to a wanderer.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const AGENT_R = 7;

function seedObstacles(state, n) {
  state.obstacles = [];
  let tries = 0;
  while (state.obstacles.length < n && tries < n * 30) {
    tries++;
    const w = 40 + Math.random() * 80;
    const h = 40 + Math.random() * 80;
    const x = 80 + Math.random() * (W - 160 - w);
    const y = 40 + Math.random() * (H - 80 - h);
    // Keep clear of sentry post.
    if (x < 160 && y < 160) continue;
    state.obstacles.push({ x, y, w, h, hue: 200 + Math.random() * 100 });
  }
}

// Segment (x1,y1)-(x2,y2) vs axis-aligned rect.
function segRect(x1, y1, x2, y2, r) {
  // Liang–Barsky clipping.
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else          { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return t0 <= t1;
}

export function init(ctx, params, env) {
  const state = {
    obstacle_count: params.obstacle_count,
    view_range: params.view_range,
    agent_speed: params.agent_speed,
    obstacles: [],
    sentry: { x: 70, y: 70 },
    wanderer: { x: W - 100, y: H - 80, heading: Math.random() * Math.PI * 2 },
  };
  seedObstacles(state, state.obstacle_count);

  function tick(dt) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Wanderer random-walk with edge & obstacle bounce.
    state.wanderer.heading += (Math.random() - 0.5) * 1.5 * dt * Math.PI;
    const nx = state.wanderer.x + Math.cos(state.wanderer.heading) * state.agent_speed * dt;
    const ny = state.wanderer.y + Math.sin(state.wanderer.heading) * state.agent_speed * dt;
    let blocked = false;
    if (nx < AGENT_R || nx > W - AGENT_R) blocked = true;
    if (ny < AGENT_R || ny > H - AGENT_R) blocked = true;
    for (const r of state.obstacles) {
      if (nx > r.x - AGENT_R && nx < r.x + r.w + AGENT_R &&
          ny > r.y - AGENT_R && ny < r.y + r.h + AGENT_R) { blocked = true; break; }
    }
    if (blocked) {
      state.wanderer.heading += Math.PI / 2 + Math.random() * Math.PI;
    } else {
      state.wanderer.x = nx; state.wanderer.y = ny;
    }

    // Obstacles.
    for (const r of state.obstacles) {
      ctx.fillStyle = `hsl(${r.hue} 30% 30%)`;
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }

    // LOS test: blocked iff any obstacle intersects the segment.
    const dx = state.wanderer.x - state.sentry.x;
    const dy = state.wanderer.y - state.sentry.y;
    const dist = Math.hypot(dx, dy);
    let occluded = dist > state.view_range;
    if (!occluded) {
      for (const r of state.obstacles) {
        if (segRect(state.sentry.x, state.sentry.y, state.wanderer.x, state.wanderer.y, r)) {
          occluded = true; break;
        }
      }
    }

    // View-range halo.
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(state.sentry.x, state.sentry.y, state.view_range, 0, Math.PI * 2);
    ctx.stroke();

    // Sight line.
    ctx.strokeStyle = occluded ? '#555' : '#ff3030';
    ctx.lineWidth = occluded ? 1 : 2;
    ctx.beginPath();
    ctx.moveTo(state.sentry.x, state.sentry.y);
    ctx.lineTo(state.wanderer.x, state.wanderer.y);
    ctx.stroke();

    // Sentry.
    ctx.fillStyle = occluded ? '#888' : '#ff3030';
    ctx.beginPath();
    ctx.arc(state.sentry.x, state.sentry.y, AGENT_R + 1, 0, Math.PI * 2);
    ctx.fill();

    // Wanderer.
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(state.wanderer.x, state.wanderer.y, AGENT_R, 0, Math.PI * 2);
    ctx.fill();

    if (!occluded) {
      ctx.fillStyle = '#ff3030';
      ctx.font = 'bold 14px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('SPOTTED', W - 12, 10);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.obstacle_count !== state.obstacle_count) {
    state.obstacle_count = params.obstacle_count;
    seedObstacles(state, params.obstacle_count);
  }
  state.view_range = params.view_range;
  state.agent_speed = params.agent_speed;
}
