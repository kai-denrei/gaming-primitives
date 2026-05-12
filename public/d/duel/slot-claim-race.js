// duel/slot-claim-race — central column of gate cells. A descending pulse
// pointer sweeps the column over `pulse_period` seconds. Auto-player (yellow,
// left) and AI (purple, right) commit chips into cells; the painted color of
// each cell at the moment the pulse passes is locked. Majority wins the round.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const COL_X = W / 2;        // column center x
const COL_W = 80;           // column width
const TOP_Y = 40;
const BOT_Y = H - 60;
const CELL_GAP = 4;

const NEUTRAL = 0, PLAYER = 1, AI = 2;
const COLORS = ['#2a2a3a', '#ffd23f', '#c83be0'];

function seed(state) {
  state.cells = new Array(state.cellCount).fill(NEUTRAL);
  state.locked = new Array(state.cellCount).fill(false);
  state.pulseT = 0;
  state.pTokens = Math.round(state.cellCount * 1.5);
  state.aTokens = Math.round(state.cellCount * 1.5);
  state.pCooldown = 0;
  state.aCooldown = 0;
  state.flashLane = new Array(state.cellCount).fill(-10);
  state.lastFlashSide = new Array(state.cellCount).fill(0);
  state.roundResult = null;       // 'player' | 'ai' | 'draw'
  state.roundEndAt = -10;
  state.elapsed = 0;
}

function cellRect(state, i) {
  const totalH = BOT_Y - TOP_Y;
  const cellH = (totalH - (state.cellCount - 1) * CELL_GAP) / state.cellCount;
  const y = TOP_Y + i * (cellH + CELL_GAP);
  return { x: COL_X - COL_W / 2, y, w: COL_W, h: cellH };
}

