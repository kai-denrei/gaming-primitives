// Collision: pixel-perfect — bbox prefilter, then per-pixel mask overlap.
// Each sprite is a 16x16 bitmap (drawn once into an offscreen canvas).
// On AABB intersection, we read the overlap region's pixel data from each
// sprite's offscreen canvas and check for any pixel where both are opaque.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const SPRITE = 16;
const SCALE = 3; // render scale — 48 px on screen

// procedural 16x16 mask patterns: 1 = opaque, 0 = transparent.
function makeMask(seed) {
  // a soft asterisk / blob — non-rectangular so pixel-perfect actually differs from AABB
  const m = new Uint8Array(SPRITE * SPRITE);
  const cx = 7.5, cy = 7.5;
  for (let y = 0; y < SPRITE; y++) {
    for (let x = 0; x < SPRITE; x++) {
      const dx = x - cx, dy = y - cy;
      const r = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      // petals — varies by seed
      const petals = 3 + (seed % 4);
      const lobe = 4.5 + 2.5 * Math.cos(petals * ang + seed);
      if (r < lobe) m[y * SPRITE + x] = 1;
    }
  }
  return m;
}

function makeSpriteCanvas(mask, hue) {
  const c = (typeof OffscreenCanvas !== 'undefined')
    ? new OffscreenCanvas(SPRITE, SPRITE)
    : (() => { const cv = document.createElement('canvas'); cv.width = SPRITE; cv.height = SPRITE; return cv; })();
  const cx = c.getContext('2d');
  const img = cx.createImageData(SPRITE, SPRITE);
  // parse hsl(h 60% 55%) into rgb
  const [r, g, b] = hslToRgb(hue, 0.6, 0.55);
  for (let i = 0; i < mask.length; i++) {
    img.data[i * 4 + 0] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = mask[i] ? 255 : 0;
  }
  cx.putImageData(img, 0, 0);
  return c;
}

function hslToRgb(h, s, l) {
  h /= 360;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h * 12) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

function seedSprites(state, n, speed) {
  state.sprites = [];
  for (let i = 0; i < n; i++) {
    const hue = (i * 73 + 30) % 360;
    const mask = makeMask(i + 1);
    const ang = Math.random() * Math.PI * 2;
    state.sprites.push({
      x: 40 + Math.random() * (W - 100),
      y: 40 + Math.random() * (H - 100),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      mask,
      canvas: makeSpriteCanvas(mask, hue),
      hue,
      flash: 0,
    });
  }
  state.speed = speed;
}

function pixelOverlap(a, b) {
  // bbox prefilter (in screen-px sprite size = SPRITE*SCALE)
  const size = SPRITE * SCALE;
  const ax0 = a.x, ay0 = a.y, ax1 = a.x + size, ay1 = a.y + size;
  const bx0 = b.x, by0 = b.y, bx1 = b.x + size, by1 = b.y + size;
  const ox0 = Math.max(ax0, bx0), oy0 = Math.max(ay0, by0);
  const ox1 = Math.min(ax1, bx1), oy1 = Math.min(ay1, by1);
  if (ox1 <= ox0 || oy1 <= oy0) return null;

  // walk overlap region in mask-space; sample both masks at each pixel
  // convert overlap rect (screen px) → each sprite's local mask coord
  const overlap = { x: ox0, y: oy0, w: ox1 - ox0, h: oy1 - oy0 };

  for (let py = oy0; py < oy1; py++) {
    for (let px = ox0; px < ox1; px++) {
      const amx = Math.floor((px - a.x) / SCALE);
      const amy = Math.floor((py - a.y) / SCALE);
      const bmx = Math.floor((px - b.x) / SCALE);
      const bmy = Math.floor((py - b.y) / SCALE);
      if (amx < 0 || amx >= SPRITE || amy < 0 || amy >= SPRITE) continue;
      if (bmx < 0 || bmx >= SPRITE || bmy < 0 || bmy >= SPRITE) continue;
      if (a.mask[amy * SPRITE + amx] && b.mask[bmy * SPRITE + bmx]) return overlap;
    }
  }
  return null;
}

export function init(ctx, params, env) {
  const state = { sprites: [], speed: 0 };
  seedSprites(state, params.sprite_count, params.speed);

  function tick(dt) {
    const size = SPRITE * SCALE;
    for (const s of state.sprites) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < 0)           { s.x = 0;            s.vx = -s.vx; }
      if (s.x + size > W)    { s.x = W - size;     s.vx = -s.vx; }
      if (s.y < 0)           { s.y = 0;            s.vy = -s.vy; }
      if (s.y + size > H)    { s.y = H - size;     s.vy = -s.vy; }
      if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
    }

    const overlaps = [];
    for (let i = 0; i < state.sprites.length; i++) {
      for (let j = i + 1; j < state.sprites.length; j++) {
        const r = pixelOverlap(state.sprites[i], state.sprites[j]);
        if (r) {
          state.sprites[i].flash = 0.15;
          state.sprites[j].flash = 0.15;
          overlaps.push(r);
        }
      }
    }

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // faint bbox-overlap rect
    ctx.fillStyle = 'rgba(160, 160, 200, 0.18)';
    for (const o of overlaps) ctx.fillRect(o.x, o.y, o.w, o.h);

    // sprites — pixelated
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    for (const s of state.sprites) {
      ctx.drawImage(s.canvas, s.x, s.y, size, size);
      if (s.flash > 0) {
        ctx.fillStyle = 'rgba(255, 68, 68, 0.45)';
        ctx.fillRect(s.x, s.y, size, size);
      }
      ctx.strokeStyle = '#2a2a3a';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x + 0.5, s.y + 0.5, size - 1, size - 1);
    }
    ctx.imageSmoothingEnabled = prevSmoothing;

    if (overlaps.length > 0) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('HIT', 12, 24);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  if (state.sprites.length !== params.sprite_count) {
    seedSprites(state, params.sprite_count, params.speed);
    return;
  }
  if (params.speed !== state.speed && state.speed > 0) {
    const k = params.speed / state.speed;
    for (const s of state.sprites) { s.vx *= k; s.vy *= k; }
    state.speed = params.speed;
  }
}
