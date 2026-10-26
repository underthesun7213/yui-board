import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatRoute, legacyRoute, parseRoute } from '../../src/app/routes';
import { ART, cutKey, endingKey, sceneKey } from '../../src/content/art';
import { ENDINGS } from '../../src/content/endings';
import { LESSONS } from '../../src/content/lessons';
import { VN } from '../../src/content/vn';
import { addMonths, monthCells, tokyoToday, weekday } from '../../src/domain/calendar/dates';
import { makeSchedule, occOn, upcoming } from '../../src/domain/calendar/occurrences';
import { HOME, mainBounds, regionOf, shownPlaces, walkMin } from '../../src/domain/geo/geo';
import { PREFS } from '../../src/domain/geo/prefs';
import { buildIcs, icsEsc, icsFold } from '../../src/domain/ics';
import { safeMapsUrl } from '../../src/domain/links';
import { checkEvent, checkPlace, HAS_LATIN } from '../../src/domain/validation';
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

describe('art', () => {
  it('only has files for slots that exist', () => {
    const slots = new Set<string>();
    for (const l of LESSONS) l.cuts.forEach((_, i) => slots.add(cutKey(l.id, i)));
    for (const r of ['osaka', 'kyoto'] as const)
      VN[r].scenes.forEach((_, i) => slots.add(sceneKey(r, i)));
    for (const e of ENDINGS) slots.add(endingKey(e.id));
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
