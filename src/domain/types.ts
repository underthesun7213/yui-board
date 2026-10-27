export type Lang = 'ja' | 'en' | 'ko';
export const LANGS: Lang[] = ['en', 'ja', 'ko'];

export type Category = 'transit' | 'daily' | 'food' | 'study' | 'admin' | 'health' | 'sights';
export const CATEGORIES: Category[] = [
  'transit',
  'daily',
  'food',
  'study',
  'admin',
  'health',
  'sights',
];

export interface LatLng {
  lat: number;
  lng: number;
}

/** A place as the public read API returns it (openapi-v2 Place). */
export interface Place extends LatLng {
  id: number;
  name: string;
  category: Category;
  description: string;
  gmaps_url: string | null;
  pref: string;
  lang: Lang;
  created_on: string;
  edited_on: string | null;
  /** the description in the other UI languages, once translated (D32) */
  tr?: Partial<Record<Lang, string>>;
}

/** An event series (openapi-v2 EventSeries), times as HH:MM. */
export interface EventSeries {
  id: number;
  title: string;
  start_date: string;
  start_time: string;
  end_time: string;
  weekly_until: string | null;
  place_text: string;
  body: string;
  lang: Lang;
  created_on: string;
  edited_on: string | null;
}

/** One week of a weekly series changed or cancelled (openapi-v2 Occurrence). */
export interface OccurrenceOverride {
  event_id: number;
  occurs_on: string;
  cancelled: boolean;
  title: string | null;
  start_time: string | null;
  end_time: string | null;
  place_text: string | null;
  body: string | null;
}

/** An event on one day, with that day's override applied. */
export interface Occurrence {
  event: EventSeries;
  date: string;
  title: string;
  body: string;
  start: string;
  end: string;
  place: string;
}
