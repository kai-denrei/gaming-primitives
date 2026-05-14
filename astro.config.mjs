import { defineConfig } from 'astro/config';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const isCI = process.env.GITHUB_ACTIONS === 'true';

const buildSha = (() => {
  try {
    const sha = execSync('git rev-parse --short HEAD').toString().trim();
    // Append -dirty if working tree has uncommitted changes, so the stamp
    // on the page accurately reflects whether the build is reproducible
    // from the named commit or includes local mods.
    const dirty = execSync('git status --porcelain').toString().trim();
    return dirty ? `${sha}-dirty` : sha;
  } catch { return 'dev'; }
})();
const buildDate = (() => {
  try { return execSync('git log -1 --format=%cd --date=short').toString().trim(); }
  catch { return new Date().toISOString().slice(0, 10); }
})();

// Single-source build identity at dist-time. Two surfaces:
//   1. dist/sw.js — CACHE_VERSION templated from package.json so the hub's
//      footer (pkg.version) and the SW key cannot drift.
//   2. dist/g/*/index.html — each mini-game's top bar shows the hub's build
//      SHA + date next to its own per-game version, so the user can verify
//      they're on the deploy I just pushed and not a stale PWA cache.
const swVersionInject = {
  name: 'sw-version-inject',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const distDir = fileURLToPath(dir);
      const swPath = join(distDir, 'sw.js');
      const swSrc = readFileSync(swPath, 'utf8');
      if (!swSrc.includes('__PKG_VERSION__')) {
        throw new Error('sw-version-inject: __PKG_VERSION__ token missing from dist/sw.js');
      }
      writeFileSync(swPath, swSrc.replace('__PKG_VERSION__', `v${pkg.version}`));

      // Walk dist/g/*/index.html and stamp build identity.
      const gamesDir = join(distDir, 'g');
      let stamped = 0;
      try {
        for (const name of readdirSync(gamesDir)) {
          const gameDir = join(gamesDir, name);
          if (!statSync(gameDir).isDirectory()) continue;
          const idxPath = join(gameDir, 'index.html');
          let src;
          try { src = readFileSync(idxPath, 'utf8'); } catch { continue; }
          if (!src.includes('__BUILD_SHA__')) continue;
          const out = src
            .replaceAll('__BUILD_SHA__', buildSha)
            .replaceAll('__BUILD_DATE__', buildDate);
          writeFileSync(idxPath, out);
          stamped++;
        }
      } catch (e) { /* no dist/g — fine */ }
      // eslint-disable-next-line no-console
      console.log(`[sw-version-inject] hub=v${pkg.version} sha=${buildSha} date=${buildDate}  stamped ${stamped} game(s)`);
    },
  },
};

export default defineConfig({
  site: isCI ? 'https://kai-denrei.github.io' : 'http://localhost:4321',
  base: isCI ? '/gaming-primitives' : '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [swVersionInject],
  build: {
    assets: 'astro-assets',
  },
  server: {
    port: 4321,
  },
  vite: {
    server: {
      watch: {
        // Mini-game source under public/g/ must NOT trigger Astro HMR — these
        // are vendored standalone PWAs, not Astro-processed assets.
        ignored: ['**/public/g/**'],
      },
    },
  },
});
