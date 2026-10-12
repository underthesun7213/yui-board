import { addMonths, tokyoToday } from '../domain/calendar/dates';
import { findOcc } from '../domain/calendar/occurrences';
import { buildIcs, icsName } from '../domain/ics';
import { t } from '../i18n';
import { downloadText } from '../platform/download';
import { calendarUi } from '../state/calendarUi';
import { data } from '../state/data';
import { prefs } from '../state/prefs';
import { toast } from './ui';

export const selectDay = (k: string) => calendarUi.set((s) => ({ day: s.day === k ? null : k }));
export const moveMonth = (n: number) =>
  calendarUi.set((s) => ({ month: addMonths(s.month ?? tokyoToday().slice(0, 7), n) }));

export function downloadIcs(id: number, date: string) {
  const o = findOcc(data.get().schedule, id, date);
  if (!o) return;
  downloadText(icsName(o), 'text/calendar', buildIcs(o));
  toast(t(prefs.get().lang).addedIcs);
}
