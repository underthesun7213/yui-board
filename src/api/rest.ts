import {
  CATEGORIES,
  type EventSeries,
  type EventText,
  type Lang,
  type OccurrenceOverride,
  type Place,
} from '../domain/types';
import { FIXTURE_MODE, SUPABASE_KEY, SUPABASE_URL } from './config';

export { FIXTURE_MODE };

export interface Snapshot {
  places: Place[];
  events: EventSeries[];
  overrides: OccurrenceOverride[];
}

const hm = (t: string | null) => (t ? t.slice(0, 5) : t);
const CATS = new Set<string>(CATEGORIES);
export function normalize(s: Snapshot): Snapshot {
  return {
    /* a category this build does not know cannot be drawn; skip it */
    places: s.places.filter((p) => CATS.has(p.category)),
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

/* Reads need no account: the publishable key and the public views (Y-A1).
   Plain fetch, so the first screen does not carry the Supabase SDK. */
async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`read ${path}: ${r.status}`);
  return (await r.json()) as T;
}

/* The hosted API answers at most "max rows" per request (1000 unless the
   project lowers it); read until a page comes back empty, so nothing is cut
   off silently whatever that limit is. The order keeps the pages stable. */
const PAGE = 1000;
async function getAll<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await get<T[]>(`${path}&limit=${PAGE}&offset=${offset}`);
    if (!page.length) return out;
    out.push(...page);
    /* the server may cap a page below PAGE ("max rows"): continue right after it */
    offset += page.length - PAGE;
  }
}

export interface Translation {
  place_id: number;
  lang: Lang;
  description: string;
}
/** Places with their description translations attached (D32). */
export function withTranslations(places: Place[], rows: Translation[]): Place[] {
  const by = new Map<number, Partial<Record<Lang, string>>>();
  for (const t of rows) by.set(t.place_id, { ...by.get(t.place_id), [t.lang]: t.description });
  return places.map((p) => (by.has(p.id) ? { ...p, tr: by.get(p.id) } : p));
}

export interface EventTranslation extends EventText {
  event_id: number;
  lang: Lang;
}
/** Events with their translations attached (TR-Q2). */
export function withEventTranslations(
  events: EventSeries[],
  rows: EventTranslation[],
): EventSeries[] {
  const by = new Map<number, Partial<Record<Lang, EventText>>>();
  for (const { event_id, lang, title, place_text, body } of rows)
    by.set(event_id, { ...by.get(event_id), [lang]: { title, place_text, body } });
  return events.map((e) => (by.has(e.id) ? { ...e, tr: by.get(e.id) } : e));
}

export async function readAll(): Promise<Snapshot> {
  if (FIXTURE_MODE) {
    const [p, e, o, t, et] = await Promise.all([
      import('../../tests/fixtures/places.json'),
      import('../../tests/fixtures/events.json'),
      import('../../tests/fixtures/occurrences.json'),
      import('../../tests/fixtures/place_translations.json'),
      import('../../tests/fixtures/event_translations.json'),
    ]);
    return normalize({
      places: withTranslations(p.default as Place[], t.default as Translation[]),
      events: withEventTranslations(e.default as EventSeries[], et.default as EventTranslation[]),
      overrides: o.default as OccurrenceOverride[],
    });
  }
  const [places, events, overrides, translations, eventTranslations] = await Promise.all([
    getAll<Place>(
      'places_public?select=id,name,category,description,gmaps_url,lat,lng,pref,lang,created_on,edited_on&order=id',
    ),
    getAll<EventSeries>(
      'events_public?select=id,title,start_date,start_time,end_time,weekly_until,place_text,body,lang,created_on,edited_on&order=id',
    ),
    getAll<OccurrenceOverride>(
      'event_occurrences_public?select=event_id,occurs_on,cancelled,title,start_time,end_time,place_text,body&order=event_id,occurs_on',
    ),
    /* translations are extra: without them the originals show, as before */
    getAll<Translation>(
      'place_translations_public?select=place_id,lang,description&order=place_id,lang',
    ).catch(() => []),
    getAll<EventTranslation>(
      'event_translations_public?select=event_id,lang,title,place_text,body&order=event_id,lang',
    ).catch(() => []),
  ]);
  return normalize({
    places: withTranslations(places, translations),
    events: withEventTranslations(events, eventTranslations),
    overrides,
  });
}

/** A number that changes whenever anything public changes. GET, so it is never counted as a write. */
export async function readVersion(): Promise<number> {
  if (FIXTURE_MODE) return 0;
  return Number(await get<number>('rpc/data_version'));
}

export async function fetchPrefectures(): Promise<unknown> {
  const r = await fetch('/data/japan-prefectures.geojson');
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}
