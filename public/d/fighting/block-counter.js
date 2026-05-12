// fighting/block-counter — Attacker auto-strikes; defender attempts block within
// block_window_ms with defender_skill probability. Successful block → attacker
// stun + counter_window_ms during which defender counter-strikes for 1.5x.
// Failed block → defender takes 10 HP. Tallies BLOCK / COUNTER / HIT.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const STAGE_Y    = H - 60;
const ATK_X      = 220;
const DEF_X      = W - 220;
const FIGHTER_H  = 130;
const HP_MAX     = 100;
const HIT_DAMAGE = 10;

const BG       = '#0d1117';
const STAGE    = '#2a2a3a';
const ATK_COL  = '#ff4444';
const DEF_COL  = '#5e8fff';
const STRIKE   = '#ffd23f';
const BLOCK    = '#39ff14';
const COUNTER  = '#c83be0';
const FG       = '#e6edf3';
const MUTED    = '#9aa4b2';

function seed(state) {
  state.hpAtk = HP_MAX;
  state.hpDef = HP_MAX;
  state.elapsed = 0;
  state.nextStrike = 0.8;
  state.phase = 'idle';      // 'idle' | 'windup' | 'resolve' | 'counter'
  state.phaseT = 0;
  state.lastEvent = null;    // 'BLOCKED' | 'COUNTER!' | 'HIT'
  state.lastEventAt = -10;
  state.blockCount = 0;
  state.counterCount = 0;
  state.hitCount = 0;
  state.koAt = -10;
  state.atkStunUntil = 0;
}

