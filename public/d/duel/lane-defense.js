// duel/lane-defense — horizontal lanes. Attackers (red) march left from the
// right edge, defenders (green) auto-place at left of empty lane positions
// when economy permits, defenders fire bullets that travel at attackers.
// If any attacker reaches the left edge, the wave fails and resets.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const PAD_L = 40;
const PAD_R = 30;
const PAD_T = 30;
const PAD_B = 40;

const DEFENDER_COST = 5;
const DEFENDER_SLOTS = 3;     // up to 3 defenders per lane
const ATTACKER_HP = 3;
const ATTACKER_SPEED = 25;    // px / sec
const BULLET_SPEED = 220;     // px / sec
const ATTACKER_R = 12;
const DEFENDER_R = 12;
const BULLET_R = 4;

function seed(state) {
  state.attackers = [];
  state.defenders = [];
  state.bullets = [];
  state.spawnAccum = 0;
  state.economyAccum = 0;
  state.economy = DEFENDER_COST * 2;   // start with seed pool
  state.failedFlash = -10;
  state.elapsed = 0;
  state.waveFails = 0;
  state.kills = 0;
}

function laneY(state, i) {
  const totalH = H - PAD_T - PAD_B;
  const laneH = totalH / state.laneCount;
  return PAD_T + laneH * (i + 0.5);
}

function defenderSlotX(slot) {
  // slot 0 leftmost
  return PAD_L + 20 + slot * 36;
}

