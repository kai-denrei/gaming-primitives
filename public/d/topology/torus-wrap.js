// Topology: torus-wrap — position wraps modulo edge.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h, R = 6;

function mod(v, m) { return ((v % m) + m) % m; }

function seed(state, n, speed, jitter) {
  state.agents = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.agents.push({
      x: Math.random() * W,
      y: Math.random() * H,
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
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    for (const a of state.agents) {
      if (state.jitter > 0) {
        const ang = Math.atan2(a.vy, a.vx) + (Math.random() - 0.5) * state.jitter * dt;
        const s = Math.hypot(a.vx, a.vy);
        a.vx = Math.cos(ang) * s;
        a.vy = Math.sin(ang) * s;
      }
      a.x = mod(a.x + a.vx * dt, W);
      a.y = mod(a.y + a.vy * dt, H);

      // Draw twice if near the wrap seam — avoids visual pop
      const dx = a.x < R ? W : (a.x > W - R ? -W : 0);
      const dy = a.y < R ? H : (a.y > H - R ? -H : 0);
      for (const ox of (dx ? [0, dx] : [0])) for (const oy of (dy ? [0, dy] : [0])) {
        ctx.fillStyle = `hsl(${a.hue} 70% 60%)`;
        ctx.beginPath();
        ctx.arc(a.x + ox, a.y + oy, R, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (state.agents.length !== params.agents) seed(state, params.agents, params.speed, params.jitter);
  state.jitter = params.jitter;
  if (params.speed !== state.speed && state.speed > 0) {
    const k = params.speed / state.speed;
    for (const a of state.agents) { a.vx *= k; a.vy *= k; }
  }
  state.speed = params.speed;
}
