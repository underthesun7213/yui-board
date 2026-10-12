import type { Route, RouteName } from '../state/route';

export const ROOTS: RouteName[] = ['home', 'learn', 'map', 'cal'];
export const TABS: Route[] = [
  { name: 'home' },
  { name: 'learn' },
  { name: 'map' },
  { name: 'cal' },
];
export const TAB_OF: Record<RouteName, number> = {
  home: 0,
  learn: 1,
  lesson: 1,
  collection: 1,
  map: 2,
  cal: 3,
  event: 3,
};
/** Where ‹ goes. */
export const PARENT: Partial<Record<RouteName, Route>> = {
  learn: { name: 'home' },
  map: { name: 'home' },
  cal: { name: 'home' },
  lesson: { name: 'learn' },
  collection: { name: 'learn' },
  event: { name: 'cal' },
};

export function formatRoute(r: Route): string {
  switch (r.name) {
    case 'home':
      return '#/';
    case 'learn':
      return '#/learn';
    case 'lesson':
      return '#/learn/' + encodeURIComponent(r.lid);
    case 'collection':
      return '#/learn/collection';
    case 'map':
      return '#/map';
    case 'cal':
      return '#/cal';
    case 'event':
      return `#/cal/event/${r.id}/${r.date}`;
  }
}

export function parseRoute(hash: string): Route | null {
  const p = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!p.length) return hash ? { name: 'home' } : null;
  if (p[0] === 'learn') {
    if (p.length === 1) return { name: 'learn' };
    if (p.length === 2)
      return p[1] === 'collection'
        ? { name: 'collection' }
        : { name: 'lesson', lid: decodeURIComponent(p[1]!) };
  }
  if (p[0] === 'map' && p.length === 1) return { name: 'map' };
  if (p[0] === 'cal') {
    if (p.length === 1) return { name: 'cal' };
    if (
      p[1] === 'event' &&
      p.length === 4 &&
      /^\d+$/.test(p[2]!) &&
      /^\d{4}-\d\d-\d\d$/.test(p[3]!)
    )
      return { name: 'event', id: +p[2]!, date: p[3]! };
  }
  return null;
}

/* Old links and manifest shortcuts: ?v=learn|map|cal, ?tab=1 (the old board's
   events tab) and ?compose=1 (the old board's composer, now home). */
export function legacyRoute(search: string): Route | null {
  const q = new URLSearchParams(search);
  const v = q.get('v');
  if (v === 'learn' || v === 'map' || v === 'cal') return { name: v };
  if (q.get('tab') === '1') return { name: 'cal' };
  if (q.has('compose') || q.has('v') || q.has('tab')) return { name: 'home' };
  return null;
}
