import type { Category, LatLng, Place } from '../types';
import { PREFS } from './prefs';

/** 結 -YUI-, the reference point when location is not used. */
export const HOME: LatLng = { lat: 34.8244, lng: 135.6525 };
export const JAPAN_BOUNDS: [[number, number], [number, number]] = [
  [24.0, 122.9],
  [45.6, 146.0],
];
export const NEAR_M = 3000;

export function distM(a: LatLng, b: LatLng): number {
  const r = Math.PI / 180;
  const dl = (b.lat - a.lat) * r;
  const dn = (b.lng - a.lng) * r;
  const h =
    Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2;
  return 12742e3 * Math.asin(Math.sqrt(h));
}

/* Straight-line distance x1.25 for streets, at 78 m/min (the hill up to campus). */
export const walkMin = (from: LatLng, p: LatLng) =>
  Math.max(1, Math.round((distM(from, p) * 1.25) / 78));

export type Region =
  'hokkaido' | 'tohoku' | 'kanto' | 'chubu' | 'kinki' | 'chugoku' | 'shikoku' | 'kyushu';
export function regionOf(code: string): Region {
  const n = +code;
  return n === 1
    ? 'hokkaido'
    : n <= 7
      ? 'tohoku'
      : n <= 14
        ? 'kanto'
        : n <= 23
          ? 'chubu'
          : n <= 30
            ? 'kinki'
            : n <= 35
              ? 'chugoku'
              : n <= 39
                ? 'shikoku'
                : 'kyushu';
}

export function prefName(code: string, lang: 'ja' | 'en' | 'ko'): string {
  const p = PREFS.find((x) => x[0] === code);
  return p ? p[{ ja: 1, en: 2, ko: 3 }[lang] as 1 | 2 | 3] : code;
}

export interface MapFilter {
  mode: 'near' | 'japan';
  pref: string | null;
  cat: Category | '';
}

/** Places shown in the list and as pins for the current mode. */
export function shownPlaces(places: Place[], f: MapFilter, ref: LatLng): Place[] {
  let list: Place[];
  if (f.mode === 'near')
    list = places
      .map((p) => [p, distM(ref, p)] as const)
      .filter(([, d]) => d <= NEAR_M)
      .sort((a, b) => a[1] - b[1])
      .map(([p]) => p);
  else if (f.pref) list = places.filter((p) => p.pref === f.pref);
  else list = [];
  return f.cat ? list.filter((p) => p.category === f.cat) : list;
}

type Ring = [number, number][];
export type PrefGeometry =
  { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };

/* Bounds [[s,w],[n,e]] of the largest polygon: Tokyo's Izu islands or Okinawa's
   outer islands would otherwise zoom the prefecture out to open sea. */
export function mainBounds(g: PrefGeometry): [[number, number], [number, number]] | null {
  const polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
  let best: Ring | null = null;
  let area = -1;
  for (const poly of polys) {
    const ring = poly[0];
    if (!ring) continue;
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const pi = ring[i]!;
      const pj = ring[j]!;
      a += (pj[0] + pi[0]) * (pj[1] - pi[1]);
    }
    if (Math.abs(a) > area) {
      area = Math.abs(a);
      best = ring;
    }
  }
  if (!best?.length) return null;
  const lats = best.map((c) => c[1]);
  const lngs = best.map((c) => c[0]);
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
}
