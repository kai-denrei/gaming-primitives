// timed-puzzle/cascade-clear-rush — Tetris-style cascade clear.
// `board_width × 20` board. Tetrominoes fall at current_speed = initial_speed *
// (1 + speed_ramp * lines_cleared / 10). Auto-pilot picks (rotation × position)
// per piece using a heuristic over height, holes, bumpiness, lines-cleared.
// Game over when a fresh piece can't spawn. Re-seed after 1.5s pause.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const BOARD_H = 20;

// Tetromino definitions. Each is an array of rotation states (4x4 mask grids
// represented as offset arrays [dx, dy]).
const TETROMINOES = {
  I: { color: '#5ee7df', cells: [
    [[0,1],[1,1],[2,1],[3,1]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[1,0],[1,1],[1,2],[1,3]],
  ]},
  O: { color: '#ffd23f', cells: [
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
  ]},
  T: { color: '#b066ff', cells: [
    [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[2,1],[1,2]],
    [[1,0],[0,1],[1,1],[1,2]],
  ]},
  S: { color: '#39ff14', cells: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]],
    [[0,0],[0,1],[1,1],[1,2]],
  ]},
  Z: { color: '#ff4444', cells: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[2,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,0],[0,1],[1,1],[0,2]],
  ]},
  J: { color: '#357edd', cells: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[0,2],[1,2]],
  ]},
  L: { color: '#ff9933', cells: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]],
    [[0,0],[1,0],[1,1],[1,2]],
  ]},
};
const PIECE_TYPES = Object.keys(TETROMINOES);

