import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/* The published address, https://yunabi.juha.dev/ (ADR-0025): the CSP names
   it, and its asset path, rather than 'self' (RFC-0003 §17.3). */
const ORIGIN = process.env.YUNABI_ORIGIN ?? '';
const SUPABASE = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');

/* One list for both CSPs, so the meta tag and the header cannot drift apart. */
function cspRules(): string[] {
  const self = ORIGIN || "'self'";
  const turnstile = 'https://challenges.cloudflare.com';
  const rules = [
    "default-src 'none'",
    `script-src ${ORIGIN ? ORIGIN + 'assets/' : "'self'"} ${turnstile}`,
    /* Leaflet sets inline styles on its elements */
    `style-src ${ORIGIN ? ORIGIN + 'assets/' : "'self'"} 'unsafe-inline'`,
    `img-src ${self} data: https://tile.openstreetmap.org`,
    /* recorded lines (D35), from assets/voice/ */
    `media-src ${self}`,
    `connect-src ${self} ${SUPABASE} ${turnstile}`.replace(/\s+/g, ' ').trim(),
    `frame-src ${turnstile}`,
    `worker-src ${ORIGIN ? ORIGIN + 'sw.js' : "'self'"}`,
    `manifest-src ${self}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ];
  if (ORIGIN.startsWith('https:')) rules.push('upgrade-insecure-requests');
  return rules;
}

/* Response headers for Cloudflare Workers static assets (ADR-0025), adding
   what a meta tag cannot: frame-ancestors, HSTS, nosniff. Referer stays at the
   browser default, which the OpenStreetMap tile policy asks for (the console
   sends none). Geolocation is for "near me" on the map. HSTS without preload,
   as for the console. Checked in the output by scripts/check-app-headers.mjs. */
const headers = () => `/*
  Content-Security-Policy: ${[...cspRules(), "frame-ancestors 'none'"].join('; ')}
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
/
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/sw.js
  Cache-Control: no-cache
/manifest.webmanifest
  Cache-Control: no-cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

/* Production only: the dev server injects inline scripts for Fast Refresh. */
const security = (): Plugin => ({
  name: 'yunabi-security',
  apply: 'build',
  /* A build without the published address would ship a CSP that trusts
     'self'; refuse unless that is asked for explicitly. */
  configResolved() {
    if (ORIGIN && !/^https?:\/\/[^/]+\/(.*\/)?$/.test(ORIGIN))
      throw new Error(`YUNABI_ORIGIN must be a full URL ending in "/" (got ${ORIGIN})`);
    if (!ORIGIN && !process.env.YUNABI_ALLOW_SELF)
      throw new Error(
        "Set YUNABI_ORIGIN (https://yunabi.juha.dev/) or YUNABI_ALLOW_SELF=1 for a local build with 'self'.",
      );
  },
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: cspRules().join('; ') },
      injectTo: 'head-prepend',
    },
  ],
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: '_headers', source: headers() });
    /* the build manifest (read by the bundle budget check) is not for the web */
    this.emitFile({ type: 'asset', fileName: '.assetsignore', source: '.vite\n' });
  },
});

export default defineConfig({
  base: './',
  build: {
    assetsDir: 'assets',
    target: 'es2022',
    manifest: true,
    modulePreload: { polyfill: false },
    rolldownOptions: {
      output: {
        /* Comic pages get their own folder so the service worker can leave
           them out of the install download and cache each when first seen
           (src/sw.ts); everything else keeps the default name. */
        assetFileNames: (a) => {
          const from = (a.originalFileNames ?? []).map((f) => f.replace(/\\/g, '/'));
          if (from.some((f) => f.includes('src/art/lessons/')))
            return 'assets/comic/[name]-[hash][extname]';
          /* recorded lines (D35): the same, cached when first played */
          if (from.some((f) => f.includes('src/voice/')))
            return 'assets/voice/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  plugins: [
    react(),
    security(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,webp,jpg,svg,webmanifest,geojson}'],
        /* comic pages: cached on first view instead (src/sw.ts) */
        globIgnores: ['assets/comic/**', 'assets/voice/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
