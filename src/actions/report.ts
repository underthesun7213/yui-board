import { isSheetEntry, pushSheetState } from '../app/router';
import { ui, type ReportTarget } from '../state/ui';

/** Opens the report sheet for a place or an event (Y-R1, Y-K10). */
export function openReport(target: ReportTarget) {
  if (ui.get().report || ui.get().zoom) return;
  ui.set({ report: target });
  pushSheetState();
}

/** Closes it, taking back the history step it made when there is one. */
export function closeReport() {
  if (!ui.get().report) return;
  if (isSheetEntry()) history.back();
  else ui.set({ report: null });
}
