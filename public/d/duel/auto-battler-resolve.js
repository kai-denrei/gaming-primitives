// duel/auto-battler-resolve — two teams on horizontal rows face off. Each
// combat tick, every unit picks its nearest live enemy in range and deals
// damage. Units die at hp ≤ 0. Round ends when one team is wiped; re-seed
// after a brief pause.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const PLAYER_X = 160;
const AI_X = W - 160;
const ROW_TOP = 80;
const ROW_BOT = H - 80;
const UNIT_R = 18;

const PLAYER_COLOR = '#ffd23f';
const AI_COLOR     = '#c83be0';

function makeUnit(side, idx, total, variance) {
  // Base stats with optional variance.
  const baseHp = 10, baseDmg = 2.4, baseRange = 220;
  const v = variance;
  const hp = baseHp * (1 + (Math.random() * 2 - 1) * v * 0.6);
  const dmg = baseDmg * (1 + (Math.random() * 2 - 1) * v * 0.6);
  const range = baseRange + (Math.random() - 0.5) * 80 * v;
  const x = side === 'player' ? PLAYER_X : AI_X;
  const y = ROW_TOP + (idx + 0.5) / total * (ROW_BOT - ROW_TOP);
  return {
    side,
    hpMax: hp,
    hp,
    dmg,
    range,
    x, y,
    flash: -10,
    targetIdx: -1,
    targetSide: null,
  };
}

function seed(state) {
  state.player = [];
  state.ai = [];
  for (let i = 0; i < state.teamSize; i++) {
    state.player.push(makeUnit('player', i, state.teamSize, state.variance));
    state.ai.push(makeUnit('ai', i, state.teamSize, state.variance));
  }
  state.tickAccum = 0;
  state.tickCount = 0;
  state.attacks = [];           // {fromSide, fromIdx, toSide, toIdx, t}
  state.roundEnd = null;        // 'player' | 'ai' | 'draw'
  state.roundEndAt = -10;
  state.elapsed = 0;
}

function nearestEnemy(state, unit) {
  const enemies = unit.side === 'player' ? state.ai : state.player;
  let bestIdx = -1, bestD = Infinity;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.hp <= 0) continue;
    const d = Math.hypot(e.x - unit.x, e.y - unit.y);
    if (d < bestD) { bestD = d; bestIdx = i; }
  }
  return { idx: bestIdx, dist: bestD };
}