export function init(ctx, params, env) {
  const state = {
    attackerSpeed: params.attacker_speed,
    defenderSkill: params.defender_skill,
    blockWindow:   params.block_window_ms / 1000,
    counterWindow: params.counter_window_ms / 1000,
  };
  seed(state);

  function tick(dt) {
    state.elapsed += dt;
    state.phaseT += dt;

    if (state.phase === 'ko') {
      if (state.elapsed - state.koAt > 1.5) {
        state.hpAtk = HP_MAX;
        state.hpDef = HP_MAX;
        state.phase = 'idle';
        state.phaseT = 0;
        state.nextStrike = 0.8;
      }
      draw();
      return;
    }

    // Schedule next strike based on attacker speed.
    if (state.phase === 'idle' && state.elapsed >= state.atkStunUntil) {
      state.nextStrike -= dt;
      if (state.nextStrike <= 0) {
        state.phase = 'windup';
        state.phaseT = 0;
      }
    }

    const windupDur = 0.30;     // visible windup
    if (state.phase === 'windup' && state.phaseT >= windupDur) {
      // Resolution: defender attempts block within blockWindow,
      // success probability = defenderSkill.
      const blocked = Math.random() < state.defenderSkill;
      if (blocked) {
        state.blockCount++;
        state.lastEvent = 'BLOCKED';
        state.lastEventAt = state.elapsed;
        state.phase = 'counter';
        state.phaseT = 0;
        // Attacker stunned for counterWindow + a bit.
        state.atkStunUntil = state.elapsed + state.counterWindow + 0.15;
      } else {
        state.hpDef -= HIT_DAMAGE;
        state.hitCount++;
        state.lastEvent = 'HIT';
        state.lastEventAt = state.elapsed;
        state.phase = 'resolve';
        state.phaseT = 0;
        if (state.hpDef <= 0) {
          state.phase = 'ko';
          state.koAt = state.elapsed;
          return;
        }
      }
    }

    if (state.phase === 'counter') {
      // Within counterWindow, attempt a counter (also defenderSkill scaled).
      if (state.phaseT >= state.counterWindow * 0.4) {
        const landed = Math.random() < state.defenderSkill;
        if (landed) {
          state.hpAtk -= Math.round(HIT_DAMAGE * 1.5);
          state.counterCount++;
          state.lastEvent = 'COUNTER!';
          state.lastEventAt = state.elapsed;
          if (state.hpAtk <= 0) {
            state.phase = 'ko';
            state.koAt = state.elapsed;
            draw();
            return;
          }
        }
        state.phase = 'resolve';
        state.phaseT = 0;
      }
    }

    if (state.phase === 'resolve' && state.phaseT >= 0.35) {
      state.phase = 'idle';
      state.phaseT = 0;
      state.nextStrike = 1 / state.attackerSpeed;
    }

    draw();
  }

  function drawFighter(x, color, facing, mode) {
    // mode: 'idle' | 'windup' | 'strike' | 'block' | 'counter' | 'hit' | 'stun'
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
    if (mode === 'strike' || mode === 'counter') {
      const armEndX = x + facing * 42;
      const armEndY = torsoTopY + 10;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(armEndX, armEndY);
      ctx.stroke();
      ctx.fillStyle = mode === 'counter' ? COUNTER : STRIKE;
      ctx.beginPath();
      ctx.arc(armEndX, armEndY, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (mode === 'windup') {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x - facing * 14, torsoTopY + 8);
      ctx.stroke();
    } else if (mode === 'block') {
      // Forward-arm raised vertically as a guard.
      ctx.strokeStyle = BLOCK;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x + facing * 10, torsoTopY);
      ctx.lineTo(x + facing * 10, torsoTopY + 30);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x + facing * 10, torsoTopY + 12);
      ctx.stroke();
    } else if (mode === 'hit') {
      ctx.fillStyle = `rgba(255,68,68,0.45)`;
      ctx.fillRect(x - 18, headY - 12, 36, FIGHTER_H + 8);
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x + facing * 16, torsoTopY + 18);
      ctx.stroke();
    } else if (mode === 'stun') {
      // Stars-like shake; arm slumped.
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x + facing * 8, torsoTopY + 22);
      ctx.stroke();
      ctx.fillStyle = STRIKE;
      ctx.font = '14px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('*', x, headY - 16);
    } else {
      // idle
      ctx.strokeStyle = color;
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
    ctx.fillText(`BLOCK ${state.blockCount}   COUNTER ${state.counterCount}   HIT ${state.hitCount}`, W / 2, 22);

    // Attacker mode
    let atkMode = 'idle';
    if (state.phase === 'windup') atkMode = 'windup';
    else if (state.phase === 'resolve' && state.lastEvent === 'HIT' &&
             state.elapsed - state.lastEventAt < 0.18) atkMode = 'strike';
    else if (state.phase === 'counter' || state.elapsed < state.atkStunUntil) atkMode = 'stun';

    // Defender mode
    let defMode = 'idle';
    if (state.phase === 'windup' && state.phaseT > 0.18) defMode = 'block';
    else if (state.phase === 'resolve' && state.lastEvent === 'BLOCKED' &&
             state.elapsed - state.lastEventAt < 0.18) defMode = 'block';
    else if (state.phase === 'counter') defMode = 'counter';
    else if (state.lastEvent === 'HIT' && state.elapsed - state.lastEventAt < 0.18) defMode = 'hit';

    drawFighter(ATK_X, ATK_COL, +1, atkMode);
    drawFighter(DEF_X, DEF_COL, -1, defMode);

    // Last-event banner
    if (state.lastEvent && state.elapsed - state.lastEventAt < 0.5) {
      const t = (state.elapsed - state.lastEventAt) / 0.5;
      const color = state.lastEvent === 'BLOCKED' ? BLOCK
                  : state.lastEvent === 'COUNTER!' ? COUNTER
                  :                                  '#ff4444';
      ctx.fillStyle = color;
      ctx.globalAlpha = 1 - t;
      ctx.font = 'bold 28px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.lastEvent, W / 2, 130);
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
  state.attackerSpeed = params.attacker_speed;
  state.defenderSkill = params.defender_skill;
  state.blockWindow   = params.block_window_ms / 1000;
  state.counterWindow = params.counter_window_ms / 1000;
}
