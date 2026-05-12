// Pathfinding: waypoint — agent walks a fixed loop of placed nodes in order.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const AGENT_R = 6, NODE_R = 7;

function seedWaypoints(state, n) {
  state.waypoints = [];
  const margin = 50;
  for (let i = 0; i < n; i++) {
    state.waypoints.push({
      x: margin + Math.random() * (W - 2 * margin),
      y: margin + Math.random() * (H - 2 * margin),
    });
  }
  // Place agent on first waypoint, heading to second.
  state.agent.x = state.waypoints[0].x;
  state.agent.y = state.waypoints[0].y;
  state.target = 1 % n;
}

export function init(ctx, params, env) {
  const state = {
    waypoint_count: params.waypoint_count,
    agent_speed: params.agent_speed,
    waypoints: [],
    agent: { x: 0, y: 0 },
    target: 0,
  };
  seedWaypoints(state, state.waypoint_count);

  function tick(dt) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Path lines between consecutive waypoints (loop).
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < state.waypoints.length; i++) {
      const a = state.waypoints[i];
      const b = state.waypoints[(i + 1) % state.waypoints.length];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    // Waypoint marks.
    for (let i = 0; i < state.waypoints.length; i++) {
      const w = state.waypoints[i];
      const isTarget = i === state.target;
      ctx.fillStyle = isTarget ? '#ff8a00' : 'hsl(200 50% 55%)';
      ctx.beginPath();
      ctx.arc(w.x, w.y, NODE_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0d1117';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), w.x, w.y);
    }

    // Move agent toward target waypoint.
    const tgt = state.waypoints[state.target];
    const dx = tgt.x - state.agent.x, dy = tgt.y - state.agent.y;
    const d = Math.hypot(dx, dy);
    const step = state.agent_speed * dt;
    if (d <= step) {
      state.agent.x = tgt.x;
      state.agent.y = tgt.y;
      state.target = (state.target + 1) % state.waypoints.length;
    } else {
      state.agent.x += (dx / d) * step;
      state.agent.y += (dy / d) * step;
    }

    // Active leg highlight.
    const prev = state.waypoints[(state.target - 1 + state.waypoints.length) % state.waypoints.length];
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.stroke();

    // Agent.
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(state.agent.x, state.agent.y, AGENT_R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.waypoint_count !== state.waypoint_count) {
    state.waypoint_count = params.waypoint_count;
    seedWaypoints(state, params.waypoint_count);
  }
  state.agent_speed = params.agent_speed;
}
