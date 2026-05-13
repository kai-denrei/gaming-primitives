import { defineConfig } from 'astro/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const isCI = process.env.GITHUB_ACTIONS === 'true';

// Single-source the SW cache version from package.json. public/sw.js ships
// with the literal token __PKG_VERSION__; this hook rewrites it in dist/
// after build so footer (pkg.version) and SW (CACHE_VERSION) cannot drift.
const swVersionInject = {
  name: 'sw-version-inject',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const swPath = join(fileURLToPath(dir), 'sw.js');
      const src = readFileSync(swPath, 'utf8');
      if (!src.includes('__PKG_VERSION__')) {
        throw new Error('sw-version-inject: __PKG_VERSION__ token missing from dist/sw.js');
      }
      writeFileSync(swPath, src.replace('__PKG_VERSION__', `v${pkg.version}`));
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
