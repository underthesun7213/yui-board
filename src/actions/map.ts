import { fetchPrefectures } from '../api/rest';
import { isPrefEntry, pushPrefState, replaceMapState } from '../app/router';
import type { Category } from '../domain/types';
import { distM } from '../domain/geo/geo';
import { forgetView, setHandlers, setPrefGeo } from '../map/runtime';
import { getPosition } from '../platform/geolocation';
import { store } from '../platform/storage';
import { location } from '../state/location';
import { mapUi } from '../state/mapUi';
import { route } from '../state/route';

const bumpFit = () => mapUi.set((s) => ({ fitSeq: s.fitSeq + 1 }));
const onMap = () => route.get().route.name === 'map';

/* Entering the map tab (Y-M1): refresh the position if location was allowed
   before — never a permission prompt — and load boundaries for all of Japan.
   A map that failed to load gets another try. */
export function enterMap() {
  const m = mapUi.get();
  if (m.mapFail) mapUi.set({ mapFail: false });
  const st = location.get().state;
  if (m.mode === 'near' && (st === 'idle' || st === 'ok')) void locate();
  if (m.mode === 'japan') void ensurePrefs();
}

/* Moving less than this keeps the map where the person left it. */
const MOVED_M = 100;

export async function locate() {
  const before = location.get();
  const had = before.state === 'ok' && before.loc ? before.loc : null;
  /* a refresh keeps the last fix on screen until the new one arrives */
  location.set(had ? { refreshing: true } : { state: 'wait' });
  const r = await getPosition();
  if (r.ok) {
    location.set({ state: 'ok', loc: r.loc, refreshing: false });
    if (had && distM(had, r.loc) < MOVED_M) return;
    forgetView('near');
  } else if (had) {
    /* keep the last good position rather than falling back to 結 */
    location.set({ refreshing: false });
    return;
  } else location.set({ state: r.denied ? 'denied' : 'fail', refreshing: false });
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

/* Switching mode returns to where that mode was left (the runtime keeps each
   mode's view) and keeps the prefecture, as v1.3 did. It is not an entry to
   the map, so it locates only if that has not happened yet this session. */
export function setMode(mode: 'near' | 'japan') {
  if (mode === mapUi.get().mode) return;
  mapUi.set({ mode, pl: null, cat: '' });
  replaceMapState();
  if (mode === 'near' && location.get().state === 'idle') void locate();
  if (mode === 'japan') void ensurePrefs();
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
