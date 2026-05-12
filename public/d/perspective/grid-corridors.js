// perspective/grid-corridors — first-person on a square grid. Walls drawn as
// nested rectangles per cell of forward depth. Auto-pilot picks a move on a
// fixed cadence: forward when open, otherwise turn or reverse.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
// Facings: 0=N (dy=-1), 1=E (dx=+1), 2=S (dy=+1), 3=W (dx=-1)
const DX = [ 0, 1, 0, -1 ];
const DY = [ -1, 0, 1, 0 ];

function genMaze(size, density) {
  const grid = new Uint8Array(size * size);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() < density ? 1 : 0;
  }
  // Border walls
  for (let i = 0; i < size; i++) {
    grid[i] = 1;
    grid[(size - 1) * size + i] = 1;
    grid[i * size] = 1;
    grid[i * size + (size - 1)] = 1;
  }
  // Ensure a starting cell is open and has at least one open neighbor.
  const sx = Math.floor(size / 2), sy = Math.floor(size / 2);
  grid[sy * size + sx] = 0;
  for (let f = 0; f < 4; f++) {
    grid[(sy + DY[f]) * size + (sx + DX[f])] = 0;
  }
  return grid;
}

function isWall(state, x, y) {
  if (x < 0 || y < 0 || x >= state.size || y >= state.size) return true;
  return state.grid[y * state.size + x] === 1;
}

function seed(state) {
  state.size = state.mazeSize;
  state.grid = genMaze(state.size, state.density);
  state.gx = Math.floor(state.size / 2);
  state.gy = Math.floor(state.size / 2);
  // Choose facing that's actually open.
  state.facing = 0;
  for (let f = 0; f < 4; f++) {
    if (!isWall(state, state.gx + DX[f], state.gy + DY[f])) { state.facing = f; break; }
  }
  state.moveAccum = 0;
  state.steps = 0;
}

function step(state) {
  const fx = state.gx + DX[state.facing];
  const fy = state.gy + DY[state.facing];
  const openFwd = !isWall(state, fx, fy);
  const openL   = !isWall(state, state.gx + DX[(state.facing + 3) % 4], state.gy + DY[(state.facing + 3) % 4]);
  const openR   = !isWall(state, state.gx + DX[(state.facing + 1) % 4], state.gy + DY[(state.facing + 1) % 4]);

  // Bias: prefer forward when open, else turn toward an open side, else reverse.
  const r = Math.random();
  let choice;
  if (openFwd && r < 0.75) choice = 'fwd';
  else if (openL && openR) choice = r < 0.5 ? 'left' : 'right';
  else if (openL)          choice = 'left';
  else if (openR)          choice = 'right';
  else if (openFwd)        choice = 'fwd';
  else                     choice = 'back';

  switch (choice) {
    case 'fwd':   state.gx = fx; state.gy = fy; state.steps++; break;
    case 'left':  state.facing = (state.facing + 3) % 4; break;
    case 'right': state.facing = (state.facing + 1) % 4; break;
    case 'back':  state.facing = (state.facing + 2) % 4; break;
  }
}

// Depth-d nested rectangle bounds. Power < 1 keeps the recession from
// collapsing too fast — far rect stays visible.
function depthRect(d) {
  const k = 1 / Math.pow(d + 1, 0.6);
  const xl = W / 2 - (W / 2) * k;
  const xr = W - xl;
  const yt = H / 2 - (H / 2) * k;
  const yb = H - yt;
  return { xl, xr, yt, yb };
}

