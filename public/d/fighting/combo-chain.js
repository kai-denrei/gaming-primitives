// fighting/combo-chain — Attacker auto-attempts combo strings of length up to
// chain_target. Each move has startup + active + recovery. Cancel into the
// next move must happen within the cancel_window_ms. Success increments the
// combo counter; failure drops the string and triggers a PUNISH counter-strike.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const STAGE_Y    = H - 60;
const ATK_X      = 240;
const DEF_X      = W - 240;
const FIGHTER_H  = 130;
const HP_MAX     = 100;
const COMBO_HIT  = 4;   // damage per combo hit
const PUNISH_DMG = 14;

const BG       = '#0d1117';
const STAGE    = '#2a2a3a';
const ATK_COL  = '#ff4444';
const DEF_COL  = '#5e8fff';
const STRIKE   = '#ffd23f';
const COMBO_FG = '#ffd23f';
const PUNISH_C = '#c83be0';
const FG       = '#e6edf3';
const MUTED    = '#9aa4b2';

// Per-move phase durations (seconds).
const STARTUP_DUR  = 0.10;
const ACTIVE_DUR   = 0.08;
const RECOVERY_DUR = 0.20;
const REST_DUR     = 0.45;   // between combo attempts when string ended

function seed(state) {
  state.hpAtk = HP_MAX;
  state.hpDef = HP_MAX;
  state.elapsed = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.attempts = 0;
  // Per-move state machine
  state.phase = 'rest';    // 'rest' | 'startup' | 'active' | 'recovery' | 'punish' | 'ko'
  state.phaseT = 0;
  state.comboFlashAt = -10;
  state.punishAt = -10;
  state.koAt = -10;
}

