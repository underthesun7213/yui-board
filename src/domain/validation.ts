/* The server's rules, checked early so the form can say what is wrong before
   sending. The server checks again; these only explain. Field names match the
   server's {status:'invalid', field}. */
import { addDays, dayDiff } from './calendar/dates';

const CNTRL = /\p{Cc}/u;
const len = (s: string) => [...s].length;
export const MAPS_URL =
  /^https:\/\/((www\.)?google\.(com|co\.jp)\/maps([/?#]|$)|maps\.app\.goo\.gl\/)/;

export const LIMITS = {
  name: 60,
  description: 500,
  title: 60,
  place_text: 60,
  body: 500,
  weeks: 26,
};

export interface PlaceInput {
  name: string;
  category: string;
  description: string;
  gmaps_url: string;
  lat: number | null;
  lng: number | null;
  lang: string;
}
export function checkPlace(p: PlaceInput): string | null {
  const name = p.name.trim();
  if (!name || len(name) > LIMITS.name || CNTRL.test(name)) return 'name';
  if (!p.category) return 'category';
  if (len(p.description) > LIMITS.description) return 'description';
  const url = p.gmaps_url.trim();
  if (url && (len(url) > 500 || !MAPS_URL.test(url))) return 'gmaps_url';
  if (p.lat == null || p.lng == null || !Number.isFinite(p.lat) || !Number.isFinite(p.lng))
    return 'location';
  if (p.lat < 20 || p.lat > 46 || p.lng < 122 || p.lng > 154) return 'location';
  if (!p.lang) return 'lang';
  return null;
}

export interface EventInput {
  title: string;
  start_date: string;
  start_time: string;
  end_time: string;
  weekly_until: string | null;
  place_text: string;
  body: string;
  lang: string;
}
export function checkEvent(e: EventInput, today: string, startLocked = false): string | null {
  const title = e.title.trim();
  if (!title || len(title) > LIMITS.title || CNTRL.test(title)) return 'title';
  if (!/^\d{4}-\d\d-\d\d$/.test(e.start_date)) return 'start_date';
  if (!startLocked && e.start_date < today) return 'start_date';
  if (
    !/^\d\d:\d\d$/.test(e.start_time) ||
    !/^\d\d:\d\d$/.test(e.end_time) ||
    e.end_time <= e.start_time
  )
    return 'time';
  if (e.weekly_until != null) {
    const d = /^\d{4}-\d\d-\d\d$/.test(e.weekly_until) ? dayDiff(e.start_date, e.weekly_until) : -1;
    if (d <= 0 || d > 7 * (LIMITS.weeks - 1) || d % 7) return 'weekly_until';
  }
  const place = e.place_text.trim();
  if (len(place) > LIMITS.place_text || CNTRL.test(place)) return 'place_text';
  if (len(e.body) > LIMITS.body) return 'body';
  if (!e.lang) return 'lang';
  return null;
}

/** The last allowed "last week" for a series starting on `start`. */
export const lastWeekMax = (start: string) => addDays(start, 7 * (LIMITS.weeks - 1));
