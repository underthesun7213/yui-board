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
  /** the server's data_version when this was read */
  version: number | null;
  status: DataStatus;
}
export const data = createStore<Data>({
  places: [],
  events: [],
  overrides: [],
  schedule: makeSchedule([], []),
  fetchedAt: null,
  version: null,
  status: 'idle',
});

export function setData(
  places: Place[],
  events: EventSeries[],
  overrides: OccurrenceOverride[],
  fetchedAt: string,
  version: number | null = null,
  status: DataStatus = 'ok',
) {
  data.set({
    places,
    events,
    overrides,
    schedule: makeSchedule(events, overrides),
    fetchedAt,
    version,
    status,
  });
}
