// Information asymmetry: los-reveal — ray-cast cone visibility recomputed per frame.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const COLS = 40, ROWS = 22;
const TILE = W / COLS; // 20px
const MARGIN_Y = (H - ROWS * TILE) / 2;
const RAY_COUNT = 60;

function seedWorld(state) {
  state.walls = new Uint8Array(COLS * ROWS);
  state.decor = new Array(COLS * ROWS);
  for (let i = 0; i < COLS * ROWS; i++) {
    if (Math.random() < state.wall_density) state.walls[i] = 1;
    state.decor[i] = (Math.random() < 0.22) ? ((Math.random() * 360) | 0) : -1;
  }
  // Clear a spawn pocket so the viewer is never inside a wall.
  state.viewer = { x: W / 2, y: MARGIN_Y + ROWS * TILE / 2, heading: 0 };
  const cx = Math.floor(state.viewer.x / TILE);
  const cy = Math.floor((state.viewer.y - MARGIN_Y) / TILE);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const c = cx + dx, r = cy + dy;
    if (c >= 0 && c < COLS && r >= 0 && r < ROWS) state.walls[r * COLS + c] = 0;
  }
  state.target = { ...state.viewer };
  pickTarget(state);
}

function pickTarget(state) {
  for (let tries = 0; tries < 20; tries++) {
    const x = 20 + Math.random() * (W - 40);
    const y = MARGIN_Y + 20 + Math.random() * (ROWS * TILE - 40);
    const c = Math.floor(x / TILE), r = Math.floor((y - MARGIN_Y) / TILE);
    if (state.walls[r * COLS + c] === 0) { state.target = { x, y }; return; }
  }
}

export function init(ctx, params, env) {
  const state = {
    wall_density: params.wall_density,
    viewer_speed: params.viewer_speed,
    cone_angle: params.cone_angle,
    walls: null, decor: null,
    viewer: { x: W / 2, y: H / 2, heading: 0 },
    target: { x: W / 2, y: H / 2 },
    visible: new Uint8Array(COLS * ROWS),
  };
  seedWorld(state);

  function tick(dt) {
    // Move viewer toward target.
    const v = state.viewer;
    const dx = state.target.x - v.x, dy = state.target.y - v.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) pickTarget(state);
    else {
      v.heading = Math.atan2(dy, dx);
      v.x += (dx / dist) * state.viewer_speed * dt;
      v.y += (dy / dist) * state.viewer_speed * dt;
    }

    // Recompute visibility cone.
    state.visible.fill(0);
    const halfRad = (state.cone_angle * Math.PI / 180) / 2;
    const maxDist = Math.max(W, H);
    const step = TILE * 0.5;
    for (let i = 0; i < RAY_COUNT; i++) {
      const a = v.heading - halfRad + (i / (RAY_COUNT - 1)) * (halfRad * 2);
      const cos = Math.cos(a), sin = Math.sin(a);
      for (let d = 0; d < maxDist; d += step) {
        const px = v.x + cos * d, py = v.y + sin * d;
        const c = Math.floor(px / TILE);
        const r = Math.floor((py - MARGIN_Y) / TILE);
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) break;
        const idx = r * COLS + c;
        state.visible[idx] = 1;
        if (state.walls[idx]) break;
      }
    }

    // Draw.
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const x = c * TILE, y = MARGIN_Y + r * TILE;
        const vis = state.visible[idx];
        if (state.walls[idx]) {
          ctx.fillStyle = vis ? '#666' : '#444';
          ctx.fillRect(x, y, TILE, TILE);
        } else if (vis) {
          ctx.fillStyle = '#1a3a1a';
          ctx.fillRect(x, y, TILE, TILE);
          if (state.decor[idx] >= 0) {
            ctx.fillStyle = `hsl(${state.decor[idx]} 70% 55%)`;
            ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
          }
        }
      }
    }

    // Grid lines (subtle).
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

    // Cone outline.
    ctx.strokeStyle = '#39ff1466';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(v.x, v.y);
    ctx.lineTo(v.x + Math.cos(v.heading - halfRad) * 80, v.y + Math.sin(v.heading - halfRad) * 80);
    ctx.moveTo(v.x, v.y);
    ctx.lineTo(v.x + Math.cos(v.heading + halfRad) * 80, v.y + Math.sin(v.heading + halfRad) * 80);
    ctx.stroke();

    // Viewer.
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(v.x, v.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`density:${state.wall_density.toFixed(2)}  cone:${state.cone_angle|0}°  speed:${state.viewer_speed|0}`, 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  const reseed = state.wall_density !== params.wall_density;
  state.wall_density = params.wall_density;
  state.viewer_speed = params.viewer_speed;
  state.cone_angle = params.cone_angle;
  if (reseed) seedWorld(state);
}
