// perspective/pseudo-3d-road — segment-based road receding to horizon.
// Each frame, advance accumulated_z by forward_speed * dt, then draw road
// segments far→near so near overdraws far. Horizontal curvature drifts via
// a sine of (accumulated_z + segment_z).

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SEGMENT_COUNT = 80;
const SEGMENT_LEN = 2;                // z-units per segment
const SCALE_FACTOR = 60;              // controls vanishing rate
const HORIZON_Y = H * 0.45;
const FOCAL = 280;                    // world-x → screen scaling at unit depth

function seed(state) {
  state.accumZ = 0;
  state.elapsed = 0;
  // Stable per-segment palette toggle for stripes.
  state.segParity = new Uint8Array(SEGMENT_COUNT);
  for (let i = 0; i < SEGMENT_COUNT; i++) state.segParity[i] = i & 1;
}

function projectSegment(state, segIndex) {
  // Segment world-z relative to camera.
  const wz = segIndex * SEGMENT_LEN - (state.accumZ % SEGMENT_LEN);
  if (wz < 0.1) return null;
  const scale = 1 / (1 + wz / SCALE_FACTOR);
  const screenY = HORIZON_Y + (1 - scale) * (H - HORIZON_Y);
  const halfWidth = (state.roadWidth / 2) * scale;

  // Cumulative curve: sample sin at (accumZ + segment_z * SEGMENT_LEN)
  // and weight by scale so far segments curve less.
  const curveX = state.curveAmount
    * Math.sin((state.accumZ + segIndex * SEGMENT_LEN) * 0.02)
    * (1 - scale)
    * (W * 0.25);
  const cx = W / 2 + curveX;
  return { screenY, halfWidth, scale, cx, wz };
}

export function init(ctx, params, env) {
  const state = {
    forwardSpeed: params.forward_speed,
    roadWidth:    params.road_width,
    curveAmount:  params.curve_amount,
    markers:      params.markers,
  };
  seed(state);

  function tick(dt) {
    state.elapsed += dt;
    state.accumZ += state.forwardSpeed * dt;

    // === Render ===
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
    sky.addColorStop(0, '#1e2632');
    sky.addColorStop(1, '#2a3a4a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, HORIZON_Y);

    // Distant ground band
    ctx.fillStyle = '#1a2620';
    ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);

    // Collect projected segments
    const segs = [];
    for (let i = 1; i <= SEGMENT_COUNT; i++) {
      const p = projectSegment(state, i);
      if (p) segs.push({ i, ...p });
    }
    // Far → near
    segs.sort((a, b) => b.wz - a.wz);

    // Draw road + ground stripes as trapezoid strips between consecutive segments.
    // We need pairs (far, near) so iterate adjacent pairs in the near-to-far ordering.
    const near2far = segs.slice().sort((a, b) => a.wz - b.wz); // near→far
    // We want to draw far-to-near, but pair each far seg with its nearer neighbor.
    for (let k = near2far.length - 1; k >= 1; k--) {
      const far  = near2far[k];
      const near = near2far[k - 1];

      // Ground stripe (alternates per parity)
      const groundColor = (state.segParity[far.i % SEGMENT_COUNT] ^ (((state.accumZ / SEGMENT_LEN) | 0) & 1))
        ? '#243528' : '#1b2820';
      ctx.fillStyle = groundColor;
      ctx.beginPath();
      ctx.moveTo(0, far.screenY);
      ctx.lineTo(W, far.screenY);
      ctx.lineTo(W, near.screenY);
      ctx.lineTo(0, near.screenY);
      ctx.closePath();
      ctx.fill();

      // Road trapezoid
      const farL  = far.cx  - far.halfWidth;
      const farR  = far.cx  + far.halfWidth;
      const nearL = near.cx - near.halfWidth;
      const nearR = near.cx + near.halfWidth;

      // Road body
      ctx.fillStyle = '#3a4555';
      ctx.beginPath();
      ctx.moveTo(farL, far.screenY);
      ctx.lineTo(farR, far.screenY);
      ctx.lineTo(nearR, near.screenY);
      ctx.lineTo(nearL, near.screenY);
      ctx.closePath();
      ctx.fill();

      // Center dashed line, drawn on alternating segments
      if (state.segParity[far.i % SEGMENT_COUNT] ^ (((state.accumZ / SEGMENT_LEN) | 0) & 1)) {
        ctx.fillStyle = '#e6edf3';
        ctx.beginPath();
        const farCw  = Math.max(1, 2 * far.scale);
        const nearCw = Math.max(1, 2 * near.scale);
        ctx.moveTo(far.cx - farCw,  far.screenY);
        ctx.lineTo(far.cx + farCw,  far.screenY);
        ctx.lineTo(near.cx + nearCw, near.screenY);
        ctx.lineTo(near.cx - nearCw, near.screenY);
        ctx.closePath();
        ctx.fill();
      }

      // Shoulder stripes (red/white) at road edges
      const stripeW = 4 * far.scale + 1;
      ctx.fillStyle = (far.i & 2) ? '#e6edf3' : '#c94f4f';
      ctx.beginPath();
      ctx.moveTo(farL - stripeW, far.screenY);
      ctx.lineTo(farL,           far.screenY);
      ctx.lineTo(nearL,          near.screenY);
      ctx.lineTo(nearL - stripeW * (near.scale / far.scale), near.screenY);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(farR,           far.screenY);
      ctx.lineTo(farR + stripeW, far.screenY);
      ctx.lineTo(nearR + stripeW * (near.scale / far.scale), near.screenY);
      ctx.lineTo(nearR,          near.screenY);
      ctx.closePath();
      ctx.fill();
    }

    // Roadside trees / markers — every 8th segment, drawn far→near.
    if (state.markers) {
      for (const s of segs) {
        if (s.i % 8 !== 0) continue;
        const treeH = 60 * s.scale;
        const treeW = 20 * s.scale;
        const sideOffset = state.roadWidth * 0.9 * s.scale;
        // Left tree
        const lx = s.cx - sideOffset;
        // Right tree
        const rx = s.cx + sideOffset;
        for (const tx of [lx, rx]) {
          // Trunk
          ctx.fillStyle = '#3a2818';
          ctx.fillRect(tx - treeW * 0.1, s.screenY - treeH * 0.3, treeW * 0.2, treeH * 0.3);
          // Crown
          ctx.fillStyle = '#2d5a2d';
          ctx.beginPath();
          ctx.moveTo(tx, s.screenY - treeH);
          ctx.lineTo(tx - treeW * 0.5, s.screenY - treeH * 0.3);
          ctx.lineTo(tx + treeW * 0.5, s.screenY - treeH * 0.3);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Horizon line
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HORIZON_Y);
    ctx.lineTo(W, HORIZON_Y);
    ctx.stroke();

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`speed ${state.forwardSpeed.toFixed(0)} u/s  ·  z ${state.accumZ.toFixed(0)}`, 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.forwardSpeed = params.forward_speed;
  state.roadWidth    = params.road_width;
  state.curveAmount  = params.curve_amount;
  state.markers      = params.markers;
}
