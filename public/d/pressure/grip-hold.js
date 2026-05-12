// Pressure: grip-hold — sustained-contact climb until stamina runs out, then release.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const WALL_X = 90;       // wall vertical line
const CLIMB_SPEED = 60;  // u/s while gripping
const FALL_GRAVITY = 500;
const FLOOR_Y = H - 30;

function spawnGrip(state) {
  state.climber = {
    x: WALL_X,
    y: FLOOR_Y,
    vx: 0,
    vy: 0,
    state: 'grip',     // 'grip' | 'fall'
    stamina: state.staminaMax,
    fallTimer: 0,
  };
}

export function init(ctx, params, env) {
  const state = {
    climber: null,
    staminaMax: params.stamina_max,
    regenRate: params.regen_rate,
    releaseVel: params.release_velocity,
  };
  spawnGrip(state);

  function tick(dt) {
    const c = state.climber;

    if (c.state === 'grip') {
      // Climb up at constant rate, drain stamina
      c.y -= CLIMB_SPEED * dt;
      c.stamina -= dt;
      if (c.y < 40) c.y = 40; // ceiling — keep climber visible, stamina still drains
      if (c.stamina <= 0) {
        c.stamina = 0;
        c.state = 'fall';
        c.vx = state.releaseVel;
        c.vy = -50; // small upward kick on release
        c.fallTimer = 0;
      }
    } else {
      // Falling: gravity + horizontal push; stamina regens
      c.vy += FALL_GRAVITY * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.fallTimer += dt;
      c.stamina = Math.min(state.staminaMax, c.stamina + state.regenRate * dt);
      // Return-to-wall condition: 2-3s fall OR off-screen
      if (c.fallTimer > 2.5 || c.y > H + 20 || c.x > W + 20) {
        c.x = WALL_X;
        c.y = FLOOR_Y;
        c.vx = 0;
        c.vy = 0;
        c.state = 'grip';
        c.stamina = state.staminaMax;
      }
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
    ctx.fillRect(WALL_X - 10, 20, 20, H - 50);
    // Floor
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, FLOOR_Y + 10, W, 4);

    // Climber sprite (square)
    ctx.fillStyle = c.state === 'grip' ? '#39ff14' : '#ff4444';
    ctx.fillRect(c.x - 8, c.y - 12, 16, 24);
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 1;
    ctx.strokeRect(c.x - 8 + 0.5, c.y - 12 + 0.5, 15, 23);

    // Stamina bar (top-left)
    const barX = WALL_X + 30, barY = 30, barW = 200, barH = 14;
    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`stamina ${c.stamina.toFixed(2)} / ${state.staminaMax.toFixed(1)} s`, barX, barY - 4);
    ctx.strokeStyle = '#e6edf3';
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
    const frac = c.stamina / Math.max(0.0001, state.staminaMax);
    ctx.fillStyle = c.state === 'grip' ? '#39ff14' : '#ff4444';
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * frac, barH - 2);

    // State label
    ctx.fillStyle = c.state === 'grip' ? '#39ff14' : '#ff4444';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(c.state === 'grip' ? 'GRIPPING' : 'RELEASED', barX, barY + 38);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.staminaMax = params.stamina_max;
  state.regenRate = params.regen_rate;
  state.releaseVel = params.release_velocity;
  // Cap current stamina so the bar can't exceed max if user lowered the cap mid-grip
  if (state.climber && state.climber.stamina > state.staminaMax) {
    state.climber.stamina = state.staminaMax;
  }
}