export function init(ctx, params, env) {
  const state = {
    laneCount: params.lane_count,
    spawnRate: params.attacker_spawn_rate,
    fireRate: params.defender_fire_rate,
    econRate: params.defender_economy_rate,
  };
  seed(state);

  function placementHeuristic() {
    // Pick the most-threatened lane (lowest attacker.x) with a free defender slot.
    let bestLane = -1, bestSlot = -1, bestThreat = Infinity;
    for (let l = 0; l < state.laneCount; l++) {
      const slots = new Array(DEFENDER_SLOTS).fill(false);
      for (const d of state.defenders) {
        if (d.lane === l) slots[d.slot] = true;
      }
      let freeSlot = -1;
      for (let s = 0; s < DEFENDER_SLOTS; s++) {
        if (!slots[s]) { freeSlot = s; break; }
      }
      if (freeSlot === -1) continue;
      // Threat = lowest x of attacker in this lane (closer = more threatening).
      let minX = Infinity;
      for (const a of state.attackers) {
        if (a.lane === l && a.x < minX) minX = a.x;
      }
      // No attacker yet → moderate priority for empty lanes
      if (minX === Infinity) minX = W + 200;
      if (minX < bestThreat) { bestThreat = minX; bestLane = l; bestSlot = freeSlot; }
    }
    return bestLane === -1 ? null : { lane: bestLane, slot: bestSlot };
  }

  function tick(dt) {
    state.elapsed += dt;

    // Spawn attackers
    state.spawnAccum += dt * state.spawnRate;
    while (state.spawnAccum >= 1) {
      state.spawnAccum -= 1;
      const lane = Math.floor(Math.random() * state.laneCount);
      state.attackers.push({
        x: W - PAD_R,
        lane,
        hp: ATTACKER_HP,
        flash: -10,
      });
    }

    // Accumulate economy
    state.economy += dt * state.econRate;

    // Try place a defender
    if (state.economy >= DEFENDER_COST) {
      const slot = placementHeuristic();
      if (slot) {
        state.defenders.push({
          lane: slot.lane,
          slot: slot.slot,
          fireAccum: Math.random() * 0.4,
        });
        state.economy -= DEFENDER_COST;
      }
    }

    // Defender fire
    for (const d of state.defenders) {
      d.fireAccum += dt * state.fireRate;
      // Only fire when there's an attacker in lane to the right
      let inLane = false;
      for (const a of state.attackers) {
        if (a.lane === d.lane && a.x > defenderSlotX(d.slot)) { inLane = true; break; }
      }
      if (d.fireAccum >= 1 && inLane) {
        d.fireAccum = 0;
        state.bullets.push({
          x: defenderSlotX(d.slot) + DEFENDER_R + 2,
          y: laneY(state, d.lane),
          lane: d.lane,
        });
      } else if (d.fireAccum > 1.2) {
        // Cap accumulator so fire doesn't dump on first sight
        d.fireAccum = 1.2;
      }
    }

    // Move attackers
    for (const a of state.attackers) {
      a.x -= ATTACKER_SPEED * dt;
    }

    // Move bullets
    for (const b of state.bullets) {
      b.x += BULLET_SPEED * dt;
    }

    // Bullet-attacker collision (nearest attacker in lane)
    for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
      const b = state.bullets[bi];
      let hitIdx = -1, hitDist = Infinity;
      for (let ai = 0; ai < state.attackers.length; ai++) {
        const a = state.attackers[ai];
        if (a.lane !== b.lane) continue;
        if (a.x < b.x - BULLET_R) continue;
        const d = a.x - b.x;
        if (d < hitDist) { hitDist = d; hitIdx = ai; }
      }
      if (hitIdx !== -1) {
        const a = state.attackers[hitIdx];
        if (Math.abs(a.x - b.x) < ATTACKER_R + BULLET_R) {
          a.hp -= 1;
          a.flash = state.elapsed;
          state.bullets.splice(bi, 1);
          if (a.hp <= 0) {
            state.attackers.splice(hitIdx, 1);
            state.kills++;
          }
        }
      }
    }

    // Cull off-screen bullets
    state.bullets = state.bullets.filter(b => b.x < W + 10);

    // Wave fail: any attacker reached the left edge.
    for (const a of state.attackers) {
      if (a.x < PAD_L) {
        state.failedFlash = state.elapsed;
        state.waveFails++;
        state.attackers = [];
        state.bullets = [];
        // Defenders persist; economy persists.
        break;
      }
    }

    // === Render ===
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Lane backgrounds + dividers
    const totalH = H - PAD_T - PAD_B;
    const laneH = totalH / state.laneCount;
    for (let i = 0; i < state.laneCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(PAD_L, PAD_T + i * laneH, W - PAD_L - PAD_R, laneH);
    }
    // Left wall (the house)
    ctx.fillStyle = 'rgba(57,255,20,0.10)';
    ctx.fillRect(0, PAD_T, PAD_L, totalH);
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD_L + 0.5, PAD_T);
    ctx.lineTo(PAD_L + 0.5, H - PAD_B);
    ctx.stroke();

    // Defenders
    for (const d of state.defenders) {
      const x = defenderSlotX(d.slot);
      const y = laneY(state, d.lane);
      ctx.fillStyle = '#39ff14';
      ctx.beginPath();
      ctx.arc(x, y, DEFENDER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0d1117';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Bullets
    ctx.fillStyle = '#e6edf3';
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // Attackers
    for (const a of state.attackers) {
      const y = laneY(state, a.lane);
      const flash = state.elapsed - a.flash < 0.12;
      ctx.fillStyle = flash ? '#ffffff' : '#ff4444';
      ctx.beginPath();
      ctx.arc(a.x, y, ATTACKER_R, 0, Math.PI * 2);
      ctx.fill();
      // HP pips
      ctx.fillStyle = '#0d1117';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(a.hp.toString(), a.x, y + 3);
    }

    // Wave-fail flash
    if (state.elapsed - state.failedFlash < 0.4) {
      const t = (state.elapsed - state.failedFlash) / 0.4;
      ctx.fillStyle = `rgba(255, 68, 68, ${0.4 * (1 - t)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`economy ${state.economy.toFixed(1)}  ·  defenders ${state.defenders.length}  ·  kills ${state.kills}`, 12, 18);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`attackers ${state.attackers.length}  ·  fails ${state.waveFails}`, W - 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Structural: lane_count → re-seed.
  if (params.lane_count !== state.laneCount) {
    state.laneCount = params.lane_count;
    state.spawnRate = params.attacker_spawn_rate;
    state.fireRate = params.defender_fire_rate;
    state.econRate = params.defender_economy_rate;
    seed(state);
    return;
  }
  state.spawnRate = params.attacker_spawn_rate;
  state.fireRate = params.defender_fire_rate;
  state.econRate = params.defender_economy_rate;
}
