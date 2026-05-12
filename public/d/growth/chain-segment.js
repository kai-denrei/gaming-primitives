// Growth: chain-segment — Snake on a grid. Auto-pilot head turns toward
// nearest food but never reverses into its neck. Self-collision or wall hit
// resets the run.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

const DIRS = [
  { dx:  1, dy:  0 },
  { dx: -1, dy:  0 },
  { dx:  0, dy:  1 },
  { dx:  0, dy: -1 },
];

function spawnFood(state) {
  // Place on a free cell (not on snake body)
  const occ = new Set(state.snake.map(s => `${s.x},${s.y}`));
  for (const f of state.food) occ.add(`${f.x},${f.y}`);
  let tries = 0;
  while (tries++ < 200) {
    const x = Math.floor(Math.random() * state.cols);
    const y = Math.floor(Math.random() * state.rows);
    if (!occ.has(`${x},${y}`)) {
      state.food.push({ x, y });
      return;
    }
  }
}

function seed(state) {
  // Compute rows from grid_size (cols) preserving aspect ratio of canvas.
  state.cols = state.gridSize;
  state.cell = Math.floor(W / state.cols);
  state.rows = Math.max(8, Math.floor(H / state.cell));
  // Recompute cell so the grid is integer and fills nicely.
  state.cell = Math.min(Math.floor(W / state.cols), Math.floor(H / state.rows));
  state.offsetX = Math.floor((W - state.cell * state.cols) / 2);
  state.offsetY = Math.floor((H - state.cell * state.rows) / 2);

  const cx = Math.floor(state.cols / 2);
  const cy = Math.floor(state.rows / 2);
  state.snake = [
    { x: cx,     y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  state.dir = { dx: 1, dy: 0 };
  state.pendingGrowth = 0;
  state.food = [];
  for (let i = 0; i < state.foodCount; i++) spawnFood(state);
  state.stepAccum = 0;
  state.deathFlashT = 0;
  state.length = state.snake.length;
}

function nearestFood(state) {
  const head = state.snake[0];
  let best = null, bestD = Infinity;
  for (const f of state.food) {
    const d = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
}

function chooseDir(state) {
  const head = state.snake[0];
  const neck = state.snake[1];
  const food = nearestFood(state);
  // Score each non-reversing direction. Prefer reducing distance to food,
  // penalize hitting body or wall on next step.
  let best = state.dir, bestScore = -Infinity;
  for (const d of DIRS) {
    // Reverse check: not into the cell of neck
    if (neck && head.x + d.dx === neck.x && head.y + d.dy === neck.y) continue;
    const nx = head.x + d.dx, ny = head.y + d.dy;
    // Wall = bad but allowed if no other choice; very low score
    let score = 0;
    if (nx < 0 || nx >= state.cols || ny < 0 || ny >= state.rows) score -= 1000;
    // Body collision (skip tail-tip, which is about to vacate, unless growth pending)
    const bodyN = state.pendingGrowth > 0 ? state.snake.length : state.snake.length - 1;
    for (let i = 0; i < bodyN; i++) {
      const s = state.snake[i];
      if (s.x === nx && s.y === ny) { score -= 500; break; }
    }
    // Food-distance: smaller distance = better
    if (food) {
      const dist = Math.abs(food.x - nx) + Math.abs(food.y - ny);
      score += -dist;
    }
    // Tiny inertia bonus to prefer keeping direction in ties
    if (d === state.dir) score += 0.1;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

function reset(state) {
  state.deathFlashT = 0.4;
  // Preserve high-score tracking
  state.bestLength = Math.max(state.bestLength ?? 3, state.length);
  // Re-seed snake at center but keep settings
  const cx = Math.floor(state.cols / 2);
  const cy = Math.floor(state.rows / 2);
  state.snake = [
    { x: cx,     y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  state.dir = { dx: 1, dy: 0 };
  state.pendingGrowth = 0;
  state.length = 3;
}

function step(state) {
  state.dir = chooseDir(state);
  const head = state.snake[0];
  const nx = head.x + state.dir.dx;
  const ny = head.y + state.dir.dy;

  // Wall hit
  if (nx < 0 || nx >= state.cols || ny < 0 || ny >= state.rows) {
    reset(state);
    return;
  }
  // Self hit (excluding tail-tip when not growing)
  const bodyN = state.pendingGrowth > 0 ? state.snake.length : state.snake.length - 1;
  for (let i = 0; i < bodyN; i++) {
    const s = state.snake[i];
    if (s.x === nx && s.y === ny) { reset(state); return; }
  }

  // Advance
  state.snake.unshift({ x: nx, y: ny });
  if (state.pendingGrowth > 0) {
    state.pendingGrowth--;
  } else {
    state.snake.pop();
  }
  state.length = state.snake.length;

  // Eat food
  for (let i = state.food.length - 1; i >= 0; i--) {
    if (state.food[i].x === nx && state.food[i].y === ny) {
      state.food.splice(i, 1);
      state.pendingGrowth += state.growthPerFood;
    }
  }
  while (state.food.length < state.foodCount) spawnFood(state);
}

export function init(ctx, params, env) {
  const state = {
    gridSize: params.grid_size,
    speed: params.speed,
    growthPerFood: params.growth_per_food,
    foodCount: params.food_count,
    bestLength: 3,
  };
  seed(state);

  function tick(dt) {
    if (state.deathFlashT > 0) state.deathFlashT -= dt;

    state.stepAccum += dt;
    const period = 1 / state.speed;
    while (state.stepAccum >= period) {
      state.stepAccum -= period;
      step(state);
    }

    // === Render ===
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Grid border
    ctx.strokeStyle = '#2a2a3a';
    const gw = state.cell * state.cols;
    const gh = state.cell * state.rows;
    ctx.strokeRect(state.offsetX + 0.5, state.offsetY + 0.5, gw - 1, gh - 1);

    // Faint cell grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < state.cols; i++) {
      const x = state.offsetX + i * state.cell + 0.5;
      ctx.moveTo(x, state.offsetY);
      ctx.lineTo(x, state.offsetY + gh);
    }
    for (let j = 1; j < state.rows; j++) {
      const y = state.offsetY + j * state.cell + 0.5;
      ctx.moveTo(state.offsetX, y);
      ctx.lineTo(state.offsetX + gw, y);
    }
    ctx.stroke();

    // Food
    ctx.fillStyle = '#ff4444';
    for (const f of state.food) {
      const x = state.offsetX + f.x * state.cell;
      const y = state.offsetY + f.y * state.cell;
      ctx.beginPath();
      ctx.arc(x + state.cell / 2, y + state.cell / 2, state.cell * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snake body — gradient from head to tail
    const n = state.snake.length;
    for (let i = n - 1; i >= 0; i--) {
      const s = state.snake[i];
      const x = state.offsetX + s.x * state.cell;
      const y = state.offsetY + s.y * state.cell;
      if (i === 0) {
        ctx.fillStyle = '#39ff14';
      } else {
        // Body fades from green to teal toward the tail
        const t = i / Math.max(1, n - 1);
        const hue = 140 + t * 60;
        const light = 55 - t * 20;
        ctx.fillStyle = `hsl(${hue}, 70%, ${light}%)`;
      }
      ctx.fillRect(x + 1, y + 1, state.cell - 2, state.cell - 2);
    }

    // Death flash
    if (state.deathFlashT > 0) {
      ctx.fillStyle = `rgba(255, 68, 68, ${state.deathFlashT})`;
      ctx.fillRect(state.offsetX, state.offsetY, gw, gh);
    }

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`length ${state.length}  ·  best ${state.bestLength}  ·  ${state.cols}×${state.rows}`, 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // grid_size is structural; food_count and growth_per_food are live; speed is live.
  if (params.grid_size !== state.gridSize) {
    state.gridSize = params.grid_size;
    state.speed = params.speed;
    state.growthPerFood = params.growth_per_food;
    state.foodCount = params.food_count;
    seed(state);
    return;
  }
  state.speed = params.speed;
  state.growthPerFood = params.growth_per_food;
  if (params.food_count !== state.foodCount) {
    state.foodCount = params.food_count;
    while (state.food.length < state.foodCount) spawnFood(state);
    while (state.food.length > state.foodCount) state.food.pop();
  }
}
