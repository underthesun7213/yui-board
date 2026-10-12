import type { EventSeries, OccurrenceOverride, Place } from '../domain/types';

export interface Snapshot {
  places: Place[];
  events: EventSeries[];
  overrides: OccurrenceOverride[];
}

const hm = (t: string | null) => (t ? t.slice(0, 5) : t);
function normalize(s: Snapshot): Snapshot {
  return {
    places: s.places,
    events: s.events.map((e) => ({
      ...e,
      start_time: hm(e.start_time)!,
      end_time: hm(e.end_time)!,
    })),
    overrides: s.overrides.map((o) => ({
      ...o,
      start_time: hm(o.start_time),
      end_time: hm(o.end_time),
    })),
  };
}

/* Until the backend lands (Y-2) there is no Supabase URL and the app reads the
   test fixtures — the v1.3 sample data in the shape of the public read API.
   They load as their own chunk, so the home screen does not carry them. */
export const FIXTURE_MODE = !import.meta.env.VITE_SUPABASE_URL;

export async function readAll(): Promise<Snapshot> {
  if (FIXTURE_MODE) {
    const [p, e, o] = await Promise.all([
      import('../../tests/fixtures/places.json'),
      import('../../tests/fixtures/events.json'),
      import('../../tests/fixtures/occurrences.json'),
    ]);
    return normalize({
      places: p.default as Place[],
      events: e.default as EventSeries[],
      overrides: o.default as OccurrenceOverride[],
    });
  }
  throw new Error('Supabase reads arrive in Y-2');
}

export async function fetchPrefectures(): Promise<unknown> {
  const r = await fetch('data/japan-prefectures.geojson');
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}
