// Fails when the admin console build lacks a security header (Y-S8, ADR-0022
// S8): reads the _headers file and index.html that build:admin actually wrote,
// so a plugin mistake between the config and the output is caught too
// (y3s-automated-checks §2.2).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2] ?? 'dist-admin';
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

const csp = h('Content-Security-Policy');
if (!csp.includes("default-src 'none'") || !csp.includes("frame-ancestors 'none'"))
  bad.push("H1 /* Content-Security-Policy with default-src 'none' and frame-ancestors 'none'");
if (h('X-Frame-Options') !== 'DENY') bad.push('H2 /* X-Frame-Options: DENY');
if (h('X-Content-Type-Options') !== 'nosniff') bad.push('H3 /* X-Content-Type-Options: nosniff');
const hsts = h('Strict-Transport-Security');
const maxAge = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0);
if (maxAge < 31536000 || !/includeSubDomains/i.test(hsts))
  bad.push('H4 /* Strict-Transport-Security: max-age >= 31536000; includeSubDomains');
if (h('Referrer-Policy') !== 'no-referrer') bad.push('H5 /* Referrer-Policy: no-referrer');

const html = readFileSync(join(DIR, 'index.html'), 'utf8');
const meta = (/<meta[^>]+http-equiv="Content-Security-Policy"[^>]*>/i.exec(html)?.[0] ?? '')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&');
if (!meta.includes("default-src 'none'"))
  bad.push('H6 index.html <meta http-equiv="Content-Security-Policy"> with default-src \'none\'');

if (bad.length) {
  console.error(`missing security headers in ${DIR}/:\n` + bad.join('\n'));
  process.exit(1);
}
console.log(`✓ security headers in ${DIR}/_headers and index.html`);
