import type { EventSeries, Occurrence, OccurrenceOverride } from '../types';
import { addDays, dayDiff } from './dates';

export interface Schedule {
  events: EventSeries[];
  /** keyed by `${event_id}|${date}` */
  overrides: Map<string, OccurrenceOverride>;
}

export function makeSchedule(events: EventSeries[], overrides: OccurrenceOverride[]): Schedule {
  return { events, overrides: new Map(overrides.map((o) => [o.event_id + '|' + o.occurs_on, o])) };
}

/* Occurrences on one day: one-off events on their date, weekly events every
   seventh day from start_date until weekly_until, with that day's override applied. */
export function occOn(s: Schedule, k: string): Occurrence[] {
  const out: Occurrence[] = [];
  for (const e of s.events) {
    if (e.weekly_until) {
      if (k < e.start_date || k > e.weekly_until || dayDiff(e.start_date, k) % 7) continue;
    } else if (e.start_date !== k) continue;
    const o = s.overrides.get(e.id + '|' + k);
    if (o?.cancelled) continue;
    out.push({
      event: e,
      date: k,
      title: o?.title || e.title,
      body: o?.body ?? e.body,
      start: o?.start_time || e.start_time,
      end: o?.end_time || e.end_time,
      place: o?.place_text ?? e.place_text,
    });
  }
  return out.sort((a, b) =>
    a.start < b.start ? -1 : a.start > b.start ? 1 : a.event.id - b.event.id,
  );
}

export function upcoming(s: Schedule, from: string, n: number): Occurrence[] {
  const out: Occurrence[] = [];
  let k = from;
  for (let i = 0; i < 180 && out.length < n; i++) {
    out.push(...occOn(s, k));
    k = addDays(k, 1);
  }
  return out.slice(0, n);
}

export const findOcc = (s: Schedule, id: number, k: string) =>
  occOn(s, k).find((o) => o.event.id === id);
