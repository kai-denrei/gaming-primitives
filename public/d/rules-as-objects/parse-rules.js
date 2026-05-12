// Rules-as-objects: parse-rules — scan grid for NOUN IS PROP triplets each tick; show rule list.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const COLS = 8, ROWS = 6;
const CELL = 48;
const GRID_X = 24, GRID_Y = (H - ROWS * CELL) / 2;

const NOUNS = ['BABA', 'ROCK', 'WALL'];
const PROPS = ['YOU', 'WIN', 'STOP', 'PUSH'];

const NOUN_COLOR = '#ec4899'; // pink
const IS_COLOR   = '#6b7280'; // grey
const PROP_COLOR = '#3b82f6'; // blue

function inBounds(x, y) { return x >= 0 && x < COLS && y >= 0 && y < ROWS; }

function cellAt(state, x, y) {
  return state.tiles.find(t => t.x === x && t.y === y);
}

function emptyCells(state) {
  const out = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (!cellAt(state, x, y)) out.push({ x, y });
  }
  return out;
}

function placeTriplet(state, noun, prop, y) {
  // Place [noun][IS][prop] horizontally on row y, starting at random valid x
  for (let attempt = 0; attempt < 20; attempt++) {
    const x = (Math.random() * (COLS - 3)) | 0;
    const cells = [[x, y], [x + 1, y], [x + 2, y]];
    if (cells.every(([cx, cy]) => !cellAt(state, cx, cy))) {
      state.tiles.push({ kind: 'NOUN', word: noun, x, y });
      state.tiles.push({ kind: 'IS',   word: 'IS', x: x + 1, y });
      state.tiles.push({ kind: 'PROP', word: prop, x: x + 2, y });
      return true;
    }
  }
  return false;
}

function seed(state, rule_count) {
  state.tiles = [];
  const rowsUsed = [];
  const target = Math.min(rule_count, ROWS);
  for (let i = 0; i < target; i++) {
    let y;
    do { y = (Math.random() * ROWS) | 0; } while (rowsUsed.includes(y));
    rowsUsed.push(y);
    placeTriplet(state, NOUNS[(Math.random() * NOUNS.length) | 0],
                        PROPS[(Math.random() * PROPS.length) | 0], y);
  }
  // Sprinkle decoy tiles in non-rule rows
  const decoyN = 3;
  for (let i = 0; i < decoyN; i++) {
    const empties = emptyCells(state);
    if (!empties.length) break;
    const { x, y } = empties[(Math.random() * empties.length) | 0];
    const kind = ['NOUN', 'IS', 'PROP'][(Math.random() * 3) | 0];
    const word = kind === 'NOUN' ? NOUNS[(Math.random() * NOUNS.length) | 0]
              : kind === 'IS'   ? 'IS'
              : PROPS[(Math.random() * PROPS.length) | 0];
    state.tiles.push({ kind, word, x, y });
  }
  state.timer = 0;
  state.rules = parseRules(state);
}

function parseRules(state) {
  // Scan each row for adjacent NOUN IS PROP triplets
  const rules = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x <= COLS - 3; x++) {
      const a = cellAt(state, x, y), b = cellAt(state, x + 1, y), c = cellAt(state, x + 2, y);
      if (a && b && c && a.kind === 'NOUN' && b.kind === 'IS' && c.kind === 'PROP') {
        rules.push({ noun: a.word, prop: c.word, x, y });
      }
    }
  }
  return rules;
}

function mutate(state) {
  if (!state.tiles.length) return;
  const t = state.tiles[(Math.random() * state.tiles.length) | 0];
  // Try to move to an adjacent empty cell
  const cand = [
    { x: t.x + 1, y: t.y }, { x: t.x - 1, y: t.y },
    { x: t.x, y: t.y + 1 }, { x: t.x, y: t.y - 1 },
  ].filter(c => inBounds(c.x, c.y) && !cellAt(state, c.x, c.y));
  if (cand.length === 0) return;
  const dest = cand[(Math.random() * cand.length) | 0];
  t.x = dest.x; t.y = dest.y;
  state.flash = 0.35;
  state.flashTile = t;
}

export function init(ctx, params, env) {
  const state = {
    tiles: [], rules: [],
    rule_count: params.rule_count, mutation_interval: params.mutation_interval,
    timer: 0, flash: 0, flashTile: null,
  };
  seed(state, params.rule_count);

  function tick(dt) {
    state.timer += dt;
    if (state.timer >= state.mutation_interval) {
      state.timer = 0;
      mutate(state);
      state.rules = parseRules(state);
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

    // Highlight cells that participate in current rules
    for (const rule of state.rules) {
      for (let i = 0; i < 3; i++) {
        const x = GRID_X + (rule.x + i) * CELL, y = GRID_Y + rule.y * CELL;
        ctx.fillStyle = 'rgba(57, 255, 20, 0.08)';
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
      }
    }

    // Tiles
    for (const t of state.tiles) {
      const flashing = state.flash > 0 && t === state.flashTile;
      const color = t.kind === 'NOUN' ? NOUN_COLOR : t.kind === 'IS' ? IS_COLOR : PROP_COLOR;
      drawWord(ctx, t.x, t.y, t.word, color, flashing);
    }

    // Right panel — rule list
    const px = GRID_X + COLS * CELL + 16, py = GRID_Y;
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillText('RULES PARSED', px, py + 14);
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('scan rows for', px, py + 32);
    ctx.fillText('NOUN IS PROP', px, py + 48);

    ctx.font = '14px ui-monospace, monospace';
    let ry = py + 80;
    if (state.rules.length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.fillText('(none)', px, ry);
    } else {
      for (const r of state.rules) {
        ctx.fillStyle = NOUN_COLOR; ctx.fillText(r.noun, px, ry);
        ctx.fillStyle = IS_COLOR;   ctx.fillText('IS',     px + 56, ry);
        ctx.fillStyle = PROP_COLOR; ctx.fillText(r.prop,   px + 84, ry);
        ry += 22;
      }
    }
  }

  return { state, tick, LOGICAL };
}

function drawWord(ctx, gx, gy, word, color, flash) {
  const x = GRID_X + gx * CELL + 3, y = GRID_Y + gy * CELL + 3;
  const w = CELL - 6, h = CELL - 6;
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 6); ctx.fill();
  ctx.strokeStyle = flash ? '#39ff14' : '#e6edf3';
  ctx.lineWidth = flash ? 2 : 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 6); ctx.stroke();
  ctx.fillStyle = '#0d1117';
  ctx.font = `bold ${word.length > 4 ? 10 : 12}px ui-monospace, monospace`;
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
  const reseed = state.rule_count !== params.rule_count;
  state.rule_count = params.rule_count;
  state.mutation_interval = params.mutation_interval;
  if (reseed) seed(state, params.rule_count);
}
