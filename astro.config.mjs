import { defineConfig } from 'astro/config';

const isCI = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  site: isCI ? 'https://kai-denrei.github.io' : 'http://localhost:4321',
  base: isCI ? '/gaming-primitives' : '/',
  output: 'static',
  trailingSlash: 'always',
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
