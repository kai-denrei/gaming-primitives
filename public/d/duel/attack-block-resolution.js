// duel/attack-block-resolution — Magic: the Gathering combat. Top row attacks,
// bottom row blocks via a greedy heuristic (largest unblocked threat first).
// Each pairing exchanges simultaneous damage = the other side's power. Both
// die when damage ≥ toughness. Unblocked attackers hit life total.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const ATTACKER_ROW_Y = 110;
const BLOCKER_ROW_Y = H - 130;
const CARD_W = 80;
const CARD_H = 100;

const ATTACKER_COLOR = '#c83be0';   // opposing side
const BLOCKER_COLOR  = '#ffd23f';   // player side

// Phases: 'declare' (1s) → 'block' (1s) → 'damage' (instant flash) → 'rest'
function makeCreature(variance) {
  const baseP = 3, baseT = 3;
  const v = variance;
  const p = Math.max(1, Math.round(baseP + (Math.random() * 2 - 1) * baseP * v));
  const t = Math.max(1, Math.round(baseT + (Math.random() * 2 - 1) * baseT * v));
  return { p, t, dmg: 0, dead: false };
}

function seed(state) {
  state.attackers = [];
  state.blockers = [];
  for (let i = 0; i < state.attackerCount; i++) state.attackers.push(makeCreature(state.variance));
  for (let i = 0; i < state.blockerCount; i++)  state.blockers.push(makeCreature(state.variance));
  state.pairings = new Array(state.attackerCount).fill(-1);   // blocker index assigned to each attacker
  state.phase = 'declare';
  state.phaseT = 0;
  state.roundT = 0;
  state.lifeP = state.lifeP ?? 20;
  state.lifeA = state.lifeA ?? 20;
  state.damageFlashes = [];   // {at, who: 'a'|'b', idx, amt}
  state.elapsed = 0;
}

function attackerX(state, i) {
  const cx = W / 2;
  const totalW = state.attackerCount * CARD_W + (state.attackerCount - 1) * 16;
  return cx - totalW / 2 + i * (CARD_W + 16);
}
function blockerX(state, i) {
  const cx = W / 2;
  const totalW = state.blockerCount * CARD_W + (state.blockerCount - 1) * 16;
  return cx - totalW / 2 + i * (CARD_W + 16);
}

// Greedy block assignment: sort attackers by power desc, assign each the
// smallest available blocker whose toughness > attacker.power if possible,
// else the largest blocker available. Keeps a couple of blockers in reserve
// when attackers outnumber blockers.
function assignBlocks(state) {
  state.pairings = new Array(state.attackerCount).fill(-1);
  const attackerOrder = state.attackers
    .map((a, i) => ({ a, i }))
    .sort((x, y) => y.a.p - x.a.p);
  const usedB = new Set();
  for (const { a, i } of attackerOrder) {
    let best = -1, bestScore = -Infinity;
    for (let bi = 0; bi < state.blockers.length; bi++) {
      if (usedB.has(bi)) continue;
      const b = state.blockers[bi];
      // Prefer blocker that survives (t > a.p) but uses least toughness.
      let score;
      if (b.t > a.p) score = 100 - (b.t - a.p);    // efficient survival
      else score = 50 - (a.p - b.t) + b.p;          // chump-block weighted by ability to kill back
      if (score > bestScore) { bestScore = score; best = bi; }
    }
    if (best !== -1) {
      state.pairings[i] = best;
      usedB.add(best);
    }
  }
}

function resolveDamage(state) {
  // Simultaneous: capture old P/T, apply damage to both sides.
  for (let ai = 0; ai < state.attackers.length; ai++) {
    const bi = state.pairings[ai];
    const a = state.attackers[ai];
    if (bi === -1) {
      // Unblocked → hits player
      state.lifeP -= a.p;
      state.damageFlashes.push({ at: state.elapsed, who: 'lifeP', amt: a.p });
      continue;
    }
    const b = state.blockers[bi];
    const ap = a.p, bp = b.p;
    a.dmg += bp;
    b.dmg += ap;
    state.damageFlashes.push({ at: state.elapsed, who: 'a', idx: ai, amt: bp });
    state.damageFlashes.push({ at: state.elapsed, who: 'b', idx: bi, amt: ap });
  }
  for (const a of state.attackers) if (a.dmg >= a.t) a.dead = true;
  for (const b of state.blockers)  if (b.dmg >= b.t) b.dead = true;
}

