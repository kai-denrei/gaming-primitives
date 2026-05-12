// Pressure: stickiness — adhere on contact; accumulated load eventually breaks the bond.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const WALL_X = 60;
const R = 8;
const SPAWN_PERIOD = 0.8;

function spawnEntity(state) {
  const y = 40 + Math.random() * (H - 80);
  state.entities.push({
    x: W - 20,
    y,
    vx: -state.entitySpeed,
    vy: 0,
    state: 'free',   // 'free' | 'stuck' | 'falling'
    load: 0,
    hue: (state.spawnCount * 53) % 360,
  });
  state.spawnCount++;
}

function seed(state) {
  state.entities = [];
  state.spawnCount = 0;
  for (let i = 0; i < state.entityCount; i++) spawnEntity(state);
}

export function init(ctx, params, env) {
  const state = {
    entities: [],
    spawnTimer: 0,
    spawnCount: 0,
    bondStrength: params.bond_strength,
    entityCount: params.entity_count,
    entitySpeed: params.entity_speed,
    gravity: params.gravity,
  };
  seed(state);

  function tick(dt) {
    state.spawnTimer += dt;
    // Maintain entity_count free+stuck (not falling)
    const alive = state.entities.filter(e => e.state !== 'falling').length;
    if (state.spawnTimer >= SPAWN_PERIOD && alive < state.entityCount) {
      state.spawnTimer = 0;
      spawnEntity(state);
    }

    const breakThreshold = state.bondStrength * 200;

    for (const e of state.entities) {
      if (e.state === 'free') {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.x <= WALL_X + R) {
          e.x = WALL_X + R;
          e.vx = 0;
          e.vy = 0;
          e.state = 'stuck';
          e.load = 0;
        }
      } else if (e.state === 'stuck') {
        // Bond accumulates gravity load each frame.
        e.load += state.gravity * dt;
        if (e.load > breakThreshold) {
          e.state = 'falling';
          e.vx = 0;
          e.vy = 0;
        }
      } else { // falling
        e.vy += state.gravity * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.y > H + 40) {
          // Despawn — flag for removal below
          e.dead = true;
        }
      }
    }
    // Remove dead
    for (let i = state.entities.length - 1; i >= 0; i--) {
      if (state.entities[i].dead) state.entities.splice(i, 1);
    }

    // Draw
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Wall
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, WALL_X, H);
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(WALL_X + 0.5, 0);
    ctx.lineTo(WALL_X + 0.5, H);
    ctx.stroke();

    // Threshold readout (top-right)
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`break threshold ${breakThreshold.toFixed(0)} (bond × 200)`, W - 260, 22);

    for (const e of state.entities) {
      let color;
      if (e.state === 'free') color = '#39ff14';
      else if (e.state === 'stuck') color = '#ff9c42';   // orange while stuck
      else color = '#ff4444';                            // red while falling

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, R, 0, Math.PI * 2);
      ctx.fill();

      if (e.state === 'stuck') {
        // "Tug" indicator — a small downward bar shows how close the bond is to breaking.
        const tug = Math.min(1, e.load / Math.max(0.0001, breakThreshold));
        const tugLen = 4 + tug * 18;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y + R);
        ctx.lineTo(e.x, e.y + R + tugLen);
        ctx.stroke();
        // Load bar above
        ctx.strokeStyle = '#e6edf3';
        ctx.lineWidth = 1;
        ctx.strokeRect(e.x - 12 + 0.5, e.y - R - 8 + 0.5, 23, 4);
        ctx.fillStyle = tug > 0.8 ? '#ff4444' : '#ff9c42';
        ctx.fillRect(e.x - 12 + 1, e.y - R - 8 + 1, 22 * tug, 2);
      }
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (state.entityCount !== params.entity_count) {
    state.entityCount = params.entity_count;
    seed(state);
    return;
  }
  state.bondStrength = params.bond_strength;
  state.entitySpeed = params.entity_speed;
  state.gravity = params.gravity;
  // Live retune: free entities pick up new speed
  for (const e of state.entities) {
    if (e.state === 'free') e.vx = -state.entitySpeed;
  }
}
