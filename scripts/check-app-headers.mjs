// Fails when the user app build lacks a security header (Y-S8, ADR-0025):
// reads the _headers file and index.html that `npm run build` actually wrote.
// With --deploy it also refuses a build that is not the production one: a
// fixture or 'self' build, a missing key, or the e2e test handle.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const DEPLOY = args.includes('--deploy');
const DIR = args.find((a) => !a.startsWith('--')) ?? 'dist';
const APP = 'https://yunabi.juha.dev/';
const bad = [];

/* Cloudflare _headers: an unindented line is a path, an indented one "Name: value" */
const blocks = new Map();
let current = null;
for (const line of readFileSync(join(DIR, '_headers'), 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.trim().startsWith('#')) continue;
  if (!/^\s/.test(line)) {
    current = line.trim();
    blocks.set(current, new Map());
  } else if (current) {
    const i = line.indexOf(':');
    if (i > 0)
      blocks.get(current).set(line.slice(0, i).trim().toLowerCase(), line.slice(i + 1).trim());
  }
}
const all = blocks.get('/*') ?? new Map();
const h = (name) => all.get(name.toLowerCase()) ?? '';
const directives = (policy) =>
  policy
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean);

const csp = h('Content-Security-Policy');
if (!csp.includes("default-src 'none'") || !csp.includes("frame-ancestors 'none'"))
  bad.push("A1 /* Content-Security-Policy with default-src 'none' and frame-ancestors 'none'");
if (h('X-Frame-Options') !== 'DENY') bad.push('A2 /* X-Frame-Options: DENY');
if (h('X-Content-Type-Options') !== 'nosniff') bad.push('A2 /* X-Content-Type-Options: nosniff');
const hsts = h('Strict-Transport-Security');
const maxAge = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0);
if (maxAge < 31536000 || !/includeSubDomains/i.test(hsts))
  bad.push('A2 /* Strict-Transport-Security: max-age >= 31536000; includeSubDomains');
/* not no-referrer: the OpenStreetMap tile policy asks for a Referer */
if (h('Referrer-Policy') !== 'strict-origin-when-cross-origin')
  bad.push('A3 /* Referrer-Policy: strict-origin-when-cross-origin');
if (!/(^|[\s,])geolocation=\(self\)/.test(h('Permissions-Policy')))
  bad.push('A3 /* Permissions-Policy with geolocation=(self) (the map\'s "near me")');

/* the meta tag must say what the header says, less what only a header can */
const html = readFileSync(join(DIR, 'index.html'), 'utf8');
const meta = (/<meta[^>]+http-equiv="Content-Security-Policy"[^>]*>/i.exec(html)?.[0] ?? '')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&');
const metaCsp = /content="([^"]*)"/.exec(meta)?.[1] ?? '';
const fromHeader = directives(csp).filter((d) => !d.startsWith('frame-ancestors'));
if (!metaCsp || directives(metaCsp).join('; ') !== fromHeader.join('; '))
  bad.push('A4 index.html meta CSP = the header CSP without frame-ancestors');

for (const path of ['/', '/sw.js'])
  if (!/no-cache|no-store/.test(blocks.get(path)?.get('cache-control') ?? ''))
    bad.push(`A5 ${path} Cache-Control: no-cache`);
const ignore = existsSync(join(DIR, '.assetsignore'))
  ? readFileSync(join(DIR, '.assetsignore'), 'utf8')
  : '';
if (!/^\.vite\/?$/m.test(ignore)) bad.push('A5 .assetsignore lists .vite (the build manifest)');

if (DEPLOY) {
  const rule = (name) => directives(csp).find((d) => d.startsWith(name + ' ')) ?? '';
  if (
    !rule('script-src')
      .split(/\s+/)
      .includes(APP + 'assets/')
  )
    bad.push(`D1 script-src names ${APP}assets/ (YUNABI_ORIGIN=${APP})`);
  const supabase = rule('connect-src')
    .split(/\s+/)
    .filter((s) => /^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(s));
  if (supabase.length !== 1 || supabase[0] === 'https://example.supabase.co')
    bad.push('D2 connect-src names the real Supabase project (not a fixture or example build)');

  const js = readdirSync(join(DIR, 'assets'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => [f, readFileSync(join(DIR, 'assets', f), 'utf8')]);
  const inBundle = (s) => js.some(([, text]) => text.includes(s));
  /* keys come from the shell environment (runbook §7.3), not from .env files */
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
  if (!key.startsWith('sb_publishable_') || !inBundle(key))
    bad.push('D3 VITE_SUPABASE_PUBLISHABLE_KEY (sb_publishable_…) is set and in the bundle');
  const site = process.env.VITE_TURNSTILE_SITE_KEY ?? '';
  if (!site || !inBundle(site)) bad.push('D3 VITE_TURNSTILE_SITE_KEY is set and in the bundle');

  if (!existsSync(join(DIR, 'sw.js'))) bad.push('D4 sw.js is in the build');
  /* the e2e handle (src/e2e.ts) exists only in VITE_E2E builds */
  if (js.some(([f, text]) => f.startsWith('e2e-') || text.includes('__yunabi')))
    bad.push('D4 no e2e test handle (__yunabi) in the build');
}

if (bad.length) {
  console.error(
    `not deployable: ${DIR}/ (${DEPLOY ? 'deploy' : 'build'} checks)\n` + bad.join('\n'),
  );
  process.exit(1);
}
console.log(`✓ security headers in ${DIR}/_headers and index.html${DEPLOY ? ' (deploy)' : ''}`);
