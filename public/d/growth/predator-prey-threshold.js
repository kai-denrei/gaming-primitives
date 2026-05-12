// Growth: predator-prey-threshold — every nearby entity is classified live
// each frame as prey / peer / predator based on its size ratio to the player.
// The whole color field re-grades as the player grows or shrinks through
// each neighbor's threshold band.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const PRURSUE_RANGE = 180;
const FLEE_RANGE = 220;
const PURSUIT_SPEED = 95;
const FLEE_SPEED = 130;

function areaOf(r) { return Math.PI * r * r; }
function radiusFromArea(a) { return Math.sqrt(a / Math.PI); }

function spawnEntity(state, opts = {}) {
  // Mix sizes so the field always has some prey, some peer, some predator
  // relative to a typical player. Re-roll for variety.
  const baseline = state.startSize;
  const variance = 0.4 + Math.random() * 1.6;   // 0.4× to 2.0× baseline
  const r = Math.max(3, baseline * variance);
  // Spawn away from player
  let x, y, tries = 0;
  do {
    x = 20 + Math.random() * (W - 40);
    y = 20 + Math.random() * (H - 40);
    tries++;
  } while (tries < 8 && Math.hypot(x - state.player.x, y - state.player.y) < state.player.r + r + 30);
  const ang = Math.random() * Math.PI * 2;
  state.entities.push({
    x, y, r,
    vx: Math.cos(ang) * 25,
    vy: Math.sin(ang) * 25,
  });
}

function seed(state) {
  state.player = { x: W / 2, y: H / 2, r: state.startSize };
  state.entities = [];
  for (let i = 0; i < state.entityCount; i++) spawnEntity(state);
}

function classify(state, e) {
  const ratio = e.r / state.player.r;
  if (ratio < state.preyThreshold)     return 'prey';
  if (ratio > state.predatorThreshold) return 'predator';
  return 'peer';
}

export function init(ctx, params, env) {
  const state = {
    startSize: params.start_size,
    entityCount: params.entity_count,
    preyThreshold: params.prey_threshold,
    predatorThreshold: params.predator_threshold,
  };
  seed(state);

  function tick(dt) {
    const p = state.player;

    // Classify all entities this frame (the central invariant of this variant).
    const labels = state.entities.map(e => classify(state, e));

    // Find nearest prey within pursue range, nearest predator within flee range.
    let nearestPrey = null, dPrey = Infinity;
    let nearestPred = null, dPred = Infinity;
    for (let i = 0; i < state.entities.length; i++) {
      const e = state.entities[i];
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (labels[i] === 'prey' && d < dPrey && d < PRURSUE_RANGE) { dPrey = d; nearestPrey = e; }
      if (labels[i] === 'predator' && d < dPred && d < FLEE_RANGE) { dPred = d; nearestPred = e; }
    }

    // Behavior priority: flee > pursue > wander
    let pvx = 0, pvy = 0;
    if (nearestPred) {
      const dx = p.x - nearestPred.x, dy = p.y - nearestPred.y;
      const d = Math.hypot(dx, dy) || 1;
      pvx = dx / d * FLEE_SPEED;
      pvy = dy / d * FLEE_SPEED;
    } else if (nearestPrey) {
      const dx = nearestPrey.x - p.x, dy = nearestPrey.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      pvx = dx / d * PURSUIT_SPEED;
      pvy = dy / d * PURSUIT_SPEED;
    } else {
      state.wanderA = (state.wanderA ?? 0) + (Math.random() - 0.5) * 2 * dt;
      pvx = Math.cos(state.wanderA) * 40;
      pvy = Math.sin(state.wanderA) * 40;
    }
    p.x += pvx * dt;
    p.y += pvy * dt;
    p.x = Math.max(p.r, Math.min(W - p.r, p.x));
    p.y = Math.max(p.r, Math.min(H - p.r, p.y));

    // Drift entities
    for (const e of state.entities) {
      e.vx += (Math.random() - 0.5) * 30 * dt;
      e.vy += (Math.random() - 0.5) * 30 * dt;
      const sp = Math.hypot(e.vx, e.vy);
      if (sp > 45) { e.vx *= 45 / sp; e.vy *= 45 / sp; }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.x < e.r)     { e.x = e.r;     e.vx = -e.vx; }
      if (e.x > W - e.r) { e.x = W - e.r; e.vx = -e.vx; }
      if (e.y < e.r)     { e.y = e.r;     e.vy = -e.vy; }
      if (e.y > H - e.r) { e.y = H - e.r; e.vy = -e.vy; }
    }

    // Resolve contacts
    for (let i = state.entities.length - 1; i >= 0; i--) {
      const e = state.entities[i];
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d >= p.r + e.r * 0.6) continue;
      const label = labels[i];
      if (label === 'prey') {
        // Eat
        const newArea = areaOf(p.r) + 0.85 * areaOf(e.r);
        p.r = radiusFromArea(newArea);
        state.entities.splice(i, 1);
        spawnEntity(state);     // keep field populated
      } else if (label === 'predator') {
        // Death — reset to start_size
        p.r = state.startSize;
        // Knockback the player away from predator a bit so it can flee
        const dx = p.x - e.x, dy = p.y - e.y;
        const dd = Math.hypot(dx, dy) || 1;
        p.x += (dx / dd) * 30;
        p.y += (dy / dd) * 30;
      } else {
        // Peer — elastic-ish bounce, no eat
        const dx = p.x - e.x, dy = p.y - e.y;
        const dd = Math.hypot(dx, dy) || 1;
        const overlap = (p.r + e.r * 0.6) - dd;
        p.x += (dx / dd) * overlap * 0.6;
        p.y += (dy / dd) * overlap * 0.6;
        e.x -= (dx / dd) * overlap * 0.4;
        e.y -= (dy / dd) * overlap * 0.4;
      }
    }

    // === Render ===
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Entities, color by trophic label
    for (let i = 0; i < state.entities.length; i++) {
      const e = state.entities[i];
      const label = labels[i];
      const color = label === 'prey'     ? '#39ff14'
                  : label === 'predator' ? '#ff4444'
                  :                        '#ffd23f';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player on top
    ctx.fillStyle = '#5ee7df';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // HUD
    let np = 0, nq = 0, nd = 0;
    for (const l of labels) { if (l === 'prey') np++; else if (l === 'peer') nq++; else nd++; }
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`r ${p.r.toFixed(1)}  ·  prey ${np}  peer ${nq}  pred ${nd}`, 12, 18);
    ctx.fillStyle = '#9aa4b2';
    ctx.fillText(`< ${state.preyThreshold.toFixed(2)}×  prey  ·  > ${state.predatorThreshold.toFixed(2)}×  predator`, 12, H - 12);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.start_size !== state.startSize || params.entity_count !== state.entityCount) {
    state.startSize = params.start_size;
    state.entityCount = params.entity_count;
    state.preyThreshold = params.prey_threshold;
    state.predatorThreshold = params.predator_threshold;
    seed(state);
    return;
  }
  state.preyThreshold = params.prey_threshold;
  state.predatorThreshold = params.predator_threshold;
}