export function init(ctx, params, env) {
  const state = {
    chainTarget:  params.chain_target,
    cancelWindow: params.cancel_window_ms / 1000,
    autoSkill:    params.auto_skill,
  };
  seed(state);

  function tick(dt) {
    state.elapsed += dt;
    state.phaseT += dt;

    if (state.phase === 'ko') {
      if (state.elapsed - state.koAt > 1.5) {
        state.hpAtk = HP_MAX;
        state.hpDef = HP_MAX;
        state.combo = 0;
        state.phase = 'rest';
        state.phaseT = 0;
      }
      draw();
      return;
    }

    if (state.phase === 'rest') {
      if (state.phaseT >= REST_DUR) {
        state.combo = 0;       // new attempt resets combo
        state.attempts++;
        state.phase = 'startup';
        state.phaseT = 0;
      }
    } else if (state.phase === 'startup') {
      if (state.phaseT >= STARTUP_DUR) {
        state.phase = 'active';
        state.phaseT = 0;
      }
    } else if (state.phase === 'active') {
      // Land the hit at the start of active frames.
      if (state.phaseT === 0 || (state.combo === 0 && state.phaseT < dt + 0.001)) {
        // (Compatibility w/ first tick into active.)
      }
      // Apply hit once on entry; use a flag.
      if (!state._appliedThisActive) {
        state.hpDef -= COMBO_HIT;
        state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        state.comboFlashAt = state.elapsed;
        state._appliedThisActive = true;
        if (state.hpDef <= 0) {
          state.phase = 'ko';
          state.koAt = state.elapsed;
          state._appliedThisActive = false;
          draw();
          return;
        }
      }
      if (state.phaseT >= ACTIVE_DUR) {
        state.phase = 'recovery';
        state.phaseT = 0;
        state._appliedThisActive = false;
      }
    } else if (state.phase === 'recovery') {
      // Decide whether to cancel into next move. cancel_window_ms defines the
      // early portion of recovery during which cancel-into-next is possible.
      // Auto-pilot succeeds with probability autoSkill, but only if combo < chain target.
      if (state.combo < state.chainTarget) {
        if (state.phaseT < state.cancelWindow) {
          // Roll cancel attempt right at start of recovery (once).
          if (!state._rolledCancel) {
            state._rolledCancel = true;
            const ok = Math.random() < state.autoSkill;
            if (ok) {
              state.phase = 'startup';
              state.phaseT = 0;
              return;
            } else {
              // Failed cancel → finish recovery → PUNISH
              state._punishPending = true;
            }
          }
        }
      }
      // Done with recovery: either max combo reached cleanly OR a failed cancel.
      if (state.phaseT >= RECOVERY_DUR) {
        if (state._punishPending) {
          state._punishPending = false;
          state._rolledCancel = false;
          state.phase = 'punish';
          state.phaseT = 0;
          state.punishAt = state.elapsed;
          state.hpAtk -= PUNISH_DMG;
          if (state.hpAtk <= 0) {
            state.phase = 'ko';
            state.koAt = state.elapsed;
            draw();
            return;
          }
        } else {
          state._rolledCancel = false;
          state.phase = 'rest';
          state.phaseT = 0;
        }
      }
    } else if (state.phase === 'punish') {
      if (state.phaseT >= 0.4) {
        state.phase = 'rest';
        state.phaseT = 0;
      }
    }

    draw();
  }

  function drawFighter(x, color, facing, mode) {
    const headY = STAGE_Y - FIGHTER_H + 14;
    const torsoTopY = headY + 18;
    const torsoBotY = headY + 60;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, headY, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, torsoTopY);
    ctx.lineTo(x, torsoBotY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, torsoBotY);
    ctx.lineTo(x - 12, STAGE_Y);
    ctx.moveTo(x, torsoBotY);
    ctx.lineTo(x + 12, STAGE_Y);
    ctx.stroke();
    // Back arm
    ctx.beginPath();
    ctx.moveTo(x, torsoTopY + 6);
    ctx.lineTo(x - facing * 12, torsoTopY + 22);
    ctx.stroke();
    // Front arm based on mode
    if (mode === 'active') {
      const armEndX = x + facing * 42;
      const armEndY = torsoTopY + 10;
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(armEndX, armEndY);
      ctx.stroke();
      ctx.fillStyle = STRIKE;
      ctx.beginPath();
      ctx.arc(armEndX, armEndY, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (mode === 'startup') {
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x - facing * 8, torsoTopY + 8);
      ctx.stroke();
    } else if (mode === 'recovery') {
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x + facing * 22, torsoTopY + 22);
      ctx.stroke();
    } else if (mode === 'punish') {
      // Counter-strike from defender side (drawn separately when this is defender)
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x + facing * 28, torsoTopY + 22);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,68,68,0.45)`;
      ctx.fillRect(x - 18, headY - 12, 36, FIGHTER_H + 8);
    } else if (mode === 'hit') {
      ctx.fillStyle = `rgba(255,68,68,0.40)`;
      ctx.fillRect(x - 18, headY - 12, 36, FIGHTER_H + 8);
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x + facing * 16, torsoTopY + 18);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x + facing * 14, torsoTopY + 18);
      ctx.stroke();
    }
  }

  function drawHPBar(x, y, w, hp, color, label) {
    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(x, y, w, 14);
    const frac = Math.max(0, hp / HP_MAX);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * frac, 14);
    ctx.strokeStyle = STAGE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 13);
    ctx.fillStyle = FG;
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y - 4);
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.max(0, hp)}`, x + w, y - 4);
  }

  function draw() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = STAGE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, STAGE_Y); ctx.lineTo(W, STAGE_Y);
    ctx.stroke();

    drawHPBar(20, 30, 280, state.hpAtk, ATK_COL, 'ATTACKER');
    drawHPBar(W - 300, 30, 280, state.hpDef, DEF_COL, 'DEFENDER');

    ctx.fillStyle = MUTED;
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`max combo ${state.maxCombo}   ·   target ${state.chainTarget}   ·   attempts ${state.attempts}`, W / 2, 22);

    // Attacker mode
    let atkMode = 'idle';
    if (state.phase === 'startup') atkMode = 'startup';
    else if (state.phase === 'active') atkMode = 'active';
    else if (state.phase === 'recovery') atkMode = 'recovery';
    else if (state.phase === 'punish') atkMode = 'hit';

    // Defender mode
    let defMode = 'idle';
    if (state.phase === 'active' && state.elapsed - state.comboFlashAt < 0.10) defMode = 'hit';
    if (state.phase === 'punish') defMode = 'punish';

    drawFighter(ATK_X, ATK_COL, +1, atkMode);
    drawFighter(DEF_X, DEF_COL, -1, defMode);

    // Combo overlay (grows with combo)
    if (state.combo > 0 && state.elapsed - state.comboFlashAt < 0.5) {
      const t = (state.elapsed - state.comboFlashAt) / 0.5;
      const size = 28 + state.combo * 6;
      ctx.fillStyle = COMBO_FG;
      ctx.globalAlpha = 1 - t * 0.7;
      ctx.font = `bold ${size}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`${state.combo}-HIT COMBO!`, W / 2, 130);
      ctx.globalAlpha = 1;
    }

    // PUNISH overlay
    if (state.phase === 'punish') {
      const t = state.phaseT / 0.4;
      ctx.fillStyle = PUNISH_C;
      ctx.globalAlpha = 1 - t;
      ctx.font = 'bold 32px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PUNISH!', W / 2, 180);
      ctx.globalAlpha = 1;
    }

    if (state.phase === 'ko') {
      ctx.fillStyle = 'rgba(13,17,23,0.85)';
      ctx.fillRect(0, H / 2 - 40, W, 80);
      ctx.fillStyle = state.hpAtk <= 0 ? DEF_COL : ATK_COL;
      ctx.font = 'bold 36px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('K.O.', W / 2, H / 2 + 6);
      ctx.fillStyle = MUTED;
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillText(`${state.hpAtk <= 0 ? 'DEFENDER' : 'ATTACKER'} wins`, W / 2, H / 2 + 26);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.chainTarget  = params.chain_target;
  state.cancelWindow = params.cancel_window_ms / 1000;
  state.autoSkill    = params.auto_skill;
}
