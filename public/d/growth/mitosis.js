// Growth: mitosis — periodic split of largest blob into two halves with
// opposing momentum; halves pursue ambient prey, then drift back to merge
// after a timer expires. Mass conserved on split and merge.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SPLIT_MIN_RATIO = 1.5;   // only blobs ≥ start_size × 1.5 may split

function areaOf(r) { return Math.PI * r * r; }
function radiusFromArea(a) { return Math.sqrt(Math.max(0.0001, a) / Math.PI); }

let nextId = 1;
function spawnPrey(state) {
  const r = 3 + Math.random() * 6;
  const ang = Math.random() * Math.PI * 2;
  state.prey.push({
    x: 20 + Math.random() * (W - 40),
    y: 20 + Math.random() * (H - 40),
    vx: Math.cos(ang) * 20,
    vy: Math.sin(ang) * 20,
    r,
  });
}

function seed(state) {
  state.blobs = [{
    id: nextId++,
    x: W / 2, y: H / 2,
    vx: 0, vy: 0,
    r: state.startSize,
    mergeTimer: 0,    // 0 = ready to split / not waiting to merge
    sibling: null,
  }];
  state.prey = [];
  for (let i = 0; i < 18; i++) spawnPrey(state);
  state.splitTimer = state.autoSplitInterval;
}

