// Camera: lerp — cam = cam + (player - cam) * lerp_factor each frame; smoothing trails the player.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const WORLD_W = 2000, WORLD_H = 800;
const VIEW_W = 800, VIEW_H = 450;
const PAD = 20;
const SCALE = Math.min((W - 2 * PAD) / WORLD_W, (H - 2 * PAD) / WORLD_H);
const STAGE_W = WORLD_W * SCALE, STAGE_H = WORLD_H * SCALE;
const OX = (W - STAGE_W) / 2, OY = (H - STAGE_H) / 2;
const TILE = 100;
const PLAYER_R = 8;
const wx = x => OX + x * SCALE;
const wy = y => OY + y * SCALE;

function landmarks() {
  return [
    { x: 300,  y: 200, r: 30, hue: 20  },
    { x: 700,  y: 600, r: 40, hue: 60  },
    { x: 1100, y: 300, r: 28, hue: 140 },
    { x: 1500, y: 650, r: 36, hue: 200 },
    { x: 1800, y: 200, r: 32, hue: 280 },
  ];
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
    lerp: params.lerp_factor,
    landmarks: landmarks(),
    camX: 400,
    camY: WORLD_H / 2,
  };

  function drawScene(camX, camY) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#11131a';
    ctx.fillRect(wx(0), wy(0), STAGE_W, STAGE_H);
    ctx.strokeStyle = '#1a1d28';
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD_W; x += TILE) {
      ctx.beginPath(); ctx.moveTo(wx(x), wy(0)); ctx.lineTo(wx(x), wy(WORLD_H)); ctx.stroke();
    }
    for (let y = 0; y <= WORLD_H; y += TILE) {
      ctx.beginPath(); ctx.moveTo(wx(0), wy(y)); ctx.lineTo(wx(WORLD_W), wy(y)); ctx.stroke();
    }
    const left = camX - VIEW_W / 2, right = camX + VIEW_W / 2;
    const top  = camY - VIEW_H / 2, bot   = camY + VIEW_H / 2;
    for (const m of state.landmarks) {
      const inside = m.x >= left && m.x <= right && m.y >= top && m.y <= bot;
      ctx.fillStyle = inside ? `hsl(${m.hue} 70% 55%)` : `hsl(${m.hue} 35% 25%)`;
      ctx.beginPath();
      ctx.arc(wx(m.x), wy(m.y), m.r * SCALE, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(wx(left), wy(top), VIEW_W * SCALE, VIEW_H * SCALE);
  }

  function tick(dt) {
    const p = state.player;
    p.x += p.dir * state.speed * dt;
    if (p.x > WORLD_W - 40) { p.x = WORLD_W - 40; p.dir = -1; }
    if (p.x < 40)           { p.x = 40;           p.dir =  1; }

    state.camX += (p.x - state.camX) * state.lerp;
    state.camY += (p.y - state.camY) * state.lerp;
    const c = clampCam(state.camX, state.camY);
    state.camX = c.x; state.camY = c.y;

    drawScene(state.camX, state.camY);

    // ideal indicator: where the camera would be if perfectly tracking (= player pos)
    ctx.strokeStyle = '#39ff1455';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(wx(state.camX), wy(state.camY));
    ctx.lineTo(wx(p.x), wy(p.y));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(wx(p.x), wy(p.y), 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(wx(p.x), wy(p.y), PLAYER_R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.speed = params.world_speed;
  state.lerp = params.lerp_factor;
}
