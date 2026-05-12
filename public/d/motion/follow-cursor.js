// Motion: follow-cursor — player position lerps toward target.
// Auto-path mode: target orbits in a slow figure-8. Else: lerp toward pointer.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;
const FIG_RX = 240, FIG_RY = 140;
const R = 11;
const POINTER_TIMEOUT = 2.0;

export function init(ctx, params, env) {
  const state = {
    x: CX, y: CY,
    targetX: CX, targetY: CY,
    autoPath: params.auto_path !== false,
    lerp: params.lerp_factor,
    t: 0,
    lastPointerT: -999,
    pointerX: null, pointerY: null,
    timeNow: 0,
  };

  // Pointer hookup (best-effort). Use logical coords via getBoundingClientRect.
  const canvas = env?.canvas;
  if (canvas) {
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0) return;
      state.pointerX = ((e.clientX - rect.left) / rect.width) * W;
      state.pointerY = ((e.clientY - rect.top) / rect.height) * H;
      state.lastPointerT = state.timeNow;
    };
    canvas.addEventListener('pointermove', onMove);
  }

  function tick(dt) {
    state.t += dt;
    state.timeNow += dt;

    // Figure-8: x = sin(t), y = sin(2t)
    const figX = CX + Math.sin(state.t * 0.8) * FIG_RX;
    const figY = CY + Math.sin(state.t * 1.6) * FIG_RY * 0.5;

    const havePointer = !state.autoPath
      && state.pointerX != null
      && (state.timeNow - state.lastPointerT) < POINTER_TIMEOUT;

    if (havePointer) {
      state.targetX = state.pointerX;
      state.targetY = state.pointerY;
    } else {
      state.targetX = figX;
      state.targetY = figY;
    }

    // Frame-rate independent lerp: factor adjusted by dt
    const a = 1 - Math.exp(-state.lerp * dt * 60);
    state.x += (state.targetX - state.x) * a;
    state.y += (state.targetY - state.y) * a;

    // Render
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Figure-8 ghost path
    if (!havePointer) {
      ctx.strokeStyle = '#1f2937';
      ctx.beginPath();
      const N = 120;
      for (let i = 0; i <= N; i++) {
        const u = (i / N) * Math.PI * 2;
        const gx = CX + Math.sin(u) * FIG_RX;
        const gy = CY + Math.sin(u * 2) * FIG_RY * 0.5;
        if (i === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
      }
      ctx.stroke();
    }

    // Target marker
    ctx.strokeStyle = '#3a3a4a';
    ctx.beginPath();
    ctx.arc(state.targetX, state.targetY, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Player
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(state.x, state.y, R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.lerp = params.lerp_factor;
  state.autoPath = params.auto_path !== false;
}
