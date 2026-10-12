// Fails the build when a group of chunks is over its gzip budget (JS + CSS).
// Budgets: RFC-0003 §3 and ADR-0024 decision 1.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const DIST = 'dist/';
const manifest = JSON.parse(readFileSync(DIST + '.vite/manifest.json', 'utf8'));
const KB = 1024;
const BUDGETS = [
  { name: 'home (first screen)', kb: 100, roots: ['index.html'], dynamic: false },
  {
    name: 'map',
    kb: 60,
    roots: [
      'src/features/map/MapScreen.tsx',
      'node_modules/leaflet/dist/leaflet-src.js',
      'node_modules/leaflet.markercluster/dist/leaflet.markercluster-src.js',
    ],
  },
  {
    name: 'lessons and game',
    kb: 30,
    roots: [
      'src/features/learn/LearnList.tsx',
      'src/features/learn/Lesson.tsx',
      'src/features/learn/Collection.tsx',
    ],
  },
];

function closure(keys) {
  const seen = new Set();
  const walk = (k) => {
    if (seen.has(k) || !manifest[k]) return;
    seen.add(k);
    for (const i of manifest[k].imports ?? []) walk(i);
  };
  keys.forEach(walk);
  return seen;
}
const files = (keys) => {
  const out = new Set();
  for (const k of keys) {
    const c = manifest[k];
    out.add(c.file);
    for (const css of c.css ?? []) out.add(css);
  }
  return out;
};
const gz = (f) => gzipSync(readFileSync(DIST + f), { level: 9 }).length;

const home = files(closure(['index.html']));
let failed = false;
for (const b of BUDGETS) {
  const missing = b.roots.filter((r) => !manifest[r]);
  if (missing.length) {
    console.error(`✗ ${b.name}: not in the build manifest: ${missing.join(', ')}`);
    failed = true;
    continue;
  }
  let set = files(closure(b.roots));
  /* a lazy group only pays for what the first screen has not already loaded */
  if (b.roots[0] !== 'index.html') set = new Set([...set].filter((f) => !home.has(f)));
  const total = [...set].reduce((n, f) => n + gz(f), 0);
  const ok = total <= b.kb * KB;
  if (!ok) failed = true;
  console.log(`${ok ? '✓' : '✗'} ${b.name}: ${(total / KB).toFixed(1)} KB gzip of ${b.kb} KB`);
  for (const f of [...set].sort()) console.log(`    ${(gz(f) / KB).toFixed(1).padStart(6)}  ${f}`);
}
if (failed) process.exit(1);
