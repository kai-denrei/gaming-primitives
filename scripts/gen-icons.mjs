// scripts/gen-icons.mjs <out-dir> <hex-color> <glyph-text>
// Produces icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon-180.png, favicon-32.png
// Solid background + monogram in white. No external assets. Used by both
// hub install icons and per-mini-game icons.

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [outDir, color = '#0d1117', glyph = 'GP'] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: node gen-icons.mjs <out-dir> [#hex] [glyph]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

function svg(size, padding) {
  const fs = Math.floor(size * 0.42);
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='${size}' height='${size}' fill='${color}'/>
    <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle'
          font-family='monospace' font-size='${fs}' fill='#e6edf3' font-weight='700'>${glyph}</text>
  </svg>`;
}

async function emit(name, size, padding = 0) {
  await sharp(Buffer.from(svg(size, padding))).png().toFile(join(outDir, name));
}

await Promise.all([
  emit('icon-192.png', 192),
  emit('icon-512.png', 512),
  emit('icon-maskable-512.png', 512, 90),
  emit('apple-touch-icon-180.png', 180),
  emit('favicon-32.png', 32),
]);

console.log(`icons: wrote into ${outDir}`);
