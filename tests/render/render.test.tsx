/* Every route × language × state, rendered to HTML in Node with prerender
   (which waits for lazy screens). Fails on a thrown error, a screen that fell
   back to client rendering or the loading state, and on undefined, NaN or
   [object Object] leaking into the output. This is the v1.3 headless check. */
import { prerender } from 'react-dom/static';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';
import { VN } from '../../src/content/vn';
import { CAT } from '../../src/domain/categories';
import { PREFS } from '../../src/domain/geo/prefs';
import {
  CATEGORIES,
  type EventSeries,
  type OccurrenceOverride,
  type Place,
} from '../../src/domain/types';
import { calendarUi } from '../../src/state/calendarUi';
import { collection } from '../../src/state/collection';
import { data, setData } from '../../src/state/data';
import { location, type LocState } from '../../src/state/location';
import { mapUi } from '../../src/state/mapUi';
import { prefs } from '../../src/state/prefs';
import { route, type Route } from '../../src/state/route';
import { vn, VN_START } from '../../src/state/vn';
import events from '../fixtures/events.json';
import occurrences from '../fixtures/occurrences.json';
import places from '../fixtures/places.json';

const hm = (e: EventSeries) => ({
  ...e,
  start_time: e.start_time.slice(0, 5),
  end_time: e.end_time.slice(0, 5),
});
setData(
  places as Place[],
  (events as EventSeries[]).map(hm),
  occurrences as OccurrenceOverride[],
  '2026-10-12T00:00:00Z',
);
const GIP = (events as EventSeries[]).find((e) => e.weekly_until)!.id;

async function html(): Promise<string> {
  const errors: unknown[] = [];
  const { prelude } = await prerender(<App />, { onError: (e) => void errors.push(e) });
  const out = await new Response(prelude).text();
  if (errors.length) throw errors[0];
  return out;
}

function reset() {
  data.set({ status: 'ok' });
  mapUi.set({
    mode: 'near',
    pref: null,
    cat: '',
    pl: null,
    prefFail: false,
    tileFail: false,
    mapFail: false,
  });
  location.set({ state: 'ask', loc: null });
  calendarUi.set({ day: null, month: null });
  collection.set({ cg: {} });
  vn.set(VN_START);
}

type Case = [name: string, r: Route, setup?: () => void, mark?: RegExp];
const cases: Case[] = [
  ['home', { name: 'home' }],
  ['home-cards', { name: 'home' }, () => collection.set({ cg: { e_osaka_best: true } })],
  ['learn', { name: 'learn' }],
  ['lesson', { name: 'lesson', lid: 'l1' }],
  ['lesson-unknown', { name: 'lesson', lid: 'zz' }, undefined, /class="lesson"/],
  ['collection-empty', { name: 'collection' }],
  [
    'collection-full',
    { name: 'collection' },
    () => collection.set({ cg: { e_osaka_best: true, e_kyoto_norm: true, e_both: true } }),
  ],
  ['cal', { name: 'cal' }],
  ['cal-day', { name: 'cal' }, () => calendarUi.set({ day: '2026-09-22', month: '2026-09' })],
  ['cal-empty-day', { name: 'cal' }, () => calendarUi.set({ day: '2026-11-03', month: '2026-11' })],
  [
    'cal-cancelled-week',
    { name: 'cal' },
    () => calendarUi.set({ day: '2026-10-20', month: '2026-10' }),
  ],
  ['event', { name: 'event', id: GIP, date: '2026-09-22' }],
  ['event-weekly', { name: 'event', id: GIP, date: '2026-10-13' }],
  ['event-missing', { name: 'event', id: GIP, date: '2026-10-14' }, undefined, /class="empty"/],
  ['event-cancelled', { name: 'event', id: GIP, date: '2026-10-20' }, undefined, /class="empty"/],
  ['home-loading', { name: 'home' }, () => data.set({ status: 'loading' }), /class="dstatus"/],
  ['cal-data-error', { name: 'cal' }, () => data.set({ status: 'error' }), /class="dstatus warn"/],
  ['map-data-error', { name: 'map' }, () => data.set({ status: 'error' }), /class="dstatus warn"/],
  ['map-near-pl', { name: 'map' }, () => (location.set({ state: 'skip' }), mapUi.set({ pl: 1 }))],
  ['map-japan', { name: 'map' }, () => mapUi.set({ mode: 'japan', prefFail: true })],
  [
    'map-pref-27',
    { name: 'map' },
    () => mapUi.set({ mode: 'japan', pref: '27', cat: 'daily', pl: 3 }),
  ],
  ['map-pref-13', { name: 'map' }, () => mapUi.set({ mode: 'japan', pref: '13' })],
  ['map-fail', { name: 'map' }, () => mapUi.set({ mapFail: true, tileFail: true })],
];
for (const st of ['ask', 'idle', 'wait', 'ok', 'denied', 'fail', 'skip'] as LocState[])
  cases.push([
    `map-near-${st}`,
    { name: 'map' },
    () => location.set({ state: st, loc: st === 'ok' ? { lat: 35.68, lng: 139.76 } : null }),
  ]);

