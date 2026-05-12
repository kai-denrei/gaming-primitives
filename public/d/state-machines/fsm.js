// State-machines: fsm — N agents, each a 4-state FSM IDLE→PATROL→CHASE→RETURN.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;
const STATES = ['IDLE', 'PATROL', 'CHASE', 'RETURN'];
const COLORS = { IDLE: '#6b7280', PATROL: '#3b82f6', CHASE: '#ef4444', RETURN: '#10b981' };
const SPEEDS = { IDLE: 0, PATROL: 40, CHASE: 110, RETURN: 70 };

function seed(state, n) {
  state.agents = [];
  for (let i = 0; i < n; i++) {
    const margin = 60;
    const sx = margin + Math.random() * (W - 2 * margin);
    const sy = margin + Math.random() * (H - 2 * margin);
    state.agents.push({
      x: sx, y: sy, sx, sy,
      vx: 0, vy: 0,
      state: 'IDLE',
      timer: Math.random() * 1.5,
      dir: Math.random() * Math.PI * 2,
      hue: (i * 71) % 360,
    });
  }
}

function pickNext(cur) {
  // Forced cycle with a small chance to skip ahead — keeps state visible.
  const idx = STATES.indexOf(cur);
  return Math.random() < 0.2
    ? STATES[(idx + 2) % STATES.length]
    : STATES[(idx + 1) % STATES.length];
}

function enter(a, s) {
  a.state = s;
  a.timer = 0;
  if (s === 'PATROL') a.dir = Math.random() * Math.PI * 2;
}

function updateAgent(a, dt, interval) {
  a.timer += dt;
  const spd = SPEEDS[a.state];
  if (a.state === 'IDLE') { a.vx = a.vy = 0; }
  else if (a.state === 'PATROL') {
    if (Math.random() < dt * 0.5) a.dir += (Math.random() - 0.5) * 0.8;
    a.vx = Math.cos(a.dir) * spd; a.vy = Math.sin(a.dir) * spd;
  } else if (a.state === 'CHASE') {
    const dx = CX - a.x, dy = CY - a.y, d = Math.hypot(dx, dy) || 1;
    a.vx = dx / d * spd; a.vy = dy / d * spd;
  } else if (a.state === 'RETURN') {
    const dx = a.sx - a.x, dy = a.sy - a.y, d = Math.hypot(dx, dy) || 1;
    a.vx = dx / d * spd; a.vy = dy / d * spd;
    if (d < 6) { a.x = a.sx; a.y = a.sy; enter(a, 'IDLE'); return; }
  }
  a.x += a.vx * dt; a.y += a.vy * dt;
  // Bounce inside bounds
  if (a.x < 20) { a.x = 20; a.dir = Math.PI - a.dir; }
  if (a.x > W - 20) { a.x = W - 20; a.dir = Math.PI - a.dir; }
  if (a.y < 20) { a.y = 20; a.dir = -a.dir; }
  if (a.y > H - 20) { a.y = H - 20; a.dir = -a.dir; }
  if (a.timer >= interval) enter(a, pickNext(a.state));
}

function drawStateGraph(ctx, activeStates) {
  const gx = W - 130, gy = 16, r = 14;
  const positions = {
    IDLE:   { x: gx + 20, y: gy + 20 },
    PATROL: { x: gx + 100, y: gy + 20 },
    CHASE:  { x: gx + 100, y: gy + 90 },
    RETURN: { x: gx + 20, y: gy + 90 },
  };
  ctx.strokeStyle = '#374151'; ctx.lineWidth = 1;
  const order = ['IDLE', 'PATROL', 'CHASE', 'RETURN'];
  for (let i = 0; i < order.length; i++) {
    const a = positions[order[i]], b = positions[order[(i + 1) % order.length]];
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (const s of order) {
    const p = positions[s];
    const live = activeStates.has(s);
    ctx.fillStyle = live ? COLORS[s] : '#1f2937';
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = live ? 2 : 1;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e6edf3';
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, p.x, p.y);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

export function init(ctx, params, env) {
  const state = {
    transition_interval: params.transition_interval,
    agent_count: params.agent_count,
    agents: [],
  };
  seed(state, state.agent_count);

  function tick(dt) {
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

    // Center attractor
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.beginPath(); ctx.arc(CX, CY, 28, 0, Math.PI * 2); ctx.fill();

    const active = new Set();
    for (const a of state.agents) {
      updateAgent(a, dt, state.transition_interval);
      active.add(a.state);
    }

    for (const a of state.agents) {
      // Spawn marker
      ctx.strokeStyle = '#374151'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(a.sx, a.sy, 4, 0, Math.PI * 2); ctx.stroke();
      // Agent body
      ctx.fillStyle = COLORS[a.state];
      ctx.beginPath(); ctx.arc(a.x, a.y, 9, 0, Math.PI * 2); ctx.fill();
      // State label
      ctx.fillStyle = '#e6edf3';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(a.state, a.x, a.y - 14);
      ctx.textAlign = 'left';
    }

    drawStateGraph(ctx, active);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.transition_interval = params.transition_interval;
  if (params.agent_count !== state.agent_count) {
    state.agent_count = params.agent_count;
    seed(state, state.agent_count);
  }
}
