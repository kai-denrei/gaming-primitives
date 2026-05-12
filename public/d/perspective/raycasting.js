// perspective/raycasting — flat-shaded raycasting on a 2D grid. One ray per
// screen column via DDA; wall slab height = H / perpendicular_distance with
// fish-eye correction via cos(rayAngle - heading). N-S walls drawn slightly
// darker than E-W to fake shading.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const MAP_SIZE = 16;

function buildMap() {
  const m = new Uint8Array(MAP_SIZE * MAP_SIZE);
  // Border walls.
  for (let i = 0; i < MAP_SIZE; i++) {
    m[i] = 1;
    m[(MAP_SIZE - 1) * MAP_SIZE + i] = 1;
    m[i * MAP_SIZE] = 1;
    m[i * MAP_SIZE + (MAP_SIZE - 1)] = 1;
  }
  // Plus-shape interior pillar cluster + a couple of corridor-defining walls.
  const mid = Math.floor(MAP_SIZE / 2);
  m[mid * MAP_SIZE + mid] = 1;
  m[(mid - 1) * MAP_SIZE + mid] = 1;
  m[(mid + 1) * MAP_SIZE + mid] = 1;
  m[mid * MAP_SIZE + (mid - 1)] = 1;
  m[mid * MAP_SIZE + (mid + 1)] = 1;

  // A few scattered pillars (deterministic-ish via simple seeded loop).
  const pillars = [
    [3, 3], [3, 12], [12, 3], [12, 12],
    [6, 8], [10, 8], [8, 5], [8, 11],
  ];
  for (const [x, y] of pillars) m[y * MAP_SIZE + x] = 1;
  // Ensure player start is open.
  m[(mid - 3) * MAP_SIZE + (mid - 3)] = 0;
  return m;
}

function cellAt(map, x, y) {
  if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return 1;
  return map[y * MAP_SIZE + x];
}

function seed(state) {
  state.map = buildMap();
  const mid = Math.floor(MAP_SIZE / 2);
  state.px = mid - 3 + 0.5;
  state.py = mid - 3 + 0.5;
  state.heading = 0;
  state.elapsed = 0;
}

// DDA ray cast. Returns { dist, side } where side=0 vertical (E-W facing wall), 1 horizontal (N-S wall).
function castRay(state, rayAngle) {
  const cosA = Math.cos(rayAngle);
  const sinA = Math.sin(rayAngle);
  const px = state.px, py = state.py;

  let mapX = Math.floor(px);
  let mapY = Math.floor(py);

  const deltaX = Math.abs(1 / (cosA || 1e-9));
  const deltaY = Math.abs(1 / (sinA || 1e-9));

  let stepX, stepY, sideDistX, sideDistY;
  if (cosA < 0) { stepX = -1; sideDistX = (px - mapX) * deltaX; }
  else          { stepX =  1; sideDistX = (mapX + 1 - px) * deltaX; }
  if (sinA < 0) { stepY = -1; sideDistY = (py - mapY) * deltaY; }
  else          { stepY =  1; sideDistY = (mapY + 1 - py) * deltaY; }

  let side = 0;
  for (let iter = 0; iter < 64; iter++) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaY;
      mapY += stepY;
      side = 1;
    }
    if (cellAt(state.map, mapX, mapY)) {
      const perp = side === 0
        ? (sideDistX - deltaX)
        : (sideDistY - deltaY);
      return { dist: perp, side };
    }
  }
  return { dist: 64, side: 0 };
}

export function init(ctx, params, env) {
  const state = {
    fov:      params.fov_deg * Math.PI / 180,
    rayCount: params.ray_count,
    moveSpeed: params.move_speed,
    rotSpeed:  params.rotation_speed,
  };
  seed(state);

  function tick(dt) {
    state.elapsed += dt;

    // Auto-pilot: rotation oscillates, forward moves at moveSpeed with wall slide.
    state.heading += state.rotSpeed * Math.sin(state.elapsed * 0.3) * dt;
    const stepX = Math.cos(state.heading) * state.moveSpeed * dt;
    const stepY = Math.sin(state.heading) * state.moveSpeed * dt;
    // Slide: try x, then y, with a small clearance margin.
    const M = 0.18;
    const nx = state.px + stepX;
    if (!cellAt(state.map, Math.floor(nx + Math.sign(stepX) * M), Math.floor(state.py))) state.px = nx;
    else state.heading += 0.4; // bounce
    const ny = state.py + stepY;
    if (!cellAt(state.map, Math.floor(state.px), Math.floor(ny + Math.sign(stepY) * M))) state.py = ny;
    else state.heading += 0.4;

    // === Render ===
    // Ceiling / floor split.
    ctx.fillStyle = '#1e2632';
    ctx.fillRect(0, 0, W, H / 2);
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, H / 2, W, H / 2);

    const colW = W / state.rayCount;
    for (let i = 0; i < state.rayCount; i++) {
      const t = (i + 0.5) / state.rayCount;        // 0..1
      const rayAngle = state.heading + (t - 0.5) * state.fov;
      const cast = castRay(state, rayAngle);
      // Fish-eye correction: project ray distance onto camera forward axis.
      const correctedDist = cast.dist * Math.cos(rayAngle - state.heading);
      const slabH = Math.min(H, H / Math.max(0.05, correctedDist));
      const y0 = (H - slabH) / 2;

      // Brightness: base 35%, brighter when close; N-S (side=1) walls slightly darker.
      const distFalloff = Math.max(0.25, 1 - correctedDist / 12);
      const sideShade = cast.side === 1 ? 0.78 : 1.0;
      const light = Math.round(35 * sideShade * (0.6 + distFalloff * 0.6));
      ctx.fillStyle = `hsl(200, 5%, ${light}%)`;
      ctx.fillRect(i * colW, y0, Math.ceil(colW) + 0.5, slabH);
    }

    // Minimap
    const mmCell = 7;
    const mmW = MAP_SIZE * mmCell;
    const mmX = W - mmW - 12, mmY = 12;
    ctx.fillStyle = 'rgba(13,17,23,0.85)';
    ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmW + 4);
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (state.map[y * MAP_SIZE + x]) {
          ctx.fillStyle = '#3a4555';
          ctx.fillRect(mmX + x * mmCell, mmY + y * mmCell, mmCell - 1, mmCell - 1);
        }
      }
    }
    // Player dot
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(mmX + state.px * mmCell, mmY + state.py * mmCell, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Heading line
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mmX + state.px * mmCell, mmY + state.py * mmCell);
    ctx.lineTo(
      mmX + state.px * mmCell + Math.cos(state.heading) * mmCell * 2,
      mmY + state.py * mmCell + Math.sin(state.heading) * mmCell * 2,
    );
    ctx.stroke();

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`fov ${(state.fov * 180 / Math.PI).toFixed(0)}°  ·  ${state.rayCount} rays  ·  pos (${state.px.toFixed(1)}, ${state.py.toFixed(1)})`, 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  state.fov       = params.fov_deg * Math.PI / 180;
  state.rayCount  = params.ray_count;
  state.moveSpeed = params.move_speed;
  state.rotSpeed  = params.rotation_speed;
}
