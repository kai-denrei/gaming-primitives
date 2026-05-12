// Time-as-resource: bonfire-recovery — auto-walk, gather souls, periodic death respawns enemies.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const BONFIRE_X = 70, BONFIRE_Y = H / 2;

function seedEnemies(state, n) {
  state.enemies = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    state.enemies.push({
      x: 200 + (W - 260) * t + (Math.random() - 0.5) * 60,
      y: 80 + Math.random() * (H - 160),
      alive: true,
      wob: Math.random() * Math.PI * 2,
    });
  }
}

function spawnPlayer(state) {
  state.player = { x: BONFIRE_X + 18, y: BONFIRE_Y, vx: 60, vy: 0 };
  state.trail = [];
  state.souls = 0;
  for (const e of state.enemies) e.alive = true;
}

function die(state) {
  state.flash = 0.6;
  spawnPlayer(state);
}

function drawBonfire(ctx, t) {
  const flick = 0.85 + 0.15 * Math.sin(t * 9);
  ctx.fillStyle = `rgba(255, 140, 40, ${0.18 * flick})`;
  ctx.beginPath(); ctx.arc(BONFIRE_X, BONFIRE_Y, 56, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255, 180, 60, ${0.32 * flick})`;
  ctx.beginPath(); ctx.arc(BONFIRE_X, BONFIRE_Y, 32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff8c28';
  ctx.beginPath(); ctx.arc(BONFIRE_X, BONFIRE_Y, 14 + Math.sin(t * 11) * 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2310';
  ctx.fillRect(BONFIRE_X - 18, BONFIRE_Y + 10, 36, 6);
}

export function init(ctx, params, env) {
  const state = {
    death_interval: params.death_interval,
    enemy_count: params.enemy_count,
    timer: 0,
    clock: 0,
    flash: 0,
    enemies: [],
    player: null,
    trail: [],
    souls: 0,
  };
  seedEnemies(state, state.enemy_count);
  spawnPlayer(state);

  function tick(dt) {
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    state.clock += dt;
    state.timer += dt;
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 1.5);

    drawBonfire(ctx, state.clock);

    // Player auto-walks right
    const p = state.player;
    p.x += p.vx * dt;
    p.vy = Math.sin(state.clock * 2.4) * 18;
    p.y += p.vy * dt;
    p.y = Math.max(40, Math.min(H - 40, p.y));
    state.trail.push({ x: p.x, y: p.y });
    if (state.trail.length > 80) state.trail.shift();

    // Soul pickups via enemy proximity
    for (const e of state.enemies) {
      if (!e.alive) continue;
      e.wob += dt * 3;
      const dx = e.x - p.x, dy = e.y - p.y;
      if (Math.hypot(dx, dy) < 20) {
        e.alive = false;
        state.souls += 1;
      }
    }

    // Wrap or hit wall → also die (off-screen)
    if (p.x > W - 20) die(state);

    if (state.timer >= state.death_interval) {
      state.timer = 0;
      die(state);
    }

    // Trail
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i++) {
      const pt = state.trail[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Enemies
    for (const e of state.enemies) {
      if (!e.alive) continue;
      ctx.fillStyle = '#ef4444';
      const r = 9 + Math.sin(e.wob) * 1.5;
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
    }

    // Souls collected so far (yellow trailing dots near player)
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < state.souls; i++) {
      const a = state.clock * 2 + i * (Math.PI * 2 / Math.max(1, state.souls));
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 18, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player
    ctx.fillStyle = '#39ff14';
    ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();

    // Death flash
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${state.flash})`;
      ctx.fillRect(0, 0, W, H);
    }

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillText(`souls ${state.souls}`, 16, 24);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`death in ${Math.max(0, state.death_interval - state.timer).toFixed(1)}s`, 16, 42);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.death_interval = params.death_interval;
  if (params.enemy_count !== state.enemy_count) {
    state.enemy_count = params.enemy_count;
    seedEnemies(state, state.enemy_count);
    spawnPlayer(state);
  }
}
