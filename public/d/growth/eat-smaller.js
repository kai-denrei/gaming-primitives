// Growth: eat-smaller — player blob absorbs strictly-smaller blobs, growing
// by a fraction of their area. Area-conservation math: new_area = old_area +
// growth_factor × prey_area; new_radius = sqrt(new_area / π).

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

function areaOf(r) { return Math.PI * r * r; }
function radiusFromArea(a) { return Math.sqrt(a / Math.PI); }

function spawnPrey(state) {
  // Prey radius: anywhere from ~25% to ~110% of the player's current radius,
  // biased small so the field always has eatable mass.
  const minR = Math.max(2, state.player.r * 0.25);
  const maxR = state.player.r * 1.1;
  const r = minR + Math.random() * (maxR - minR);
  // Spawn away from player center to avoid instant-eat on spawn.
  let x, y, tries = 0;
  do {
    x = 20 + Math.random() * (W - 40);
    y = 20 + Math.random() * (H - 40);
    tries++;
  } while (tries < 8 && Math.hypot(x - state.player.x, y - state.player.y) < state.player.r + r + 20);
  const ang = Math.random() * Math.PI * 2;
  state.prey.push({
    x, y, r,
    vx: Math.cos(ang) * 20,
    vy: Math.sin(ang) * 20,
  });
}

function seed(state) {
  state.player = { x: W / 2, y: H / 2, r: state.startSize };
  state.prey = [];
  for (let i = 0; i < state.preyCount; i++) spawnPrey(state);
}

export function init(ctx, params, env) {
  const state = {
    startSize: params.start_size,
    preyCount: params.prey_count,
    growthFactor: params.growth_factor,
    pursuitSpeed: params.pursuit_speed,
  };
  seed(state);

  function tick(dt) {
    const p = state.player;

    // Find nearest strictly-smaller prey
    let target = null, bestD = Infinity;
    for (const q of state.prey) {
      if (q.r >= p.r) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bestD) { bestD = d; target = q; }
    }

    // Pursue or wander
    let pvx = 0, pvy = 0;
    if (target) {
      const dx = target.x - p.x, dy = target.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      pvx = dx / d * state.pursuitSpeed;
      pvy = dy / d * state.pursuitSpeed;
    } else {
      // Slow wander when no prey
      state.wanderA = (state.wanderA ?? 0) + (Math.random() - 0.5) * 2 * dt;
      pvx = Math.cos(state.wanderA) * state.pursuitSpeed * 0.4;
      pvy = Math.sin(state.wanderA) * state.pursuitSpeed * 0.4;
    }
    p.x += pvx * dt;
    p.y += pvy * dt;
    // Clamp to play area
    p.x = Math.max(p.r, Math.min(W - p.r, p.x));
    p.y = Math.max(p.r, Math.min(H - p.r, p.y));

    // Drift prey with brownian noise; bounce off edges
    for (const q of state.prey) {
      q.vx += (Math.random() - 0.5) * 30 * dt;
      q.vy += (Math.random() - 0.5) * 30 * dt;
      const sp = Math.hypot(q.vx, q.vy);
      if (sp > 35) { q.vx *= 35 / sp; q.vy *= 35 / sp; }
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.x < q.r)         { q.x = q.r;         q.vx = -q.vx; }
      if (q.x > W - q.r)     { q.x = W - q.r;     q.vx = -q.vx; }
      if (q.y < q.r)         { q.y = q.r;         q.vy = -q.vy; }
      if (q.y > H - q.r)     { q.y = H - q.r;     q.vy = -q.vy; }
    }

    // Collision: player absorbs strictly-smaller prey on overlap.
    for (let i = state.prey.length - 1; i >= 0; i--) {
      const q = state.prey[i];
      if (q.r >= p.r) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < p.r + q.r * 0.6) {
        const newArea = areaOf(p.r) + state.growthFactor * areaOf(q.r);
        p.r = radiusFromArea(newArea);
        state.prey.splice(i, 1);
      }
    }

    // Maintain population when it drops below half
    if (state.prey.length < state.preyCount / 2) {
      while (state.prey.length < state.preyCount) spawnPrey(state);
    }

    // === Render ===
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Prey, colored by size relative to player on a cool hue ramp
    for (const q of state.prey) {
      const ratio = Math.min(1, q.r / Math.max(0.001, p.r));
      // 140 (green) at small → 220 (blue) at near-player size
      const hue = 140 + ratio * 80;
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player
    ctx.fillStyle = '#5ee7df';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`radius ${p.r.toFixed(1)}  ·  area ${areaOf(p.r).toFixed(0)}  ·  prey ${state.prey.length}`, 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // start_size or prey_count change → re-seed (structural).
  if (params.start_size !== state.startSize || params.prey_count !== state.preyCount) {
    state.startSize = params.start_size;
    state.preyCount = params.prey_count;
    state.growthFactor = params.growth_factor;
    state.pursuitSpeed = params.pursuit_speed;
    seed(state);
    return;
  }
  state.growthFactor = params.growth_factor;
  state.pursuitSpeed = params.pursuit_speed;
}
