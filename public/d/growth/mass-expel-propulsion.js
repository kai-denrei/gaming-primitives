// Growth: mass-expel-propulsion — periodic auto-expel imparts opposing velocity
// to the player (Newton's 3rd law). Player shrinks per expel; expelled blobs
// drift and can be re-absorbed. Ambient motes drift in the field.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const EXPEL_PERIOD = 0.7;     // seconds between auto-expels
const PLAYER_DENSITY = 1;     // mass = area × density (we use area directly)

function areaOf(r) { return Math.PI * r * r; }
function radiusFromArea(a) { return Math.sqrt(Math.max(0.0001, a) / Math.PI); }

function spawnMote(state) {
  // Motes are small (always smaller than the player at start)
  const r = 3 + Math.random() * Math.max(3, state.startSize * 0.18);
  const ang = Math.random() * Math.PI * 2;
  state.motes.push({
    x: 20 + Math.random() * (W - 40),
    y: 20 + Math.random() * (H - 40),
    vx: Math.cos(ang) * 30,
    vy: Math.sin(ang) * 30,
    r,
    expelled: false,
  });
}

function seed(state) {
  state.player = {
    x: W / 2, y: H / 2,
    vx: 0, vy: 0,
    r: state.startSize,
  };
  state.motes = [];
  for (let i = 0; i < state.moteCount; i++) spawnMote(state);
  state.expelTimer = EXPEL_PERIOD * 0.5;
}

export function init(ctx, params, env) {
  const state = {
    startSize: params.start_size,
    expelFraction: params.expel_fraction,
    expelVelocity: params.expel_velocity,
    moteCount: params.mote_count,
  };
  seed(state);

  function tryExpel() {
    const p = state.player;
    if (p.r < 6) return;        // too small to expel safely
    // Aim toward nearest mote (drift goal); if none, pick random direction.
    let aimX = 0, aimY = 0;
    let best = null, bestD = Infinity;
    for (const m of state.motes) {
      if (m.expelled) continue;
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      if (d < bestD) { bestD = d; best = m; }
    }
    if (best) {
      const dx = best.x - p.x, dy = best.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      aimX = dx / d; aimY = dy / d;
    } else {
      const a = Math.random() * Math.PI * 2;
      aimX = Math.cos(a); aimY = Math.sin(a);
    }

    // Conservation: player_mass × dv  =  expelled_mass × expel_velocity.
    // mass ∝ area (radius²).
    const playerArea = areaOf(p.r);
    const expelledArea = playerArea * state.expelFraction;
    const expelledR = radiusFromArea(expelledArea);
    if (expelledR < 1) return;

    // Velocity gain on player in +aim direction
    const dv = (expelledArea / playerArea) * state.expelVelocity;
    p.vx += aimX * dv;
    p.vy += aimY * dv;
    // Shrink player by removing expelled area
    const newPlayerArea = playerArea - expelledArea;
    p.r = radiusFromArea(newPlayerArea);

    // Spawn expelled blob behind the player, moving in -aim direction
    const offset = p.r + expelledR + 2;
    state.motes.push({
      x: p.x - aimX * offset,
      y: p.y - aimY * offset,
      vx: -aimX * state.expelVelocity,
      vy: -aimY * state.expelVelocity,
      r: expelledR,
      expelled: true,
    });
  }

  function tick(dt) {
    const p = state.player;

    // Expel timer
    state.expelTimer -= dt;
    if (state.expelTimer <= 0) {
      tryExpel();
      state.expelTimer = EXPEL_PERIOD;
    }

    // Player physics + slight drag (so it doesn't run away forever)
    const drag = 0.15;
    p.vx -= p.vx * drag * dt;
    p.vy -= p.vy * drag * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Wall bounce
    if (p.x < p.r)     { p.x = p.r;     p.vx = Math.abs(p.vx) * 0.6; }
    if (p.x > W - p.r) { p.x = W - p.r; p.vx = -Math.abs(p.vx) * 0.6; }
    if (p.y < p.r)     { p.y = p.r;     p.vy = Math.abs(p.vy) * 0.6; }
    if (p.y > H - p.r) { p.y = H - p.r; p.vy = -Math.abs(p.vy) * 0.6; }

    // Motes drift + drag
    for (const m of state.motes) {
      m.vx -= m.vx * 0.3 * dt;
      m.vy -= m.vy * 0.3 * dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      // Wrap motes off-screen so the field stays alive
      if (m.x < -m.r - 5)        m.x = W + m.r;
      if (m.x > W + m.r + 5)     m.x = -m.r;
      if (m.y < -m.r - 5)        m.y = H + m.r;
      if (m.y > H + m.r + 5)     m.y = -m.r;
    }

    // Absorb motes the player crosses (including its own expelled blobs)
    for (let i = state.motes.length - 1; i >= 0; i--) {
      const m = state.motes[i];
      if (m.r >= p.r) continue;     // can't eat larger than self
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      if (d < p.r + m.r * 0.6) {
        const newArea = areaOf(p.r) + areaOf(m.r);
        p.r = radiusFromArea(newArea);
        state.motes.splice(i, 1);
      }
    }

    // Maintain ambient (non-expelled) mote population
    const ambient = state.motes.filter(m => !m.expelled).length;
    if (ambient < state.moteCount) spawnMote(state);

    // === Render ===
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Motes
    for (const m of state.motes) {
      ctx.fillStyle = m.expelled ? '#888' : `hsl(180, 60%, 55%)`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Velocity vector
    const vs = Math.hypot(p.vx, p.vy);
    if (vs > 1) {
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      const len = Math.min(60, vs * 0.18);
      ctx.lineTo(p.x + (p.vx / vs) * len, p.y + (p.vy / vs) * len);
      ctx.stroke();
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
    ctx.fillText(`mass ${areaOf(p.r).toFixed(0)}  ·  r ${p.r.toFixed(1)}  ·  |v| ${vs.toFixed(0)}`, 12, 18);
    ctx.fillStyle = '#9aa4b2';
    ctx.fillText(`expel ${(state.expelFraction * 100).toFixed(1)}% mass  @  ${state.expelVelocity.toFixed(0)} u/s`, 12, H - 12);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.start_size !== state.startSize || params.mote_count !== state.moteCount) {
    state.startSize = params.start_size;
    state.moteCount = params.mote_count;
    state.expelFraction = params.expel_fraction;
    state.expelVelocity = params.expel_velocity;
    seed(state);
    return;
  }
  state.expelFraction = params.expel_fraction;
  state.expelVelocity = params.expel_velocity;
}
