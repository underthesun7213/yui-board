import { addMonths, tokyoToday } from '../domain/calendar/dates';
import { calendarUi } from '../state/calendarUi';

export const selectDay = (k: string) => calendarUi.set((s) => ({ day: s.day === k ? null : k }));
export const moveMonth = (n: number) =>
  calendarUi.set((s) => ({ month: addMonths(s.month ?? tokyoToday().slice(0, 7), n) }));
