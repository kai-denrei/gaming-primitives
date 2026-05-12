// Procedural: l-system — rule-rewrite a string then turtle-draw it as a tree.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const AXIOM = 'F';
const RULE = 'FF+[+F-F-F]-[-F+F+F]';   // bushy tree shape

function expand(iters) {
  let s = AXIOM;
  for (let i = 0; i < iters; i++) {
    let next = '';
    for (let k = 0; k < s.length; k++) next += (s[k] === 'F') ? RULE : s[k];
    if (next.length > 200000) return next;        // safety cap
  }
  return s;
}

function buildSegments(state) {
  const s = expand(state.iterations);
  // Heuristic step length: shrinks with iteration count so the tree fits the canvas.
  const baseStep = 220 / Math.pow(1.9, state.iterations - 1);
  const angle = state.angle_deg * Math.PI / 180;
  const stack = [];
  let x = W / 2, y = H - 10, a = -Math.PI / 2, depth = 0;
  const segs = [];
  let maxDepth = 0;

  for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if (ch === 'F') {
      const nx = x + Math.cos(a) * baseStep;
      const ny = y + Math.sin(a) * baseStep;
      segs.push({ x1: x, y1: y, x2: nx, y2: ny, depth });
      x = nx; y = ny;
    } else if (ch === '+') {
      a += angle;
    } else if (ch === '-') {
      a -= angle;
    } else if (ch === '[') {
      stack.push({ x, y, a, depth });
      depth++;
      if (depth > maxDepth) maxDepth = depth;
    } else if (ch === ']') {
      const f = stack.pop();
      x = f.x; y = f.y; a = f.a; depth = f.depth;
    }
  }
  state.segments = segs;
  state.maxDepth = Math.max(1, maxDepth);
}

export function init(ctx, params, env) {
  const state = {
    iterations: params.iterations,
    angle_deg: params.angle_deg,
    regen_interval: params.regen_interval,
    segments: [], maxDepth: 1,
    elapsed: 0, drawT: 0,
  };
  buildSegments(state);

  function tick(dt) {
    state.elapsed += dt;
    state.drawT = Math.min(1, state.drawT + dt / 1.2);
    if (state.elapsed >= state.regen_interval) {
      state.elapsed = 0;
      state.drawT = 0;
      buildSegments(state);
    }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    ctx.lineCap = 'round';
    const cutoff = Math.floor(state.segments.length * state.drawT);
    for (let i = 0; i < cutoff; i++) {
      const sg = state.segments[i];
      const depthRatio = sg.depth / state.maxDepth;
      const opacity = (0.35 + 0.65 * (1 - depthRatio)).toFixed(2);
      ctx.strokeStyle = `rgba(57, 255, 20, ${opacity})`;
      ctx.lineWidth = Math.max(0.6, 3 - sg.depth * 0.4);
      ctx.beginPath();
      ctx.moveTo(sg.x1, sg.y1);
      ctx.lineTo(sg.x2, sg.y2);
      ctx.stroke();
    }

    // HUD.
    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`iters: ${state.iterations}   angle: ${state.angle_deg.toFixed(0)}°   segs: ${state.segments.length}   regen: ${(state.regen_interval - state.elapsed).toFixed(1)}s`, 12, 22);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  const rebuild = params.iterations !== state.iterations || params.angle_deg !== state.angle_deg;
  state.iterations = params.iterations;
  state.angle_deg = params.angle_deg;
  state.regen_interval = params.regen_interval;
  if (rebuild) {
    state.drawT = 0;
    buildSegments(state);
  }
}
