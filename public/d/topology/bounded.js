// Topology: bounded — position clamped, velocity zeroed on contact.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h, R = 6;

function seed(state, n, speed, jitter) {
  state.agents = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.agents.push({
      x: 20 + Math.random() * (W - 40),
      y: 20 + Math.random() * (H - 40),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      hue: (i * 47) % 360,
    });
  }
  state.jitter = jitter;
  state.speed = speed;
}

export function init(ctx, params, env) {
  const state = { agents: [], jitter: 0, speed: 0 };
  seed(state, params.agents, params.speed, params.jitter);

  function tick(dt) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    for (const a of state.agents) {
      // tiny heading jitter
      if (state.jitter > 0) {
        const ang = Math.atan2(a.vy, a.vx) + (Math.random() - 0.5) * state.jitter * dt;
        const s = Math.hypot(a.vx, a.vy);
        a.vx = Math.cos(ang) * s;
        a.vy = Math.sin(ang) * s;
      }
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // BOUNDED: clamp + zero velocity if we hit
      if (a.x < R)         { a.x = R;     a.vx = 0; a.vy = 0; }
      else if (a.x > W - R) { a.x = W - R; a.vx = 0; a.vy = 0; }
      if (a.y < R)         { a.y = R;     a.vx = 0; a.vy = 0; }
      else if (a.y > H - R) { a.y = H - R; a.vx = 0; a.vy = 0; }

      ctx.fillStyle = `hsl(${a.hue} 70% 60%)`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, R, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Re-seed on agent count change (different population); retune live for others
  if (state.agents.length !== params.agents) seed(state, params.agents, params.speed, params.jitter);
  state.jitter = params.jitter;
  // rescale speeds proportionally without re-seeding directions
  if (params.speed !== state.speed && state.speed > 0) {
    const k = params.speed / state.speed;
    for (const a of state.agents) { a.vx *= k; a.vy *= k; }
  }
  state.speed = params.speed;
}
