import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/* The published address, e.g. https://<user>.github.io/yui-board/ — the CSP
   trusts this path rather than the whole github.io origin (RFC-0003 §17.3). */
const ORIGIN = process.env.YUNABI_ORIGIN ?? '';
const SUPABASE = process.env.VITE_SUPABASE_URL ?? '';

function csp(): string {
  const self = ORIGIN || "'self'";
  const turnstile = 'https://challenges.cloudflare.com';
  const rules = [
    "default-src 'none'",
    `script-src ${ORIGIN ? ORIGIN + 'assets/' : "'self'"} ${turnstile}`,
    /* Leaflet sets inline styles on its elements */
    `style-src ${ORIGIN ? ORIGIN + 'assets/' : "'self'"} 'unsafe-inline'`,
    `img-src ${self} data: https://tile.openstreetmap.org`,
    `connect-src ${self} ${SUPABASE} ${turnstile}`.replace(/\s+/g, ' ').trim(),
    `frame-src ${turnstile}`,
    `worker-src ${ORIGIN ? ORIGIN + 'sw.js' : "'self'"}`,
    `manifest-src ${self}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ];
  if (ORIGIN.startsWith('https:')) rules.push('upgrade-insecure-requests');
  return rules.join('; ');
}

/* Production only: the dev server injects inline scripts for Fast Refresh. */
const metaCsp = (): Plugin => ({
  name: 'yunabi-meta-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: csp() },
      injectTo: 'head-prepend',
    },
  ],
});

export default defineConfig({
  base: './',
  build: {
    assetsDir: 'assets',
    target: 'es2022',
    manifest: true,
    modulePreload: { polyfill: false },
  },
  plugins: [
    react(),
    metaCsp(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,webp,jpg,svg,webmanifest,geojson}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