function randPiece() {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

function makePiece(type) {
  return { type, rot: 0, x: 0, y: 0 };
}

function pieceCells(piece) {
  return TETROMINOES[piece.type].cells[piece.rot % 4];
}

function collides(board, bw, piece, x, y, rot) {
  const cells = TETROMINOES[piece.type].cells[rot % 4];
  for (const [dx, dy] of cells) {
    const bx = x + dx, by = y + dy;
    if (bx < 0 || bx >= bw || by >= BOARD_H) return true;
    if (by < 0) continue;
    if (board[by * bw + bx] !== '') return true;
  }
  return false;
}

function lockPiece(board, bw, piece) {
  const cells = pieceCells(piece);
  for (const [dx, dy] of cells) {
    const bx = piece.x + dx, by = piece.y + dy;
    if (by >= 0 && by < BOARD_H && bx >= 0 && bx < bw) {
      board[by * bw + bx] = piece.type;
    }
  }
}

function clearLines(board, bw) {
  let cleared = 0;
  for (let y = BOARD_H - 1; y >= 0; y--) {
    let full = true;
    for (let x = 0; x < bw; x++) {
      if (board[y * bw + x] === '') { full = false; break; }
    }
    if (full) {
      cleared++;
      // Shift everything above down
      for (let yy = y; yy > 0; yy--) {
        for (let x = 0; x < bw; x++) board[yy * bw + x] = board[(yy - 1) * bw + x];
      }
      for (let x = 0; x < bw; x++) board[x] = '';
      y++;  // recheck this row after shift
    }
  }
  return cleared;
}

// Heuristic score for a board state. Higher = better (less bad).
// Penalize aggregate height, holes, bumpiness; reward cleared-lines.
function evaluateBoard(board, bw, linesJustCleared) {
  let aggHeight = 0, holes = 0, bumpiness = 0;
  const heights = new Array(bw);
  for (let x = 0; x < bw; x++) {
    let h = 0;
    let seenBlock = false;
    for (let y = 0; y < BOARD_H; y++) {
      if (board[y * bw + x] !== '') {
        if (!seenBlock) h = BOARD_H - y;
        seenBlock = true;
      } else if (seenBlock) {
        holes++;
      }
    }
    heights[x] = h;
    aggHeight += h;
  }
  for (let x = 0; x < bw - 1; x++) {
    bumpiness += Math.abs(heights[x] - heights[x + 1]);
  }
  // Standard Pierre Dellacherie-ish weights (tuned simply)
  return -0.51 * aggHeight + 0.76 * linesJustCleared - 0.36 * holes - 0.18 * bumpiness;
}

// Drop position simulation: clone board, place piece in (x, rot) at lowest valid Y,
// clear lines, evaluate. Returns { score, y } or null if cannot place.
function evaluatePlacement(board, bw, piece, x, rot) {
  // Find drop Y.
  let y = -2;
  // First check piece fits in spawn (some pieces extend up to dy=0..3 from origin).
  // We'll just check from y = -2 (cells with dy=0..3 might still fit).
  while (!collides(board, bw, piece, x, y + 1, rot)) {
    y++;
    if (y > BOARD_H) break;
  }
  if (y < -2) return null;
  if (collides(board, bw, piece, x, y, rot)) return null;
  // Apply
  const trial = board.slice();
  const cells = TETROMINOES[piece.type].cells[rot % 4];
  for (const [dx, dy] of cells) {
    const bx = x + dx, by = y + dy;
    if (by < 0) return null;     // can't lock above board → game-over-ish
    if (bx < 0 || bx >= bw || by >= BOARD_H) return null;
    trial[by * bw + bx] = piece.type;
  }
  const cleared = clearLines(trial, bw);
  const score = evaluateBoard(trial, bw, cleared);
  return { score, y, rot, x, cleared };
}

function bestPlacement(state, piece) {
  const best = [];
  for (let rot = 0; rot < 4; rot++) {
    for (let x = -2; x < state.boardWidth + 2; x++) {
      const e = evaluatePlacement(state.board, state.boardWidth, piece, x, rot);
      if (e) best.push(e);
    }
  }
  if (!best.length) return null;
  best.sort((a, b) => b.score - a.score);
  return best;
}

function seed(state) {
  state.board = new Array(state.boardWidth * BOARD_H).fill('');
  state.currentPiece = newSpawn(state, randPiece());
  state.nextType = randPiece();
  state.fallAccum = 0;
  state.linesCleared = 0;
  state.score = 0;
  state.elapsed = 0;
  state.endState = null;
  state.endAt = -10;
  state.plan = null;             // { x, rot, y } cached best placement for current piece
  state.lockFlashAt = -10;
  state.lineFlashY = [];
}

function newSpawn(state, type) {
  // Spawn at top center
  const startX = Math.floor(state.boardWidth / 2) - 2;
  return { type, rot: 0, x: startX, y: -1 };
}

function planForCurrent(state) {
  const list = bestPlacement(state, state.currentPiece);
  if (!list || list.length === 0) return null;
  // Pick best (auto_skill) or a random non-terrible one.
  if (Math.random() < state.autoSkill) return list[0];
  // Pick from top half randomly when skill is low.
  const half = Math.max(1, Math.floor(list.length / 2));
  const subset = list.slice(0, half);
  return subset[Math.floor(Math.random() * subset.length)];
}

export function init(ctx, params, env) {
  const state = {
    boardWidth: params.board_width,
    initialSpeed: params.initial_speed,
    speedRamp: params.speed_ramp,
    autoSkill: params.auto_skill,
  };
  seed(state);
  state.plan = planForCurrent(state);

  function currentSpeed() {
    return state.initialSpeed * (1 + state.speedRamp * state.linesCleared / 10);
  }

  function tick(dt) {
    state.elapsed += dt;

    if (state.endState) {
      if (state.elapsed - state.endAt > 1.5) {
        seed(state);
        state.plan = planForCurrent(state);
      }
      draw();
      return;
    }

    // Move the current piece horizontally + rotation toward plan, 1 step per frame.
    if (state.plan) {
      if (state.currentPiece.rot !== state.plan.rot) {
        // try rotate
        const nr = (state.currentPiece.rot + 1) % 4;
        if (!collides(state.board, state.boardWidth, state.currentPiece, state.currentPiece.x, state.currentPiece.y, nr)) {
          state.currentPiece.rot = nr;
        } else {
          // Try wall-kicks: shift x by ±1 and retry
          if (!collides(state.board, state.boardWidth, state.currentPiece, state.currentPiece.x + 1, state.currentPiece.y, nr)) {
            state.currentPiece.x++; state.currentPiece.rot = nr;
          } else if (!collides(state.board, state.boardWidth, state.currentPiece, state.currentPiece.x - 1, state.currentPiece.y, nr)) {
            state.currentPiece.x--; state.currentPiece.rot = nr;
          }
        }
      } else if (state.currentPiece.x < state.plan.x) {
        if (!collides(state.board, state.boardWidth, state.currentPiece, state.currentPiece.x + 1, state.currentPiece.y, state.currentPiece.rot)) {
          state.currentPiece.x++;
        }
      } else if (state.currentPiece.x > state.plan.x) {
        if (!collides(state.board, state.boardWidth, state.currentPiece, state.currentPiece.x - 1, state.currentPiece.y, state.currentPiece.rot)) {
          state.currentPiece.x--;
        }
      }
    }

    // Vertical fall
    state.fallAccum += dt * currentSpeed();
    while (state.fallAccum >= 1) {
      state.fallAccum -= 1;
      const p = state.currentPiece;
      if (!collides(state.board, state.boardWidth, p, p.x, p.y + 1, p.rot)) {
        p.y++;
      } else {
        // Lock and spawn next
        lockPiece(state.board, state.boardWidth, p);
        state.lockFlashAt = state.elapsed;
        const cleared = clearLines(state.board, state.boardWidth);
        if (cleared > 0) {
          state.linesCleared += cleared;
          state.score += [0, 40, 100, 300, 1200][Math.min(cleared, 4)];
        }
        // Spawn next
        const next = newSpawn(state, state.nextType);
        state.nextType = randPiece();
        // Game over check: does the new spawn collide immediately at y=-1 or y=0?
        if (collides(state.board, state.boardWidth, next, next.x, next.y, next.rot) ||
            collides(state.board, state.boardWidth, next, next.x, next.y + 1, next.rot)) {
          state.endState = 'over';
          state.endAt = state.elapsed;
          break;
        }
        state.currentPiece = next;
        state.plan = planForCurrent(state);
      }
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Layout: board centered, next-piece + HUD on right.
    const bw = state.boardWidth;
    const maxCellH = Math.floor((H - 40) / BOARD_H);
    const maxCellW = Math.floor((W - 240) / bw);
    const c = Math.max(8, Math.min(maxCellW, maxCellH));
    const boardW = c * bw, boardH = c * BOARD_H;
    const ox = 24;
    const oy = Math.floor((H - boardH) / 2);

    // Board background
    ctx.fillStyle = '#161b22';
    ctx.fillRect(ox - 2, oy - 2, boardW + 4, boardH + 4);
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 1.5, oy - 1.5, boardW + 3, boardH + 3);

    // Cells
    for (let y = 0; y < BOARD_H; y++) {
      for (let x = 0; x < bw; x++) {
        const v = state.board[y * bw + x];
        const px = ox + x * c, py = oy + y * c;
        if (v) {
          ctx.fillStyle = TETROMINOES[v].color;
          ctx.fillRect(px, py, c, c);
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, c - 1, c - 1);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.015)';
          ctx.fillRect(px, py, c, c);
        }
      }
    }

    // Active piece (with ghost)
    if (state.currentPiece && !state.endState) {
      const p = state.currentPiece;
      // Ghost: drop position
      let ghostY = p.y;
      while (!collides(state.board, bw, p, p.x, ghostY + 1, p.rot)) ghostY++;
      const cells = pieceCells(p);
      ctx.fillStyle = TETROMINOES[p.type].color + '40';   // ~25% alpha
      for (const [dx, dy] of cells) {
        const bx = p.x + dx, by = ghostY + dy;
        if (by >= 0 && by < BOARD_H && bx >= 0 && bx < bw) {
          const px = ox + bx * c, py = oy + by * c;
          ctx.fillRect(px, py, c, c);
        }
      }
      // Active piece
      ctx.fillStyle = TETROMINOES[p.type].color;
      for (const [dx, dy] of cells) {
        const bx = p.x + dx, by = p.y + dy;
        if (by >= 0 && by < BOARD_H && bx >= 0 && bx < bw) {
          const px = ox + bx * c, py = oy + by * c;
          ctx.fillRect(px, py, c, c);
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, c - 1, c - 1);
        }
      }
    }

    // Side panel: next piece, score
    const sideX = ox + boardW + 24;
    ctx.fillStyle = '#9aa4b2';
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NEXT', sideX, oy + 14);

    // Draw next piece in a 4x4 mini-grid
    const miniC = Math.min(c, 18);
    const miniOX = sideX, miniOY = oy + 24;
    ctx.fillStyle = '#161b22';
    ctx.fillRect(miniOX - 2, miniOY - 2, miniC * 4 + 4, miniC * 4 + 4);
    ctx.strokeStyle = '#2a2a3a';
    ctx.strokeRect(miniOX - 1.5, miniOY - 1.5, miniC * 4 + 3, miniC * 4 + 3);
    const nextCells = TETROMINOES[state.nextType].cells[0];
    ctx.fillStyle = TETROMINOES[state.nextType].color;
    for (const [dx, dy] of nextCells) {
      ctx.fillRect(miniOX + dx * miniC, miniOY + dy * miniC, miniC, miniC);
    }

    // Score / lines / level
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    let sy = miniOY + miniC * 4 + 30;
    ctx.fillStyle = '#9aa4b2';
    ctx.fillText('SCORE', sideX, sy);
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText(String(state.score), sideX, sy + 22);
    sy += 50;
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillStyle = '#9aa4b2';
    ctx.fillText('LINES', sideX, sy);
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText(String(state.linesCleared), sideX, sy + 22);
    sy += 50;
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillStyle = '#9aa4b2';
    ctx.fillText('LEVEL', sideX, sy);
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText(String(Math.floor(state.linesCleared / 10) + 1), sideX, sy + 22);
    sy += 46;
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillStyle = '#9aa4b2';
    ctx.fillText(`speed ${currentSpeed().toFixed(2)} b/s`, sideX, sy);
    ctx.fillText(`skill ${(state.autoSkill * 100).toFixed(0)}%`, sideX, sy + 14);

    // Game over
    if (state.endState === 'over') {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(0, H / 2 - 40, W, 80);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0d1117';
      ctx.font = 'bold 36px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 + 12);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // board_width is structural; initial_speed, speed_ramp, auto_skill are live.
  if (params.board_width !== state.boardWidth) {
    state.boardWidth = params.board_width;
    state.initialSpeed = params.initial_speed;
    state.speedRamp = params.speed_ramp;
    state.autoSkill = params.auto_skill;
    seed(state);
    return;
  }
  state.initialSpeed = params.initial_speed;
  state.speedRamp = params.speed_ramp;
  state.autoSkill = params.auto_skill;
}
