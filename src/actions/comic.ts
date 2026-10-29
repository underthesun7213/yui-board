import { isSheetEntry, pushSheetState } from '../app/router';
import { ui } from '../state/ui';

/** Opens a comic page full screen (Y-J1); a history step, like the report sheet. */
export function openZoom(lid: string, n: 1 | 2) {
  if (ui.get().zoom || ui.get().report) return;
  ui.set({ zoom: { lid, n } });
  pushSheetState();
}

/** Opens a collection picture full screen, the same way. */
export function openArt(art: string, alt: string) {
  if (ui.get().zoom || ui.get().report) return;
  ui.set({ zoom: { art, alt } });
  pushSheetState();
}

/** Closes it, taking back the history step it made when there is one. */
export function closeZoom() {
  if (!ui.get().zoom) return;
  if (isSheetEntry()) history.back();
  else ui.set({ zoom: null });
}
