// Pathfinding: flocking — boids with alignment, cohesion, separation.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const NEIGHBOUR_R = 80;
const SEPARATION_R = 24;
const MAX_SPEED = 140;
const MAX_FORCE = 240;   // units / s^2

function seedAgents(state, n) {
  state.agents = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.agents.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.cos(ang) * MAX_SPEED * 0.6,
      vy: Math.sin(ang) * MAX_SPEED * 0.6,
      hue: 140 + Math.random() * 80,
    });
  }
}

function clampLen(vx, vy, max) {
  const m = Math.hypot(vx, vy);
  if (m > max && m > 0) return [vx * max / m, vy * max / m];
  return [vx, vy];
}

export function init(ctx, params, env) {
  const state = {
    agent_count: params.agent_count,
    align_weight: params.align_weight,
    cohesion_weight: params.cohesion_weight,
    separation_weight: params.separation_weight,
    agents: [],
  };
  seedAgents(state, state.agent_count);

  function tick(dt) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    const N = state.agents.length;
    const dvx = new Float32Array(N);
    const dvy = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const a = state.agents[i];
      let ax = 0, ay = 0, count = 0;
      let cx = 0, cy = 0;
      let sx = 0, sy = 0;
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const b = state.agents[j];
        const ddx = b.x - a.x, ddy = b.y - a.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < NEIGHBOUR_R * NEIGHBOUR_R) {
          ax += b.vx; ay += b.vy;
          cx += b.x;  cy += b.y;
          count++;
          if (d2 < SEPARATION_R * SEPARATION_R && d2 > 0.0001) {
            const d = Math.sqrt(d2);
            sx -= ddx / d * (SEPARATION_R - d);
            sy -= ddy / d * (SEPARATION_R - d);
          }
        }
      }
      let fx = 0, fy = 0;
      if (count > 0) {
        // Align: steer toward neighbour average velocity.
        let alx = ax / count - a.vx;
        let aly = ay / count - a.vy;
        [alx, aly] = clampLen(alx, aly, MAX_FORCE);
        // Cohesion: steer toward neighbour center.
        let cox = cx / count - a.x;
        let coy = cy / count - a.y;
        [cox, coy] = clampLen(cox, coy, MAX_FORCE);
        fx += alx * state.align_weight + cox * state.cohesion_weight;
        fy += aly * state.align_weight + coy * state.cohesion_weight;
      }
      // Separation (already a displacement-like vector).
      [sx, sy] = clampLen(sx * 6, sy * 6, MAX_FORCE);
      fx += sx * state.separation_weight;
      fy += sy * state.separation_weight;
      dvx[i] = fx; dvy[i] = fy;
    }

    for (let i = 0; i < N; i++) {
      const a = state.agents[i];
      a.vx += dvx[i] * dt;
      a.vy += dvy[i] * dt;
      [a.vx, a.vy] = clampLen(a.vx, a.vy, MAX_SPEED);
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // Wrap around edges.
      if (a.x < 0) a.x += W; else if (a.x > W) a.x -= W;
      if (a.y < 0) a.y += H; else if (a.y > H) a.y -= H;
    }

    // Draw.
    for (const a of state.agents) {
      const ang = Math.atan2(a.vy, a.vx);
      ctx.fillStyle = `hsl(${a.hue} 70% 60%)`;
      ctx.beginPath();
      ctx.moveTo(a.x + Math.cos(ang) * 8, a.y + Math.sin(ang) * 8);
      ctx.lineTo(a.x + Math.cos(ang + 2.5) * 5, a.y + Math.sin(ang + 2.5) * 5);
      ctx.lineTo(a.x + Math.cos(ang - 2.5) * 5, a.y + Math.sin(ang - 2.5) * 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.agent_count !== state.agent_count) {
    state.agent_count = params.agent_count;
    seedAgents(state, params.agent_count);
  }
  state.align_weight = params.align_weight;
  state.cohesion_weight = params.cohesion_weight;
  state.separation_weight = params.separation_weight;
}
