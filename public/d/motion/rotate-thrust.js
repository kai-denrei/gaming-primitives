// Motion: rotate-thrust — ship rotates + thrusts along facing; friction drags velocity.
// Auto-pattern: rotate 1s → thrust 1s → coast 0.5s → repeat. Self-driving demo.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SHIP_R = 12;

// Auto-pilot phases (seconds, action)
const PHASES = [
  { dur: 1.0, kind: 'rotate' },
  { dur: 1.0, kind: 'thrust' },
  { dur: 0.5, kind: 'coast' },
];

export function init(ctx, params, env) {
  const state = {
    x: W / 2, y: H / 2,
    vx: 0, vy: 0,
    heading: 0,
    rotRate: params.rot_rate,
    thrustAccel: params.thrust,
    friction: params.friction,
    phaseIdx: 0,
    phaseT: 0,
    rotSign: 1,
  };

  function tick(dt) {
    // Advance auto-pilot
    state.phaseT += dt;
    const phase = PHASES[state.phaseIdx];
    if (state.phaseT >= phase.dur) {
      state.phaseT = 0;
      state.phaseIdx = (state.phaseIdx + 1) % PHASES.length;
      if (PHASES[state.phaseIdx].kind === 'rotate') {
        state.rotSign = Math.random() < 0.5 ? -1 : 1;
      }
    }
    const cur = PHASES[state.phaseIdx].kind;

    if (cur === 'rotate') state.heading += state.rotRate * state.rotSign * dt;
    const thrusting = cur === 'thrust';
    if (thrusting) {
      state.vx += Math.cos(state.heading) * state.thrustAccel * dt;
      state.vy += Math.sin(state.heading) * state.thrustAccel * dt;
    }

    // Friction: v *= exp(-k·dt)
    const damp = Math.exp(-state.friction * dt);
    state.vx *= damp;
    state.vy *= damp;

    state.x += state.vx * dt;
    state.y += state.vy * dt;

    // Bounce
    if (state.x < SHIP_R) { state.x = SHIP_R; state.vx = -state.vx; }
    if (state.x > W - SHIP_R) { state.x = W - SHIP_R; state.vx = -state.vx; }
    if (state.y < SHIP_R) { state.y = SHIP_R; state.vy = -state.vy; }
    if (state.y > H - SHIP_R) { state.y = H - SHIP_R; state.vy = -state.vy; }

    // Render
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    ctx.save();
    ctx.translate(state.x, state.y);
    ctx.rotate(state.heading);

    // Thrust flame
    if (thrusting) {
      ctx.fillStyle = 'rgba(255, 160, 40, 0.9)';
      ctx.beginPath();
      ctx.moveTo(-SHIP_R, -5);
      ctx.lineTo(-SHIP_R - 10 - Math.random() * 6, 0);
      ctx.lineTo(-SHIP_R, 5);
      ctx.closePath();
      ctx.fill();
    }

    // Triangle ship
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.moveTo(SHIP_R, 0);
    ctx.lineTo(-SHIP_R * 0.7, -SHIP_R * 0.8);
    ctx.lineTo(-SHIP_R * 0.7, SHIP_R * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.rotRate = params.rot_rate;
  state.thrustAccel = params.thrust;
  state.friction = params.friction;
}
