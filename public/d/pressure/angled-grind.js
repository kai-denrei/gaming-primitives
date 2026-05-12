// Pressure: angled-grind — attach to a rail iff approach angle is within tolerance.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const RAIL_YS = [110, 200, 290, 380];
const R = 6;
const SPAWN_PERIOD = 0.5;

function spawnSkater(state) {
  // Spawn at top, random x, random velocity direction
  const ang = Math.random() * Math.PI * 2;
  state.skaters.push({
    x: 30 + Math.random() * (W - 60),
    y: 40,
    vx: Math.cos(ang) * state.entitySpeed,
    vy: Math.abs(Math.sin(ang)) * state.entitySpeed + 30, // bias toward downward
    state: 'free',    // 'free' | 'grinding' | 'miss'
    railY: null,
    crossedRails: new Set(),
    hue: (state.spawnCount * 41) % 360,
    flashTimer: 0,    // green/red blink at each rail decision
    lastFlash: null,  // 'hit' | 'miss'
  });
  state.spawnCount++;
}

export function init(ctx, params, env) {
  const state = {
    skaters: [],
    spawnTimer: 0,
    spawnCount: 0,
    angleTolerance: params.angle_tolerance,
    entitySpeed: params.entity_speed,
    railFriction: params.rail_friction,
  };
  spawnSkater(state);

  function tick(dt) {
    state.spawnTimer += dt;
    if (state.spawnTimer >= SPAWN_PERIOD) {
      state.spawnTimer = 0;
      spawnSkater(state);
    }

    const tolRad = state.angleTolerance * Math.PI / 180;

    for (const s of state.skaters) {
      if (s.flashTimer > 0) s.flashTimer = Math.max(0, s.flashTimer - dt);

      if (s.state === 'grinding') {
        // Apply rail friction (speed lost per second along x)
        s.vx -= Math.sign(s.vx) * state.railFriction * state.entitySpeed * dt;
        if (Math.sign(s.vx) === 0) s.vx = 0;
        s.x += s.vx * dt;
        // y locked
        if (s.x < -30 || s.x > W + 30 || Math.abs(s.vx) < 5) {
          s.dead = true;
        }
      } else {
        const prevY = s.y;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        // Check rail crossings
        for (const railY of RAIL_YS) {
          if (s.crossedRails.has(railY)) continue;
          if ((prevY <= railY && s.y >= railY) || (prevY >= railY && s.y <= railY)) {
            s.crossedRails.add(railY);
            // Angle from horizontal of velocity vector
            const speed = Math.hypot(s.vx, s.vy);
            // Angle to horizontal: |atan2(vy, vx)| then clamp to [0, pi/2]
            const angFromHoriz = Math.atan(Math.abs(s.vy) / Math.max(1, Math.abs(s.vx)));
            if (angFromHoriz <= tolRad && Math.abs(s.vx) > 30) {
              s.state = 'grinding';
              s.y = railY;
              s.vy = 0;
              s.railY = railY;
              s.flashTimer = 0.4;
              s.lastFlash = 'hit';
              break;
            } else {
              // Near-miss: flash red at the crossing point
              s.flashTimer = 0.3;
              s.lastFlash = 'miss';
            }
          }
        }
        // Off-screen despawn
        if (s.y > H + 30 || s.x < -30 || s.x > W + 30) s.dead = true;
      }
    }
    for (let i = state.skaters.length - 1; i >= 0; i--) {
      if (state.skaters[i].dead) state.skaters.splice(i, 1);
    }

    // Draw
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Rails
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 3;
    for (const y of RAIL_YS) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(W - 20, y);
      ctx.stroke();
    }
    // Tolerance legend (top-left)
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`tolerance ±${state.angleTolerance.toFixed(0)}° from horizontal`, 16, 22);

    for (const s of state.skaters) {
      let color;
      if (s.state === 'grinding') color = '#39ff14';
      else if (s.flashTimer > 0) color = s.lastFlash === 'hit' ? '#39ff14' : '#ff4444';
      else color = `hsl(${s.hue} 70% 60%)`;

      // velocity vector
      const vs = Math.hypot(s.vx, s.vy) || 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.vx / vs * 20, s.y + s.vy / vs * 20);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, R, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.angleTolerance = params.angle_tolerance;
  state.railFriction = params.rail_friction;
  // Speed retune: re-scale free skaters; grinding skaters keep their current vx (still erodes via friction)
  if (params.entity_speed !== state.entitySpeed && state.entitySpeed > 0) {
    const k = params.entity_speed / state.entitySpeed;
    for (const s of state.skaters) {
      if (s.state === 'free') { s.vx *= k; s.vy *= k; }
    }
  }
  state.entitySpeed = params.entity_speed;
}
