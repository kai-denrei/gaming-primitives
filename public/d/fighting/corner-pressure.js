// fighting/corner-pressure — Two fighters on a bounded stage. Attacker advances
// toward defender; defender backs away but can't pass the wall. Within ~80px
// of either wall, the defender is "cornered" — block + counter windows shrink
// by corner_disadvantage. Successful counter escapes the corner (roles swap).

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const STAGE_Y    = H - 60;
const FIGHTER_H  = 130;
const HP_MAX     = 100;
const HIT_DMG    = 8;
const COUNTER_DMG= 12;
const CORNER_PX  = 80;

const BG       = '#0d1117';
const STAGE    = '#2a2a3a';
const ATK_COL  = '#ff4444';
const DEF_COL  = '#5e8fff';
const STRIKE   = '#ffd23f';
const BLOCK    = '#39ff14';
const COUNTER  = '#c83be0';
const FG       = '#e6edf3';
const MUTED    = '#9aa4b2';
const ZONE     = 'rgba(255,68,68,0.12)';

const BASE_BLOCK_WIN   = 0.18;
const BASE_COUNTER_WIN = 0.22;

function seed(state) {
  state.hpAtk = HP_MAX;
  state.hpDef = HP_MAX;
  state.elapsed = 0;
  state.koAt = -10;
  state.phase = 'idle';     // 'idle' | 'windup' | 'resolve' | 'counter' | 'ko'
  state.phaseT = 0;
  state.nextStrike = 0.8;
  state.atkRole = 'A';      // 'A' or 'B' (A is red attacker by default)
  // Positions: stage centered, stage_width controls inner walls.
  const half = state.stageWidth / 2;
  state.stageL = W / 2 - half;
  state.stageR = W / 2 + half;
  state.xAtk = W / 2 - 100;
  state.xDef = W / 2 + 100;
  state.lastEvent = null;
  state.lastEventAt = -10;
  state.corneredFlash = -10;
  state.exchangesTotal = 0;
  state.corneredExchanges = 0;
}

function isDefenderCornered(state) {
  return (state.xDef - state.stageL < CORNER_PX) || (state.stageR - state.xDef < CORNER_PX);
}

