// timed-puzzle/defuse-sequence — bomb display with a countdown timer, a row of
// colored buttons, a serial number, and a lit indicator. A rule sheet on the
// right specifies a sequence to press. Auto-pilot reads the bomb state, applies
// the rules with auto_skill accuracy, taps buttons in order. Win → DEFUSED;
// wrong button or timeout → BOOM. Re-seed after either end-state.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

// Pure colors for buttons — distinguishable like real hardware.
const BUTTON_COLORS = {
  red:    '#e63946',
  blue:   '#357edd',
  green:  '#39c659',
  yellow: '#ffd23f',
};
const BUTTON_KEYS = ['red', 'blue', 'green', 'yellow'];

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

function randSerial() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits  = '0123456789';
  // 2 letters + 2 digits + 1 letter pattern
  let s = '';
  for (let i = 0; i < 2; i++) s += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 2; i++) s += digits[Math.floor(Math.random() * digits.length)];
  s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}

function hasVowel(serial) {
  for (const ch of serial) if (VOWELS.has(ch)) return true;
  return false;
}

function seed(state) {
  // Buttons: 4..6 colored buttons depending on difficulty.
  const counts = { simple: 4, medium: 5, hard: 6 };
  const n = counts[state.difficulty] ?? 5;
  state.buttons = [];
  for (let i = 0; i < n; i++) {
    state.buttons.push(BUTTON_KEYS[Math.floor(Math.random() * BUTTON_KEYS.length)]);
  }
  state.serial = randSerial();
  state.lit = Math.random() < 0.5;
  state.timeLeft = state.timerSeconds;
  // Compute correct sequence from rules.
  state.correctSequence = computeSequence(state);
  state.pressed = [];           // indices pressed so far
  state.endState = null;        // 'defused' | 'boom-wrong' | 'boom-time'
  state.endAt = -10;
  state.elapsed = 0;
  state.pressCooldown = state.difficulty === 'hard' ? 0.5 : 0.7;
  state.nextPressAt = state.elapsed + state.pressCooldown + Math.random() * 0.3;
}

// Rules:
//   simple:  press all red buttons first, then all others in order.
//   medium:  if serial has vowel AND lit → press red first, then blues, then rest.
//            else → press all greens, then yellows, then rest.
//   hard:    if vowel: press in order [red, green, yellow, blue], pulling only
//                       buttons of each color in their first-appearance order.
//            if !vowel: reverse the button list, then apply lit-conditional swap.
function computeSequence(state) {
  const buttons = state.buttons;
  const idxs = buttons.map((_, i) => i);
  const byColor = (color) => idxs.filter(i => buttons[i] === color);

  if (state.difficulty === 'simple') {
    return [...byColor('red'), ...idxs.filter(i => buttons[i] !== 'red')];
  }
  if (state.difficulty === 'medium') {
    if (hasVowel(state.serial) && state.lit) {
      return [
        ...byColor('red'),
        ...byColor('blue'),
        ...idxs.filter(i => buttons[i] !== 'red' && buttons[i] !== 'blue'),
      ];
    } else {
      return [
        ...byColor('green'),
        ...byColor('yellow'),
        ...idxs.filter(i => buttons[i] !== 'green' && buttons[i] !== 'yellow'),
      ];
    }
  }
  // hard
  const vowel = hasVowel(state.serial);
  let order;
  if (vowel) {
    order = ['red', 'green', 'yellow', 'blue'];
  } else {
    order = ['blue', 'yellow', 'green', 'red'];
  }
  if (state.lit) order = [order[1], order[0], order[3], order[2]]; // swap pairs
  const out = [];
  for (const color of order) {
    for (const i of byColor(color)) out.push(i);
  }
  return out;
}

