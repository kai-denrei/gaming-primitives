// Composition: deck-shuffle — permute a finite card pool via the chosen algorithm.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CARD_W = 28, CARD_H = 80;
const ANIM_DUR = 0.5;

function rowGeom(n) {
  const totalW = n * CARD_W + (n - 1) * 2;
  const x0 = (W - totalW) / 2;
  const y0 = (H - CARD_H) / 2;
  return { x0, y0 };
}

function targetPos(n, i) {
  const { x0, y0 } = rowGeom(n);
  return { x: x0 + i * (CARD_W + 2), y: y0 };
}

function seed(state, n) {
  state.cards = [];
  for (let i = 0; i < n; i++) {
    const p = targetPos(n, i);
    state.cards.push({ id: i, label: i + 1, hue: (i * 360 / n) | 0, x: p.x, y: p.y, fromX: p.x, fromY: p.y, toX: p.x, toY: p.y });
  }
  state.order = state.cards.map((_, i) => i); // index-in-array per slot
  state.animT = 0;
  state.timer = 0;
}

function fisherYates(order) {
  const a = order.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function riffle(order) {
  const mid = Math.floor(order.length / 2);
  const left = order.slice(0, mid), right = order.slice(mid);
  const out = [];
  let li = 0, ri = 0;
  while (li < left.length || ri < right.length) {
    if (li < left.length && (ri >= right.length || Math.random() < 0.5)) out.push(left[li++]);
    else out.push(right[ri++]);
  }
  return out;
}

function naive(order) {
  return order.slice().sort(() => Math.random() - 0.5);
}

function startShuffle(state) {
  const n = state.cards.length;
  const algo = state.algo;
  const next = algo === 'fisher-yates' ? fisherYates(state.order)
            : algo === 'riffle'        ? riffle(state.order)
            :                            naive(state.order);
  for (let slot = 0; slot < n; slot++) {
    const card = state.cards[next[slot]];
    const dest = targetPos(n, slot);
    card.fromX = card.x; card.fromY = card.y;
    card.toX = dest.x;   card.toY = dest.y;
  }
  state.order = next;
  state.animT = ANIM_DUR;
}

export function init(ctx, params, env) {
  const state = { cards: [], order: [], algo: params.algo, interval: params.shuffle_interval, timer: 0, animT: 0 };
  seed(state, params.deck_size);

  function tick(dt) {
    state.timer += dt;
    if (state.timer >= state.interval && state.animT <= 0) {
      state.timer = 0;
      startShuffle(state);
    }
    if (state.animT > 0) {
      state.animT = Math.max(0, state.animT - dt);
      const t = 1 - state.animT / ANIM_DUR;
      const e = t * t * (3 - 2 * t); // smoothstep
      for (const c of state.cards) {
        c.x = c.fromX + (c.toX - c.fromX) * e;
        c.y = c.fromY + (c.toY - c.fromY) * e;
      }
    }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    for (const c of state.cards) drawCard(ctx, c.x, c.y, c.label, c.hue);

    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`algo: ${state.algo}   n=${state.cards.length}`, 12, 22);
  }

  return { state, tick, LOGICAL };
}

function drawCard(ctx, x, y, label, hue) {
  ctx.fillStyle = `hsl(${hue} 55% 28%)`;
  roundRect(ctx, x, y, CARD_W, CARD_H, 4); ctx.fill();
  ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, CARD_W - 1, CARD_H - 1, 4); ctx.stroke();
  ctx.fillStyle = '#e6edf3';
  ctx.font = '14px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(label), x + CARD_W / 2, y + CARD_H / 2);
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
  if (state.cards.length !== params.deck_size) seed(state, params.deck_size);
  state.algo = params.algo;
  state.interval = params.shuffle_interval;
}
