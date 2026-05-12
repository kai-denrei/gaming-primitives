// fighting/special-input — A single fighter generates directional/button inputs
// into a sliding buffer. A rule sheet lists 3-5 named special moves. Matcher
// scans the right edge of the buffer for the longest matching pattern; on
// match, the named special fires with a screen flash + projectile if applicable.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const STAGE_Y    = H - 60;
const FIGHTER_X  = W / 2 - 60;
const FIGHTER_H  = 130;

const BG       = '#0d1117';
const STAGE    = '#2a2a3a';
const FIGHTER  = '#ff4444';
const STRIP_BG = '#161b22';
const TOKEN_FG = '#e6edf3';
const FG       = '#e6edf3';
const MUTED    = '#9aa4b2';
const STRIKE   = '#ffd23f';
const SPECIAL  = '#c83be0';

// Token pool. Directional + buttons.
const TOKENS = ['←','↓','→','↘','↗','P','K'];

const MOVES_EASY = [
  { name: 'Hadouken',   pattern: ['↓','→','P'],  color: '#5e8fff' },
  { name: 'Shoryuken',  pattern: ['→','↓','P'],  color: '#c83be0' },
  { name: 'Tatsumaki',  pattern: ['↓','←','K'],  color: '#39ff14' },
];
const MOVES_MEDIUM = [
  { name: 'Hadouken',     pattern: ['↓','↘','→','P'],   color: '#5e8fff' },
  { name: 'Shoryuken',    pattern: ['→','↓','↘','P'],   color: '#c83be0' },
  { name: 'Tatsumaki',    pattern: ['↓','↘','←','K'],   color: '#39ff14' },
  { name: 'Sonic Boom',   pattern: ['←','→','P'],       color: '#ffd23f' },
];
const MOVES_HARD = [
  { name: 'Hadouken',      pattern: ['↓','↘','→','P','P'],     color: '#5e8fff' },
  { name: 'Shoryuken',     pattern: ['→','↓','↘','P','P'],     color: '#c83be0' },
  { name: 'Tatsumaki',     pattern: ['↓','↘','←','K','K'],     color: '#39ff14' },
  { name: 'Yoga Flame',    pattern: ['↓','↘','→','K','K'],     color: '#ff4444' },
  { name: 'Super Combo',   pattern: ['↓','→','↓','→','P'],     color: '#ffd23f' },
];

function pickMoves(difficulty) {
  if (difficulty === 'easy')   return MOVES_EASY;
  if (difficulty === 'hard')   return MOVES_HARD;
  return MOVES_MEDIUM;
}

function seed(state) {
  state.buffer = [];                     // last ~8 tokens
  state.elapsed = 0;
  state.nextInput = 0.5;
  state.lastSpecial = null;
  state.lastSpecialAt = -10;
  state.specialFlights = [];             // projectile flights
  state.specialCount = 0;
  state.moves = pickMoves(state.difficulty);
  // Auto-pilot intent: when generating a "correct" sequence, follow this index.
  state.intent = null;                   // { move, idx }
}

function matchTrailingMove(state) {
  // Scan from longest patterns first so we don't fire a 3-token prefix while a
  // 5-token version is still possible to complete.
  const moves = [...state.moves].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const m of moves) {
    const p = m.pattern;
    const buf = state.buffer;
    if (buf.length < p.length) continue;
    let ok = true;
    for (let i = 0; i < p.length; i++) {
      if (buf[buf.length - p.length + i] !== p[i]) { ok = false; break; }
    }
    if (ok) return m;
  }
  return null;
}