export function init(ctx, params, env) {
  const state = {
    mazeSize:    params.maze_size,
    density:     params.wall_density,
    moveInterval: params.move_interval,
    drawDistance: params.draw_distance,
  };
  seed(state);

  function tick(dt) {
    state.moveAccum += dt;
    while (state.moveAccum >= state.moveInterval) {
      state.moveAccum -= state.moveInterval;
      step(state);
    }

    // === Render ===
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Floor / ceiling subtle bands
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#1e2632');
    grd.addColorStop(0.5, '#0d1117');
    grd.addColorStop(1, '#161b22');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    const lookL = (state.facing + 3) % 4;
    const lookR = (state.facing + 1) % 4;

    // Walk forward d=0..drawDistance, drawing left/right wall quads when adjacent
    // cell to the side is a wall, and a far-wall slab when the forward cell is blocked.
    let stoppedAt = state.drawDistance;
    for (let d = 0; d < state.drawDistance; d++) {
      const cx = state.gx + DX[state.facing] * d;
      const cy = state.gy + DY[state.facing] * d;
      if (isWall(state, cx, cy)) { stoppedAt = d; break; }
    }

    const farRect = depthRect(stoppedAt);
    // Far wall slab
    ctx.fillStyle = '#161d28';
    ctx.fillRect(farRect.xl, farRect.yt, farRect.xr - farRect.xl, farRect.yb - farRect.yt);
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(farRect.xl + 0.5, farRect.yt + 0.5, farRect.xr - farRect.xl - 1, farRect.yb - farRect.yt - 1);

    // Side wall quads for each depth from far→near so near overdraws far.
    for (let d = stoppedAt - 1; d >= 0; d--) {
      const near = depthRect(d);
      const far  = depthRect(d + 1);
      const cx = state.gx + DX[state.facing] * d;
      const cy = state.gy + DY[state.facing] * d;

      // Left side wall?
      const lx = cx + DX[lookL], ly = cy + DY[lookL];
      if (isWall(state, lx, ly)) {
        ctx.fillStyle = '#1b232f';
        ctx.beginPath();
        ctx.moveTo(near.xl, near.yt);
        ctx.lineTo(far.xl,  far.yt);
        ctx.lineTo(far.xl,  far.yb);
        ctx.lineTo(near.xl, near.yb);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#e6edf3';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      // Right side wall?
      const rx = cx + DX[lookR], ry = cy + DY[lookR];
      if (isWall(state, rx, ry)) {
        ctx.fillStyle = '#1b232f';
        ctx.beginPath();
        ctx.moveTo(near.xr, near.yt);
        ctx.lineTo(far.xr,  far.yt);
        ctx.lineTo(far.xr,  far.yb);
        ctx.lineTo(near.xr, near.yb);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#e6edf3';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // Minimap
    const mmCell = 6;
    const mmW = state.size * mmCell;
    const mmX = W - mmW - 12, mmY = 12;
    ctx.fillStyle = 'rgba(13,17,23,0.85)';
    ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmW + 4);
    for (let y = 0; y < state.size; y++) {
      for (let x = 0; x < state.size; x++) {
        if (state.grid[y * state.size + x]) {
          ctx.fillStyle = '#3a4555';
          ctx.fillRect(mmX + x * mmCell, mmY + y * mmCell, mmCell - 1, mmCell - 1);
        }
      }
    }
    // Player marker
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(mmX + state.gx * mmCell, mmY + state.gy * mmCell, mmCell - 1, mmCell - 1);
    // Facing tick
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const pcx = mmX + state.gx * mmCell + mmCell / 2;
    const pcy = mmY + state.gy * mmCell + mmCell / 2;
    ctx.moveTo(pcx, pcy);
    ctx.lineTo(pcx + DX[state.facing] * mmCell * 1.5, pcy + DY[state.facing] * mmCell * 1.5);
    ctx.stroke();

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${state.size}×${state.size}  ·  steps ${state.steps}  ·  facing ${'NESW'[state.facing]}`, 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Structural: maze_size and wall_density → re-seed.
  if (params.maze_size !== state.mazeSize || params.wall_density !== state.density) {
    state.mazeSize = params.maze_size;
    state.density  = params.wall_density;
    seed(state);
  }
  state.moveInterval = params.move_interval;
  state.drawDistance = params.draw_distance;
}
