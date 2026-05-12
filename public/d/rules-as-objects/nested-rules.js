// Rules-as-objects: nested-rules — chain of `A IS B`, `B IS C`, ... `Z IS YOU`. Resolve transitively to find YOU.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;

const TOKENS = ['BABA', 'ROCK', 'WALL', 'FLAG', 'KEY', 'DOOR'];
const TOKEN_COLORS = {
  BABA: '#ef4444', ROCK: '#3b82f6', WALL: '#22c55e',
  FLAG: '#eab308', KEY:  '#a855f7', DOOR: '#06b6d4',
};

// Layout: chain rendered along upper half; tile-row of all tokens along lower half.
const CHAIN_Y = 140;
const TILE_Y  = 320;

function freshChain(depth) {
  // pick `depth` distinct nouns; last one's rhs is YOU
  const pool = [...TOKENS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const nodes = pool.slice(0, depth);
  // Build links: nodes[0] IS nodes[1], nodes[1] IS nodes[2], ..., nodes[depth-1] IS YOU
  const links = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    links.push({ from: nodes[i], to: nodes[i + 1] });
  }
  links.push({ from: nodes[nodes.length - 1], to: 'YOU' });
  return { nodes, links };
}

function resolveYou(links) {
  // Follow forward: start from each node's source; if any chain transitively reaches YOU,
  // the head of that chain is the "YOU" tile.
  // We pick the node whose `from` doesn't appear as any other link's `to` — that's the head.
  const tos = new Set(links.map(l => l.to));
  const heads = links.map(l => l.from).filter(s => !tos.has(s));
  if (heads.length === 0) return null;
  let cur = heads[0];
  const visited = new Set();
  while (true) {
    if (visited.has(cur)) return null;
    visited.add(cur);
    const next = links.find(l => l.from === cur);
    if (!next) return null;
    if (next.to === 'YOU') return cur;
    cur = next.to;
  }
}

function mutate(state) {
  // Swap one link's `to` to a random other token (not YOU unless it's the last link)
  const { links, nodes } = state;
  const idx = (Math.random() * links.length) | 0;
  const link = links[idx];
  if (idx === links.length - 1) {
    // Last link — keep IS YOU. Instead, swap the head of this last link with another node.
    // Simpler: swap two adjacent nodes in the chain
    if (nodes.length >= 2) {
      const a = (Math.random() * (nodes.length - 1)) | 0;
      [nodes[a], nodes[a + 1]] = [nodes[a + 1], nodes[a]];
      // Rebuild links from nodes
      const newLinks = [];
      for (let i = 0; i < nodes.length - 1; i++) newLinks.push({ from: nodes[i], to: nodes[i + 1] });
      newLinks.push({ from: nodes[nodes.length - 1], to: 'YOU' });
      state.links = newLinks;
    }
  } else {
    // Repoint this link's `to` to a different existing node in the chain
    const others = nodes.filter(n => n !== link.from && n !== link.to);
    if (others.length > 0) {
      link.to = others[(Math.random() * others.length) | 0];
    }
  }
  state.flashLink = idx;
  state.flash = 0.6;
}

function seed(state, depth) {
  Object.assign(state, freshChain(depth));
  state.timer = 0;
  state.flash = 0;
  state.flashLink = -1;
}