export function init(ctx, params, env) {
  const state = {
    inputSpeed: params.input_speed,
    autoSkill: params.auto_skill,
    difficulty: params.move_difficulty,
  };
  seed(state);

  function pushToken(tok) {
    state.buffer.push(tok);
    if (state.buffer.length > 8) state.buffer.shift();
    const m = matchTrailingMove(state);
    if (m) {
      state.lastSpecial = m;
      state.lastSpecialAt = state.elapsed;
      state.specialCount++;
      // Spawn a projectile if it's a forward-fireball-shaped move name.
      if (m.name.match(/Hadouken|Sonic Boom|Yoga Flame|Super Combo/)) {
        state.specialFlights.push({ x: FIGHTER_X + 30, color: m.color, t: 0 });
      }
      // Reset intent after firing so the auto-pilot picks a new target move.
      state.intent = null;
    }
  }

  function pickNextToken() {
    // With probability autoSkill, follow an existing or pick-a-new intent to
    // generate a meaningful input toward a named move. Otherwise random noise.
    if (Math.random() < state.autoSkill) {
      if (!state.intent || state.intent.idx >= state.intent.move.pattern.length) {
        const m = state.moves[Math.floor(Math.random() * state.moves.length)];
        state.intent = { move: m, idx: 0 };
      }
      const tok = state.intent.move.pattern[state.intent.idx];
      state.intent.idx++;
      return tok;
    }
    return TOKENS[Math.floor(Math.random() * TOKENS.length)];
  }

  function tick(dt) {
    state.elapsed += dt;
    state.nextInput -= dt;
    if (state.nextInput <= 0) {
      pushToken(pickNextToken());
      state.nextInput = 1 / state.inputSpeed;
    }

    // Advance projectiles
    for (const f of state.specialFlights) f.t += dt / 1.2;
    state.specialFlights = state.specialFlights.filter(f => f.t < 1);

    draw();
  }

  function drawFighter(x, color) {
    const headY = STAGE_Y - FIGHTER_H + 14;
    const torsoTopY = headY + 18;
    const torsoBotY = headY + 60;
    const isFiring = state.lastSpecial && state.elapsed - state.lastSpecialAt < 0.35;

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
    ctx.lineTo(x - 12, torsoTopY + 22);
    ctx.stroke();
    // Front arm
    if (isFiring) {
      const armEndX = x + 42;
      const armEndY = torsoTopY + 10;
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(armEndX, armEndY);
      ctx.stroke();
      ctx.fillStyle = state.lastSpecial.color;
      ctx.beginPath();
      ctx.arc(armEndX + 6, armEndY, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, torsoTopY + 6);
      ctx.lineTo(x + 14, torsoTopY + 18);
      ctx.stroke();
    }
  }

  function drawBuffer() {
    const stripX = 20, stripY = 30, stripW = W - 40, stripH = 40;
    ctx.fillStyle = STRIP_BG;
    ctx.fillRect(stripX, stripY, stripW, stripH);
    ctx.strokeStyle = STAGE;
    ctx.lineWidth = 1;
    ctx.strokeRect(stripX + 0.5, stripY + 0.5, stripW - 1, stripH - 1);

    const slots = 8;
    const slotW = stripW / slots;
    for (let i = 0; i < slots; i++) {
      const x = stripX + i * slotW + slotW / 2;
      ctx.strokeStyle = STAGE;
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(stripX + i * slotW, stripY + 4);
        ctx.lineTo(stripX + i * slotW, stripY + stripH - 4);
        ctx.stroke();
      }
      // Token from the right end of buffer
      const idx = state.buffer.length - slots + i;
      if (idx >= 0 && idx < state.buffer.length) {
        const tok = state.buffer[idx];
        ctx.fillStyle = TOKEN_FG;
        ctx.font = 'bold 22px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tok, x, stripY + stripH / 2);
        ctx.textBaseline = 'alphabetic';
      }
    }

    ctx.fillStyle = MUTED;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('input buffer (← oldest · newest →)', stripX, stripY - 4);
  }

  function drawRuleSheet() {
    const x = W - 220, y = 90, w = 200;
    const h = 24 + state.moves.length * 18 + 6;
    ctx.fillStyle = STRIP_BG;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = STAGE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = FG;
    ctx.font = 'bold 11px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SPECIAL MOVES', x + 8, y + 16);
    ctx.font = '11px ui-monospace, monospace';
    for (let i = 0; i < state.moves.length; i++) {
      const m = state.moves[i];
      const ly = y + 32 + i * 18;
      ctx.fillStyle = m.color;
      ctx.fillRect(x + 8, ly - 8, 6, 6);
      ctx.fillStyle = FG;
      ctx.fillText(m.name, x + 20, ly);
      ctx.fillStyle = MUTED;
      ctx.fillText(m.pattern.join(' '), x + 20, ly + 10);
    }
  }

  function draw() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // Screen-edge glow on special
    if (state.lastSpecial && state.elapsed - state.lastSpecialAt < 0.5) {
      const t = (state.elapsed - state.lastSpecialAt) / 0.5;
      const alpha = (1 - t) * 0.25;
      ctx.fillStyle = state.lastSpecial.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(0, 0, W, 8);
      ctx.fillRect(0, H - 8, W, 8);
      ctx.fillRect(0, 0, 8, H);
      ctx.fillRect(W - 8, 0, 8, H);
      ctx.globalAlpha = 1;
    }

    // Stage line
    ctx.strokeStyle = STAGE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, STAGE_Y); ctx.lineTo(W, STAGE_Y);
    ctx.stroke();

    drawBuffer();
    drawRuleSheet();
    drawFighter(FIGHTER_X, FIGHTER);

    // Projectiles
    for (const f of state.specialFlights) {
      const x = f.x + f.t * (W - f.x - 40);
      ctx.fillStyle = f.color;
      ctx.globalAlpha = 1 - f.t * 0.4;
      ctx.beginPath();
      ctx.arc(x, STAGE_Y - 70, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Special name flash
    if (state.lastSpecial && state.elapsed - state.lastSpecialAt < 0.6) {
      const t = (state.elapsed - state.lastSpecialAt) / 0.6;
      ctx.fillStyle = state.lastSpecial.color;
      ctx.globalAlpha = 1 - t;
      ctx.font = 'bold 32px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.lastSpecial.name.toUpperCase(), W / 2, 180);
      ctx.globalAlpha = 1;
    }

    // HUD
    ctx.fillStyle = MUTED;
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`specials ${state.specialCount}   ·   ${state.difficulty}   ·   skill ${Math.round(state.autoSkill * 100)}%`, 20, H - 14);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Difficulty change is structural (changes move set) → re-seed.
  if (params.move_difficulty !== state.difficulty) {
    state.difficulty = params.move_difficulty;
    state.inputSpeed = params.input_speed;
    state.autoSkill = params.auto_skill;
    seed(state);
    return;
  }
  state.inputSpeed = params.input_speed;
  state.autoSkill = params.auto_skill;
}