export function init(ctx, params, env) {
  const state = {
    teamSize: params.team_size,
    tickRate: params.tick_rate,
    variance: params.unit_variance,
    autoRestart: params.auto_restart,
  };
  seed(state);

  function doCombatTick() {
    state.tickCount++;
    // Snapshot damage to apply simultaneously.
    const damage = { player: new Array(state.player.length).fill(0),
                     ai:     new Array(state.ai.length).fill(0) };
    const newAttacks = [];
    const all = [...state.player, ...state.ai];
    for (const u of all) {
      if (u.hp <= 0) continue;
      const { idx, dist } = nearestEnemy(state, u);
      if (idx === -1 || dist > u.range) continue;
      const targetSide = u.side === 'player' ? 'ai' : 'player';
      const tgt = (targetSide === 'player' ? state.player : state.ai)[idx];
      if (tgt.hp <= 0) continue;
      damage[targetSide][idx] += u.dmg;
      newAttacks.push({
        x1: u.x, y1: u.y, x2: tgt.x, y2: tgt.y,
        targetSide, targetIdx: idx,
        bornAt: state.elapsed,
      });
    }
    // Apply damage
    for (let i = 0; i < state.player.length; i++) {
      if (damage.player[i] > 0) {
        state.player[i].hp -= damage.player[i];
        state.player[i].flash = state.elapsed;
      }
    }
    for (let i = 0; i < state.ai.length; i++) {
      if (damage.ai[i] > 0) {
        state.ai[i].hp -= damage.ai[i];
        state.ai[i].flash = state.elapsed;
      }
    }
    state.attacks.push(...newAttacks);

    // Round-end check
    const pAlive = state.player.some(u => u.hp > 0);
    const aAlive = state.ai.some(u => u.hp > 0);
    if (!pAlive || !aAlive) {
      state.roundEnd = !pAlive && !aAlive ? 'draw' : !aAlive ? 'player' : 'ai';
      state.roundEndAt = state.elapsed;
    }
  }

  function tick(dt) {
    state.elapsed += dt;

    if (state.roundEnd) {
      if (state.autoRestart && state.elapsed - state.roundEndAt > 1.0) {
        seed(state);
      }
    } else {
      // Combat ticks
      state.tickAccum += dt * state.tickRate;
      while (state.tickAccum >= 1) {
        state.tickAccum -= 1;
        doCombatTick();
        if (state.roundEnd) break;
      }
    }

    // Cull old attack lines
    state.attacks = state.attacks.filter(a => state.elapsed - a.bornAt < 0.18);

    // === Render ===
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Divider line
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(W / 2, ROW_TOP - 20);
    ctx.lineTo(W / 2, ROW_BOT + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Attack lines
    for (const a of state.attacks) {
      const t = (state.elapsed - a.bornAt) / 0.18;
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - t)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x1, a.y1);
      ctx.lineTo(a.x2, a.y2);
      ctx.stroke();
    }

    // Draw units
    function drawTeam(units, color) {
      for (const u of units) {
        if (u.hp <= 0) {
          ctx.fillStyle = 'rgba(80,80,80,0.4)';
          ctx.beginPath();
          ctx.arc(u.x, u.y, UNIT_R, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#3a3a3a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(u.x - UNIT_R * 0.6, u.y - UNIT_R * 0.6);
          ctx.lineTo(u.x + UNIT_R * 0.6, u.y + UNIT_R * 0.6);
          ctx.moveTo(u.x + UNIT_R * 0.6, u.y - UNIT_R * 0.6);
          ctx.lineTo(u.x - UNIT_R * 0.6, u.y + UNIT_R * 0.6);
          ctx.stroke();
          continue;
        }
        const flash = state.elapsed - u.flash < 0.12;
        ctx.fillStyle = flash ? '#ff5555' : color;
        ctx.beginPath();
        ctx.arc(u.x, u.y, UNIT_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0d1117';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // HP bar
        const barW = UNIT_R * 2;
        const barH = 4;
        const bx = u.x - UNIT_R, by = u.y + UNIT_R + 4;
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(bx, by, barW, barH);
        const frac = Math.max(0, u.hp / u.hpMax);
        ctx.fillStyle = frac > 0.5 ? '#39ff14' : frac > 0.25 ? '#ffd23f' : '#ff4444';
        ctx.fillRect(bx, by, barW * frac, barH);
      }
    }
    drawTeam(state.player, PLAYER_COLOR);
    drawTeam(state.ai, AI_COLOR);

    // Result banner
    if (state.roundEnd) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = state.roundEnd === 'player' ? '#39ff14'
                    : state.roundEnd === 'ai'     ? '#ff4444'
                    :                                '#e6edf3';
      ctx.fillRect(0, H / 2 - 28, W, 56);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0d1117';
      ctx.font = 'bold 24px ui-monospace, monospace';
      ctx.textAlign = 'center';
      const label = state.roundEnd === 'player' ? 'PLAYER WINS'
                  : state.roundEnd === 'ai'     ? 'AI WINS'
                  :                                'DRAW';
      ctx.fillText(label, W / 2, H / 2 + 8);
    }

    // HUD
    ctx.fillStyle = '#9aa4b2';
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`tick ${state.tickCount}  ·  ${state.tickRate.toFixed(1)}/s`, 12, 18);
    ctx.textAlign = 'right';
    const pAlive = state.player.filter(u => u.hp > 0).length;
    const aAlive = state.ai.filter(u => u.hp > 0).length;
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillText(`${pAlive} live`, W / 2 - 12, 18);
    ctx.fillStyle = AI_COLOR;
    ctx.textAlign = 'left';
    ctx.fillText(`${aAlive} live`, W / 2 + 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Structural: team_size or unit_variance → re-seed.
  if (params.team_size !== state.teamSize || params.unit_variance !== state.variance) {
    state.teamSize = params.team_size;
    state.variance = params.unit_variance;
    state.tickRate = params.tick_rate;
    state.autoRestart = params.auto_restart;
    seed(state);
    return;
  }
  state.tickRate = params.tick_rate;
  state.autoRestart = params.auto_restart;
}
