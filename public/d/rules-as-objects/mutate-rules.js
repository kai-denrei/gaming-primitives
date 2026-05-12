// Rules-as-objects: mutate-rules — swap the subject of `X IS YOU`; control retargets to a different tile.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const COLS = 10, ROWS = 7;
const CELL = 40;
const GRID_X = 24, GRID_Y = (H - ROWS * CELL) / 2;

const NOUN_TYPES = [
  { word: 'BABA', color: '#ef4444', glyph: 'B' }, // red
  { word: 'ROCK', color: '#3b82f6', glyph: 'R' }, // blue
  { word: 'WALL', color: '#22c55e', glyph: 'W' }, // green
];

const DIRS = [
  { dx:  1, dy:  0 }, { dx: -1, dy:  0 }, { dx:  0, dy:  1 }, { dx:  0, dy: -1 },
];

function inBounds(x, y) { return x >= 0 && x < COLS && y >= 0 && y < ROWS; }

function occupant(state, x, y) {
  for (const n of state.nouns) if (n.x === x && n.y === y) return n;
  for (const t of state.words) if (t.x === x && t.y === y) return t;
  return null;
}

function seed(state) {
  // Word-tiles row at top: NOUN IS YOU  (NOUN is the mutable subject)
  state.words = [];
  const wy = 0;
  const wx = 1;
  state.subjectIdx = 0;
  state.words.push({ kind: 'NOUN', word: NOUN_TYPES[state.subjectIdx].word, x: wx,     y: wy, color: '#ec4899' });
  state.words.push({ kind: 'IS',   word: 'IS',                              x: wx + 1, y: wy, color: '#6b7280' });
  state.words.push({ kind: 'PROP', word: 'YOU',                             x: wx + 2, y: wy, color: '#3b82f6' });

  // Three noun-tiles of different colors on the playfield
  state.nouns = [];
  for (let i = 0; i < NOUN_TYPES.length; i++) {
    const t = NOUN_TYPES[i];
    let x, y, tries = 0;
    do {
      x = 1 + ((Math.random() * (COLS - 2)) | 0);
      y = 2 + ((Math.random() * (ROWS - 3)) | 0);
      tries++;
    } while (occupant(state, x, y) && tries < 50);
    state.nouns.push({ type: t.word, color: t.color, glyph: t.glyph, x, y });
  }

  state.moveTimer = 0;
  state.mutTimer = 0;
  state.flash = 0;
}

function activeYou(state) {
  const subject = state.words.find(w => w.kind === 'NOUN');
  if (!subject) return null;
  return state.nouns.find(n => n.type === subject.word) || null;
}

function tryMove(state, who, dx, dy) {
  const tx = who.x + dx, ty = who.y + dy;
  if (!inBounds(tx, ty)) return false;
  if (occupant(state, tx, ty)) return false;
  who.x = tx; who.y = ty;
  return true;
}

function mutate(state) {
  // Cycle subject to a different noun
  state.subjectIdx = (state.subjectIdx + 1 + ((Math.random() * (NOUN_TYPES.length - 1)) | 0)) % NOUN_TYPES.length;
  const subject = state.words.find(w => w.kind === 'NOUN');
  subject.word = NOUN_TYPES[state.subjectIdx].word;
  state.flash = 0.6;
}

export function init(ctx, params, env) {
  const state = {
    words: [], nouns: [], subjectIdx: 0,
    mutation_interval: params.mutation_interval, moveInterval: 0.4,
    moveTimer: 0, mutTimer: 0, flash: 0,
  };
  seed(state);

  function tick(dt) {
    state.moveTimer += dt;
    state.mutTimer += dt;
    if (state.mutTimer >= state.mutation_interval) {
      state.mutTimer = 0;
      mutate(state);
    }
    if (state.moveTimer >= state.moveInterval) {
      state.moveTimer = 0;
      const you = activeYou(state);
      if (you) {
        const order = [0, 1, 2, 3];
        for (let i = order.length - 1; i > 0; i--) {
          const j = (Math.random() * (i + 1)) | 0;
          [order[i], order[j]] = [order[j], order[i]];
        }
        for (const idx of order) {
          const d = DIRS[idx];
          if (tryMove(state, you, d.dx, d.dy)) break;
        }
      }
    }
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(GRID_X, GRID_Y + r * CELL + 0.5);
      ctx.lineTo(GRID_X + COLS * CELL, GRID_Y + r * CELL + 0.5);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(GRID_X + c * CELL + 0.5, GRID_Y);
      ctx.lineTo(GRID_X + c * CELL + 0.5, GRID_Y + ROWS * CELL);
      ctx.stroke();
    }

    // Word tiles
    for (const w of state.words) {
      const isSubject = w.kind === 'NOUN';
      drawWord(ctx, w.x, w.y, w.word, w.color, isSubject && state.flash > 0);
    }

    // Noun tiles (one is YOU)
    const you = activeYou(state);
    for (const n of state.nouns) {
      drawTile(ctx, n.x, n.y, n.color, n === you);
    }

    // Right panel
    const px = GRID_X + COLS * CELL + 16, py = GRID_Y;
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillText('MUTATE-RULES', px, py + 14);
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('the subject of', px, py + 34);
    ctx.fillText('`X IS YOU` swaps.', px, py + 50);
    ctx.fillText('player control', px, py + 66);
    ctx.fillText('retargets.', px, py + 82);

    // Active rule
    ctx.font = '14px ui-monospace, monospace';
    const subj = state.words.find(w => w.kind === 'NOUN').word;
    ctx.fillStyle = '#ec4899'; ctx.fillText(subj, px, py + 120);
    ctx.fillStyle = '#6b7280'; ctx.fillText('IS',  px + 56, py + 120);
    ctx.fillStyle = '#3b82f6'; ctx.fillText('YOU', px + 84, py + 120);

    // Active YOU indicator
    if (you) {
      ctx.fillStyle = '#39ff14';
      ctx.fillText(`YOU = ${you.type}`, px, py + 150);
    }
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`next mutation: ${(state.mutation_interval - state.mutTimer).toFixed(1)}s`, px, py + 174);
  }

  return { state, tick, LOGICAL };
}

function drawTile(ctx, gx, gy, color, isYou) {
  const x = GRID_X + gx * CELL + 3, y = GRID_Y + gy * CELL + 3;
  const w = CELL - 6, h = CELL - 6;
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 5); ctx.fill();
  if (isYou) {
    ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 3;
    roundRect(ctx, x - 1, y - 1, w + 2, h + 2, 6); ctx.stroke();
  } else {
    ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1;
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 5); ctx.stroke();
  }
}

function drawWord(ctx, gx, gy, word, color, flash) {
  const x = GRID_X + gx * CELL + 3, y = GRID_Y + gy * CELL + 3;
  const w = CELL - 6, h = CELL - 6;
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 5); ctx.fill();
  ctx.strokeStyle = flash ? '#39ff14' : '#e6edf3';
  ctx.lineWidth = flash ? 2 : 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 5); ctx.stroke();
  ctx.fillStyle = '#0d1117';
  ctx.font = `bold ${word.length > 3 ? 10 : 12}px ui-monospace, monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(word, x + w / 2, y + h / 2 + 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

export function applyParams(state, params) {
  state.mutation_interval = params.mutation_interval;
}
