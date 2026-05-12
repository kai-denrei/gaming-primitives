// Rhythm: beat-pulse — metronome emits a visual pulse at a fixed BPM; every Nth beat is accented.

export const LOGICAL = { w: 800, h: 450 };

const W = LOGICAL.w, H = LOGICAL.h;
const CX = W / 2, CY = H / 2 - 20;
const BASE_R = 60;

export function init(ctx, params, env) {
  const state = {
    bpm: params.bpm,
    accentEvery: params.accent_every,
    flash: params.flash_intensity,
    elapsed: 0,        // total seconds since start
    beatIndex: 0,      // monotonic count of beats fired
    sincePulse: 0,     // seconds since most recent beat tick
    pulseAccent: false,
  };

  function tick(dt) {
    state.elapsed += dt;
    state.sincePulse += dt;
    const beatPeriod = 60 / state.bpm;

    // Catch up if dt jumped (tab refocus, low fps spike): fire each missed beat at most once.
    while (state.sincePulse >= beatPeriod) {
      state.sincePulse -= beatPeriod;
      state.beatIndex += 1;
      state.pulseAccent = (state.beatIndex % state.accentEvery) === 0;
    }

    // Pulse envelope: 0 at strike → 1 → 0 over the beat period.
    const phase = state.sincePulse / beatPeriod;            // 0..1
    const env01 = Math.max(0, 1 - phase);                   // sharp attack, linear decay
    const accent = state.pulseAccent;
    const scale = 1 + (accent ? 0.5 : 0.3) * env01 * state.flash;
    const r = BASE_R * scale;
    const brightness = (accent ? 1 : 0.65) * (0.4 + 0.6 * env01);

    // Background + frame
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a3a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.setLineDash([]);

    // Pulse circle
    const fillAlpha = 0.25 + 0.5 * brightness * state.flash;
    ctx.fillStyle = accent ? `rgba(57,255,20,${fillAlpha})` : `rgba(230,237,243,${fillAlpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent ? '#39ff14' : '#e6edf3';
    ctx.lineWidth = accent ? 3 : 2;
    ctx.beginPath();
    ctx.arc(CX, CY, BASE_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    // HUD: beat count + BPM (monospace)
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 18px ui-monospace, Menlo, monospace';
    ctx.fillText(`BEAT  ${String(state.beatIndex).padStart(4, '0')}`, 20, 30);
    ctx.font = '14px ui-monospace, Menlo, monospace';
    ctx.fillText(`${state.bpm} BPM  · accent every ${state.accentEvery}`, 20, 50);

    // 16-step bar at the bottom — active step highlighted, accents marked
    const STEPS = 16, BAR_Y = H - 36, BAR_X = 40, BAR_W = W - 80;
    const cell = BAR_W / STEPS;
    const activeStep = state.beatIndex % STEPS;
    for (let i = 0; i < STEPS; i++) {
      const x = BAR_X + i * cell;
      const isAccent = ((i + 1) % state.accentEvery) === 0;
      const isActive = i === activeStep;
      ctx.fillStyle = isActive
        ? (state.pulseAccent ? '#39ff14' : '#e6edf3')
        : (isAccent ? '#2a2a3a' : '#1a1a24');
      ctx.fillRect(x + 1, BAR_Y, cell - 2, 20);
      ctx.strokeStyle = isAccent ? '#39ff14' : '#2a2a3a';
      ctx.strokeRect(x + 1.5, BAR_Y + 0.5, cell - 3, 19);
    }
  }

  return { state, tick, LOGICAL };
}

export function applyParams(state, params) {
  // Live-retune: BPM change preserves phase; accent_every and flash are pure visuals.
  state.bpm = params.bpm;
  state.accentEvery = params.accent_every;
  state.flash = params.flash_intensity;
}
