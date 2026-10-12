import { createStore } from './store';

/** day: selected YYYY-MM-DD · month: shown YYYY-MM (null = this month) */
export const calendarUi = createStore<{ day: string | null; month: string | null }>({
  day: null,
  month: null,
});
