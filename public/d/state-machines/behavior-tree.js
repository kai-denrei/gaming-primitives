// State-machines: behavior-tree — selector/sequence walk with live highlight.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

// --- Tree construction ----------------------------------------------------
// depth 2 = root selector with 2 leaves; depth 3 adds a sequence; depth 4 adds nested branches.
function buildTree(depth) {
  if (depth <= 2) {
    return {
      type: 'selector', label: 'root',
      children: [
        { type: 'leaf', label: 'check enemy', action: 'check_enemy' },
        { type: 'leaf', label: 'patrol',      action: 'patrol' },
      ],
    };
  }
  if (depth === 3) {
    return {
      type: 'selector', label: 'root',
      children: [
        { type: 'sequence', label: 'engage', children: [
          { type: 'leaf', label: 'check enemy', action: 'check_enemy' },
          { type: 'leaf', label: 'move to',     action: 'move_to_enemy' },
        ]},
        { type: 'leaf', label: 'patrol', action: 'patrol' },
      ],
    };
  }
  // depth >= 4
  return {
    type: 'selector', label: 'root',
    children: [
      { type: 'sequence', label: 'engage', children: [
        { type: 'leaf', label: 'enemy near', action: 'check_enemy' },
        { type: 'leaf', label: 'chase',      action: 'move_to_enemy' },
      ]},
      { type: 'sequence', label: 'rest', children: [
        { type: 'leaf', label: 'low energy', action: 'check_tired' },
        { type: 'leaf', label: 'wait',       action: 'wait' },
      ]},
      { type: 'leaf', label: 'patrol', action: 'patrol' },
    ],
  };
}

// Assign layout coords by recursive midpoint.
function layout(node, x0, x1, y, dy) {
  node.x = (x0 + x1) / 2; node.y = y;
  if (!node.children) return;
  const n = node.children.length;
  const slice = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    layout(node.children[i], x0 + slice * i, x0 + slice * (i + 1), y + dy, dy);
  }
}

// --- Tree evaluation with path tracking ----------------------------------
function evalNode(node, ctxBT, path) {
  path.push(node);
  if (node.type === 'leaf') {
    const ok = ctxBT.actions[node.action](ctxBT);
    return ok;
  }
  if (node.type === 'selector') {
    for (const c of node.children) {
      if (evalNode(c, ctxBT, path)) return true;
    }
    return false;
  }
  if (node.type === 'sequence') {
    for (const c of node.children) {
      if (!evalNode(c, ctxBT, path)) return false;
    }
    return true;
  }
  return false;
}

// --- Agent actions --------------------------------------------------------
function makeActions(state) {
  return {
    check_enemy: () => Math.hypot(state.enemy.x - state.agent.x, state.enemy.y - state.agent.y) < 180,
    move_to_enemy: () => { state.agent.target = { x: state.enemy.x, y: state.enemy.y }; return true; },
    check_tired: () => state.agent.energy < 0.3,
    wait:        () => { state.agent.target = null; state.agent.energy = Math.min(1, state.agent.energy + 0.4); return true; },
    patrol:      () => {
      if (!state.agent.target || Math.hypot(state.agent.target.x - state.agent.x, state.agent.target.y - state.agent.y) < 20) {
        state.agent.target = { x: 80 + Math.random() * 240, y: 60 + Math.random() * 240 };
      }
      return true;
    },
  };
}

// --- Drawing --------------------------------------------------------------
function drawTree(ctx, node, activeSet) {
  if (node.children) {
    for (const c of node.children) {
      const live = activeSet.has(node) && activeSet.has(c);
      ctx.strokeStyle = live ? '#39ff14' : '#374151';
      ctx.lineWidth = live ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(node.x, node.y + 12); ctx.lineTo(c.x, c.y - 12); ctx.stroke();
      drawTree(ctx, c, activeSet);
    }
  }
  const w = Math.max(56, node.label.length * 7 + 14), h = 22;
  const live = activeSet.has(node);
  ctx.fillStyle = live ? 'rgba(57,255,20,0.18)' : '#1f2937';
  ctx.fillRect(node.x - w / 2, node.y - h / 2, w, h);
  ctx.strokeStyle = live ? '#39ff14' : '#4b5563';
  ctx.lineWidth = live ? 2 : 1;
  ctx.strokeRect(node.x - w / 2 + 0.5, node.y - h / 2 + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#e6edf3';
  ctx.font = '10px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(node.label, node.x, node.y);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

export function init(ctx, params, env) {
  const state = {
    tree_depth: params.tree_depth,
    tick_interval: params.tick_interval,
    timer: 0,
    agent: { x: 200, y: 200, target: null, energy: 1 },
    enemy: { x: 250, y: 250, dir: Math.random() * Math.PI * 2 },
    tree: null,
    activePath: new Set(),
  };
  state.tree = buildTree(state.tree_depth);
  layout(state.tree, 380, W - 24, 40, 80);
  const actions = makeActions(state);

  function tick(dt) {
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

    // Move enemy on a slow wander so check_enemy actually flips.
    state.enemy.dir += (Math.random() - 0.5) * dt * 1.2;
    state.enemy.x += Math.cos(state.enemy.dir) * 60 * dt;
    state.enemy.y += Math.sin(state.enemy.dir) * 60 * dt;
    if (state.enemy.x < 40 || state.enemy.x > 360) state.enemy.dir = Math.PI - state.enemy.dir;
    if (state.enemy.y < 40 || state.enemy.y > 360) state.enemy.dir = -state.enemy.dir;
    state.enemy.x = Math.max(40, Math.min(360, state.enemy.x));
    state.enemy.y = Math.max(40, Math.min(360, state.enemy.y));

    // Drift energy down each frame.
    state.agent.energy = Math.max(0, state.agent.energy - dt * 0.06);

    // Eval tree on tick.
    state.timer += dt;
    if (state.timer >= state.tick_interval) {
      state.timer = 0;
      const path = [];
      evalNode(state.tree, { state, actions }, path);
      state.activePath = new Set(path);
    }

    // Move agent toward target.
    if (state.agent.target) {
      const dx = state.agent.target.x - state.agent.x, dy = state.agent.target.y - state.agent.y;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        const spd = 80;
        state.agent.x += dx / d * spd * dt;
        state.agent.y += dy / d * spd * dt;
      }
    }

    // World pane (left)
    ctx.strokeStyle = '#1f2937';
    ctx.strokeRect(20.5, 20.5, 350, 340);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(state.enemy.x, state.enemy.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#58a6ff';
    ctx.beginPath(); ctx.arc(state.agent.x, state.agent.y, 9, 0, Math.PI * 2); ctx.fill();
    // Energy bar
    ctx.fillStyle = '#1f2937'; ctx.fillRect(40, 380, 200, 10);
    ctx.fillStyle = '#10b981'; ctx.fillRect(40, 380, 200 * state.agent.energy, 10);
    ctx.fillStyle = '#e6edf3'; ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('energy', 40, 376);

    // Tree pane (right)
    drawTree(ctx, state.tree, state.activePath);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.tick_interval = params.tick_interval;
  if (params.tree_depth !== state.tree_depth) {
    state.tree_depth = params.tree_depth;
    state.tree = buildTree(state.tree_depth);
    layout(state.tree, 380, W - 24, 40, 80);
    state.activePath = new Set();
  }
}
