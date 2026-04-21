import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';

const astroEntrypoints = fileURLToPath(new URL('./node_modules/astro/dist/entrypoints/', import.meta.url));

export default defineConfig({
  site: 'https://takatabi.net',
  integrations: [sitemap()],
  trailingSlash: 'always',
  vite: {
    resolve: {
      alias: {
        'astro/entrypoints/prerender': `${astroEntrypoints}prerender.js`,
        'astro/entrypoints/legacy': `${astroEntrypoints}legacy.js`
      }
    }
  }
});
