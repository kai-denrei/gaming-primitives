// Pathfinding: a-star-grid — A* over a 4-connected grid; agent re-plans on arrival.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

function buildGrid(state) {
  const cs = state.cell_size;
  state.cols = Math.floor(W / cs);
  state.rows = Math.floor(H / cs);
  state.ox = (W - state.cols * cs) / 2;
  state.oy = (H - state.rows * cs) / 2;
  state.walls = new Uint8Array(state.cols * state.rows);
  for (let i = 0; i < state.walls.length; i++) {
    if (Math.random() < state.wall_density) state.walls[i] = 1;
  }
  state.start = pickOpen(state);
  state.goal  = pickOpen(state, state.start);
  state.agent = { col: state.start.col, row: state.start.row, x: 0, y: 0 };
  centerXY(state, state.agent);
  state.path = aStar(state, state.start, state.goal);
  state.pathIdx = 0;
  state.closedTint = state.lastClosed || null;
}

function idx(state, c, r) { return r * state.cols + c; }

function pickOpen(state, avoid) {
  for (let i = 0; i < 500; i++) {
    const c = Math.floor(Math.random() * state.cols);
    const r = Math.floor(Math.random() * state.rows);
    if (state.walls[idx(state, c, r)]) continue;
    if (avoid && Math.abs(c - avoid.col) + Math.abs(r - avoid.row) < 6) continue;
    return { col: c, row: r };
  }
  // Fallback: force a clear cell.
  for (let r = 0; r < state.rows; r++) for (let c = 0; c < state.cols; c++) {
    if (!state.walls[idx(state, c, r)]) return { col: c, row: r };
  }
  return { col: 0, row: 0 };
}

function centerXY(state, a) {
  a.x = state.ox + a.col * state.cell_size + state.cell_size / 2;
  a.y = state.oy + a.row * state.cell_size + state.cell_size / 2;
}

function aStar(state, start, goal) {
  const N = state.cols * state.rows;
  const g = new Float32Array(N); g.fill(Infinity);
  const f = new Float32Array(N); f.fill(Infinity);
  const cameFrom = new Int32Array(N); cameFrom.fill(-1);
  const closed = new Uint8Array(N);
  const open = [];
  const sI = idx(state, start.col, start.row);
  const gI = idx(state, goal.col, goal.row);
  g[sI] = 0;
  f[sI] = Math.abs(start.col - goal.col) + Math.abs(start.row - goal.row);
  open.push(sI);
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (open.length) {
    // Find lowest-f node (linear scan; grid is small).
    let best = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[best]]) best = i;
    const cur = open[best];
    if (cur === gI) {
      const path = [];
      let n = cur;
      while (n !== -1) {
        const r = Math.floor(n / state.cols), c = n - r * state.cols;
        path.push({ col: c, row: r });
        n = cameFrom[n];
      }
      path.reverse();
      state.lastClosed = closed;
      return path;
    }
    open[best] = open[open.length - 1]; open.pop();
    closed[cur] = 1;
    const cr = Math.floor(cur / state.cols), cc = cur - cr * state.cols;
    for (const [dc, dr] of dirs) {
      const nc = cc + dc, nr = cr + dr;
      if (nc < 0 || nc >= state.cols || nr < 0 || nr >= state.rows) continue;
      const nI = idx(state, nc, nr);
      if (state.walls[nI] || closed[nI]) continue;
      const tg = g[cur] + 1;
      if (tg < g[nI]) {
        cameFrom[nI] = cur;
        g[nI] = tg;
        f[nI] = tg + Math.abs(nc - goal.col) + Math.abs(nr - goal.row);
        if (!open.includes(nI)) open.push(nI);
      }
    }
  }
  state.lastClosed = closed;
  return null;
}

function rePlan(state) {
  state.start = { col: state.agent.col, row: state.agent.row };
  state.goal = pickOpen(state, state.start);
  state.path = aStar(state, state.start, state.goal);
  state.pathIdx = 0;
  state.closedTint = state.lastClosed;
}

export function init(ctx, params, env) {
  const state = {
    wall_density: params.wall_density,
    cell_size: params.cell_size,
    cols: 0, rows: 0, ox: 0, oy: 0,
    walls: null, start: null, goal: null, agent: null,
    path: null, pathIdx: 0, lastClosed: null, closedTint: null,
    speed: 120,
  };
  buildGrid(state);

  function tick(dt) {
    const cs = state.cell_size;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Faint visited-set tint.
    if (state.closedTint) {
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          if (state.closedTint[idx(state, c, r)]) {
            ctx.fillStyle = '#3a3a4a';
            ctx.fillRect(state.ox + c * cs, state.oy + r * cs, cs, cs);
          }
        }
      }
    }

    // Walls.
    ctx.fillStyle = '#666';
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        if (state.walls[idx(state, c, r)]) {
          ctx.fillRect(state.ox + c * cs, state.oy + r * cs, cs, cs);
        }
      }
    }

    // Grid lines.
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= state.cols; c++) {
      ctx.moveTo(state.ox + c * cs, state.oy);
      ctx.lineTo(state.ox + c * cs, state.oy + state.rows * cs);
    }
    for (let r = 0; r <= state.rows; r++) {
      ctx.moveTo(state.ox, state.oy + r * cs);
      ctx.lineTo(state.ox + state.cols * cs, state.oy + r * cs);
    }
    ctx.stroke();

    // Final path.
    if (state.path && state.path.length > 1) {
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < state.path.length; i++) {
        const n = state.path[i];
        const x = state.ox + n.col * cs + cs / 2;
        const y = state.oy + n.row * cs + cs / 2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Start & goal markers.
    function marker(cell, color) {
      const x = state.ox + cell.col * cs + cs / 2;
      const y = state.oy + cell.row * cs + cs / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, cs * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    marker(state.start, '#39ff14');
    marker(state.goal, '#ff8a00');

    // Move agent along path.
    if (state.path && state.pathIdx < state.path.length - 1) {
      const next = state.path[state.pathIdx + 1];
      const tx = state.ox + next.col * cs + cs / 2;
      const ty = state.oy + next.row * cs + cs / 2;
      const ddx = tx - state.agent.x, ddy = ty - state.agent.y;
      const d = Math.hypot(ddx, ddy);
      const step = state.speed * dt;
      if (d <= step) {
        state.agent.x = tx; state.agent.y = ty;
        state.agent.col = next.col; state.agent.row = next.row;
        state.pathIdx++;
      } else {
        state.agent.x += ddx / d * step;
        state.agent.y += ddy / d * step;
      }
    } else if (state.path) {
      rePlan(state);
    } else {
      // No path possible — pick a new goal.
      rePlan(state);
    }

    // Agent.
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.agent.x, state.agent.y, cs * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  const rebuild = params.wall_density !== state.wall_density || params.cell_size !== state.cell_size;
  state.wall_density = params.wall_density;
  state.cell_size = params.cell_size;
  if (rebuild) buildGrid(state);
}
