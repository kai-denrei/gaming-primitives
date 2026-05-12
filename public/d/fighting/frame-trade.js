// fighting/frame-trade — Two stick-figure fighters trade simultaneous strikes.
// Each exchange fires at auto_pace; the side with the shorter startup wins the
// trade, ties broken by p1_priority. Loser eats 10 HP. K.O. resets both bars.
// Frame-bar overlays during windup make startup difference legible.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const STAGE_Y    = H - 60;       // ground line
const P1_X       = 220;
const P2_X       = W - 220;
const FIGHTER_H  = 130;
const HP_MAX     = 100;
const HIT_DAMAGE = 10;

const BG       = '#0d1117';
const STAGE    = '#2a2a3a';
const P1_COL   = '#ff4444';
const P2_COL   = '#5e8fff';
const STRIKE   = '#ffd23f';
const HIT_FLASH= '#ff4444';
const FG       = '#e6edf3';
const MUTED    = '#9aa4b2';

function seed(state) {
  state.hp1 = HP_MAX;
  state.hp2 = HP_MAX;
  state.elapsed = 0;
  state.phase = 'idle';     // 'idle' → 'windup' → 'resolve' → 'idle', or 'ko'
  state.phaseT = 0;
  state.windupProgress1 = 0; // 0..1 fraction of startup elapsed
  state.windupProgress2 = 0;
  state.lastResolve = null;  // 'p1' | 'p2' | 'tie' (which side won the trade)
  state.lastResolveAt = -10;
  state.koAt = -10;
  state.exchanges = 0;
  state.p1Wins = 0;
  state.p2Wins = 0;
}

