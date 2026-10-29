import { describe, expect, it } from 'vitest';
import { formatRoute, legacyRoute, parseRoute } from '../../src/app/routes';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  GAME_OUT,
  PROMPTS_OUT,
  OUT,
  renderComicScripts,
  renderGameScript,
  renderImagePrompts,
} from '../../scripts/gen-comic-scripts.mjs';
import { ART, endingKey, pageKey, sceneKey } from '../../src/content/art';
import { YUKI_ART } from '../../src/content/yuki-minigame';
import { ENDINGS } from '../../src/content/endings';
import { LESSONS } from '../../src/content/lessons';
import { plain, segments } from '../../src/content/ruby';
import { voiceHash, voiceLines } from '../../src/content/voice-lines';
import { toSsml } from '../../scripts/gen-voice.mjs';
import { BEST_MISSES, VN } from '../../src/content/vn';
import {
  addMonths,
  monthCells,
  tokyoTime,
  tokyoToday,
  weekday,
} from '../../src/domain/calendar/dates';
import { makeSchedule, occOn, upcoming } from '../../src/domain/calendar/occurrences';
import { HOME, mainBounds, regionOf, shownPlaces, walkMin } from '../../src/domain/geo/geo';
import { PREFS } from '../../src/domain/geo/prefs';
import { PREF_INTRO } from '../../src/content/prefIntro';
import { buildIcs, icsEsc, icsFold } from '../../src/domain/ics';
import { safeMapsUrl } from '../../src/domain/links';
import { checkEvent, checkPlace, HAS_LATIN, newEventDay } from '../../src/domain/validation';
import type { EventSeries, OccurrenceOverride, Place } from '../../src/domain/types';
import { en } from '../../src/i18n/en';
import { ja } from '../../src/i18n/ja';
import { ko } from '../../src/i18n/ko';

const MESSAGES = { en, ja, ko };
import events from '../fixtures/events.json';
import occurrences from '../fixtures/occurrences.json';
import places from '../fixtures/places.json';

const hm = (e: EventSeries) => ({
  ...e,
  start_time: e.start_time.slice(0, 5),
  end_time: e.end_time.slice(0, 5),
});
const S = makeSchedule((events as EventSeries[]).map(hm), occurrences as OccurrenceOverride[]);
const gip = (events as EventSeries[]).find((e) => e.weekly_until)!;