export function init(ctx, params, env) {
  const state = {
    attackerCount: params.attacker_count,
    blockerCount:  params.blocker_count,
    roundPeriod:   params.round_period,
    variance:      params.creature_variance,
    lifeP: 20, lifeA: 20,
  };
  seed(state);

  function tick(dt) {
    state.elapsed += dt;
    state.phaseT += dt;
    state.roundT += dt;

    // Phase machine
    if (state.phase === 'declare' && state.phaseT >= 1) {
      state.phase = 'block';
      state.phaseT = 0;
      assignBlocks(state);
    } else if (state.phase === 'block' && state.phaseT >= 1) {
      state.phase = 'damage';
      state.phaseT = 0;
      resolveDamage(state);
    } else if (state.phase === 'damage' && state.phaseT >= 0.5) {
      state.phase = 'rest';
      state.phaseT = 0;
    }

    // Round over → reset.
    if (state.roundT >= state.roundPeriod) {
      // Carry life totals between rounds; reset to 20 if either is dead.
      if (state.lifeP <= 0 || state.lifeA <= 0) {
        state.lifeP = 20;
        state.lifeA = 20;
      }
      // Replenish to declared counts (remove dead).
      state.attackers = [];
      state.blockers = [];
      for (let i = 0; i < state.attackerCount; i++) state.attackers.push(makeCreature(state.variance));
      for (let i = 0; i < state.blockerCount; i++)  state.blockers.push(makeCreature(state.variance));
      state.pairings = new Array(state.attackerCount).fill(-1);
      state.phase = 'declare';
      state.phaseT = 0;
      state.roundT = 0;
    }

    drawAll();
  }

  function drawAll() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Center divider
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, H / 2);
    ctx.lineTo(W - 40, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pairing lines (drawn under cards)
    if (state.phase === 'block' || state.phase === 'damage') {
      for (let i = 0; i < state.attackers.length; i++) {
        const bi = state.pairings[i];
        if (bi === -1) continue;
        const ax = attackerX(state, i) + CARD_W / 2;
        const bx = blockerX(state, bi) + CARD_W / 2;
        ctx.strokeStyle = '#e6edf3';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ax, ATTACKER_ROW_Y + CARD_H / 2);
        ctx.lineTo(bx, BLOCKER_ROW_Y - CARD_H / 2);
        ctx.stroke();
      }
    }

    function drawCard(x, y, c, color, faceLabel) {
      const top = y - CARD_H / 2;
      // Card body
      ctx.fillStyle = c.dead ? 'rgba(80,80,80,0.35)' : '#161b22';
      ctx.fillRect(x, top, CARD_W, CARD_H);
      ctx.strokeStyle = c.dead ? '#3a3a3a' : color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, top + 1, CARD_W - 2, CARD_H - 2);
      // Label
      ctx.fillStyle = c.dead ? '#666' : color;
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(faceLabel, x + CARD_W / 2, top + 18);
      // P/T
      ctx.fillStyle = c.dead ? '#666' : '#e6edf3';
      ctx.font = 'bold 22px ui-monospace, monospace';
      ctx.fillText(`${c.p}/${c.t - c.dmg}`, x + CARD_W / 2, top + 60);
      // Damage marker
      if (c.dmg > 0 && !c.dead) {
        ctx.fillStyle = '#ff4444';
        ctx.font = '11px ui-monospace, monospace';
        ctx.fillText(`-${c.dmg}`, x + CARD_W / 2, top + CARD_H - 12);
      }
      if (c.dead) {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 8, top + 8);
        ctx.lineTo(x + CARD_W - 8, top + CARD_H - 8);
        ctx.moveTo(x + CARD_W - 8, top + 8);
        ctx.lineTo(x + 8, top + CARD_H - 8);
        ctx.stroke();
      }
    }

    for (let i = 0; i < state.attackers.length; i++) {
      drawCard(attackerX(state, i), ATTACKER_ROW_Y, state.attackers[i], ATTACKER_COLOR, `A${i + 1}`);
    }
    for (let i = 0; i < state.blockers.length; i++) {
      drawCard(blockerX(state, i), BLOCKER_ROW_Y, state.blockers[i], BLOCKER_COLOR, `B${i + 1}`);
    }

    // Damage flashes
    for (const f of state.damageFlashes) {
      const age = state.elapsed - f.at;
      if (age > 0.5) continue;
      const alpha = 1 - age / 0.5;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 18px ui-monospace, monospace';
      ctx.textAlign = 'center';
      if (f.who === 'a') {
        const x = attackerX(state, f.idx) + CARD_W / 2;
        ctx.fillText(`-${f.amt}`, x, ATTACKER_ROW_Y - CARD_H / 2 - 8 - age * 30);
      } else if (f.who === 'b') {
        const x = blockerX(state, f.idx) + CARD_W / 2;
        ctx.fillText(`-${f.amt}`, x, BLOCKER_ROW_Y + CARD_H / 2 + 22 + age * 30);
      } else if (f.who === 'lifeP') {
        ctx.fillText(`-${f.amt}`, 60, H / 2 - 10 - age * 20);
      }
      ctx.globalAlpha = 1;
    }
    state.damageFlashes = state.damageFlashes.filter(f => state.elapsed - f.at < 0.5);

    // Life totals
    ctx.fillStyle = ATTACKER_COLOR;
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`AI life ${state.lifeA}`, 16, 30);
    ctx.fillStyle = BLOCKER_COLOR;
    ctx.fillText(`Player life ${state.lifeP}`, 16, H - 14);

    // Phase indicator
    ctx.fillStyle = '#9aa4b2';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'right';
    const phaseLabel = state.phase === 'declare' ? '1. attackers declared'
                    : state.phase === 'block'   ? '2. blockers paired'
                    : state.phase === 'damage'  ? '3. damage'
                    :                              '4. rest';
    ctx.fillText(phaseLabel, W - 16, 30);
    ctx.fillText(`round ${(state.roundT / state.roundPeriod * 100).toFixed(0)}%`, W - 16, H - 14);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Structural: counts → re-seed.
  if (params.attacker_count !== state.attackerCount || params.blocker_count !== state.blockerCount) {
    state.attackerCount = params.attacker_count;
    state.blockerCount  = params.blocker_count;
    state.roundPeriod   = params.round_period;
    state.variance      = params.creature_variance;
    seed(state);
    return;
  }
  state.roundPeriod = params.round_period;
  state.variance    = params.creature_variance;
}
