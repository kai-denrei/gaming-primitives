// duel/slot-claim-race — Paradroid-style takeover puzzle.
// Two sides race to commit chips into a central column of logic-gate cells
// before a descending pulse pointer locks each cell's color. Visual vocabulary
// matches the original 1985 Hewson cabinet: side pools, row pointers, wires,
// droid class badges, chip-fly animations along wires.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

// Layout regions
const TOP_BAR = 56;
const BOT_PAD = 28;
const POOL_W  = 56;
const POOL_PAD = 18;
const POOL_X_L = POOL_PAD;
const POOL_X_R = W - POOL_PAD - POOL_W;
const COL_W = 72;
const COL_X = W / 2 - COL_W / 2;
const ROWS_TOP = TOP_BAR + 22;
const ROWS_BOT = H - BOT_PAD - 24;
const FIELD_H  = ROWS_BOT - ROWS_TOP;

const NEUTRAL = 0, PLAYER = 1, AI = 2;
const CHIP_YEL  = '#ffd23f';
const CHIP_PUR  = '#c83be0';
const CHIP_DIM_YEL = '#5a4818';
const CHIP_DIM_PUR = '#3e1a4a';
const FG = '#e6edf3';
const MUTED = '#9aa4b2';
const BG = '#0d1117';
const WIRE_DIM = '#2a2a3a';

function randClass(min, max) { return min + Math.floor(Math.random() * (max - min)); }

function seed(state, fresh) {
  state.cells   = new Array(state.cellCount).fill(NEUTRAL);
  state.locked  = new Array(state.cellCount).fill(false);
  state.flashAt = new Array(state.cellCount).fill(-10);
  state.flashSide = new Array(state.cellCount).fill(0);
  state.pulseT = 0;
  state.pTokens = Math.round(state.cellCount * 1.6);
  state.aTokens = Math.round(state.cellCount * 1.6);
  state.pPointer = 0;
  state.aPointer = state.cellCount - 1;
  state.pAimTarget = 0;
  state.aAimTarget = state.cellCount - 1;
  state.pNextFire = 0.6;
  state.aNextFire = 0.6;
  state.pNextAim = 0.3;
  state.aNextAim = 0.3;
  state.flights = [];   // {side, row, t}
  state.roundResult = null;
  state.roundEndAt = -10;
  if (fresh) {
    state.playerClass = randClass(100, 500);
    state.aiClass     = randClass(state.playerClass + 100, 999);
  }
}

function cellRect(state, i) {
  const cellH = FIELD_H / state.cellCount;
  return {
    x: COL_X,
    y: ROWS_TOP + i * cellH + 2,
    w: COL_W,
    h: cellH - 4,
    cy: ROWS_TOP + i * cellH + cellH / 2,
  };
}

