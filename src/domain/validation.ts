/* The server's rules, checked early so the form can say what is wrong before
   sending. The server checks again; these only explain. Field names match the
   server's {status:'invalid', field}. */
import { addDays, dayDiff, tokyoTime, tokyoToday } from './calendar/dates';

const CNTRL = /\p{Cc}/u;
/* invisible or direction-changing characters, C1 controls, line separators (as the server) */
const HIDDEN =
  /[\u0080-\u009f\u00ad\u061c\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff\ufff9-\ufffb\u115f\u1160\u3164\uffa0\u2800\u{e0000}-\u{e007f}]/u;
/* in multi-line fields only tab and newline */
const ctrlBesidesTabNewline = (v: string) => CNTRL.test(v.replace(/[\t\n]/g, ''));
const VISIBLE = /[^\s\u00a0\u3000]/u;
export const trimText = (s: string) => s.replace(/^[\s\u00a0\u3000]+|[\s\u00a0\u3000]+$/gu, '');
const len = (s: string) => [...s].length;
const DOT_SEGMENT = /(\/|%2f)(\.|%2e){1,2}(\/|%2f|\?|#|$)/i;
const singleLine = (v: string, max: number, required: boolean) =>
  len(v) <= max && !CNTRL.test(v) && !HIDDEN.test(v) && (!required || VISIBLE.test(v));
const multiLine = (v: string, max: number) =>
  len(v) <= max && !ctrlBesidesTabNewline(v) && !HIDDEN.test(v);
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
  const name = trimText(p.name);
  if (!name || !singleLine(name, LIMITS.name, true)) return 'name';
  if (!p.category) return 'category';
  if (!multiLine(p.description, LIMITS.description)) return 'description';
  const url = trimText(p.gmaps_url);
  if (url && (len(url) > 500 || !MAPS_URL.test(url) || DOT_SEGMENT.test(url) || /[\\\s]/.test(url)))
    return 'gmaps_url';
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
/** A new event's slot until the person changes it. */
export const NEW_EVENT_SLOT = { start: '18:00', end: '19:00' };
/** The day a new event starts on: today, or tomorrow once today's slot has ended. */
export const newEventDay = (now: Date = new Date()) =>
  tokyoTime(now) < NEW_EVENT_SLOT.end ? tokyoToday(now) : addDays(tokyoToday(now), 1);

/** `nowTime` (HH:MM in Japan) is given for a new event: the server refuses one
    that has already ended today. */
export function checkEvent(
  e: EventInput,
  today: string,
  startLocked = false,
  nowTime: string | null = null,
): string | null {
  const title = trimText(e.title);
  if (!title || !singleLine(title, LIMITS.title, true)) return 'title';
  if (!/^\d{4}-\d\d-\d\d$/.test(e.start_date)) return 'start_date';
  if (!startLocked && (e.start_date < today || e.start_date > addDays(today, 365)))
    return 'start_date';
  if (
    !/^\d\d:\d\d$/.test(e.start_time) ||
    !/^\d\d:\d\d$/.test(e.end_time) ||
    e.end_time <= e.start_time ||
    (nowTime != null && e.start_date === today && e.end_time <= nowTime)
  )
    return 'time';
  if (e.weekly_until != null) {
    const d = /^\d{4}-\d\d-\d\d$/.test(e.weekly_until) ? dayDiff(e.start_date, e.weekly_until) : -1;
    if (d <= 0 || d > 7 * (LIMITS.weeks - 1) || d % 7) return 'weekly_until';
  }
  if (!singleLine(trimText(e.place_text), LIMITS.place_text, false)) return 'place_text';
  if (!multiLine(e.body, LIMITS.body)) return 'body';
  if (!e.lang) return 'lang';
  return null;
}

/** The last allowed "last week" for a series starting on `start`. */
export const lastWeekMax = (start: string) => addDays(start, 7 * (LIMITS.weeks - 1));
