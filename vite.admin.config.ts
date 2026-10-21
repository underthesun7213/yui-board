import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

/* The admin console: its own build, published to its own origin (Cloudflare,
   ADR-0020), so an XSS in the app can never reach an admin token. Its CSP is
   both a meta tag (any host) and _headers (Cloudflare), which adds what a meta
   tag cannot: frame-ancestors (RFC-0003 §12.2, §17.3). */
const SUPABASE = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
const TURNSTILE = 'https://challenges.cloudflare.com';
const OUT = process.env.ADMIN_OUT_DIR ?? 'dist-admin';

const rules = [
  "default-src 'none'",
  `script-src 'self' ${TURNSTILE}`,
  "style-src 'self'",
  /* the authenticator QR code is a data: SVG from Supabase Auth */
  "img-src 'self' data:",
  `connect-src ${SUPABASE} ${TURNSTILE}`,
  `frame-src ${TURNSTILE}`,
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "manifest-src 'none'",
  "worker-src 'none'",
];
/* HSTS without preload (hard to undo). includeSubDomains reaches only the
   subdomains of today's Cloudflare origin; look again before putting the
   console on a custom domain's apex, where it would force HTTPS on every
   subdomain of that domain (y3s-automated-checks §2.1). Checked in the build
   output by scripts/check-admin-headers.mjs. */
const HEADERS = `/*
  Content-Security-Policy: ${[...rules, "frame-ancestors 'none'"].join('; ')}
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
/
  Cache-Control: no-store
/index.html
  Cache-Control: no-store
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

const adminSecurity = (): Plugin => ({
  name: 'yunabi-admin-security',
  apply: 'build',
  configResolved() {
    if (!/^https?:\/\/[^/]+$/.test(SUPABASE))
      throw new Error('Set VITE_SUPABASE_URL to the project URL to build the admin console.');
  },
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: rules.join('; ') },
      injectTo: 'head-prepend',
    },
  ],
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: '_headers', source: HEADERS });
  },
});

export default defineConfig({
  root: fileURLToPath(new URL('./admin', import.meta.url)),
  base: '/',
  envDir: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: fileURLToPath(new URL('./admin-public', import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL(`./${OUT}`, import.meta.url)),
    emptyOutDir: true,
    assetsDir: 'assets',
    target: 'es2022',
    modulePreload: { polyfill: false },
  },
  plugins: [react(), adminSecurity()],
});