// Pick which row the side wants to be aiming at right now.
function pickTarget(state, side, pulseIdx) {
  const other = side === PLAYER ? AI : PLAYER;
  let best = -1, bestScore = -Infinity;
  for (let i = 0; i < state.cellCount; i++) {
    if (state.locked[i]) continue;
    if (i < pulseIdx) continue;
    let score = 0;
    if (state.cells[i] === other) score += 3;
    else if (state.cells[i] === NEUTRAL) score += 2;
    else score += 0.2;
    score += 5 / (1 + (i - pulseIdx));
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

export function init(ctx, params, env) {
  const state = {
    cellCount: params.cell_count,
    pulsePeriod: params.pulse_period,
    aiAgg: params.ai_aggression,
    playerSkill: params.player_skill,
    elapsed: 0,
    score: 0,
  };
  seed(state, true);

  function fire(side, row) {
    if (row < 0 || row >= state.cellCount || state.locked[row]) return false;
    const pool = side === PLAYER ? 'pTokens' : 'aTokens';
    if (state[pool] <= 0) return false;
    state[pool]--;
    state.flights.push({ side, row, t: 0 });
    return true;
  }

  function tick(dt) {
    state.elapsed += dt;

    // Mid-round-end pause then auto-restart.
    if (state.roundResult) {
      if (state.elapsed - state.roundEndAt > 1.6) seed(state, true);
      drawAll();
      return;
    }

    state.pulseT += dt / state.pulsePeriod;
    const pulseIdx = Math.floor(state.pulseT * state.cellCount);
    for (let i = 0; i < Math.min(pulseIdx, state.cellCount); i++) state.locked[i] = true;

    if (state.pulseT >= 1) {
      for (let i = 0; i < state.cellCount; i++) state.locked[i] = true;
      let p = 0, a = 0;
      for (const c of state.cells) { if (c === PLAYER) p++; else if (c === AI) a++; }
      state.roundResult = p > a ? 'player' : a > p ? 'ai' : 'draw';
      state.roundEndAt = state.elapsed;
      if (state.roundResult === 'player') state.score += state.aiClass;
      drawAll();
      return;
    }

    // === Player AI: aim then fire ===
    state.pNextAim -= dt;
    if (state.pNextAim <= 0) {
      const t = pickTarget(state, PLAYER, pulseIdx);
      if (t >= 0) {
        // Skill biases toward optimal target; low skill picks any reachable row.
        if (Math.random() < state.playerSkill) state.pAimTarget = t;
        else state.pAimTarget = Math.max(pulseIdx, Math.floor(Math.random() * state.cellCount));
      }
      state.pNextAim = 0.18 + Math.random() * 0.16;
    }
    // Pointer moves toward aim target (1 row per tick interval).
    if (state.pPointer < state.pAimTarget) state.pPointer = Math.min(state.pPointer + 1, state.pAimTarget);
    else if (state.pPointer > state.pAimTarget) state.pPointer = Math.max(state.pPointer - 1, state.pAimTarget);

    state.pNextFire -= dt;
    if (state.pNextFire <= 0 && state.pPointer === state.pAimTarget) {
      if (fire(PLAYER, state.pPointer)) {
        state.pNextFire = 0.32 + Math.random() * 0.16;
      } else {
        state.pNextFire = 0.18;
      }
    }

    // === AI: aim then fire, modulated by aggression ===
    state.aNextAim -= dt;
    if (state.aNextAim <= 0) {
      const t = pickTarget(state, AI, pulseIdx);
      if (t >= 0) state.aAimTarget = t;
      state.aNextAim = 0.20 + Math.random() * 0.18;
    }
    if (state.aPointer < state.aAimTarget) state.aPointer = Math.min(state.aPointer + 1, state.aAimTarget);
    else if (state.aPointer > state.aAimTarget) state.aPointer = Math.max(state.aPointer - 1, state.aAimTarget);

    state.aNextFire -= dt;
    if (state.aNextFire <= 0 && state.aPointer === state.aAimTarget) {
      // Aggression: higher = faster recovery between fires.
      const baseDelay = 0.55 - state.aiAgg * 0.32;
      if (fire(AI, state.aPointer)) state.aNextFire = baseDelay + Math.random() * 0.18;
      else state.aNextFire = 0.18;
    }

    // === Flights: advance, deliver on arrival ===
    const FLIGHT_S = 0.22;
    for (const f of state.flights) f.t += dt / FLIGHT_S;
    const arrived = state.flights.filter(f => f.t >= 1);
    state.flights = state.flights.filter(f => f.t < 1);
    for (const f of arrived) {
      if (!state.locked[f.row]) {
        state.cells[f.row] = f.side;
        state.flashAt[f.row] = state.elapsed;
        state.flashSide[f.row] = f.side;
      }
    }

    drawAll();
  }

  function drawBadge(cx, cy, label, color) {
    ctx.fillStyle = '#161b22';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 13px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + 1);
    ctx.textBaseline = 'alphabetic';
  }

  function drawAll() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // Top bar: badges + title + countdown + score
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, W, TOP_BAR);
    ctx.strokeStyle = WIRE_DIM;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, TOP_BAR); ctx.lineTo(W, TOP_BAR); ctx.stroke();

    drawBadge(POOL_X_L + POOL_W / 2, TOP_BAR / 2, String(state.playerClass), CHIP_YEL);
    drawBadge(POOL_X_R + POOL_W / 2, TOP_BAR / 2, String(state.aiClass), CHIP_PUR);

    ctx.fillStyle = FG;
    ctx.font = 'bold 16px ui-monospace, monospace';
    ctx.textAlign = 'center';
    const finish = Math.max(0, Math.round((1 - state.pulseT) * 100));
    ctx.fillText(`Finish ~${String(finish).padStart(2, '0')}   ◆   takeover`, W / 2, 24);
    ctx.fillStyle = MUTED;
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`score ${state.score}`, W / 2, 42);

    // === Side pools (yellow left, purple right) ===
    drawPool(POOL_X_L, state.pTokens, Math.round(state.cellCount * 1.6), CHIP_YEL, CHIP_DIM_YEL);
    drawPool(POOL_X_R, state.aTokens, Math.round(state.cellCount * 1.6), CHIP_PUR, CHIP_DIM_PUR);

    // === Wires (faint) per row, plus active wire for each side ===
    const cellH = FIELD_H / state.cellCount;
    for (let i = 0; i < state.cellCount; i++) {
      const y = ROWS_TOP + i * cellH + cellH / 2;
      ctx.strokeStyle = WIRE_DIM;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(POOL_X_L + POOL_W, y);
      ctx.lineTo(COL_X, y);
      ctx.moveTo(COL_X + COL_W, y);
      ctx.lineTo(POOL_X_R, y);
      ctx.stroke();
    }
    // Highlighted wire for each side's active pointer.
    const drawActiveWire = (row, color, isLeft) => {
      const y = ROWS_TOP + row * cellH + cellH / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (isLeft) { ctx.moveTo(POOL_X_L + POOL_W, y); ctx.lineTo(COL_X, y); }
      else        { ctx.moveTo(COL_X + COL_W, y);     ctx.lineTo(POOL_X_R, y); }
      ctx.stroke();
    };
    drawActiveWire(state.pPointer, CHIP_YEL, true);
    drawActiveWire(state.aPointer, CHIP_PUR, false);

    // === Pointers (triangles at edge of each pool) ===
    drawPointer(POOL_X_L + POOL_W + 4, ROWS_TOP + state.pPointer * cellH + cellH / 2, CHIP_YEL, true);
    drawPointer(POOL_X_R - 4, ROWS_TOP + state.aPointer * cellH + cellH / 2, CHIP_PUR, false);

    // === Central column cells ===
    for (let i = 0; i < state.cellCount; i++) {
      const r = cellRect(state, i);
      const c = state.cells[i];
      ctx.fillStyle = c === NEUTRAL ? '#1a1d24' : c === PLAYER ? CHIP_YEL : CHIP_PUR;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (state.locked[i]) {
        ctx.strokeStyle = FG;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 1.5);
      } else {
        ctx.strokeStyle = WIRE_DIM;
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      }
      // Recent-commit flash
      const since = state.elapsed - state.flashAt[i];
      if (since < 0.3) {
        const alpha = 1 - since / 0.3;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = state.flashSide[i] === PLAYER ? '#fff5b0' : '#f4d0ff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
        ctx.globalAlpha = 1;
      }
    }

    // === In-flight chips ===
    for (const f of state.flights) {
      const row = f.row;
      const yPos = ROWS_TOP + row * cellH + cellH / 2;
      const fromX = f.side === PLAYER ? POOL_X_L + POOL_W : POOL_X_R;
      const toX   = f.side === PLAYER ? COL_X            : COL_X + COL_W;
      const x = fromX + (toX - fromX) * f.t;
      ctx.fillStyle = f.side === PLAYER ? CHIP_YEL : CHIP_PUR;
      ctx.fillRect(x - 4, yPos - 4, 8, 8);
    }

    // === Pulse pointer descending the central column ===
    const pulseY = ROWS_TOP + state.pulseT * FIELD_H;
    ctx.strokeStyle = FG;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(COL_X - 8, pulseY);
    ctx.lineTo(COL_X + COL_W + 8, pulseY);
    ctx.stroke();
    ctx.setLineDash([]);
    // Pulse caret
    ctx.fillStyle = FG;
    ctx.beginPath();
    ctx.moveTo(COL_X + COL_W + 10, pulseY);
    ctx.lineTo(COL_X + COL_W + 18, pulseY - 5);
    ctx.lineTo(COL_X + COL_W + 18, pulseY + 5);
    ctx.closePath();
    ctx.fill();

    // === Pool count labels ===
    ctx.fillStyle = CHIP_YEL;
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.pTokens}`, POOL_X_L + POOL_W / 2, H - 10);
    ctx.fillStyle = CHIP_PUR;
    ctx.fillText(`${state.aTokens}`, POOL_X_R + POOL_W / 2, H - 10);

    // === Score line: yellow vs purple cell tally ===
    let p = 0, a = 0;
    for (const c of state.cells) { if (c === PLAYER) p++; else if (c === AI) a++; }
    ctx.fillStyle = FG;
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${p}`, COL_X - 30, H - 10);
    ctx.textAlign = 'right';
    ctx.fillText(`${a}`, COL_X + COL_W + 30, H - 10);

    // === End-of-round banner ===
    if (state.roundResult) {
      ctx.fillStyle = 'rgba(13,17,23,0.85)';
      ctx.fillRect(0, H / 2 - 38, W, 76);
      const isWin  = state.roundResult === 'player';
      const isDraw = state.roundResult === 'draw';
      ctx.fillStyle = isWin ? '#39ff14' : isDraw ? FG : '#ff4444';
      ctx.font = 'bold 28px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isWin ? 'TAKEOVER' : isDraw ? 'DRAW' : 'DESTROYED', W / 2, H / 2 + 2);
      ctx.fillStyle = MUTED;
      ctx.font = '12px ui-monospace, monospace';
      const tag = isWin  ? `+${state.aiClass} → host ${state.aiClass}`
                : isDraw ? `pulse expired, neutral`
                :          `Influence Device lost`;
      ctx.fillText(tag, W / 2, H / 2 + 24);
    }
  }

  function drawPool(x, count, max, fillCol, dimCol) {
    // Vertical column of chip slots, top-down. Filled slots use fillCol.
    const slotH = (FIELD_H - 4) / max;
    for (let i = 0; i < max; i++) {
      const y = ROWS_TOP + i * slotH + 2;
      ctx.fillStyle = i < count ? fillCol : dimCol;
      // Chip drawn as a small chevron pointing toward the field center
      const cx = x + POOL_W / 2;
      const cy = y + slotH / 2;
      const pointRight = x < W / 2;
      ctx.beginPath();
      if (pointRight) {
        ctx.moveTo(cx + 12, cy);
        ctx.lineTo(cx - 10, cy - 5);
        ctx.lineTo(cx - 10, cy + 5);
      } else {
        ctx.moveTo(cx - 12, cy);
        ctx.lineTo(cx + 10, cy - 5);
        ctx.lineTo(cx + 10, cy + 5);
      }
      ctx.closePath();
      ctx.fill();
    }
    // Pool border
    ctx.strokeStyle = WIRE_DIM;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, ROWS_TOP + 0.5, POOL_W - 1, FIELD_H - 1);
  }

  function drawPointer(x, y, color, pointRight) {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (pointRight) {
      ctx.moveTo(x, y); ctx.lineTo(x - 10, y - 6); ctx.lineTo(x - 10, y + 6);
    } else {
      ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 6); ctx.lineTo(x + 10, y + 6);
    }
    ctx.closePath();
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (params.cell_count !== state.cellCount) {
    state.cellCount = params.cell_count;
    state.pulsePeriod = params.pulse_period;
    state.aiAgg = params.ai_aggression;
    state.playerSkill = params.player_skill;
    seed(state, true);
    return;
  }
  state.pulsePeriod = params.pulse_period;
  state.aiAgg = params.ai_aggression;
  state.playerSkill = params.player_skill;
}
