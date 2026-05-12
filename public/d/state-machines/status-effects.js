// State-machines: status-effects — agents accumulate timed stacking effects.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const MAX_HP = 100;

const EFFECTS = {
  POISON: { color: '#a855f7', dps: 6,  duration: 5 },
  BURN:   { color: '#f97316', dps: 10, duration: 3 },
  SLOW:   { color: '#60a5fa', dps: 0,  duration: 4 },
  SHIELD: { color: '#facc15', dps: -4, duration: 3 },
};
const EFFECT_KEYS = Object.keys(EFFECTS);

function seed(state, n) {
  state.agents = [];
  for (let i = 0; i < n; i++) {
    state.agents.push({
      x: (W * 0.18) + (i * (W * 0.72)) / Math.max(1, n - 1) || W * 0.5,
      y: H * 0.5,
      hp: MAX_HP,
      effects: [],
      hue: (i * 53) % 360,
    });
  }
  // If only one agent, center it.
  if (n === 1) state.agents[0].x = W * 0.5;
}

function applyRandomEffect(state) {
  if (!state.agents.length) return;
  const a = state.agents[(Math.random() * state.agents.length) | 0];
  const type = EFFECT_KEYS[(Math.random() * EFFECT_KEYS.length) | 0];
  const def = EFFECTS[type];
  a.effects.push({ type, remaining: def.duration, color: def.color, dps: def.dps });
}

function tickAgent(a, dt) {
  let dps = 0;
  for (const e of a.effects) {
    e.remaining -= dt;
    dps += e.dps;
  }
  a.effects = a.effects.filter(e => e.remaining > 0);
  a.hp = Math.max(0, Math.min(MAX_HP, a.hp - dps * dt));
  if (a.hp <= 0) { a.hp = MAX_HP; a.effects = []; }
}

function drawAgent(ctx, a) {
  // Body
  ctx.fillStyle = `hsl(${a.hue} 60% 55%)`;
  ctx.beginPath(); ctx.arc(a.x, a.y, 22, 0, Math.PI * 2); ctx.fill();
  // Shield ring if SHIELD active
  if (a.effects.some(e => e.type === 'SHIELD')) {
    ctx.strokeStyle = EFFECTS.SHIELD.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(a.x, a.y, 26, 0, Math.PI * 2); ctx.stroke();
  }
  // HP bar
  const bw = 60, bh = 6;
  ctx.fillStyle = '#1f2937'; ctx.fillRect(a.x - bw / 2, a.y + 30, bw, bh);
  ctx.fillStyle = a.hp > 30 ? '#10b981' : '#ef4444';
  ctx.fillRect(a.x - bw / 2, a.y + 30, bw * (a.hp / MAX_HP), bh);
  // HP number
  ctx.fillStyle = '#e6edf3';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${a.hp | 0}/${MAX_HP}`, a.x, a.y + 52);
  // Status badges
  const bx = a.x - (a.effects.length * 14) / 2 + 7;
  for (let i = 0; i < a.effects.length; i++) {
    const e = a.effects[i];
    const x = bx + i * 14 - 6, y = a.y - 48;
    ctx.fillStyle = e.color; ctx.fillRect(x, y, 12, 12);
    ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 11, 11);
    ctx.fillStyle = '#0d1117';
    ctx.font = 'bold 8px ui-monospace, monospace';
    ctx.fillText(e.type[0], x + 6, y + 9);
  }
  ctx.textAlign = 'left';
}

export function init(ctx, params, env) {
  const state = {
    effect_interval: params.effect_interval,
    agent_count: params.agent_count,
    agents: [],
    timer: 0,
  };
  seed(state, state.agent_count);

  function tick(dt) {
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

    state.timer += dt;
    if (state.timer >= state.effect_interval) {
      state.timer = 0;
      applyRandomEffect(state);
    }
    for (const a of state.agents) tickAgent(a, dt);

    for (const a of state.agents) drawAgent(ctx, a);

    // Legend
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText('status effects', 16, 22);
    let lx = 16;
    for (const k of EFFECT_KEYS) {
      ctx.fillStyle = EFFECTS[k].color; ctx.fillRect(lx, 32, 10, 10);
      ctx.fillStyle = '#e6edf3'; ctx.fillText(k, lx + 14, 41);
      lx += 14 + k.length * 7 + 12;
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.effect_interval = params.effect_interval;
  if (params.agent_count !== state.agent_count) {
    state.agent_count = params.agent_count;
    seed(state, state.agent_count);
  }
}
