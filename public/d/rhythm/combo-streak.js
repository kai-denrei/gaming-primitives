// Rhythm: combo-streak — sequential successes accumulate a multiplier; one miss resets to zero.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2;

export function init(ctx, params, env) {
  const state = {
    bpm: params.bpm,
    successRate: params.success_rate,
    decayMs: params.decay_ms,
    bonusThreshold: params.bonus_threshold,
    sincePulse: 0,
    sinceAttempt: 0,        // time since last hit attempt — used for decay
    streak: 0,
    pulseEnv: 0,            // 1 on event → 0 over ~0.4s
    pulseColor: '#39ff14',
    bonusFlash: 0,          // seconds remaining on BONUS overlay
    bonusValue: 0,          // multiplier at flash-time
  };

  function attempt() {
    state.sinceAttempt = 0;
    const success = Math.random() < state.successRate;
    if (success) {
      const prevMult = Math.floor(state.streak / state.bonusThreshold) + 1;
      state.streak += 1;
      const newMult = Math.floor(state.streak / state.bonusThreshold) + 1;
      state.pulseEnv = 1;
      state.pulseColor = '#39ff14';
      // Fire bonus overlay AT the threshold crossing — i.e. when multiplier ticks up.
      if (newMult > prevMult) {
        state.bonusFlash = 1.0;
        state.bonusValue = newMult;
      }
    } else {
      state.streak = 0;
      state.pulseEnv = 1;
      state.pulseColor = '#ff4444';
    }
  }

  function tick(dt) {
    state.sincePulse += dt;
    state.sinceAttempt += dt;
    const beatPeriod = 60 / state.bpm;

    while (state.sincePulse >= beatPeriod) {
      state.sincePulse -= beatPeriod;
      attempt();
    }

    // Decay (if enabled): streak drops to 0 if no attempt fires for decayMs.
    if (state.decayMs > 0 && state.streak > 0 && state.sinceAttempt * 1000 > state.decayMs) {
      state.streak = 0;
      state.pulseEnv = 1;
      state.pulseColor = '#ff4444';
      state.sinceAttempt = 0;
    }

    state.pulseEnv = Math.max(0, state.pulseEnv - dt / 0.4);
    state.bonusFlash = Math.max(0, state.bonusFlash - dt);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Pulse halo behind counter
    if (state.pulseEnv > 0) {
      const r = 140 + state.pulseEnv * 60;
      const a = 0.15 + 0.35 * state.pulseEnv;
      ctx.fillStyle = state.pulseColor === '#39ff14'
        ? `rgba(57,255,20,${a})`
        : `rgba(255,68,68,${a})`;
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Streak counter (large mono, centered)
    const mult = Math.floor(state.streak / state.bonusThreshold) + 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 120px ui-monospace, Menlo, monospace';
    ctx.fillText(String(state.streak), CX, CY + 30);

    // Multiplier badge above
    ctx.font = 'bold 28px ui-monospace, Menlo, monospace';
    ctx.fillStyle = mult > 1 ? '#ffd23f' : '#2a2a3a';
    ctx.fillText(`x${mult}`, CX, CY - 80);

    // STREAK label
    ctx.font = '14px ui-monospace, Menlo, monospace';
    ctx.fillStyle = '#e6edf3';
    ctx.fillText('STREAK', CX, CY - 110);
    ctx.textAlign = 'left';

    // HUD bottom
    ctx.font = '12px ui-monospace, Menlo, monospace';
    ctx.fillStyle = '#e6edf3';
    const decayLabel = state.decayMs === 0 ? 'off' : `${state.decayMs}ms`;
    ctx.fillText(
      `${state.bpm} bpm · success ${(state.successRate * 100).toFixed(0)}% · decay ${decayLabel} · bonus @ ${state.bonusThreshold}`,
      20, H - 14
    );

    // Bonus overlay
    if (state.bonusFlash > 0) {
      const a = Math.min(1, state.bonusFlash);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 16;
      ctx.fillText(`BONUS x${state.bonusValue}`, CX, 70);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // BPM and rates are pure retunes — preserve the active streak.
  state.bpm = params.bpm;
  state.successRate = params.success_rate;
  state.decayMs = params.decay_ms;
  // Threshold change: reset bonus flash to avoid showing a stale multiplier.
  if (state.bonusThreshold !== params.bonus_threshold) {
    state.bonusThreshold = params.bonus_threshold;
    state.bonusFlash = 0;
  }
}
