// Nested-spaces: portals — paired surfaces; entering one exits at its pair.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const PORTAL_R = 22, AGENT_R = 6;
const PAIR_HUES = [[210, 30], [140, 280], [50, 320]]; // [in_hue, out_hue] per pair

function seedPortals(state, portal_count) {
  state.portals = [];
  for (let p = 0; p < portal_count; p++) {
    const margin = 60;
    const y1 = margin + Math.random() * (H - 2 * margin);
    const y2 = margin + Math.random() * (H - 2 * margin);
    const x1 = margin + Math.random() * (W / 2 - margin);
    const x2 = W / 2 + Math.random() * (W / 2 - margin);
    state.portals.push({ x: x1, y: y1, pair: p, hue: PAIR_HUES[p][0] });
    state.portals.push({ x: x2, y: y2, pair: p, hue: PAIR_HUES[p][1] });
  }
}

function seedAgents(state, agent_count, speed) {
  state.agents = [];
  for (let i = 0; i < agent_count; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.agents.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      cooldown: 0,
    });
  }
}

export function init(ctx, params, env) {
  const state = {
    portal_count: params.portal_count,
    agent_count: params.agent_count,
    agent_speed: params.agent_speed,
    portals: [],
    agents: [],
    flashes: [],
    t: 0,
  };
  seedPortals(state, params.portal_count);
  seedAgents(state, params.agent_count, params.agent_speed);

  function tick(dt) {
    state.t += dt;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Portals
    for (const p of state.portals) {
      ctx.strokeStyle = `hsl(${p.hue} 80% 60%)`;
      ctx.lineWidth = 3;
      const pulse = 1 + Math.sin(state.t * 4 + p.pair) * 0.06;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PORTAL_R * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `hsl(${p.hue} 80% 60% / 0.18)`;
      ctx.fill();
    }

    // Agents
    for (const a of state.agents) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < AGENT_R || a.x > W - AGENT_R) { a.vx *= -1; a.x = Math.max(AGENT_R, Math.min(W - AGENT_R, a.x)); }
      if (a.y < AGENT_R || a.y > H - AGENT_R) { a.vy *= -1; a.y = Math.max(AGENT_R, Math.min(H - AGENT_R, a.y)); }
      a.cooldown = Math.max(0, a.cooldown - dt);

      if (a.cooldown === 0) {
        for (const p of state.portals) {
          const dx = a.x - p.x, dy = a.y - p.y;
          if (dx * dx + dy * dy < PORTAL_R * PORTAL_R) {
            const other = state.portals.find(q => q.pair === p.pair && q !== p);
            if (other) {
              const sp = Math.hypot(a.vx, a.vy) || 1;
              const nx = a.vx / sp, ny = a.vy / sp;
              a.x = other.x + nx * (PORTAL_R + AGENT_R + 1);
              a.y = other.y + ny * (PORTAL_R + AGENT_R + 1);
              a.cooldown = 0.3;
              state.flashes.push({ x: other.x, y: other.y, hue: other.hue, t: 0 });
              break;
            }
          }
        }
      }

      ctx.fillStyle = '#39ff14';
      ctx.beginPath();
      ctx.arc(a.x, a.y, AGENT_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // Exit flashes
    state.flashes = state.flashes.filter(f => f.t < 0.4);
    for (const f of state.flashes) {
      f.t += dt;
      const r = PORTAL_R + f.t * 80;
      ctx.strokeStyle = `hsl(${f.hue} 80% 70% / ${1 - f.t / 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.portal_count !== state.portal_count) {
    state.portal_count = params.portal_count;
    seedPortals(state, params.portal_count);
  }
  if (params.agent_count !== state.agent_count) {
    state.agent_count = params.agent_count;
    seedAgents(state, params.agent_count, params.agent_speed);
  }
  if (params.agent_speed !== state.agent_speed && state.agent_speed > 0) {
    const k = params.agent_speed / state.agent_speed;
    for (const a of state.agents) { a.vx *= k; a.vy *= k; }
  }
  state.agent_speed = params.agent_speed;
}
