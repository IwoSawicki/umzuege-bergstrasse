// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// WICHTIG: `site` auf die echte Produktions-Domain setzen.
// Sie wird für Canonicals, Open-Graph-URLs und die sitemap.xml verwendet.
const SITE_URL = process.env.SITE_URL || 'https://umzuege-bergstrasse.de';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      // Rechtsseiten und interne Seiten (beide noindex) ausschließen
      filter: (page) => !/\/(impressum|datenschutz)\/?$/.test(page) && !/\/intern\//.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