export function init(ctx, params, env) {
  const state = {
    startSize: params.start_size,
    splitVelocity: params.split_velocity,
    mergeTimer: params.merge_timer,
    autoSplitInterval: params.auto_split_interval,
  };
  seed(state);

  function trySplit() {
    // Pick the largest blob that's above threshold AND not currently waiting to merge.
    let target = null;
    for (const b of state.blobs) {
      if (b.r < state.startSize * SPLIT_MIN_RATIO) continue;
      if (b.mergeTimer > 0) continue;
      if (!target || b.r > target.r) target = b;
    }
    if (!target) return;

    const newArea = areaOf(target.r) * 0.5;
    const newR = radiusFromArea(newArea);
    const ang = Math.random() * Math.PI * 2;
    const dx = Math.cos(ang), dy = Math.sin(ang);

    const half1 = {
      id: nextId++,
      x: target.x + dx * (newR + 2),
      y: target.y + dy * (newR + 2),
      vx: target.vx + dx * state.splitVelocity,
      vy: target.vy + dy * state.splitVelocity,
      r: newR,
      mergeTimer: state.mergeTimer,
      sibling: null,
    };
    const half2 = {
      id: nextId++,
      x: target.x - dx * (newR + 2),
      y: target.y - dy * (newR + 2),
      vx: target.vx - dx * state.splitVelocity,
      vy: target.vy - dy * state.splitVelocity,
      r: newR,
      mergeTimer: state.mergeTimer,
      sibling: null,
    };
    half1.sibling = half2.id;
    half2.sibling = half1.id;

    // Replace original with the two halves
    const idx = state.blobs.indexOf(target);
    state.blobs.splice(idx, 1, half1, half2);
  }

  function tick(dt) {
    // Periodic split
    state.splitTimer -= dt;
    if (state.splitTimer <= 0) {
      trySplit();
      state.splitTimer = state.autoSplitInterval;
    }

    // Behavior per blob
    for (const b of state.blobs) {
      // Decrement merge timer
      if (b.mergeTimer > 0) b.mergeTimer = Math.max(0, b.mergeTimer - dt);

      // Find nearest absorbable prey (also: can absorb expelled or smaller blobs)
      let target = null, bestD = Infinity;
      for (const q of state.prey) {
        const d = Math.hypot(q.x - b.x, q.y - b.y);
        if (d < bestD) { bestD = d; target = q; }
      }

      // If merge timer expired, prefer drifting toward sibling
      let sibling = null;
      if (b.mergeTimer <= 0 && b.sibling != null) {
        sibling = state.blobs.find(x => x.id === b.sibling) || null;
      }

      const speed = 70;
      let goalX = 0, goalY = 0;
      if (sibling) {
        const dx = sibling.x - b.x, dy = sibling.y - b.y;
        const d = Math.hypot(dx, dy) || 1;
        goalX = dx / d * speed;
        goalY = dy / d * speed;
      } else if (target) {
        const dx = target.x - b.x, dy = target.y - b.y;
        const d = Math.hypot(dx, dy) || 1;
        goalX = dx / d * speed;
        goalY = dy / d * speed;
      }
      // Blend toward goal
      b.vx += (goalX - b.vx) * Math.min(1, dt * 1.8);
      b.vy += (goalY - b.vy) * Math.min(1, dt * 1.8);

      // Integrate
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // Wall bounce
      if (b.x < b.r)     { b.x = b.r;     b.vx = Math.abs(b.vx) * 0.5; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.5; }
      if (b.y < b.r)     { b.y = b.r;     b.vy = Math.abs(b.vy) * 0.5; }
      if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.5; }
    }

    // Prey drift
    for (const q of state.prey) {
      q.vx += (Math.random() - 0.5) * 30 * dt;
      q.vy += (Math.random() - 0.5) * 30 * dt;
      const sp = Math.hypot(q.vx, q.vy);
      if (sp > 35) { q.vx *= 35 / sp; q.vy *= 35 / sp; }
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.x < q.r)     { q.x = q.r;     q.vx = -q.vx; }
      if (q.x > W - q.r) { q.x = W - q.r; q.vx = -q.vx; }
      if (q.y < q.r)     { q.y = q.r;     q.vy = -q.vy; }
      if (q.y > H - q.r) { q.y = H - q.r; q.vy = -q.vy; }
    }

    // Absorb prey on contact
    for (const b of state.blobs) {
      for (let i = state.prey.length - 1; i >= 0; i--) {
        const q = state.prey[i];
        const d = Math.hypot(q.x - b.x, q.y - b.y);
        if (d < b.r + q.r * 0.6) {
          const newArea = areaOf(b.r) + areaOf(q.r);
          b.r = radiusFromArea(newArea);
          state.prey.splice(i, 1);
        }
      }
    }

    // Merge sibling blobs on contact (only if both have merge timer expired)
    for (let i = state.blobs.length - 1; i >= 0; i--) {
      const a = state.blobs[i];
      if (!a) continue;
      if (a.mergeTimer > 0 || a.sibling == null) continue;
      const sibling = state.blobs.find(x => x.id === a.sibling);
      if (!sibling || sibling.mergeTimer > 0) continue;
      const d = Math.hypot(sibling.x - a.x, sibling.y - a.y);
      if (d < a.r + sibling.r) {
        // Fuse — masses add, position weighted, velocity weighted by mass
        const mA = areaOf(a.r), mB = areaOf(sibling.r);
        const m = mA + mB;
        const fused = {
          id: nextId++,
          x: (a.x * mA + sibling.x * mB) / m,
          y: (a.y * mA + sibling.y * mB) / m,
          vx: (a.vx * mA + sibling.vx * mB) / m,
          vy: (a.vy * mA + sibling.vy * mB) / m,
          r: radiusFromArea(m),
          mergeTimer: 0,
          sibling: null,
        };
        // Remove both halves; insert fused
        const sIdx = state.blobs.indexOf(sibling);
        const aIdx = state.blobs.indexOf(a);
        // Remove higher index first
        const [hi, lo] = aIdx > sIdx ? [aIdx, sIdx] : [sIdx, aIdx];
        state.blobs.splice(hi, 1);
        state.blobs.splice(lo, 1);
        state.blobs.push(fused);
        break;     // restart loop after structural change
      }
    }

    // Maintain ambient prey
    while (state.prey.length < 18) spawnPrey(state);

    // === Render ===
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Prey
    for (const q of state.prey) {
      ctx.fillStyle = `hsl(160, 60%, 55%)`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sibling tether line
    for (const b of state.blobs) {
      if (b.sibling == null) continue;
      const sibling = state.blobs.find(x => x.id === b.sibling);
      if (!sibling || sibling.id < b.id) continue;  // draw once per pair
      ctx.strokeStyle = b.mergeTimer > 0 ? 'rgba(255,210,63,0.25)' : 'rgba(94,231,223,0.4)';
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(sibling.x, sibling.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Blobs
    for (const b of state.blobs) {
      ctx.fillStyle = '#5ee7df';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = b.mergeTimer > 0 ? '#ffd23f' : '#e6edf3';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Merge timer arc
      if (b.mergeTimer > 0) {
        const t = b.mergeTimer / state.mergeTimer;
        ctx.strokeStyle = '#ffd23f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t);
        ctx.stroke();
      }
    }

    // HUD
    let totalMass = 0;
    for (const b of state.blobs) totalMass += areaOf(b.r);
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`blobs ${state.blobs.length}  ·  mass ${totalMass.toFixed(0)}  ·  next split ${state.splitTimer.toFixed(1)}s`, 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.start_size !== state.startSize) {
    state.startSize = params.start_size;
    state.splitVelocity = params.split_velocity;
    state.mergeTimer = params.merge_timer;
    state.autoSplitInterval = params.auto_split_interval;
    seed(state);
    return;
  }
  state.splitVelocity = params.split_velocity;
  state.mergeTimer = params.merge_timer;
  state.autoSplitInterval = params.auto_split_interval;
}