describe('calendar', () => {
  it('expands a weekly series with overrides and cancellations', () => {
    expect(occOn(S, '2026-09-22').find((o) => o.event.id === gip.id)?.title).toBe(
      'GIP: Karaoke Night',
    );
    expect(occOn(S, '2026-10-13').find((o) => o.event.id === gip.id)?.title).toBe(gip.title);
    expect(occOn(S, '2026-10-14')).toHaveLength(0);
    expect(occOn(S, '2026-10-20').find((o) => o.event.id === gip.id)).toBeUndefined();
    expect(occOn(S, '2026-12-29')).toHaveLength(0); // after weekly_until
  });
  it('sorts by start time and finds the next ones', () => {
    const next = upcoming(S, '2026-09-10', 4);
    expect(next.map((o) => o.date)).toEqual([
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-15',
    ]);
  });
  it('builds month grids that start on Sunday', () => {
    const cells = monthCells('2026-11');
    expect(cells.length % 7).toBe(0);
    expect(cells[weekday('2026-11-01')]).toBe('2026-11-01');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
  it('uses Japan time for today', () => {
    expect(tokyoToday(new Date('2026-10-11T15:30:00Z'))).toBe('2026-10-12');
    expect(tokyoTime(new Date('2026-10-11T15:05:00Z'))).toBe('00:05');
    expect(tokyoTime(new Date('2026-10-11T10:30:00Z'))).toBe('19:30');
  });
});

describe('prefecture introductions', () => {
  it('has one for every prefecture, in all three languages, short enough for the map', () => {
    expect(Object.keys(PREF_INTRO).sort()).toEqual(PREFS.map(([c]) => c));
    for (const [code, intro] of Object.entries(PREF_INTRO))
      for (const lang of ['ja', 'en', 'ko'] as const) {
        const t = intro[lang];
        expect(t.trim(), `${code} ${lang}`).toBe(t);
        expect([...t].length, `${code} ${lang}`).toBeGreaterThan(20);
        expect([...t].length, `${code} ${lang}`).toBeLessThanOrEqual(200);
      }
  });
});

describe('ics', () => {
  it('turns a lone carriage return into an escaped newline too', () => {
    expect(icsEsc('a\rDESCRIPTION:x')).toBe('a\\nDESCRIPTION:x');
  });
  it('escapes RFC 5545 text', () => {
    expect(icsEsc('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne');
  });
  it('folds at 75 octets without splitting characters', () => {
    const line = 'SUMMARY:' + 'あ'.repeat(40);
    const parts = icsFold(line).split('\r\n ');
    for (const p of parts) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
    expect(parts.join('')).toBe(line);
  });
  it('writes an event in Asia/Tokyo', () => {
    const o = occOn(S, '2026-09-22')[0]!;
    const ics = buildIcs(o, new Date('2026-09-01T00:00:00Z'));
    expect(ics).toContain('DTSTART;TZID=Asia/Tokyo:20260922T170000');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});

describe('geo', () => {
  const P = places as Place[];
  it('lists near places by distance within 3 km', () => {
    const near = shownPlaces(P, { mode: 'near', pref: null, cat: '' }, HOME);
    expect(near.length).toBeGreaterThan(5);
    expect(walkMin(HOME, near[0]!)).toBeLessThanOrEqual(walkMin(HOME, near.at(-1)!));
    expect(
      shownPlaces(P, { mode: 'near', pref: null, cat: '' }, { lat: 35.68, lng: 139.76 }),
    ).toHaveLength(0);
  });
  it('filters by prefecture and category', () => {
    expect(shownPlaces(P, { mode: 'japan', pref: null, cat: '' }, HOME)).toHaveLength(0);
    expect(
      shownPlaces(P, { mode: 'japan', pref: '27', cat: 'food' }, HOME).every(
        (p) => p.category === 'food',
      ),
    ).toBe(true);
  });
  it('maps every prefecture to a region', () => {
    expect(PREFS).toHaveLength(47);
    expect(new Set(PREFS.map((p) => regionOf(p[0]))).size).toBe(8);
  });
  it('takes the bounds of the largest polygon', () => {
    const b = mainBounds({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [139, 35],
            [140, 35],
            [140, 36],
            [139, 35],
          ],
        ],
        [
          [
            [142, 30],
            [142.1, 30],
            [142.1, 30.1],
            [142, 30],
          ],
        ],
      ],
    });
    expect(b).toEqual([
      [35, 139],
      [36, 140],
    ]);
  });
});

describe('routes', () => {
  it('round-trips every route', () => {
    for (const r of [
      { name: 'home' },
      { name: 'learn' },
      { name: 'lesson', lid: 'l3' },
      { name: 'collection' },
      { name: 'yuki' },
      { name: 'map' },
      { name: 'cal' },
      { name: 'event', id: 4, date: '2026-09-22' },
    ] as const)
      expect(parseRoute(formatRoute(r))).toEqual(r);
  });
  it('rejects unknown hashes and reads old links', () => {
    expect(parseRoute('#/nope')).toBeNull();
    expect(parseRoute('#/cal/event/x/2026-01-01')).toBeNull();
    expect(legacyRoute('?v=map')).toEqual({ name: 'map' });
    expect(legacyRoute('?tab=1')).toEqual({ name: 'cal' });
    expect(legacyRoute('?compose=1')).toEqual({ name: 'home' });
    expect(legacyRoute('')).toBeNull();
  });
});

describe('strings', () => {
  const shape = (o: unknown, path = ''): string[] =>
    o && typeof o === 'object'
      ? Object.entries(o).flatMap(([k, v]) => [
          path + k + (Array.isArray(v) ? `[${v.length}]` : ''),
          ...shape(v, path + k + '.'),
        ])
      : [];
  it('has the same keys in all three languages', () => {
    expect(shape(MESSAGES.ja)).toEqual(shape(MESSAGES.en));
    expect(shape(MESSAGES.ko)).toEqual(shape(MESSAGES.en));
  });
  it('has no empty strings', () => {
    const leaves = (o: unknown): unknown[] =>
      o && typeof o === 'object' ? Object.values(o).flatMap(leaves) : [o];
    for (const l of ['en', 'ja', 'ko'] as const)
      for (const v of leaves(MESSAGES[l])) expect(typeof v === 'string' && v.length > 0).toBe(true);
  });
  it('has every lesson and ending in all three languages', () => {
    for (const l of LESSONS)
      for (const k of ['ja', 'en', 'ko'] as const) expect(l.t[k] && l.d[k]).toBeTruthy();
    for (const e of ENDINGS)
      for (const k of ['ja', 'en', 'ko'] as const) expect(e.t[k] && e.n[k]).toBeTruthy();
  });
});

describe('comic pages (Y-J1)', () => {
  const comics = LESSONS.flatMap((l) => (l.vn ? [] : [l]));
  it('are levels 1–7, two pages of four panels each', () => {
    expect(comics.map((l) => l.lv)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const l of comics) {
      expect(l.pages).toHaveLength(2);
      for (const p of l.pages) expect(p.panels).toHaveLength(4);
    }
  });
  it('has a balloon or a caption in every panel, a translation, and no brackets', () => {
    for (const l of comics)
      for (const p of l.pages)
        for (const c of p.panels) {
          expect(c.jp || c.cap, `${l.id}: empty panel`).toBeTruthy();
          expect(c.tr.en && c.tr.ko, `${l.id}: missing translation`).toBeTruthy();
          for (const t of [c.jp, c.cap])
            if (t) expect(/[（）()]/.test(t), `${l.id}: brackets in ${t}`).toBe(false);
        }
  });
  it('has a storyboard script that matches the data (node scripts/gen-comic-scripts.mjs)', () => {
    const doc = readFileSync(OUT, 'utf8').split(String.fromCharCode(13)).join('');
    expect(doc).toBe(renderComicScripts(LESSONS) + String.fromCharCode(10));
  });
  it('has image prompts that match the data (node scripts/gen-comic-scripts.mjs)', () => {
    const doc = readFileSync(PROMPTS_OUT, 'utf8').split(String.fromCharCode(13)).join('');
    expect(doc).toBe(renderImagePrompts(LESSONS, VN, ENDINGS) + String.fromCharCode(10));
  });
  it('has a game script that matches the data (node scripts/gen-comic-scripts.mjs)', () => {
    const doc = readFileSync(GAME_OUT, 'utf8').split(String.fromCharCode(13)).join('');
    expect(doc).toBe(renderGameScript(VN, ENDINGS, BEST_MISSES) + String.fromCharCode(10));
  });
  it('gives every kanji in a Japanese line a reading in kana ({漢字|かんじ})', () => {
    const lines = [
      ...LESSONS.flatMap((l) => [
        ...l.ex.map((e) => e.jp),
        ...(l.vn ? [] : l.pages.flatMap((p) => p.panels.flatMap((c) => [c.jp, c.cap]))),
      ]),
      ...Object.values(VN).flatMap((r) =>
        r.scenes.flatMap((s) => [s.jp, ...s.opts.map((o) => o.jp)]),
      ),
      ...ENDINGS.map((e) => e.jp),
    ].filter((s): s is string => !!s);
    expect(lines.length).toBeGreaterThan(100);
    for (const s of lines) {
      for (const seg of segments(s))
        if (typeof seg !== 'string') expect(seg.rt, s).toMatch(/^[ぁ-ゖー]+$/);
      const rest = s.replace(/\{[^|{}]+\|[^|{}]+\}/g, '');
      expect(/[一-鿿々{}|]/.test(rest), `kanji without a reading: ${s}`).toBe(false);
    }
  });
  it('says who speaks every balloon, so each gets a voice (D35)', () => {
    for (const l of LESSONS)
      if (!l.vn)
        for (const p of l.pages.flatMap((pg) => pg.panels))
          expect(!!p.jp === !!p.who, `${l.id}: ${p.jp ?? p.cap}`).toBe(true);
  });
  it('records only lines that exist, and reads furigana in the SSML (D35)', () => {
    const lines = voiceLines(LESSONS, VN, ENDINGS);
    const keys = new Set(lines.map((l) => l.key));
    expect(keys.size).toBe(lines.length);
    const made = JSON.parse(readFileSync('src/voice/manifest.json', 'utf8')) as Record<
      string,
      string
    >;
    for (const k of Object.keys(made)) expect(keys.has(k), `manifest: ${k}`).toBe(true);
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.mp3') ? [join(d, e.name)] : [],
      );
    for (const f of walk('src/voice')) {
      const k = f
        .replace(/\\/g, '/')
        .replace(/^src\/voice\//, '')
        .replace(/\.mp3$/, '');
      expect(keys.has(k), `orphan voice file ${f}`).toBe(true);
    }
    const ssml = toSsml({ text: 'お{弁当|べんとう}、5円 & <b>', voice: 'ja-JP-NanamiNeural' });
    expect(ssml).toContain('お<sub alias="べんとう">弁当</sub>、5円 &amp; &lt;b&gt;');
    expect(ssml).toContain('<voice name="ja-JP-NanamiNeural">');
    expect(voiceHash({ text: 'a', voice: 'v' })).not.toBe(voiceHash({ text: 'b', voice: 'v' }));
  });
  it('reads the furigana markup into segments and back to plain text', () => {
    expect(segments('お{願|ねが}いします')).toEqual(['お', { base: '願', rt: 'ねが' }, 'いします']);
    expect(segments('{3日前|みっかまえ}から')).toEqual([
      { base: '3日前', rt: 'みっかまえ' },
      'から',
    ]);
    expect(plain('{遅|おく}れた{!|x}')).toBe('遅れた!');
    expect(plain('ほな')).toBe('ほな');
  });
});

/* Width and height from a PNG, JPEG or WebP header, without a dependency. */
function imageSize(b: Buffer): [number, number] | null {
  if (b.subarray(1, 4).toString() === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') {
    const kind = b.subarray(12, 16).toString();
    if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (kind === 'VP8L') {
      const v = b.readUInt32LE(21);
      return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)];
    }
    if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    return null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1] ?? 0;
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + len;
    }
  }
  return null;
}

