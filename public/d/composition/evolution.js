// Composition: evolution — a build progresses through stages (linear or branching tree).

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const NODE_R = 22;
const PASSED = '#2a4a2a';
const CURRENT = '#39ff14';
const FUTURE = '#3a3a4a';
const EDGE = '#3a3a4a';
const ACTIVE_EDGE = '#39ff14';

function seed(state, stage_count, branching) {
  state.stage_count = stage_count;
  state.branching = branching;
  // build tree: stages 0..stage_count-1
  // linear: 1 node per stage, path = [0,0,0,...]
  // branching: stages 0 has 1 node; each subsequent stage has 2 nodes (children of the chosen path)
  state.stages = []; // per stage: array of node objs { x, y, parent: nodeIndexInPrev or -1 }
  state.path = [];   // index into each stage's array, length = current stage index + 1
  state.progress = 0; // fractional progress to next stage (0..1)
  buildStage(state, 0);
}

function buildStage(state, stageIdx) {
  // ensure stages array up to stageIdx exists with nodes
  while (state.stages.length <= stageIdx) {
    const s = state.stages.length;
    const xs = layoutX(state.stage_count, s);
    if (s === 0) {
      state.stages.push([{ x: xs, y: H / 2, parent: -1 }]);
      state.path.push(0);
    } else {
      const parentIdx = state.path[s - 1];
      if (state.branching) {
        const yA = H / 2 - 60 - s * 6;
        const yB = H / 2 + 60 + s * 6;
        state.stages.push([
          { x: xs, y: yA, parent: parentIdx },
          { x: xs, y: yB, parent: parentIdx },
        ]);
        state.path.push((Math.random() < 0.5) ? 0 : 1);
      } else {
        state.stages.push([{ x: xs, y: H / 2, parent: parentIdx }]);
        state.path.push(0);
      }
    }
  }
}

function layoutX(total, stage) {
  const margin = 80;
  return margin + (stage * (W - 2 * margin)) / Math.max(1, total - 1);
}

export function init(ctx, params, env) {
  const state = { stage_count: 0, branching: false, stages: [], path: [], progress: 0, level_speed: params.level_speed };
  seed(state, params.stage_count, !!params.branch_toggle);

  function tick(dt) {
    state.progress += state.level_speed * dt;
    while (state.progress >= 1 && state.path.length < state.stage_count) {
      state.progress -= 1;
      buildStage(state, state.path.length);
    }
    if (state.path.length >= state.stage_count) {
      // Reached final stage; pause briefly then reset
      state.progress += dt * 0.3;
      if (state.progress >= 2) {
        seed(state, state.stage_count, state.branching);
      }
    }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    const currentStageIdx = state.path.length - 1;

    // Edges first
    for (let s = 1; s < state.stages.length; s++) {
      const nodes = state.stages[s];
      const prev = state.stages[s - 1];
      const activeChild = (s <= currentStageIdx) ? state.path[s] : -1;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const p = prev[n.parent];
        const isActive = (i === activeChild);
        ctx.strokeStyle = isActive ? ACTIVE_EDGE : EDGE;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }
    }

    // Nodes
    for (let s = 0; s < state.stages.length; s++) {
      const nodes = state.stages[s];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const onPath = (s <= currentStageIdx && state.path[s] === i);
        const isCurrent = (s === currentStageIdx && onPath);
        const isPassed = (s < currentStageIdx && onPath);
        let fill;
        if (isCurrent) fill = CURRENT;
        else if (isPassed) fill = PASSED;
        else fill = FUTURE;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(n.x, n.y, NODE_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = isCurrent ? '#0d1117' : '#e6edf3';
        ctx.font = '14px ui-monospace, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`L${s + 1}`, n.x, n.y);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
    }

    // Progress bar under current node
    if (currentStageIdx >= 0 && currentStageIdx < state.stage_count - 1) {
      const cur = state.stages[currentStageIdx][state.path[currentStageIdx]];
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(cur.x - 30, cur.y + NODE_R + 8, 60, 4);
      ctx.fillStyle = CURRENT;
      ctx.fillRect(cur.x - 30, cur.y + NODE_R + 8, 60 * Math.min(1, state.progress), 4);
    }

    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`stage ${currentStageIdx + 1}/${state.stage_count}   ${state.branching ? 'branching' : 'linear'}`, 12, 22);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  const reseed = state.stage_count !== params.stage_count || state.branching !== !!params.branch_toggle;
  if (reseed) seed(state, params.stage_count, !!params.branch_toggle);
  state.level_speed = params.level_speed;
}
