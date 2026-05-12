// Rhythm: timing-window — scrolling markers grade auto-taps as PERFECT / GOOD / MISS.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const TRACK_Y = H / 2;
const TRACK_H = 80;
const TARGET_X = W * 0.3;
const MARKER_R = 14;

function seed(state) {
  state.markers = [];      // each: { x, scheduledTapAt: relative-arrival-offset-in-ms }
  state.flash = null;      // { label, color, ttl }
  state.counts = { P: 0, G: 0, M: 0 };
  state.lastBeat = 0;
}

export function init(ctx, params, env) {
  const state = {
    bpm: params.bpm,
    perfectMs: params.perfect_window_ms,
    goodMs: params.good_window_ms,
    skill: params.auto_skill,
    elapsed: 0,
    sincePulse: 0,
    markers: [],
    flash: null,
    counts: { P: 0, G: 0, M: 0 },
  };
  seed(state);

  function spawnMarker() {
    // Marker spawns at the right edge and travels left so it crosses TARGET_X exactly one beat from now.
    // Pre-decide the auto-tap offset so the marker is graded the moment it reaches the target.
    const beatPeriod = 60 / state.bpm;
    // Sample tap offset in ms: skill=1 → near 0; skill=0 → uniform in [-goodMs, +goodMs].
    const r = (Math.random() * 2 - 1) * state.goodMs;
    const offset = r * (1 - state.skill);
    state.markers.push({
      bornAt: state.elapsed,
      lifetime: beatPeriod,
      tapOffsetMs: offset,
      graded: false,
    });
  }

  function tick(dt) {
    state.elapsed += dt;
    state.sincePulse += dt;
    const beatPeriod = 60 / state.bpm;

    while (state.sincePulse >= beatPeriod) {
      state.sincePulse -= beatPeriod;
      spawnMarker();
    }

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Track lane
    ctx.fillStyle = '#1a1a24';
    ctx.fillRect(0, TRACK_Y - TRACK_H / 2, W, TRACK_H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.strokeRect(0, TRACK_Y - TRACK_H / 2 + 0.5, W, TRACK_H - 1);

    // Target zone — a vertical lane at TARGET_X. Perfect band inner, good band outer.
    // Width in pixels: markers travel (W - TARGET_X) px in one beat (their lifetime).
    const pxPerSec = (W - TARGET_X) / beatPeriod;
    const goodPx = (state.goodMs / 1000) * pxPerSec;
    const perfectPx = (state.perfectMs / 1000) * pxPerSec;
    ctx.fillStyle = 'rgba(255,210,63,0.18)';
    ctx.fillRect(TARGET_X - goodPx, TRACK_Y - TRACK_H / 2, goodPx * 2, TRACK_H);
    ctx.fillStyle = 'rgba(57,255,20,0.25)';
    ctx.fillRect(TARGET_X - perfectPx, TRACK_Y - TRACK_H / 2, perfectPx * 2, TRACK_H);
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(TARGET_X, TRACK_Y - TRACK_H / 2);
    ctx.lineTo(TARGET_X, TRACK_Y + TRACK_H / 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Update + draw markers (right → left).
    const alive = [];
    for (const m of state.markers) {
      const age = state.elapsed - m.bornAt;          // 0..lifetime
      const frac = age / m.lifetime;                 // 0 at spawn, 1 at target arrival
      const x = W - frac * (W - TARGET_X);
      // Grade the moment the marker's tap fires — at scheduled arrival + tapOffset.
      const tapAt = m.bornAt + m.lifetime + m.tapOffsetMs / 1000;
      if (!m.graded && state.elapsed >= tapAt) {
        m.graded = true;
        const absMs = Math.abs(m.tapOffsetMs);
        if (absMs <= state.perfectMs) {
          state.counts.P++;
          state.flash = { label: 'PERFECT', color: '#39ff14', ttl: 0.3 };
        } else if (absMs <= state.goodMs) {
          state.counts.G++;
          state.flash = { label: 'GOOD', color: '#ffd23f', ttl: 0.3 };
        } else {
          state.counts.M++;
          state.flash = { label: 'MISS', color: '#ff4444', ttl: 0.3 };
        }
      }
      // Cull when off-screen past target
      if (age < m.lifetime + 0.4) {
        // Draw — fade after grading
        const drawX = m.graded ? TARGET_X - (state.elapsed - tapAt) * 200 : x;
        ctx.fillStyle = m.graded ? '#2a2a3a' : '#e6edf3';
        ctx.beginPath();
        ctx.arc(drawX, TRACK_Y, MARKER_R, 0, Math.PI * 2);
        ctx.fill();
        alive.push(m);
      }
    }
    state.markers = alive;

    // Flash result
    if (state.flash) {
      state.flash.ttl -= dt;
      const a = Math.max(0, state.flash.ttl / 0.3);
      ctx.fillStyle = state.flash.color;
      ctx.globalAlpha = a;
      ctx.font = 'bold 40px system-ui, sans-serif';
      const text = state.flash.label;
      const tw = ctx.measureText(text).width;
      ctx.fillText(text, TARGET_X - tw / 2, TRACK_Y - TRACK_H / 2 - 16);
      ctx.globalAlpha = 1;
      if (state.flash.ttl <= 0) state.flash = null;
    }

    // Tally HUD (top)
    ctx.font = 'bold 16px ui-monospace, Menlo, monospace';
    ctx.fillStyle = '#39ff14';
    ctx.fillText(`P ${state.counts.P}`, 20, 30);
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(`G ${state.counts.G}`, 110, 30);
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`M ${state.counts.M}`, 200, 30);
    ctx.fillStyle = '#e6edf3';
    ctx.font = '12px ui-monospace, Menlo, monospace';
    ctx.fillText(`${state.bpm} bpm · perfect ±${state.perfectMs}ms · good ±${state.goodMs}ms · skill ${state.skill.toFixed(2)}`, 20, H - 14);
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Structural change to BPM invalidates in-flight markers (their lifetimes were baked at spawn).
  if (state.bpm !== params.bpm) {
    state.bpm = params.bpm;
    state.markers = [];
    state.sincePulse = 0;
  }
  state.perfectMs = params.perfect_window_ms;
  state.goodMs = params.good_window_ms;
  state.skill = params.auto_skill;
}
