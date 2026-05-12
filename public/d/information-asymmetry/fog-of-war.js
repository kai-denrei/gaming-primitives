// Information asymmetry: fog-of-war — tile grid with three knowledge states tracked per cell.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const COLS = 40, ROWS = 22;
const TILE = W / COLS; // 20px
const MARGIN_Y = (H - ROWS * TILE) / 2;

const UNEXPLORED = 0, EXPLORED = 1, VISIBLE = 2;

function seedAgents(state, count) {
  state.agents = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    state.agents.push({
      x: 40 + Math.random() * (W - 80),
      y: MARGIN_Y + 20 + Math.random() * (ROWS * TILE - 40),
      vx: Math.cos(angle), vy: Math.sin(angle),
      hue: (i * 67) % 360,
    });
  }
}

function seedContent(state) {
  // Static colored decorations per cell, revealed once visible.
  state.content = new Array(COLS * ROWS);
  for (let i = 0; i < COLS * ROWS; i++) {
    state.content[i] = (Math.random() < 0.18) ? ((Math.random() * 360) | 0) : -1;
  }
}

export function init(ctx, params, env) {
  const state = {
    viewer_radius: params.viewer_radius,
    agent_count: params.agent_count,
    agent_speed: params.agent_speed,
    tiles: new Uint8Array(COLS * ROWS),
    agents: [],
    content: [],
  };
  seedContent(state);
  seedAgents(state, params.agent_count);

  function tick(dt) {
    // Move agents — bounce off bounds, occasional jitter.
    for (const a of state.agents) {
      a.x += a.vx * state.agent_speed * dt;
      a.y += a.vy * state.agent_speed * dt;
      if (a.x < 10 || a.x > W - 10) { a.vx = -a.vx; a.x = Math.max(10, Math.min(W - 10, a.x)); }
      if (a.y < MARGIN_Y + 10 || a.y > MARGIN_Y + ROWS * TILE - 10) {
        a.vy = -a.vy;
        a.y = Math.max(MARGIN_Y + 10, Math.min(MARGIN_Y + ROWS * TILE - 10, a.y));
      }
      if (Math.random() < 0.02) {
        const t = Math.random() * Math.PI * 2;
        a.vx = Math.cos(t); a.vy = Math.sin(t);
      }
    }

    // Demote visible → explored.
    for (let i = 0; i < state.tiles.length; i++) {
      if (state.tiles[i] === VISIBLE) state.tiles[i] = EXPLORED;
    }

    // Mark tiles within viewer_radius of any agent as visible.
    const r2 = state.viewer_radius * state.viewer_radius;
    for (const a of state.agents) {
      const cMin = Math.max(0, Math.floor((a.x - state.viewer_radius) / TILE));
      const cMax = Math.min(COLS - 1, Math.floor((a.x + state.viewer_radius) / TILE));
      const rMin = Math.max(0, Math.floor((a.y - MARGIN_Y - state.viewer_radius) / TILE));
      const rMax = Math.min(ROWS - 1, Math.floor((a.y - MARGIN_Y + state.viewer_radius) / TILE));
      for (let r = rMin; r <= rMax; r++) {
        for (let c = cMin; c <= cMax; c++) {
          const cx = c * TILE + TILE / 2;
          const cy = MARGIN_Y + r * TILE + TILE / 2;
          const dx = cx - a.x, dy = cy - a.y;
          if (dx * dx + dy * dy <= r2) state.tiles[r * COLS + c] = VISIBLE;
        }
      }
    }

    // Draw.
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const t = state.tiles[idx];
        const x = c * TILE, y = MARGIN_Y + r * TILE;
        if (t === UNEXPLORED) {
          ctx.fillStyle = '#0d1117';
        } else if (t === EXPLORED) {
          ctx.fillStyle = '#2a2a3a';
        } else {
          ctx.fillStyle = '#3a3a4a';
        }
        ctx.fillRect(x, y, TILE, TILE);
        if (t === VISIBLE && state.content[idx] >= 0) {
          ctx.fillStyle = `hsl(${state.content[idx]} 65% 55%)`;
          ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
        }
      }
    }

    // Grid lines.
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= COLS; c++) {
      ctx.moveTo(c * TILE + 0.5, MARGIN_Y);
      ctx.lineTo(c * TILE + 0.5, MARGIN_Y + ROWS * TILE);
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.moveTo(0, MARGIN_Y + r * TILE + 0.5);
      ctx.lineTo(W, MARGIN_Y + r * TILE + 0.5);
    }
    ctx.stroke();

    // Agents.
    for (const a of state.agents) {
      ctx.fillStyle = '#39ff14';
      ctx.beginPath();
      ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD.
    let explored = 0, visible = 0;
    for (let i = 0; i < state.tiles.length; i++) {
      if (state.tiles[i] === EXPLORED) explored++;
      else if (state.tiles[i] === VISIBLE) visible++;
    }
    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`agents:${state.agents.length}  radius:${state.viewer_radius|0}  visible:${visible}  explored:${explored}`, 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.viewer_radius = params.viewer_radius;
  state.agent_speed = params.agent_speed;
  if (state.agent_count !== params.agent_count) {
    state.agent_count = params.agent_count;
    seedAgents(state, params.agent_count);
  }
}