export function init(ctx, params, env) {
  const state = {
    p1Startup: params.p1_startup,
    p2Startup: params.p2_startup,
    p1Priority: params.p1_priority,
    autoPace: params.auto_pace,
  };
  seed(state);

  function beginExchange() {
    state.phase = 'windup';
    state.phaseT = 0;
    state.windupProgress1 = 0;
    state.windupProgress2 = 0;
  }

  function resolveExchange() {
    const s1 = state.p1Startup;
    const s2 = state.p2Startup;
    let winner;
    if (s1 < s2) winner = 'p1';
    else if (s2 < s1) winner = 'p2';
    else winner = Math.random() < state.p1Priority ? 'p1' : 'p2';
    state.lastResolve = winner;
    state.lastResolveAt = state.elapsed;
    state.exchanges++;
    if (winner === 'p1') { state.hp2 -= HIT_DAMAGE; state.p1Wins++; }
    else                 { state.hp1 -= HIT_DAMAGE; state.p2Wins++; }
    state.phase = 'resolve';
    state.phaseT = 0;
    if (state.hp1 <= 0 || state.hp2 <= 0) {
      state.phase = 'ko';
      state.koAt = state.elapsed;
    }
  }

  function tick(dt) {
    state.elapsed += dt;
    state.phaseT += dt;

    // Exchange cadence: one full cycle per (1 / autoPace) seconds.
    const cyclePeriod = 1 / state.autoPace;
    // Windup duration is proportional to the slowest startup so the longer
    // bar is visibly fuller before resolution. 20 frames ~= 0.333s @ 60fps.
    const maxStartup = Math.max(state.p1Startup, state.p2Startup);
    const windupDur = Math.min(maxStartup / 60, cyclePeriod * 0.7);

    if (state.phase === 'ko') {
      if (state.elapsed - state.koAt > 1.5) {
        state.hp1 = HP_MAX;
        state.hp2 = HP_MAX;
        state.phase = 'idle';
        state.phaseT = 0;
      }
    } else if (state.phase === 'idle') {
      if (state.phaseT >= cyclePeriod - windupDur) beginExchange();
    } else if (state.phase === 'windup') {
      state.windupProgress1 = Math.min(1, state.phaseT / (state.p1Startup / 60));
      state.windupProgress2 = Math.min(1, state.phaseT / (state.p2Startup / 60));
      if (state.phaseT >= windupDur) resolveExchange();
    } else if (state.phase === 'resolve') {
      // Hold for short flash, then back to idle.
      if (state.phaseT >= 0.35) { state.phase = 'idle'; state.phaseT = 0; }
    }

    draw();
  }

  function drawFighter(x, hp, color, facing, windup, struckThisFrame, isWinnerOfTrade) {
    // facing: +1 = facing right (P1), -1 = facing left (P2)
    const headY = STAGE_Y - FIGHTER_H + 14;
    const torsoTopY = headY + 18;
    const torsoBotY = headY + 60;
    // Recoil if struck on this trade.
    let dx = 0;
    if (struckThisFrame) dx = -facing * 6;

    // Hit flash
    ctx.save();
    ctx.translate(dx, 0);

    // Strike-extending arm if winner of latest trade and within flash window.
    const armExtended = (state.phase === 'resolve' && isWinnerOfTrade);
    const inWindup = (state.phase === 'windup');

    // Head
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, headY, 12, 0, Math.PI * 2);
    ctx.stroke();
    // Torso
    ctx.beginPath();
    ctx.moveTo(x, torsoTopY);
    ctx.lineTo(x, torsoBotY);
    ctx.stroke();
    // Legs
    ctx.beginPath();
    ctx.moveTo(x, torsoBotY);
    ctx.lineTo(x - 12, STAGE_Y);
    ctx.moveTo(x, torsoBotY);
    ctx.lineTo(x + 12, STAGE_Y);
    ctx.stroke();
    // Back arm (rear)
    ctx.beginPath();
    ctx.moveTo(x, torsoTopY + 6);
    ctx.lineTo(x - facing * 12, torsoTopY + 22);
    ctx.stroke();
    // Front arm: extended if punching, drawn back if winding up, neutral otherwise
    let armEndX, armEndY;
    if (armExtended) {
      armEndX = x + facing * 42;
      armEndY = torsoTopY + 10;
      // Fist
      ctx.fillStyle = STRIKE;
      ctx.beginPath();
      ctx.arc(armEndX, armEndY, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (inWindup) {
      const wp = facing === 1 ? state.windupProgress1 : state.windupProgress2;
      const dxArm = -facing * (8 + wp * 6);
      armEndX = x + dxArm;
      armEndY = torsoTopY + 10;
    } else {
      armEndX = x + facing * 14;
      armEndY = torsoTopY + 18;
    }
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, torsoTopY + 6);
    ctx.lineTo(armEndX, armEndY);
    ctx.stroke();

    // Hit flash overlay on body
    if (struckThisFrame) {
      ctx.fillStyle = `rgba(255,68,68,0.35)`;
      ctx.fillRect(x - 18, headY - 12, 36, FIGHTER_H + 8);
    }

    ctx.restore();
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

  function drawFrameBar(x, y, w, progress, startup, color) {
    // Small bar that fills as the startup elapses. Width below fighter.
    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * progress, 6);
    ctx.strokeStyle = STAGE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 5);
    ctx.fillStyle = MUTED;
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${startup}f`, x + w / 2, y + 18);
  }

  function draw() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // Stage line
    ctx.strokeStyle = STAGE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, STAGE_Y); ctx.lineTo(W, STAGE_Y);
    ctx.stroke();

    // HP bars
    drawHPBar(20, 30, 280, state.hp1, P1_COL, 'P1');
    drawHPBar(W - 300, 30, 280, state.hp2, P2_COL, 'P2');

    // Title
    ctx.fillStyle = MUTED;
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`exchanges ${state.exchanges}   ·   P1 ${state.p1Wins}  P2 ${state.p2Wins}`, W / 2, 22);

    // Fighters
    const p1Struck = (state.phase === 'resolve' && state.lastResolve === 'p2' &&
                       state.elapsed - state.lastResolveAt < 0.25);
    const p2Struck = (state.phase === 'resolve' && state.lastResolve === 'p1' &&
                       state.elapsed - state.lastResolveAt < 0.25);
    const p1Won = state.lastResolve === 'p1';
    const p2Won = state.lastResolve === 'p2';
    drawFighter(P1_X, state.hp1, P1_COL, +1, state.windupProgress1, p1Struck, p1Won);
    drawFighter(P2_X, state.hp2, P2_COL, -1, state.windupProgress2, p2Struck, p2Won);

    // Frame bars during windup
    if (state.phase === 'windup') {
      drawFrameBar(P1_X - 30, STAGE_Y + 12, 60, state.windupProgress1, state.p1Startup, P1_COL);
      drawFrameBar(P2_X - 30, STAGE_Y + 12, 60, state.windupProgress2, state.p2Startup, P2_COL);
    }

    // K.O. banner
    if (state.phase === 'ko') {
      ctx.fillStyle = 'rgba(13,17,23,0.85)';
      ctx.fillRect(0, H / 2 - 40, W, 80);
      ctx.fillStyle = state.hp1 <= 0 ? P2_COL : P1_COL;
      ctx.font = 'bold 36px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('K.O.', W / 2, H / 2 + 6);
      ctx.fillStyle = MUTED;
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillText(`${state.hp1 <= 0 ? 'P2' : 'P1'} wins this round`, W / 2, H / 2 + 26);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.p1Startup  = params.p1_startup;
  state.p2Startup  = params.p2_startup;
  state.p1Priority = params.p1_priority;
  state.autoPace   = params.auto_pace;
}
