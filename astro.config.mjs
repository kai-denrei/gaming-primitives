import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'http://localhost:4321',
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
