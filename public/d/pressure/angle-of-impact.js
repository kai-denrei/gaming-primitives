// Pressure: angle-of-impact — vector reflection across a tiltable surface.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;
const HALF_LEN = 220;
const BALL_R = 6;
const SPAWN_PERIOD = 0.6;

function spawnBall(state) {
  const x = CX - HALF_LEN * 0.7 + Math.random() * HALF_LEN * 1.4;
  state.balls.push({
    x, y: 30,
    vx: (Math.random() - 0.5) * 30,
    vy: state.ballSpeed,
    hue: (state.spawnCount * 47) % 360,
    reflected: false,
    lastImpact: null,
  });
  state.spawnCount++;
}

export function init(ctx, params, env) {
  const state = {
    balls: [],
    spawnTimer: 0,
    spawnCount: 0,
    surfaceAngle: params.surface_angle,
    ballSpeed: params.ball_speed,
    elasticity: params.elasticity,
  };

  function tick(dt) {
    state.spawnTimer += dt;
    if (state.spawnTimer >= SPAWN_PERIOD) {
      state.spawnTimer = 0;
      spawnBall(state);
    }

    // Surface line geometry. angle measured from horizontal (positive = right side up).
    const ang = state.surfaceAngle * Math.PI / 180;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const x1 = CX - dx * HALF_LEN, y1 = CY - dy * HALF_LEN;
    const x2 = CX + dx * HALF_LEN, y2 = CY + dy * HALF_LEN;
    // Normal: rotate tangent (dx,dy) by -90 → (dy,-dx). Points "up" when angle is small.
    const nx = dy, ny = -dx;

    for (const b of state.balls) {
      // gravity is implicit (we just keep vy positive on spawn — but apply soft gravity for realism)
      b.vy += 200 * dt;
      const prevX = b.x, prevY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (!b.reflected) {
        // Signed distance from line through (CX,CY) with normal (nx,ny).
        const dPrev = (prevX - CX) * nx + (prevY - CY) * ny;
        const dCur  = (b.x   - CX) * nx + (b.y   - CY) * ny;
        // Crossed the line plane (above → below)
        if (dPrev >= 0 && dCur < 0) {
          // Param along line where crossing happened
          const t = dPrev / (dPrev - dCur);
          const cx = prevX + (b.x - prevX) * t;
          const cy = prevY + (b.y - prevY) * t;
          // Project crossing onto line segment
          const along = (cx - CX) * dx + (cy - CY) * dy;
          if (along >= -HALF_LEN && along <= HALF_LEN) {
            // Reflect velocity about normal: v' = v - (1+e) (v·n) n, but assignment says
            // v' = v - 2(v·n)n with normal component scaled by elasticity. Apply that exactly.
            const vDotN = b.vx * nx + b.vy * ny;
            b.vx = b.vx - 2 * vDotN * nx;
            b.vy = b.vy - 2 * vDotN * ny;
            // Scale only the normal component by elasticity (recompute then re-add)
            const vN2 = b.vx * nx + b.vy * ny;
            const vTx = b.vx - vN2 * nx, vTy = b.vy - vN2 * ny;
            b.vx = vTx + vN2 * state.elasticity * nx;
            b.vy = vTy + vN2 * state.elasticity * ny;
            // Snap onto the line so the vector indicator is anchored to impact point
            b.x = cx + nx * (BALL_R + 0.5);
            b.y = cy + ny * (BALL_R + 0.5);
            b.reflected = true;
            b.lastImpact = { x: cx, y: cy, vxIn: (b.x - prevX) / dt, vyIn: (b.y - prevY) / dt };
          }
        }
      }
    }

    // Despawn off-bottom
    for (let i = state.balls.length - 1; i >= 0; i--) {
      if (state.balls[i].y > H + 30 || state.balls[i].x < -30 || state.balls[i].x > W + 30) {
        state.balls.splice(i, 1);
      }
    }

    // Draw
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Surface
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    // Normal indicator from surface center
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + nx * 40, CY + ny * 40);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const b of state.balls) {
      // velocity vector
      const vs = Math.hypot(b.vx, b.vy) || 1;
      const drawLen = Math.min(40, vs * 0.15);
      ctx.strokeStyle = b.reflected ? '#39ff14' : '#ff4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + b.vx / vs * drawLen, b.y + b.vy / vs * drawLen);
      ctx.stroke();
      // ball
      ctx.fillStyle = b.reflected ? '#39ff14' : `hsl(${b.hue} 70% 60%)`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.surfaceAngle = params.surface_angle;
  state.elasticity = params.elasticity;
  state.ballSpeed = params.ball_speed;
}
