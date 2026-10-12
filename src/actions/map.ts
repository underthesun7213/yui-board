import { fetchPrefectures } from '../api/rest';
import { isPrefEntry, pushPrefState, replaceMapState } from '../app/router';
import type { Category } from '../domain/types';
import { forgetView, setHandlers, setPrefGeo } from '../map/runtime';
import { getPosition } from '../platform/geolocation';
import { store } from '../platform/storage';
import { location } from '../state/location';
import { mapUi } from '../state/mapUi';
import { route } from '../state/route';

const bumpFit = () => mapUi.set((s) => ({ fitSeq: s.fitSeq + 1 }));
const onMap = () => route.get().route.name === 'map';

/* Entering the map: locate only after the notice was accepted once (Y-M1 —
   no permission prompt on entry), and load boundaries for all of Japan. */
export function enterMap() {
  const m = mapUi.get();
  if (m.mode === 'near' && (location.get().state === 'idle' || location.get().state === 'ok'))
    void locate();
  if (m.mode === 'japan') void ensurePrefs();
}

export async function locate() {
  location.set({ state: 'wait' });
  const r = await getPosition();
  if (r.ok) {
    location.set({ state: 'ok', loc: r.loc });
    forgetView('near');
  } else location.set({ state: r.denied ? 'denied' : 'fail' });
  /* a result only moves the map in near mode; in Japan mode the view is left alone */
  if (mapUi.get().mode === 'near') bumpFit();
}

export function useLocation() {
  store.set('loc', 'use');
  void locate();
}
export function skipLocation() {
  store.set('loc', 'skip');
  location.set({ state: 'skip' });
  bumpFit();
}

let prefLoad: Promise<void> | null = null;
export function ensurePrefs(): Promise<void> {
  if (mapUi.get().prefReady) return Promise.resolve();
  prefLoad ??= fetchPrefectures()
    .then((g) => {
      setPrefGeo(g);
      mapUi.set({ prefReady: true, prefFail: false });
    })
    .catch(() => {
      prefLoad = null;
      mapUi.set({ prefFail: true });
    });
  return prefLoad;
}

/* Switching mode returns to where that mode was left; the first visit fits. */
export function setMode(mode: 'near' | 'japan') {
  if (mode === mapUi.get().mode) return;
  mapUi.set({ mode, pl: null, cat: '', pref: null });
  replaceMapState();
  enterMap();
}

/* Picking a prefecture is a history step, so system back returns to all of Japan. */
export function selectPref(code: string | null) {
  const cur = mapUi.get().pref;
  if (!code && cur && isPrefEntry(cur)) {
    history.back();
    return;
  }
  mapUi.set({ pref: code, pl: null, cat: '' });
  pushPrefState(!!code);
}

export function setCat(cat: Category | '') {
  mapUi.set({ cat, pl: null });
}
export function togglePlace(id: number) {
  mapUi.set((s) => ({ pl: s.pl === id ? null : id }));
}

setHandlers({
  onPin: (id) => {
    if (onMap()) togglePlace(id);
  },
  onPref: (code) => {
    if (onMap()) selectPref(code);
  },
});