/* Proof that the screen itself rendered, not just the frame around it. */
const MARK: Record<Route['name'], RegExp> = {
  home: /class="hcards"/,
  learn: /class="lesson"/,
  lesson: /class="(cut|route|vnwrap|vnend)"/,
  collection: /class="cgrid"/,
  map: /class="seg"/,
  cal: /class="mnav"/,
  event: /class="evwrap"/,
};
const BAD = /undefined|NaN|\[object Object\]/;
function check(out: string, mark?: RegExp) {
  expect(out).toMatch(mark ?? MARK[route.get().route.name]);
  expect(out).not.toContain('<!--$!-->');
  expect(out).not.toContain('data-route-loading');
  const m = out.match(/.{0,60}(undefined|NaN|\[object Object\]).{0,30}/);
  expect(m?.[0] ?? '').toBe('');
  expect(BAD.test(out)).toBe(false);
}

describe.each(['en', 'ja', 'ko'] as const)('%s', (lang) => {
  it.each(cases)('%s', async (_n, r, setup, mark) => {
    reset();
    prefs.set({ lang });
    route.set({ route: r, prev: null, taps: 0 });
    setup?.();
    check(await html(), mark);
  });

  it.each(['osaka', 'kyoto'] as const)('plays the %s route through', async (k) => {
    reset();
    prefs.set({ lang });
    route.set({ route: { name: 'lesson', lid: 'l8' }, prev: 'learn', taps: 0 });
    for (let i = 0; i <= VN[k].scenes.length; i++)
      for (const picked of i < VN[k].scenes.length ? [null, 0, 1] : [null]) {
        for (const score of [0, 5]) {
          vn.set({ route: k, i, picked, score });
          check(await html());
        }
      }
  });
});

describe('route table', () => {
  it('has a case for every screen', () => {
    const names: Route['name'][] = ['home', 'learn', 'lesson', 'collection', 'map', 'cal', 'event'];
    for (const n of names)
      expect(
        cases.some((c) => c[1].name === n),
        n,
      ).toBe(true);
  });
});

/* Data that people will edit by hand: a typo here breaks a whole screen. */
describe('fixtures', () => {
  it('places are valid', () => {
    const ids = new Set<number>();
    for (const p of places as Place[]) {
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      expect(CATEGORIES).toContain(p.category);
      expect(CAT[p.category]).toBeTruthy();
      expect(PREFS.some((x) => x[0] === p.pref)).toBe(true);
      expect(Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180).toBe(true);
      expect(['ja', 'en', 'ko']).toContain(p.lang);
      expect(p.name.length).toBeGreaterThan(0);
    }
  });
  it('events are valid', () => {
    const ids = new Set<number>();
    for (const e of events as EventSeries[]) {
      expect(ids.has(e.id)).toBe(false);
      ids.add(e.id);
      expect(e.start_date).toMatch(/^\d{4}-\d\d-\d\d$/);
      expect(e.start_time).toMatch(/^\d\d:\d\d(:\d\d)?$/);
      expect(e.end_time > e.start_time).toBe(true);
      expect(e.title.length).toBeGreaterThan(0);
    }
    for (const o of occurrences as OccurrenceOverride[]) expect(ids.has(o.event_id)).toBe(true);
  });
});