export function init(ctx, params, env) {
  const state = {
    nodes: [], links: [],
    chain_depth: params.chain_depth,
    mutation_interval: params.mutation_interval,
    timer: 0, flash: 0, flashLink: -1,
  };
  seed(state, params.chain_depth);

  function tick(dt) {
    state.timer += dt;
    if (state.timer >= state.mutation_interval) {
      state.timer = 0;
      mutate(state);
    }
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillText('NESTED-RULES — chain resolves to YOU', 24, 28);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText('follow arrows transitively; head-of-chain becomes the player tile.', 24, 46);

    // Chain layout: nodes evenly spaced horizontally + YOU sink on the right
    const chain = [...state.nodes, 'YOU'];
    const margin = 60;
    const span = W - margin * 2;
    const gap = chain.length > 1 ? span / (chain.length - 1) : 0;
    const nodePos = chain.map((tok, i) => ({ tok, x: margin + i * gap, y: CHAIN_Y }));

    // Draw arrows for each link
    for (let i = 0; i < state.links.length; i++) {
      const link = state.links[i];
      const a = nodePos.find(p => p.tok === link.from);
      const b = nodePos.find(p => p.tok === link.to);
      if (!a || !b) continue;
      const flashing = state.flash > 0 && state.flashLink === i;
      drawArrow(ctx, a.x, a.y, b.x, b.y, flashing ? '#39ff14' : '#6b7280', flashing ? 3 : 2);
      // "IS" label at midpoint
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 14;
      ctx.fillStyle = flashing ? '#39ff14' : '#9ca3af';
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('IS', mx, my);
      ctx.textAlign = 'left';
    }

    // Draw nodes
    for (const p of nodePos) {
      const isSink = p.tok === 'YOU';
      const color = isSink ? '#3b82f6' : TOKEN_COLORS[p.tok];
      drawNode(ctx, p.x, p.y, p.tok, color);
    }

    // Bottom: tiles, one per noun, highlight current YOU
    const youToken = resolveYou(state.links);
    const tileW = 56, tileGap = 12;
    const totalW = state.nodes.length * tileW + (state.nodes.length - 1) * tileGap;
    const startX = (W - totalW) / 2;
    for (let i = 0; i < state.nodes.length; i++) {
      const tok = state.nodes[i];
      const x = startX + i * (tileW + tileGap);
      const isYou = tok === youToken;
      drawTokenTile(ctx, x, TILE_Y, tileW, 56, tok, TOKEN_COLORS[tok], isYou);
    }

    // YOU indicator
    ctx.font = '13px ui-monospace, monospace';
    if (youToken) {
      ctx.fillStyle = '#39ff14';
      ctx.textAlign = 'center';
      ctx.fillText(`YOU = ${youToken}`, W / 2, TILE_Y + 90);
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText('chain broken — no YOU', W / 2, TILE_Y + 90);
    }
    ctx.textAlign = 'left';
  }

  return { state, tick, LOGICAL };
}

function drawNode(ctx, x, y, label, color) {
  const r = 26;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#0d1117';
  ctx.font = `bold ${label.length > 4 ? 9 : 11}px ui-monospace, monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function drawArrow(ctx, x1, y1, x2, y2, color, width) {
  // Inset endpoints by node radius
  const r = 28;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const sx = x1 + Math.cos(ang) * r, sy = y1 + Math.sin(ang) * r;
  const ex = x2 - Math.cos(ang) * r, ey = y2 - Math.sin(ang) * r;
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  // Arrowhead
  const ah = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - Math.cos(ang - 0.4) * ah, ey - Math.sin(ang - 0.4) * ah);
  ctx.lineTo(ex - Math.cos(ang + 0.4) * ah, ey - Math.sin(ang + 0.4) * ah);
  ctx.closePath();
  ctx.fill();
}

function drawTokenTile(ctx, x, y, w, h, label, color, isYou) {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 6); ctx.fill();
  if (isYou) {
    ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 3;
    roundRect(ctx, x - 1, y - 1, w + 2, h + 2, 7); ctx.stroke();
  } else {
    ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1;
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 6); ctx.stroke();
  }
  ctx.fillStyle = '#0d1117';
  ctx.font = `bold ${label.length > 4 ? 10 : 12}px ui-monospace, monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
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
  const reseed = state.chain_depth !== params.chain_depth;
  state.chain_depth = params.chain_depth;
  state.mutation_interval = params.mutation_interval;
  if (reseed) seed(state, params.chain_depth);
}
