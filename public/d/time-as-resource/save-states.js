// Time-as-resource: save-states — periodic snapshots, periodic restores.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const N = 4;
const HISTORY = 3;

function seed(state) {
  state.entities = [];
  for (let i = 0; i < N; i++) {
    state.entities.push({
      x: 60 + Math.random() * (W - 120),
      y: 60 + Math.random() * (H - 120),
      vx: (Math.random() - 0.5) * 180,
      vy: (Math.random() - 0.5) * 140,
      hue: (i * 83) % 360,
    });
  }
  state.snapshots = [];
}

function snapshot(state) {
  return state.entities.map(e => ({ x: e.x, y: e.y, vx: e.vx, vy: e.vy, hue: e.hue }));
}

function restore(state, snap) {
  for (let i = 0; i < state.entities.length && i < snap.length; i++) {
    const e = state.entities[i], s = snap[i];
    e.x = s.x; e.y = s.y; e.vx = s.vx; e.vy = s.vy; e.hue = s.hue;
  }
}

export function init(ctx, params, env) {
  const state = {
    save_interval: params.save_interval,
    load_interval: params.load_interval,
    saveTimer: 0,
    loadTimer: 0,
    saveFlash: 0,
    loadFlash: 0,
  };
  seed(state);
  state.snapshots.push(snapshot(state));

  function tick(dt) {
    state.saveTimer += dt;
    state.loadTimer += dt;
    if (state.saveFlash > 0) state.saveFlash = Math.max(0, state.saveFlash - dt * 2);
    if (state.loadFlash > 0) state.loadFlash = Math.max(0, state.loadFlash - dt * 2);

    // Physics
    for (const e of state.entities) {
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.x < 14)     { e.x = 14;     e.vx = Math.abs(e.vx); }
      if (e.x > W - 14) { e.x = W - 14; e.vx = -Math.abs(e.vx); }
      if (e.y < 14)     { e.y = 14;     e.vy = Math.abs(e.vy); }
      if (e.y > H - 14) { e.y = H - 14; e.vy = -Math.abs(e.vy); }
    }

    if (state.saveTimer >= state.save_interval) {
      state.saveTimer = 0;
      state.snapshots.push(snapshot(state));
      while (state.snapshots.length > HISTORY) state.snapshots.shift();
      state.saveFlash = 1;
    }
    if (state.loadTimer >= state.load_interval && state.snapshots.length) {
      state.loadTimer = 0;
      restore(state, state.snapshots[state.snapshots.length - 1]);
      state.loadFlash = 1;
    }

    // ── render
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

    for (const e of state.entities) {
      ctx.fillStyle = `hsl(${e.hue} 70% 60%)`;
      ctx.beginPath(); ctx.arc(e.x, e.y, 11, 0, Math.PI * 2); ctx.fill();
    }

    // Save flash (white)
    if (state.saveFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${state.saveFlash * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Load flash (red + glitch lines)
    if (state.loadFlash > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${state.loadFlash * 0.45})`;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(255, 255, 255, ${state.loadFlash * 0.3})`;
      for (let i = 0; i < 8; i++) {
        const y = Math.random() * H;
        ctx.fillRect(0, y, W, 2);
      }
    }

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillText(`snapshots ${state.snapshots.length}/${HISTORY}`, 16, 24);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`save in ${Math.max(0, state.save_interval - state.saveTimer).toFixed(1)}s   load in ${Math.max(0, state.load_interval - state.loadTimer).toFixed(1)}s`, 16, 42);

    if (state.saveFlash > 0.4) {
      ctx.fillStyle = '#e6edf3';
      ctx.font = 'bold 18px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('● SAVE', W - 16, 28);
      ctx.textAlign = 'left';
    } else if (state.loadFlash > 0.4) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 18px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('▲ LOAD', W - 16, 28);
      ctx.textAlign = 'left';
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.save_interval = params.save_interval;
  state.load_interval = params.load_interval;
}
