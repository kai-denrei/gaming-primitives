// Primitive: __ID__
// Player verb: __VERB__
// Mechanism summary: filled by build agent. Keep tick() readable.

// --- State -------------------------------------------------------------
const state = {
  // build agent: fill this in
};

// --- Tick --------------------------------------------------------------
function tick(dt) {
  // mechanism: build agent fills this with the primitive's actual loop
}

// --- Render ------------------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const stage = document.getElementById('stage');
  const w = stage.clientWidth, h = stage.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function render() {
  // build agent fills this
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- Input -------------------------------------------------------------
function bindInput() {
  // build agent fills this
}

// --- Fullscreen toggle -------------------------------------------------
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  const stage = document.getElementById('stage');
  if (!document.fullscreenElement) {
    (stage.requestFullscreen?.() ?? stage.webkitRequestFullscreen?.());
  } else {
    document.exitFullscreen?.();
  }
});

// --- Pause on blur -----------------------------------------------------
let paused = false;
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
});

// --- Boot --------------------------------------------------------------
function boot() {
  resize();
  window.addEventListener('resize', resize);
  bindInput();

  let last = performance.now();
  function frame(t) {
    const dt = Math.min(50, t - last) / 1000;
    last = t;
    if (!paused) tick(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
boot();
