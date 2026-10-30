// Fails the build when a group of chunks is over its gzip budget (JS + CSS).
// Budgets: RFC-0003 §3 and ADR-0024 decision 1.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const DIST = (process.env.DIST ?? 'dist') + '/';
const manifest = JSON.parse(readFileSync(DIST + '.vite/manifest.json', 'utf8'));
const KB = 1024;
const BUDGETS = [
  { name: 'home (first screen)', kb: 100, roots: ['index.html'], dynamic: false },
  {
    name: 'map',
    kb: 61, // D33: 60 until the description translation toggle (2026-10-27)
    roots: [
      'src/features/map/MapScreen.tsx',
      'node_modules/leaflet/dist/leaflet-src.js',
      'node_modules/leaflet.markercluster/dist/leaflet.markercluster-src.js',
    ],
  },
  {
    name: 'writing (forms + account)',
    kb: 50,
    roots: [
      'src/features/write/PlaceForm.tsx',
      'src/features/write/EventForm.tsx',
      'src/features/write/WeekForm.tsx',
      'node_modules/@supabase/auth-js/dist/module/index.js',
    ],
  },
  {
    name: 'lessons and game',
    /* 33 since 2026-10-31: the Kyoto route grew from six short scenes to eight
       with replies and three endings, all of it text in three languages */
    kb: 33,
    roots: [
      'src/features/learn/LearnList.tsx',
      'src/features/learn/Lesson.tsx',
      'src/features/learn/Collection.tsx',
    ],
  },
  {
    /* 유우키 미니게임: its own lazy screen, with its text in three languages */
    name: 'yuki mini-game',
    kb: 12,
    roots: ['src/features/learn/YukiGame.tsx'],
    /* it opens only from inside level 8, so the lesson screen is already loaded */
    after: 'lessons and game',
  },
  {
    /* the smart-ball match: its own lazy screen and the table runtime */
    name: 'smart-ball mini-game',
    kb: 12,
    roots: ['src/features/learn/SmartBall.tsx'],
    after: 'lessons and game',
  },
  {
    /* the 아야노 미니게임: its own lazy screen, the table drawn by hand on a
       canvas (tools, tea, milk, the held whisk) and its text in three languages */
    name: 'matcha mini-game',
    kb: 24,
    roots: ['src/features/learn/MatchaGame.tsx'],
    after: 'lessons and game',
  },
  {
    /* the fireworks photo: its own lazy screen, the phone runtime and its text */
    name: 'photo mini-game',
    kb: 8,
    roots: ['src/features/learn/PhotoGame.tsx'],
    after: 'lessons and game',
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
  /* nor for what the screen it opens from has loaded */
  if (b.after) {
    const before = files(closure(BUDGETS.find((x) => x.name === b.after).roots));
    set = new Set([...set].filter((f) => !before.has(f)));
  }
  const total = [...set].reduce((n, f) => n + gz(f), 0);
  const ok = total <= b.kb * KB;
  if (!ok) failed = true;
  console.log(`${ok ? '✓' : '✗'} ${b.name}: ${(total / KB).toFixed(1)} KB gzip of ${b.kb} KB`);
  for (const f of [...set].sort()) console.log(`    ${(gz(f) / KB).toFixed(1).padStart(6)}  ${f}`);
}
if (failed) process.exit(1);
