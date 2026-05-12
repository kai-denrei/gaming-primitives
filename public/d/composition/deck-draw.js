// Composition: deck-draw — each turn, slide N cards from draw pile into the hand.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CARD_W = 56, CARD_H = 80;
const DRAW_ANIM = 0.45;
const DECK_X = 80, DECK_Y = H / 2 - CARD_H / 2;
const DISCARD_X = W - 80 - CARD_W, DISCARD_Y = H / 2 - CARD_H / 2;

function handSlotX(hand_max, i) {
  const totalW = hand_max * CARD_W + (hand_max - 1) * 8;
  const x0 = (W - totalW) / 2;
  return x0 + i * (CARD_W + 8);
}

function seed(state, deck_size) {
  state.deck = [];
  state.hand = [];
  state.discard = [];
  state.flying = []; // cards mid-animation: { card, fromX, fromY, toX, toY, t, dur, dest: 'hand'|'discard'|'deck', slot }
  state.flash = 0;
  for (let i = 0; i < deck_size; i++) state.deck.push({ id: i, label: i + 1, hue: (i * 360 / deck_size) | 0 });
  shuffle(state.deck);
  state.timer = 0;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function startTurn(state) {
  // Discard old hand first
  for (let i = 0; i < state.hand.length; i++) {
    const c = state.hand[i];
    state.flying.push({
      card: c, fromX: handSlotX(state.hand_max, i), fromY: H / 2 - CARD_H / 2 + 120,
      toX: DISCARD_X, toY: DISCARD_Y, t: 0, dur: DRAW_ANIM * 0.7, dest: 'discard', slot: 0,
    });
  }
  state.hand = [];
  // Draw new cards
  const want = state.draw_per_turn;
  for (let k = 0; k < want; k++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break;
      // reshuffle discard into deck (flash)
      state.deck = state.discard; state.discard = [];
      shuffle(state.deck);
      state.flash = 0.4;
    }
    const c = state.deck.pop();
    const slot = state.hand.length;
    if (slot >= state.hand_max) break;
    state.hand.push(c);
    state.flying.push({
      card: c, fromX: DECK_X, fromY: DECK_Y,
      toX: handSlotX(state.hand_max, slot), toY: H / 2 - CARD_H / 2 + 120,
      t: 0, dur: DRAW_ANIM, dest: 'hand', slot,
    });
  }
}

export function init(ctx, params, env) {
  const state = {
    deck: [], hand: [], discard: [], flying: [],
    deck_size: params.deck_size, hand_max: params.hand_max,
    draw_per_turn: params.draw_per_turn, turn_interval: params.turn_interval,
    timer: 0, flash: 0,
  };
  seed(state, params.deck_size);

  function tick(dt) {
    state.timer += dt;
    if (state.timer >= state.turn_interval && state.flying.length === 0) {
      state.timer = 0;
      startTurn(state);
    }
    for (const f of state.flying) {
      f.t = Math.min(f.dur, f.t + dt);
      const u = f.t / f.dur;
      f.e = u * u * (3 - 2 * u);
      f.curX = f.fromX + (f.toX - f.fromX) * f.e;
      f.curY = f.fromY + (f.toY - f.fromY) * f.e;
    }
    // Finalize completed flights
    const remaining = [];
    for (const f of state.flying) {
      if (f.t >= f.dur) {
        if (f.dest === 'discard') state.discard.push(f.card);
      } else remaining.push(f);
    }
    state.flying = remaining;
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);

    // Draw
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Draw deck pile (stacked)
    drawPile(ctx, DECK_X, DECK_Y, state.deck.length, state.flash > 0 ? '#39ff14' : '#3a3a5a', 'DECK');
    drawPile(ctx, DISCARD_X, DISCARD_Y, state.discard.length, '#5a3a3a', 'DISCARD');

    // Draw empty hand slots
    for (let i = 0; i < state.hand_max; i++) {
      const x = handSlotX(state.hand_max, i);
      const y = H / 2 - CARD_H / 2 + 120;
      ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      roundRect(ctx, x + 0.5, y + 0.5, CARD_W - 1, CARD_H - 1, 4);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw settled hand cards (those not currently flying to/from hand)
    const flyingHand = new Set(state.flying.filter(f => f.dest === 'hand').map(f => f.card.id));
    const flyingDiscard = new Set(state.flying.filter(f => f.dest === 'discard').map(f => f.card.id));
    for (let i = 0; i < state.hand.length; i++) {
      const c = state.hand[i];
      if (flyingHand.has(c.id) || flyingDiscard.has(c.id)) continue;
      drawCard(ctx, handSlotX(state.hand_max, i), H / 2 - CARD_H / 2 + 120, c.label, c.hue);
    }

    // Draw flying cards on top
    for (const f of state.flying) drawCard(ctx, f.curX, f.curY, f.card.label, f.card.hue);

    ctx.fillStyle = '#e6edf3';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`deck:${state.deck.length}  hand:${state.hand.length}/${state.hand_max}  discard:${state.discard.length}`, 12, 22);
  }

  return { state, tick, LOGICAL };
}

function drawPile(ctx, x, y, count, color, label) {
  const stack = Math.min(count, 6);
  for (let i = 0; i < stack; i++) {
    ctx.fillStyle = color;
    roundRect(ctx, x - i * 1.5, y - i * 1.5, CARD_W, CARD_H, 4); ctx.fill();
    ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1;
    roundRect(ctx, x - i * 1.5 + 0.5, y - i * 1.5 + 0.5, CARD_W - 1, CARD_H - 1, 4); ctx.stroke();
  }
  ctx.fillStyle = '#e6edf3';
  ctx.font = '14px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + CARD_W / 2, y + CARD_H + 18);
  ctx.fillText(String(count), x + CARD_W / 2, y + CARD_H / 2 + 5);
  ctx.textAlign = 'left';
}

function drawCard(ctx, x, y, label, hue) {
  ctx.fillStyle = `hsl(${hue} 55% 30%)`;
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
  const reseed = state.deck_size !== params.deck_size;
  state.deck_size = params.deck_size;
  state.hand_max = params.hand_max;
  state.draw_per_turn = params.draw_per_turn;
  state.turn_interval = params.turn_interval;
  if (reseed) seed(state, params.deck_size);
  // hand_max change: drop excess hand silently into discard
  while (state.hand.length > state.hand_max) state.discard.push(state.hand.pop());
}