export function init(ctx, params, env) {
  const state = {
    timerSeconds: params.timer_seconds,
    difficulty: params.module_difficulty,
    autoSkill: params.auto_skill,
  };
  seed(state);

  function tick(dt) {
    state.elapsed += dt;

    if (state.endState) {
      if (state.elapsed - state.endAt > 1.5) seed(state);
      draw();
      return;
    }

    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.endState = 'boom-time';
      state.endAt = state.elapsed;
      draw();
      return;
    }

    // Auto-pilot taps next button on schedule.
    if (state.elapsed >= state.nextPressAt && state.pressed.length < state.buttons.length) {
      const nextCorrect = state.correctSequence[state.pressed.length];
      let pressIdx = nextCorrect;
      // auto_skill controls whether we pick the right one.
      if (Math.random() > state.autoSkill) {
        // pick a random untapped index
        const remaining = [];
        for (let i = 0; i < state.buttons.length; i++) {
          if (!state.pressed.includes(i)) remaining.push(i);
        }
        pressIdx = remaining[Math.floor(Math.random() * remaining.length)];
      }
      state.pressed.push(pressIdx);
      state.pressFlashAt = state.elapsed;
      state.lastPressedIdx = pressIdx;
      // Verify
      if (pressIdx !== nextCorrect) {
        state.endState = 'boom-wrong';
        state.endAt = state.elapsed;
        draw();
        return;
      }
      if (state.pressed.length === state.buttons.length) {
        state.endState = 'defused';
        state.endAt = state.elapsed;
        draw();
        return;
      }
      state.nextPressAt = state.elapsed + state.pressCooldown + Math.random() * 0.3;
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Bomb panel on left (60% width)
    const panelW = W * 0.6 - 20;
    const panelX = 16;
    const panelY = 16;
    const panelH = H - 32;
    ctx.fillStyle = '#161b22';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

    // Timer display
    const timerCx = panelX + panelW / 2;
    const timerCy = panelY + 60;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(timerCx - 90, timerCy - 32, 180, 64);
    ctx.strokeStyle = '#2a2a3a';
    ctx.strokeRect(timerCx - 90 + 0.5, timerCy - 32 + 0.5, 179, 63);
    const frac = state.timeLeft / state.timerSeconds;
    const timerColor = frac > 0.5 ? '#39ff14' : frac > 0.25 ? '#ffd23f' : '#ff4444';
    ctx.fillStyle = timerColor;
    ctx.font = 'bold 40px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const m = Math.floor(state.timeLeft / 60);
    const s = Math.floor(state.timeLeft % 60);
    ctx.fillText(`${m}:${String(s).padStart(2, '0')}`, timerCx, timerCy);
    ctx.textBaseline = 'alphabetic';

    // Timer bar
    const barX = panelX + 24, barY = timerCy + 44, barW = panelW - 48, barH = 8;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = timerColor;
    ctx.fillRect(barX, barY, barW * frac, barH);

    // Serial number
    ctx.fillStyle = '#9aa4b2';
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SERIAL', panelX + 20, timerCy + 84);
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText(state.serial, panelX + 20, timerCy + 106);

    // Lit indicator
    const litCx = panelX + panelW - 60, litCy = timerCy + 96;
    ctx.fillStyle = '#9aa4b2';
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('LIT', litCx - 30, litCy - 6);
    ctx.fillStyle = state.lit ? '#ffd23f' : '#2a2a3a';
    ctx.beginPath();
    ctx.arc(litCx, litCy - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9aa4b2';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Buttons row
    const btnY = panelY + panelH - 100;
    const btnSize = Math.min(60, (panelW - 40) / state.buttons.length - 10);
    const totalW = state.buttons.length * btnSize + (state.buttons.length - 1) * 10;
    const startX = panelX + (panelW - totalW) / 2;
    for (let i = 0; i < state.buttons.length; i++) {
      const bx = startX + i * (btnSize + 10);
      const isPressed = state.pressed.includes(i);
      const pressFlash = state.lastPressedIdx === i && state.elapsed - state.pressFlashAt < 0.25;
      ctx.fillStyle = BUTTON_COLORS[state.buttons[i]];
      if (isPressed) ctx.globalAlpha = 0.45;
      ctx.fillRect(bx, btnY, btnSize, btnSize);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = pressFlash ? '#ffffff' : '#0d1117';
      ctx.lineWidth = pressFlash ? 3 : 2;
      ctx.strokeRect(bx + 0.5, btnY + 0.5, btnSize - 1, btnSize - 1);
      if (isPressed) {
        // Press order number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px ui-monospace, monospace';
        ctx.textAlign = 'center';
        const order = state.pressed.indexOf(i) + 1;
        ctx.fillText(String(order), bx + btnSize / 2, btnY + btnSize / 2 + 5);
      }
    }
    ctx.fillStyle = '#9aa4b2';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`buttons (${state.pressed.length}/${state.buttons.length})`, panelX + panelW / 2, btnY + btnSize + 18);

    // Rule sheet on right
    const ruleX = W * 0.6 + 8;
    const ruleY = 16;
    const ruleW = W - ruleX - 16;
    const ruleH = H - 32;
    ctx.fillStyle = '#161b22';
    ctx.fillRect(ruleX, ruleY, ruleW, ruleH);
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(ruleX + 0.5, ruleY + 0.5, ruleW - 1, ruleH - 1);

    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RULE SHEET', ruleX + 12, ruleY + 22);
    ctx.fillStyle = '#9aa4b2';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`mode: ${state.difficulty}`, ruleX + 12, ruleY + 40);

    ctx.fillStyle = '#e6edf3';
    ctx.font = '11px ui-monospace, monospace';
    let ty = ruleY + 64;
    const lh = 16;
    const wrap = (txt) => {
      const words = txt.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > ruleW - 24) {
          ctx.fillText(line, ruleX + 12, ty);
          ty += lh;
          line = w;
        } else line = test;
      }
      if (line) { ctx.fillText(line, ruleX + 12, ty); ty += lh; }
    };

    if (state.difficulty === 'simple') {
      wrap('1. Press all RED buttons first');
      ty += 4;
      wrap('2. Then press remaining buttons in left-to-right order');
    } else if (state.difficulty === 'medium') {
      wrap('IF serial has a vowel AND lit-indicator is ON:');
      wrap('  1. press all RED');
      wrap('  2. then all BLUE');
      wrap('  3. then the rest left-to-right');
      ty += 4;
      wrap('ELSE:');
      wrap('  1. press all GREEN');
      wrap('  2. then all YELLOW');
      wrap('  3. then the rest left-to-right');
    } else {
      wrap('IF serial has a vowel:');
      wrap('  base order = RED, GREEN, YELLOW, BLUE');
      wrap('ELSE:');
      wrap('  base order = BLUE, YELLOW, GREEN, RED');
      ty += 4;
      wrap('IF lit-indicator is ON, swap first/second and third/fourth in the order.');
      ty += 4;
      wrap('Within each color, press in left-to-right order.');
    }

    ty += 8;
    ctx.fillStyle = '#5ee7df';
    wrap(`serial vowel: ${hasVowel(state.serial) ? 'YES' : 'NO'}    lit: ${state.lit ? 'YES' : 'NO'}`);

    // End state banner
    if (state.endState) {
      const label = state.endState === 'defused' ? 'DEFUSED' : 'BOOM';
      const color = state.endState === 'defused' ? '#39ff14' : '#ff4444';
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = color;
      ctx.fillRect(0, H / 2 - 36, W, 72);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0d1117';
      ctx.font = 'bold 36px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, W / 2, H / 2 + 12);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // module_difficulty is structural (button count changes); timer_seconds and
  // auto_skill are live.
  if (params.module_difficulty !== state.difficulty) {
    state.difficulty = params.module_difficulty;
    state.timerSeconds = params.timer_seconds;
    state.autoSkill = params.auto_skill;
    seed(state);
    return;
  }
  state.timerSeconds = params.timer_seconds;
  state.autoSkill = params.auto_skill;
}