export function init(ctx, params, env) {
  const state = {
    stageWidth: params.stage_width,
    pressureStrength: params.pressure_strength,
    cornerDisadvantage: params.corner_disadvantage,
  };
  seed(state);

  function effectiveBlockWindow() {
    if (!isDefenderCornered(state)) return BASE_BLOCK_WIN;
    return BASE_BLOCK_WIN * (1 - state.cornerDisadvantage * 0.5);
  }
  function effectiveCounterWindow() {
    if (!isDefenderCornered(state)) return BASE_COUNTER_WIN;
    return BASE_COUNTER_WIN * (1 - state.cornerDisadvantage * 0.5);
  }
  function defenderSkillEffective() {
    // Base 0.55 chance to block, scaled down when cornered.
    const base = 0.55;
    if (!isDefenderCornered(state)) return base;
    return base * (1 - state.cornerDisadvantage * 0.6);
  }

  function tick(dt) {
    state.elapsed += dt;
    state.phaseT += dt;

    if (state.phase === 'ko') {
      if (state.elapsed - state.koAt > 1.5) {
        state.hpAtk = HP_MAX;
        state.hpDef = HP_MAX;
        const half = state.stageWidth / 2;
        state.stageL = W / 2 - half;
        state.stageR = W / 2 + half;
        state.xAtk = W / 2 - 100;
        state.xDef = W / 2 + 100;
        state.atkRole = 'A';
        state.phase = 'idle';
        state.phaseT = 0;
        state.nextStrike = 0.8;
      }
      draw();
      return;
    }

    // Movement: attacker advances; defender backs away clamped to wall.
    if (state.phase === 'idle' || state.phase === 'windup') {
      const facing = state.xDef > state.xAtk ? +1 : -1;
      const advanceSpeed = 60 * state.pressureStrength * dt;
      state.xAtk += facing * advanceSpeed;
      // Defender retreats half-speed
      state.xDef += facing * advanceSpeed * 0.55;
      // Clamp to walls
      if (state.xDef < state.stageL + 18) state.xDef = state.stageL + 18;
      if (state.xDef > state.stageR - 18) state.xDef = state.stageR - 18;
      // Attacker can't push past defender minus reach gap
      const reachGap = 90;
      if (facing > 0 && state.xAtk > state.xDef - reachGap) state.xAtk = state.xDef - reachGap;
      if (facing < 0 && state.xAtk < state.xDef + reachGap) state.xAtk = state.xDef + reachGap;

      if (isDefenderCornered(state)) state.corneredFlash = state.elapsed;
    }

    if (state.phase === 'idle') {
      state.nextStrike -= dt;
      if (state.nextStrike <= 0) {
        state.phase = 'windup';
        state.phaseT = 0;
      }
    } else if (state.phase === 'windup') {
      if (state.phaseT >= 0.28) {
        // Resolve
        const cornered = isDefenderCornered(state);
        if (cornered) state.corneredExchanges++;
        state.exchangesTotal++;
        const blocked = Math.random() < defenderSkillEffective();
        if (blocked) {
          state.lastEvent = 'BLOCKED';
          state.lastEventAt = state.elapsed;
          state.phase = 'counter';
          state.phaseT = 0;
        } else {
          state.hpDef -= HIT_DMG;
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
    } else if (state.phase === 'counter') {
      // Counter attempt within counter window.
      const cw = effectiveCounterWindow();
      if (state.phaseT >= cw * 0.4) {
        const landed = Math.random() < defenderSkillEffective();
        if (landed) {
          state.hpAtk -= COUNTER_DMG;
          state.lastEvent = 'COUNTER!';
          state.lastEventAt = state.elapsed;
          // Successful counter escapes the corner — swap roles.
          const tmpX = state.xAtk; state.xAtk = state.xDef; state.xDef = tmpX;
          state.atkRole = state.atkRole === 'A' ? 'B' : 'A';
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
    } else if (state.phase === 'resolve' && state.phaseT >= 0.32) {
      state.phase = 'idle';
      state.phaseT = 0;
      state.nextStrike = 0.9;
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
    // Front arm
    if (mode === 'strike' || mode === 'counter') {
      const armEndX = x + facing * 42;
      const armEndY = torsoTopY + 10;
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(armEndX, armEndY);
      ctx.stroke();
      ctx.fillStyle = mode === 'counter' ? COUNTER : STRIKE;
      ctx.beginPath();
      ctx.arc(armEndX, armEndY, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (mode === 'block') {
      ctx.strokeStyle = BLOCK;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x + facing * 10, torsoTopY);
      ctx.lineTo(x + facing * 10, torsoTopY + 30);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
    } else if (mode === 'hit') {
      ctx.fillStyle = `rgba(255,68,68,0.45)`;
      ctx.fillRect(x - 18, headY - 12, 36, FIGHTER_H + 8);
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x + facing * 16, torsoTopY + 18);
      ctx.stroke();
    } else if (mode === 'windup') {
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x - facing * 10, torsoTopY + 10);
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

    // Off-stage darker fill
    ctx.fillStyle = '#080a0e';
    ctx.fillRect(0, 0, state.stageL, H);
    ctx.fillRect(state.stageR, 0, W - state.stageR, H);

    // Cornered zones (red paint) inside stage edges
    ctx.fillStyle = ZONE;
    ctx.fillRect(state.stageL, 60, CORNER_PX, STAGE_Y - 60);
    ctx.fillRect(state.stageR - CORNER_PX, 60, CORNER_PX, STAGE_Y - 60);

    // Walls
    ctx.strokeStyle = STAGE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(state.stageL, 60); ctx.lineTo(state.stageL, STAGE_Y);
    ctx.moveTo(state.stageR, 60); ctx.lineTo(state.stageR, STAGE_Y);
    ctx.stroke();

    // Stage line
    ctx.strokeStyle = STAGE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(state.stageL, STAGE_Y); ctx.lineTo(state.stageR, STAGE_Y);
    ctx.stroke();

    // HP bars
    const atkLabel = state.atkRole === 'A' ? 'P1 (atk)' : 'P2 (atk)';
    const defLabel = state.atkRole === 'A' ? 'P2 (def)' : 'P1 (def)';
    drawHPBar(20, 30, 280, state.hpAtk, ATK_COL, atkLabel);
    drawHPBar(W - 300, 30, 280, state.hpDef, DEF_COL, defLabel);

    // CORNERED overlay
    if (isDefenderCornered(state)) {
      ctx.fillStyle = '#ff4444';
      const pulse = 0.6 + 0.4 * Math.sin(state.elapsed * 8);
      ctx.globalAlpha = pulse;
      ctx.font = 'bold 14px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CORNERED', state.xDef, 100);
      ctx.globalAlpha = 1;
    }

    // Fighters
    const facing = state.xDef > state.xAtk ? +1 : -1;
    let atkMode = 'idle';
    if (state.phase === 'windup') atkMode = 'windup';
    else if (state.phase === 'resolve' && state.lastEvent === 'HIT' &&
             state.elapsed - state.lastEventAt < 0.18) atkMode = 'strike';
    else if (state.phase === 'counter') atkMode = 'hit';
    let defMode = 'idle';
    if (state.phase === 'windup' && state.phaseT > 0.16) defMode = 'block';
    else if (state.phase === 'counter') defMode = 'counter';
    else if (state.lastEvent === 'BLOCKED' && state.elapsed - state.lastEventAt < 0.18) defMode = 'block';
    else if (state.lastEvent === 'HIT' && state.elapsed - state.lastEventAt < 0.18) defMode = 'hit';

    drawFighter(state.xAtk, ATK_COL, facing, atkMode);
    drawFighter(state.xDef, DEF_COL, -facing, defMode);

    // Last-event banner
    if (state.lastEvent && state.elapsed - state.lastEventAt < 0.45) {
      const t = (state.elapsed - state.lastEventAt) / 0.45;
      const color = state.lastEvent === 'BLOCKED' ? BLOCK
                  : state.lastEvent === 'COUNTER!' ? COUNTER
                  :                                  '#ff4444';
      ctx.fillStyle = color;
      ctx.globalAlpha = 1 - t;
      ctx.font = 'bold 24px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.lastEvent, W / 2, 150);
      ctx.globalAlpha = 1;
    }

    // HUD
    ctx.fillStyle = MUTED;
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`exchanges ${state.exchangesTotal}   cornered ${state.corneredExchanges}`, 20, H - 14);
    ctx.textAlign = 'right';
    ctx.fillText(`stage ${state.stageWidth.toFixed(0)}px   pressure ${state.pressureStrength.toFixed(2)}`, W - 20, H - 14);

    if (state.phase === 'ko') {
      ctx.fillStyle = 'rgba(13,17,23,0.85)';
      ctx.fillRect(0, H / 2 - 40, W, 80);
      ctx.fillStyle = state.hpAtk <= 0 ? DEF_COL : ATK_COL;
      ctx.font = 'bold 36px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('K.O.', W / 2, H / 2 + 6);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Stage width change is structural (rewall the arena) → re-seed.
  if (params.stage_width !== state.stageWidth) {
    state.stageWidth = params.stage_width;
    state.pressureStrength = params.pressure_strength;
    state.cornerDisadvantage = params.corner_disadvantage;
    seed(state);
    return;
  }
  state.pressureStrength = params.pressure_strength;
  state.cornerDisadvantage = params.corner_disadvantage;
}
