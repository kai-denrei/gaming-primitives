// Pathfinding: follow-leader — followers chain along the leader's recent path.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const AGENT_R = 6;
const HISTORY_MAX = 600;       // ring buffer of [x, y, distance-traveled]
const HEADING_JITTER = 1.2;    // rad/s of random heading wobble for leader

function seedLeader(state) {
  state.leader = {
    x: W / 2, y: H / 2,
    heading: Math.random() * Math.PI * 2,
  };
  state.history = [{ x: state.leader.x, y: state.leader.y, s: 0 }];
}

export function init(ctx, params, env) {
  const state = {
    leader_speed: params.leader_speed,
    follower_count: params.follower_count,
    follow_distance: params.follow_distance,
    leader: null,
    history: [],   // newest first; s = cumulative distance traveled BY the leader at that point
  };
  seedLeader(state);

  function tick(dt) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Leader: random-walk heading, bounce off edges.
    state.leader.heading += (Math.random() - 0.5) * HEADING_JITTER * dt * Math.PI;
    let nx = state.leader.x + Math.cos(state.leader.heading) * state.leader_speed * dt;
    let ny = state.leader.y + Math.sin(state.leader.heading) * state.leader_speed * dt;
    if (nx < AGENT_R || nx > W - AGENT_R) {
      state.leader.heading = Math.PI - state.leader.heading;
      nx = Math.max(AGENT_R, Math.min(W - AGENT_R, nx));
    }
    if (ny < AGENT_R || ny > H - AGENT_R) {
      state.leader.heading = -state.leader.heading;
      ny = Math.max(AGENT_R, Math.min(H - AGENT_R, ny));
    }
    const moved = Math.hypot(nx - state.leader.x, ny - state.leader.y);
    state.leader.x = nx; state.leader.y = ny;

    // Prepend to history (newest first).
    const lastS = state.history[0].s;
    state.history.unshift({ x: nx, y: ny, s: lastS + moved });
    if (state.history.length > HISTORY_MAX) state.history.length = HISTORY_MAX;

    // Trail.
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < state.history.length; i++) {
      const p = state.history[i];
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Place each follower at distance i * follow_distance behind leader along history.
    const newest = state.history[0].s;
    for (let i = 1; i <= state.follower_count; i++) {
      const targetS = newest - i * state.follow_distance;
      // Walk history (newest -> oldest) to find the segment containing targetS.
      let px = state.history[state.history.length - 1].x;
      let py = state.history[state.history.length - 1].y;
      for (let h = 0; h < state.history.length - 1; h++) {
        const a = state.history[h], b = state.history[h + 1];
        if (a.s >= targetS && b.s <= targetS) {
          const t = a.s === b.s ? 0 : (a.s - targetS) / (a.s - b.s);
          px = a.x + (b.x - a.x) * t;
          py = a.y + (b.y - a.y) * t;
          break;
        }
      }
      const hue = 200 + i * 22;
      ctx.fillStyle = `hsl(${hue} 70% 60%)`;
      ctx.beginPath();
      ctx.arc(px, py, AGENT_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // Leader on top.
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(state.leader.x, state.leader.y, AGENT_R + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.leader_speed = params.leader_speed;
  state.follower_count = params.follower_count;
  state.follow_distance = params.follow_distance;
}
