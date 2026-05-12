// Motion: click-to-move — pick random destination periodically; walk toward it at constant speed.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const MARGIN = 30;
const R = 10;

function pickDest(state) {
  state.destX = MARGIN + Math.random() * (W - 2 * MARGIN);
  state.destY = MARGIN + Math.random() * (H - 2 * MARGIN);
  state.startX = state.x;
  state.startY = state.y;
}

export function init(ctx, params, env) {
  const state = {
    x: W / 2, y: H / 2,
    destX: W / 2, destY: H / 2,
    startX: W / 2, startY: H / 2,
    speed: params.move_speed,
    period: params.destination_change_period,
    sincePick: Infinity, // force pick on first tick
  };

  function tick(dt) {
    state.sincePick += dt;
    if (state.sincePick >= state.period) {
      state.sincePick = 0;
      pickDest(state);
    }

    const dx = state.destX - state.x;
    const dy = state.destY - state.y;
    const d = Math.hypot(dx, dy);
    if (d > 1) {
      const step = Math.min(d, state.speed * dt);
      state.x += (dx / d) * step;
      state.y += (dy / d) * step;
    }

    // Render
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Path line from start to destination
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.25)';
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(state.startX, state.startY);
    ctx.lineTo(state.destX, state.destY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Waypoint X marker
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    const m = 7;
    ctx.beginPath();
    ctx.moveTo(state.destX - m, state.destY - m);
    ctx.lineTo(state.destX + m, state.destY + m);
    ctx.moveTo(state.destX + m, state.destY - m);
    ctx.lineTo(state.destX - m, state.destY + m);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Player
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(state.x, state.y, R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.speed = params.move_speed;
  state.period = params.destination_change_period;
}