// Who is the "contested target"? Prefer the cell directly under the pulse,
// then unlocked neighbors. Player wants to flip the most-recently-purple cell;
// AI mirrors with the most-recently-yellow.
function pickTarget(state, side, pulseIdx) {
  // Side wants to overwrite the OTHER color, or claim a neutral cell.
  const other = side === PLAYER ? AI : PLAYER;
  let best = -1, bestScore = -Infinity;
  for (let i = 0; i < state.cellCount; i++) {
    if (state.locked[i]) continue;
    if (i < pulseIdx) continue; // past the pulse already
    let score = 0;
    if (state.cells[i] === other) score += 3;        // contested
    else if (state.cells[i] === NEUTRAL) score += 2;  // claim virgin
    else score += 0.2;                                // already ours
    // Prefer cells right under the pulse (most urgent).
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
  };
  seed(state);

  function tick(dt) {
    state.elapsed += dt;

    // Round complete?
    if (state.roundResult) {
      if (state.elapsed - state.roundEndAt > 1.0) seed(state);
      drawAll();
      return;
    }

    // Pulse moves linearly over pulse_period.
    state.pulseT += dt / state.pulsePeriod;

    // Lock cells the pulse has passed.
    const pulseIdx = Math.floor(state.pulseT * state.cellCount);
    for (let i = 0; i < Math.min(pulseIdx, state.cellCount); i++) {
      state.locked[i] = true;
    }

    // Pulse finished → tally.
    if (state.pulseT >= 1) {
      for (let i = 0; i < state.cellCount; i++) state.locked[i] = true;
      let p = 0, a = 0;
      for (const c of state.cells) { if (c === PLAYER) p++; else if (c === AI) a++; }
      state.roundResult = p > a ? 'player' : a > p ? 'ai' : 'draw';
      state.roundEndAt = state.elapsed;
      drawAll();
      return;
    }

    // Commit cadences. Token pool sized so each side can fire ~1.5× cellCount
    // chips over pulse_period; cooldown derives from that.
    const baseCooldown = state.pulsePeriod / (state.cellCount * 1.5);

    state.pCooldown -= dt;
    state.aCooldown -= dt;

    if (state.pCooldown <= 0 && state.pTokens > 0) {
      const target = pickTarget(state, PLAYER, pulseIdx);
      if (target !== -1) {
        // Skill controls whether the commit lands on the contested cell.
        const accurate = Math.random() < state.playerSkill;
        const idx = accurate ? target : Math.max(pulseIdx, Math.floor(Math.random() * state.cellCount));
        if (idx >= pulseIdx && idx < state.cellCount && !state.locked[idx]) {
          state.cells[idx] = PLAYER;
          state.flashLane[idx] = state.elapsed;
          state.lastFlashSide[idx] = PLAYER;
          state.pTokens--;
        }
      }
      state.pCooldown = baseCooldown * (0.8 + Math.random() * 0.4);
    }
    if (state.aCooldown <= 0 && state.aTokens > 0) {
      // AI aggression: at high aggression, AI commits faster (shorter cooldown).
      if (Math.random() < 0.4 + state.aiAgg * 0.6) {
        const target = pickTarget(state, AI, pulseIdx);
        if (target !== -1) {
          state.cells[target] = AI;
          state.flashLane[target] = state.elapsed;
          state.lastFlashSide[target] = AI;
          state.aTokens--;
        }
      }
      state.aCooldown = baseCooldown * (1.4 - state.aiAgg * 0.7);
    }

    drawAll();
  }

  function drawAll() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Side panels
    ctx.fillStyle = 'rgba(255,210,63,0.06)';
    ctx.fillRect(0, 0, COL_X - COL_W / 2 - 8, H);
    ctx.fillStyle = 'rgba(200,59,224,0.06)';
    ctx.fillRect(COL_X + COL_W / 2 + 8, 0, W - (COL_X + COL_W / 2 + 8), H);

    // Cells
    for (let i = 0; i < state.cellCount; i++) {
      const r = cellRect(state, i);
      ctx.fillStyle = COLORS[state.cells[i]];
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (state.locked[i]) {
        ctx.strokeStyle = '#e6edf3';
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      }
      // Flash on recent commit
      const since = state.elapsed - state.flashLane[i];
      if (since < 0.25) {
        const alpha = 1 - since / 0.25;
        ctx.strokeStyle = state.lastFlashSide[i] === PLAYER ? '#fff5b0' : '#f0c0ff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
        ctx.globalAlpha = 1;
      }
    }

    // Pulse pointer (continuous)
    const pulseY = TOP_Y + state.pulseT * (BOT_Y - TOP_Y);
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(COL_X - COL_W / 2 - 20, pulseY);
    ctx.lineTo(COL_X + COL_W / 2 + 20, pulseY);
    ctx.stroke();
    // Pointer triangles
    ctx.fillStyle = '#e6edf3';
    ctx.beginPath();
    ctx.moveTo(COL_X - COL_W / 2 - 22, pulseY);
    ctx.lineTo(COL_X - COL_W / 2 - 32, pulseY - 6);
    ctx.lineTo(COL_X - COL_W / 2 - 32, pulseY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(COL_X + COL_W / 2 + 22, pulseY);
    ctx.lineTo(COL_X + COL_W / 2 + 32, pulseY - 6);
    ctx.lineTo(COL_X + COL_W / 2 + 32, pulseY + 6);
    ctx.closePath();
    ctx.fill();

    // Pool counts
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillStyle = COLORS[PLAYER];
    ctx.textAlign = 'left';
    ctx.fillText(`pool ${state.pTokens}`, 16, 32);
    ctx.fillStyle = COLORS[AI];
    ctx.textAlign = 'right';
    ctx.fillText(`pool ${state.aTokens}`, W - 16, 32);

    // Result banner
    if (state.roundResult) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = state.roundResult === 'player' ? '#39ff14'
                    : state.roundResult === 'ai'     ? '#ff4444'
                    :                                  '#e6edf3';
      ctx.fillRect(0, H / 2 - 30, W, 60);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0d1117';
      ctx.font = 'bold 28px ui-monospace, monospace';
      ctx.textAlign = 'center';
      const label = state.roundResult === 'player' ? 'PLAYER'
                  : state.roundResult === 'ai'     ? 'AI'
                  :                                  'DRAW';
      ctx.fillText(label, W / 2, H / 2 + 10);
    }

    // HUD
    ctx.fillStyle = '#9aa4b2';
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`pulse ${(state.pulseT * 100).toFixed(0)}%`, 16, H - 14);
    ctx.textAlign = 'right';
    let p = 0, a = 0;
    for (const c of state.cells) { if (c === PLAYER) p++; else if (c === AI) a++; }
    ctx.fillText(`${p} : ${a}`, W - 16, H - 14);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Structural: cell_count → re-seed.
  if (params.cell_count !== state.cellCount) {
    state.cellCount = params.cell_count;
    state.pulsePeriod = params.pulse_period;
    state.aiAgg = params.ai_aggression;
    state.playerSkill = params.player_skill;
    seed(state);
    return;
  }
  state.pulsePeriod = params.pulse_period;
  state.aiAgg = params.ai_aggression;
  state.playerSkill = params.player_skill;
}
