// rhythm/multi-lane — vertical multi-column timing windows (DDR step-grid).
// Notes spawn at bottom on-beat, scroll upward, auto-graded as they cross the
// target line near the top. Grade bands: perfect / great / good / miss.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const TARGET_Y = 70;            // target line position from top
const NOTE_H = 28;              // note rect height
const TRAVEL_BEATS = 2.5;       // notes visible this many beats before crossing target

const PERFECT_MS = 50;
const GREAT_MS   = 100;
const GOOD_MS    = 180;

const LANE_HUES = [350, 50, 180, 280, 130, 30]; // red, yellow, cyan, magenta, green, orange

function seed(state, params) {
  state.lanes        = params.lanes;
  state.bpm          = params.bpm;
  state.density      = params.note_density;
  state.skill        = params.auto_skill;
  state.notes        = [];
  state.elapsed      = 0;
  state.beatCounter  = 0;
  state.lastBeatTime = 0;
  state.counts       = { perfect: 0, great: 0, good: 0, miss: 0 };
  state.combo        = 0;
  state.maxCombo     = 0;
  state.lastGrade    = null;
  state.lastGradeAt  = -10;
  state.hitFlashLane = new Array(state.lanes).fill(-10);
}

function gradeFor(absMs) {
  if (absMs < PERFECT_MS) return 'perfect';
  if (absMs < GREAT_MS)   return 'great';
  if (absMs < GOOD_MS)    return 'good';
  return 'miss';
}

export function init(ctx, params, env) {
  const state = {};
  seed(state, params);

  function spawnNote(lane, targetTime) {
    // Auto-tap time has skill-scaled jitter around the target. Skill 1 →
    // always perfect; skill 0 → uniform across ±(GOOD_MS + 30ms), so some hits
    // miss outright. Triangular(ish) distribution biases toward center.
    const span = (1 - state.skill) * (GOOD_MS + 30);
    const r1 = Math.random(), r2 = Math.random();
    const offsetMs = (r1 - r2) * span;
    state.notes.push({
      lane,
      targetTime,
      tapTime: targetTime + offsetMs / 1000,
      hit: false,
      grade: null,
    });
  }

  function tick(dt) {
    state.elapsed += dt;
    const beatPeriod = 60 / state.bpm;
    const travelTime = beatPeriod * TRAVEL_BEATS;
    const noteSpeed  = (H + 2 * NOTE_H) / travelTime;

    // Spawn one beat-row at a time
    while (state.lastBeatTime + beatPeriod <= state.elapsed) {
      state.lastBeatTime += beatPeriod;
      state.beatCounter++;
      const targetTime = state.lastBeatTime + travelTime;
      for (let lane = 0; lane < state.lanes; lane++) {
        if (Math.random() < state.density) spawnNote(lane, targetTime);
      }
    }

    // Resolve hits
    for (const note of state.notes) {
      if (note.hit) continue;
      if (state.elapsed >= note.tapTime && (state.elapsed - note.targetTime) * 1000 <= GOOD_MS) {
        const absMs = Math.abs((state.elapsed - note.targetTime) * 1000);
        const grade = gradeFor(absMs);
        note.hit = true;
        note.grade = grade;
        state.counts[grade]++;
        if (grade === 'miss') state.combo = 0;
        else                  state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        state.lastGrade   = grade;
        state.lastGradeAt = state.elapsed;
        state.hitFlashLane[note.lane] = state.elapsed;
      } else if ((state.elapsed - note.targetTime) * 1000 > GOOD_MS) {
        // Past target without tapping → miss
        note.hit = true;
        note.grade = 'miss';
        state.counts.miss++;
        state.combo = 0;
        state.lastGrade   = 'miss';
        state.lastGradeAt = state.elapsed;
      }
    }

    // Cull notes that have flown off the top (~3 note-heights past target)
    state.notes = state.notes.filter(n => {
      const y = H + NOTE_H - noteSpeed * (state.elapsed - (n.targetTime - travelTime));
      return y > -NOTE_H * 3;
    });

    // === Render ===
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    const laneW = W / state.lanes;

    // Lane backgrounds + dividers
    for (let i = 0; i < state.lanes; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      ctx.fillRect(i * laneW + 2, 0, laneW - 4, H);
    }

    // Target line + lane "buttons" sitting on the target line
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, TARGET_Y); ctx.lineTo(W, TARGET_Y);
    ctx.stroke();
    for (let i = 0; i < state.lanes; i++) {
      const recent = state.elapsed - state.hitFlashLane[i];
      const cx = i * laneW + laneW / 2;
      const hue = LANE_HUES[i % LANE_HUES.length];
      const alpha = recent < 0.18 ? (1 - recent / 0.18) : 0.25;
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, TARGET_Y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Notes
    for (const note of state.notes) {
      const y = H + NOTE_H - noteSpeed * (state.elapsed - (note.targetTime - travelTime));
      if (y > H + NOTE_H || y < -NOTE_H) continue;
      const hue = LANE_HUES[note.lane % LANE_HUES.length];
      const x = note.lane * laneW + 10;
      const w = laneW - 20;
      if (note.hit) {
        ctx.fillStyle = `hsla(${hue}, 30%, 40%, 0.35)`;
      } else {
        ctx.fillStyle = `hsl(${hue}, 75%, 58%)`;
      }
      ctx.fillRect(x, y - NOTE_H / 2, w, NOTE_H);
      // chevron indicator pointing up
      if (!note.hit) {
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const cx = x + w / 2;
        ctx.moveTo(cx - 8, y + 4);
        ctx.lineTo(cx, y - 4);
        ctx.lineTo(cx + 8, y + 4);
        ctx.stroke();
      }
    }

    // Grade flash at center
    if (state.lastGrade && state.elapsed - state.lastGradeAt < 0.45) {
      const t = (state.elapsed - state.lastGradeAt) / 0.45;
      const color = state.lastGrade === 'perfect' ? '#39ff14'
                  : state.lastGrade === 'great'   ? '#a8ff39'
                  : state.lastGrade === 'good'    ? '#ffd23f'
                  :                                 '#ff4444';
      ctx.fillStyle = color;
      ctx.globalAlpha = 1 - t;
      ctx.font = 'bold 32px ui-monospace, monospace';
      ctx.textAlign = 'center';
      const label = state.lastGrade.toUpperCase();
      ctx.fillText(label, W / 2, H / 2);
      ctx.globalAlpha = 1;
    }

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`combo ${state.combo}  max ${state.maxCombo}`, 12, H - 14);
    ctx.textAlign = 'right';
    const c = state.counts;
    ctx.fillText(`P:${c.perfect}  Gr:${c.great}  Go:${c.good}  M:${c.miss}`, W - 12, H - 14);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9aa4b2';
    ctx.fillText(`${state.bpm} bpm  ·  ${state.lanes} lanes  ·  skill ${(state.skill * 100).toFixed(0)}%`, 12, 18);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Re-seed on lane-count change (structural).
  if (state.lanes !== params.lanes) { seed(state, params); return; }
  state.bpm     = params.bpm;
  state.density = params.note_density;
  state.skill   = params.auto_skill;
}
