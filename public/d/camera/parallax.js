// Camera: parallax — background layers translate at fractions of camera motion to fake depth.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const WORLD_W = 2000, WORLD_H = 800;
const VIEW_W = 800, VIEW_H = 450;
const PAD = 20;
const SCALE = Math.min((W - 2 * PAD) / WORLD_W, (H - 2 * PAD) / WORLD_H);
const STAGE_W = WORLD_W * SCALE, STAGE_H = WORLD_H * SCALE;
const OX = (W - STAGE_W) / 2, OY = (H - STAGE_H) / 2;
const PLAYER_R = 8;
const wx = x => OX + x * SCALE;
const wy = y => OY + y * SCALE;

function makeLayer(n, hue, ySpread) {
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push({
      x: (i + 0.5) * (WORLD_W / n) + (Math.random() - 0.5) * 80,
      y: WORLD_H * 0.2 + Math.random() * ySpread,
      r: 14 + Math.random() * 18,
      hue: hue + (Math.random() - 0.5) * 30,
    });
  }
  return items;
}

function clampCam(camX, camY) {
  const minX = VIEW_W / 2, maxX = WORLD_W - VIEW_W / 2;
  const minY = VIEW_H / 2, maxY = WORLD_H - VIEW_H / 2;
  return { x: Math.max(minX, Math.min(maxX, camX)), y: Math.max(minY, Math.min(maxY, camY)) };
}

export function init(ctx, params, env) {
  const state = {
    player: { x: 200, y: WORLD_H / 2, dir: 1 },
    speed: params.world_speed,
    bg:  params.bg_factor,
    mid: params.mid_factor,
    bgLayer:  makeLayer(8,  220, 200),
    midLayer: makeLayer(12, 140, 400),
    fgLayer:  makeLayer(16, 30,  500),
    camX: 400,
    camY: WORLD_H / 2,
  };

  function drawLayer(items, factor, camX, camY, alpha) {
    // shift items by (1 - factor) * camera offset so distant layers appear to "drag"
    const shiftX = (1 - factor) * (camX - WORLD_W / 2);
    const shiftY = (1 - factor) * (camY - WORLD_H / 2);
    const left = camX - VIEW_W / 2, right = camX + VIEW_W / 2;
    const top  = camY - VIEW_H / 2, bot   = camY + VIEW_H / 2;
    for (const it of items) {
      const wxp = it.x + shiftX, wyp = it.y + shiftY;
      const inside = wxp >= left && wxp <= right && wyp >= top && wyp <= bot;
      const lum = inside ? 55 : 28;
      ctx.fillStyle = `hsla(${it.hue} 60% ${lum}% / ${alpha})`;
      ctx.beginPath();
      ctx.arc(wx(wxp), wy(wyp), it.r * SCALE, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick(dt) {
    const p = state.player;
    p.x += p.dir * state.speed * dt;
    if (p.x > WORLD_W - 40) { p.x = WORLD_W - 40; p.dir = -1; }
    if (p.x < 40)           { p.x = 40;           p.dir =  1; }

    // camera follows player (foreground = 1.0 always)
    state.camX = p.x; state.camY = p.y;
    const c = clampCam(state.camX, state.camY); state.camX = c.x; state.camY = c.y;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#11131a';
    ctx.fillRect(wx(0), wy(0), STAGE_W, STAGE_H);

    drawLayer(state.bgLayer,  state.bg,  state.camX, state.camY, 0.55);
    drawLayer(state.midLayer, state.mid, state.camX, state.camY, 0.8);
    drawLayer(state.fgLayer,  1,         state.camX, state.camY, 1);

    // viewport frame
    const left = state.camX - VIEW_W / 2, top = state.camY - VIEW_H / 2;
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(wx(left), wy(top), VIEW_W * SCALE, VIEW_H * SCALE);

    // player
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(wx(p.x), wy(p.y), PLAYER_R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.speed = params.world_speed;
  state.bg  = params.bg_factor;
  state.mid = params.mid_factor;
}