describe('art', () => {
  it('has comic pages that fit the rule: one per slot, 2:3, 1000 px, 400 KB', () => {
    const root = 'src/art/lessons';
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else files.push(p.split('\\').join('/'));
      }
    };
    if (!existsSync(root)) return; // no comic pages yet
    walk(root);
    const seen = new Set<string>();
    for (const f of files) {
      expect(/[.](webp|png|jpg)$/.test(f), `${f}: use .webp, .png or .jpg`).toBe(true);
      const slot = f.replace(/[.][^.]+$/, '');
      expect(seen.has(slot), `${slot}: two files for one page`).toBe(false);
      seen.add(slot);
      const buf = readFileSync(f);
      expect(buf.length <= 400 * 1024, `${f}: over 400 KB (try .webp)`).toBe(true);
      const size = imageSize(buf);
      expect(size, `${f}: unreadable image`).not.toBeNull();
      const [w, h] = size!;
      expect(Math.min(w, h) >= 1000, `${f}: ${w}x${h}, short side under 1000 px`).toBe(true);
      expect(Math.abs(w / h - 2 / 3) <= (2 / 3) * 0.01, `${f}: ${w}x${h} is not 2:3`).toBe(true);
    }
  });
  it('only has files for slots that exist', () => {
    const slots = new Set<string>();
    for (const l of LESSONS)
      if (!l.vn) for (const n of [1, 2] as const) slots.add(pageKey(l.id, n));
    for (const r of ['osaka', 'kyoto'] as const)
      VN[r].scenes.forEach((_, i) => slots.add(sceneKey(r, i)));
    for (const e of ENDINGS) slots.add(endingKey(e.id));
    for (const k of Object.values(YUKI_ART)) slots.add(k);
    for (const k of Object.keys(ART))
      expect(slots.has(k), `src/art/${k} matches no slot`).toBe(true);
  });
});

