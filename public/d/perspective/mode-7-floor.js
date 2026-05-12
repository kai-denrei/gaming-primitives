// perspective/mode-7-floor — tilted ground plane via per-scanline depth.
// For each screen row below the horizon, compute world-depth from camera
// pitch; sample the chosen pattern (checker / grid / radial) at the projected
// world point. Writes one ImageData buffer per frame to keep per-pixel work
// in tight integer math.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CAM_HEIGHT = 30;
const FOCAL = W * 0.6;

// Reusable ImageData buffer at logical resolution. Note: the canvas context is
// transformed to logical units by the runner, but putImageData ignores the
// transform — pixels go straight to backing store. We accept this mismatch
// because the demo canvas is set to LOGICAL dimensions in the unscaled space;
// the host context uses CSS-pixel scaling. To keep the visual coherent we
// putImageData via a temporary offscreen canvas drawn through the transform.
let scratch = null;
let scratchCtx = null;
let imgData = null;

function ensureScratch() {
  if (scratch && scratch.width === W && scratch.height === H) return;
  scratch = (typeof OffscreenCanvas !== 'undefined')
    ? new OffscreenCanvas(W, H)
    : Object.assign(document.createElement('canvas'), { width: W, height: H });
  scratchCtx = scratch.getContext('2d');
  imgData = scratchCtx.createImageData(W, H);
}

function patternColor(pattern, wx, wy) {
  // Returns [r,g,b]. All patterns must handle large wx/wy.
  if (pattern === 'checker') {
    const cellSize = 30;
    const cx = Math.floor(wx / cellSize);
    const cy = Math.floor(wy / cellSize);
    if ((cx ^ cy) & 1) return [57, 255, 20];           // #39ff14
    return [13, 17, 23];                                // #0d1117
  } else if (pattern === 'grid') {
    const cellSize = 40;
    const mx = ((wx % cellSize) + cellSize) % cellSize;
    const my = ((wy % cellSize) + cellSize) % cellSize;
    if (mx < 1.5 || my < 1.5) return [70, 130, 180];   // grid line
    return [22, 28, 38];                                // dark
  } else { // radial
    const d = Math.sqrt(wx * wx + wy * wy);
    const ring = Math.floor(d / 50);
    if (ring & 1) return [255, 153, 51];
    return [30, 22, 38];
  }
}

function seed(state) {
  state.elapsed = 0;
  state.heading = 0;
  state.cx = 0;
  state.cy = 0;
}

export function init(ctx, params, env) {
  ensureScratch();
  const state = {
    tilt:     params.tilt_deg,
    speed:    params.forward_speed,
    turnRate: params.turn_rate,
    pattern:  params.pattern,
  };
  seed(state);

  function tick(dt) {
    state.elapsed += dt;
    // Auto-pilot: heading drifts as a slow sin; camera glides forward along it.
    state.heading += state.turnRate * Math.sin(state.elapsed * 0.5) * dt;
    state.cx += Math.cos(state.heading) * state.speed * dt;
    state.cy += Math.sin(state.heading) * state.speed * dt;

    const pitchRad = state.tilt * Math.PI / 180;
    const horizonY = Math.floor(H * (state.tilt / 90));
    const sinH = Math.sin(state.heading);
    const cosH = Math.cos(state.heading);

    const data = imgData.data;
    // Sky band: solid color above horizon.
    for (let y = 0; y < horizonY; y++) {
      // Gradient: lighter at top
      const t = y / Math.max(1, horizonY);
      const r = 30 + t * 5, g = 38 + t * 8, b = 50 + t * 10;
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        data[idx]     = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    // Ground: for each scanline below horizon, depth d follows from inverse
    // tangent of (y - horizonY). We use a stable, vectorizable formulation.
    // depth ∝ camHeight / tan(pitch * (y - horizonY) / (H - horizonY))
    const groundRows = H - horizonY;
    for (let y = horizonY; y < H; y++) {
      const scan = (y - horizonY) / groundRows;             // 0..1
      // Map scan to a depth: small scan → big depth. Keep > 0.
      const denom = Math.tan(0.04 + scan * (pitchRad * 0.95));
      const depth = denom > 1e-3 ? CAM_HEIGHT / denom : 5000;

      // Center of scanline projects to (cx + depth*cosH, cy + depth*sinH).
      // For each x, lateral offset world_dx = (x - W/2) * depth / FOCAL.
      const scanX = state.cx + depth * cosH;
      const scanY = state.cy + depth * sinH;
      // Perpendicular world-direction (rotate heading +90°): (-sinH, cosH).
      const perpX = -sinH;
      const perpY =  cosH;

      // Fog falloff factor (further → darker).
      const fog = Math.max(0, Math.min(1, 1 - depth / 1500));

      const baseIdx = y * W * 4;
      for (let x = 0; x < W; x++) {
        const lateral = (x - W / 2) * depth / FOCAL;
        const wx = scanX + perpX * lateral;
        const wy = scanY + perpY * lateral;
        const c = patternColor(state.pattern, wx, wy);
        const idx = baseIdx + x * 4;
        data[idx]     = c[0] * fog;
        data[idx + 1] = c[1] * fog;
        data[idx + 2] = c[2] * fog;
        data[idx + 3] = 255;
      }
    }

    scratchCtx.putImageData(imgData, 0, 0);

    // Composite onto the runner-managed transformed context.
    ctx.drawImage(scratch, 0, 0, W, H);

    // Horizon line
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(W, horizonY);
    ctx.stroke();

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`tilt ${state.tilt.toFixed(0)}°  ·  heading ${(state.heading * 180 / Math.PI).toFixed(0)}°  ·  ${state.pattern}`, 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.tilt     = params.tilt_deg;
  state.speed    = params.forward_speed;
  state.turnRate = params.turn_rate;
  state.pattern  = params.pattern;
}
