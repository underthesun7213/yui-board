import type { EventSeries, OccurrenceOverride, Place } from '../domain/types';
import { makeSchedule, type Schedule } from '../domain/calendar/occurrences';
import { createStore } from './store';

export type DataStatus = 'idle' | 'loading' | 'ok' | 'offline' | 'error';
export interface Data {
  places: Place[];
  events: EventSeries[];
  overrides: OccurrenceOverride[];
  /** derived from events + overrides, rebuilt with them */
  schedule: Schedule;
  fetchedAt: string | null;
  status: DataStatus;
}
export const data = createStore<Data>({
  places: [],
  events: [],
  overrides: [],
  schedule: makeSchedule([], []),
  fetchedAt: null,
  status: 'idle',
});

export function setData(
  places: Place[],
  events: EventSeries[],
  overrides: OccurrenceOverride[],
  fetchedAt: string,
) {
  data.set({
    places,
    events,
    overrides,
    schedule: makeSchedule(events, overrides),
    fetchedAt,
    status: 'ok',
  });
}