describe('validation mirrors the server', () => {
  const place = {
    name: 'x',
    category: 'food',
    description: '',
    gmaps_url: '',
    lat: 34.82,
    lng: 135.65,
    lang: 'en',
  };
  it('refuses disguised text', () => {
    expect(checkPlace({ ...place, name: 'a\u202eb' })).toBe('name');
    expect(checkPlace({ ...place, name: 'a\u200bb' })).toBe('name');
    expect(checkPlace({ ...place, name: '\u3000\u3000' })).toBe('name');
    expect(checkPlace({ ...place, name: '\u3164' })).toBe('name');
    expect(checkPlace({ ...place, name: '\u2800' })).toBe('name');
    expect(checkPlace({ ...place, description: 'a\rb' })).toBe('description');
    expect(checkPlace({ ...place, description: 'a\nb\tc' })).toBe(null);
  });
  it('wants a Latin letter in a place name, as app.has_latin does (D31)', () => {
    /* the same inputs as pgTAP G-76 */
    const cases: [string, boolean][] = [
      ['Mandai Hirakata', true],
      ['Academic Affairs Office (教務課)', true],
      ['히라카타 T-SITE', true],
      ['枚方市駅', false],
      ['만다이', false],
      ['ＡＢＣ', false],
    ];
    /* the server lists the 52 letters in the migration; its class must be exactly A-Z a-z */
    const sql = readFileSync('supabase/migrations/20261026000250_place_name_latin.sql', 'utf8');
    const classes = [...sql.matchAll(/~ '\[([A-Za-z]+)\]'/g)].map((m) => m[1]);
    expect(classes.length).toBeGreaterThanOrEqual(2);
    for (const c of classes)
      expect([...c!].sort().join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    const server = new RegExp(`[${classes[0]}]`);
    for (const [name, ok] of cases) {
      expect(HAS_LATIN.test(name), name).toBe(ok);
      expect(server.test(name), name).toBe(ok);
      expect(checkPlace({ ...place, name }), name).toBe(ok ? null : 'name_latin');
    }
  });
  it('refuses tricky links', () => {
    expect(checkPlace({ ...place, gmaps_url: 'https://www.google.com/maps/../url?q=x' })).toBe(
      'gmaps_url',
    );
    expect(checkPlace({ ...place, gmaps_url: 'https://maps.app.goo.gl/abc' })).toBe(null);
  });
  it('keeps events within a year', () => {
    const e = {
      title: 't',
      start_date: '2027-12-01',
      start_time: '10:00',
      end_time: '11:00',
      weekly_until: null,
      place_text: '',
      body: '',
      lang: 'en',
    };
    expect(checkEvent(e, '2026-10-12')).toBe('start_date');
    expect(checkEvent({ ...e, start_date: '2026-10-20' }, '2026-10-12')).toBe(null);
  });
  it('refuses a new event that already ended today, as the server does', () => {
    const e = {
      title: 'Study group',
      start_date: '2026-10-12',
      start_time: '18:00',
      end_time: '19:00',
      weekly_until: null,
      place_text: '',
      body: '',
      lang: 'en',
    };
    expect(checkEvent(e, '2026-10-12', false, '18:30')).toBe(null);
    expect(checkEvent(e, '2026-10-12', false, '19:00')).toBe('time');
    expect(checkEvent(e, '2026-10-12', false, '19:30')).toBe('time');
    expect(checkEvent({ ...e, start_date: '2026-10-13' }, '2026-10-12', false, '19:30')).toBe(null);
    /* an edit is not held to it (the server checks the whole series instead) */
    expect(checkEvent(e, '2026-10-12', false, null)).toBe(null);
  });
  it("starts a new event tomorrow once today's default slot has ended", () => {
    expect(newEventDay(new Date('2026-10-12T09:59:00Z'))).toBe('2026-10-12'); // 18:59 JST
    expect(newEventDay(new Date('2026-10-12T10:00:00Z'))).toBe('2026-10-13'); // 19:00 JST
    expect(newEventDay(new Date('2026-10-12T14:59:00Z'))).toBe('2026-10-13'); // 23:59 JST
  });
});

/* The link rule the map uses (src/domain/links.ts) is defined apart from the
   form's (validation.ts) for the bundle budget; they must agree with each
   other and with the server's G-15 set (y3s-automated-checks §4.2). */
describe('links', () => {
  const OK = [
    'https://www.google.com/maps/place/x',
    'https://google.co.jp/maps?q=1',
    'https://www.google.com/maps',
    'https://maps.app.goo.gl/abc',
  ];
  const BAD = [
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://www.google.com/maps',
    'https://evil.com/maps',
    'https://google.com.evil.com/maps',
    'https://user@google.com/maps',
    'https://goo.gl/maps/x',
    'https://www.google.com/mapsx',
    'https://www.google.com/maps/../url?q=https://evil.example',
    'https://www.google.com/maps/%2e%2e/url',
    'https://www.google.com/maps/%2E%2e/url',
    'https://www.google.com/maps' + String.fromCharCode(92) + 'x',
    'https://www.google.com/maps x',
    'https://www.google.com/maps/' + 'x'.repeat(480),
  ];
  it('keeps Google Maps links and drops everything else', () => {
    for (const u of OK) expect(safeMapsUrl(u), u).toBe(u);
    for (const u of BAD) expect(safeMapsUrl(u), u).toBeNull();
    for (const u of [
      null,
      undefined,
      '',
      ' https://www.google.com/maps',
      'https://www.google.com/maps ',
    ])
      expect(safeMapsUrl(u), String(u)).toBeNull();
  });
  it('allows 500 characters and refuses 501, as the server does', () => {
    const base = 'https://www.google.com/maps/';
    const at = (n: number) => base + 'x'.repeat(n - base.length);
    expect(safeMapsUrl(at(500))).toBe(at(500));
    expect(safeMapsUrl(at(501))).toBeNull();
  });
  it('says the same as the form check', () => {
    /* '', null and untrimmed values are left out: checkPlace trims, and an
       empty link there means "no link"; links.ts gets only stored (trimmed) values */
    const place = {
      name: 'x',
      category: 'food',
      description: '',
      gmaps_url: '',
      lat: 34.82,
      lng: 135.65,
      lang: 'en',
    };
    for (const u of [...OK, ...BAD])
      expect(safeMapsUrl(u) === null, u).toBe(
        checkPlace({ ...place, gmaps_url: u }) === 'gmaps_url',
      );
  });
});
