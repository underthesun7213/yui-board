import { mapUi } from '../state/mapUi';
import { ui } from '../state/ui';
import { route, type Route, type RouteName } from '../state/route';
import { formatRoute, legacyRoute, PARENT, parseRoute } from './routes';

/* Path routes (/map, /cal/new), no router library; the host answers every
   path with the app (wrangler.app.jsonc, not_found_handling). An old hash
   link (#/map, the first addresses) opens its screen and becomes its path.
   Each history entry carries what the URL cannot: the screen it came from
   (for ‹) and, on the map, the mode and
   prefecture — picking a prefecture is its own history step, so system back
   returns to all of Japan without leaving the map. */
interface HistState {
  prev: RouteName | null;
  /** only on map entries; pf: this entry was made by picking a prefecture */
  map?: { mode: 'near' | 'japan'; pref: string | null; pf?: boolean };
}

type Hook = (to: Route, from: Route, how: 'push' | 'pop') => void;
let hook: Hook = () => {};
/** Called after every route change; the map uses it to start locating (D14). */
export function onRouteChange(fn: Hook) {
  hook = fn;
}

function state(pf: boolean): HistState {
  const { route: r, prev } = route.get();
  if (r.name !== 'map') return { prev };
  const m = mapUi.get();
  return { prev, map: { mode: m.mode, pref: m.pref, pf } };
}
function write(replace: boolean, url?: string, pf = false) {
  try {
    history[replace ? 'replaceState' : 'pushState'](state(pf), '', url);
  } catch {
    /* sandboxed frames can refuse history writes; the app still works in memory */
  }
}

export function navigate(to: Route, opts: { replace?: boolean } = {}) {
  const from = route.get();
  /* Coming to the map from another screen always starts at near me (D14). */
  if (to.name === 'map' && from.route.name !== 'map')
    mapUi.set({ mode: 'near', pref: null, cat: '', pl: null });
  route.set({ route: to, prev: opts.replace ? from.prev : from.route.name, taps: from.taps + 1 });
  write(!!opts.replace, formatRoute(to));
  hook(to, from.route, 'push');
}

/** ‹ : back through history when it leads to the parent, otherwise replace with the parent. */
export function back() {
  const { route: r, prev } = route.get();
  const parent = PARENT[r.name] ?? { name: 'home' };
  if (prev === parent.name) history.back();
  else navigate(parent, { replace: true });
}

/** Picking a prefecture is a history step; clearing one replaces the entry. */
export function pushPrefState(picked: boolean) {
  write(!picked, undefined, picked);
}
/** Mode switches replace the entry: they are not steps. */
export function replaceMapState() {
  write(true);
}
/** True when the current entry was made by picking this prefecture. */
export function isPrefEntry(pref: string): boolean {
  try {
    const s = history.state as HistState | null;
    return !!s?.map?.pf && s.map.pref === pref;
  } catch {
    return false;
  }
}

/* The report sheet and the full-screen comic page are a history step on the
   same URL, so system back closes them (RFC-0003 §338). */
export function pushSheetState() {
  try {
    history.pushState({ ...(history.state as HistState | null), sheet: true }, '');
  } catch {
    /* refused in a sandboxed frame: the sheet closes with its own button */
  }
}
export function isSheetEntry(): boolean {
  try {
    return !!(history.state as { sheet?: boolean } | null)?.sheet;
  } catch {
    return false;
  }
}

function onPop(e: PopStateEvent) {
  /* an old hash link typed or followed while the app is open */
  const oldHash = location.hash.startsWith('#/') ? parseRoute(location.hash) : null;
  const to = oldHash ?? parseRoute(location.pathname) ?? { name: 'home' };
  /* back from the sheet's step: only the sheet closes; the screen (and the
     map's open card) stays as it is */
  if (ui.get().report || ui.get().zoom) {
    ui.set({ report: null, zoom: null });
    if (formatRoute(to) === formatRoute(route.get().route)) return;
  }
  const st = (e.state ?? { prev: null }) as HistState;
  const mp = st.map;
  const from = route.get().route;
  /* System back keeps the screen as it was: the map's mode comes back from the
     entry rather than resetting to near (D14 is for taps only). */
  if (to.name === 'map')
    mapUi.set({ mode: mp?.mode ?? 'near', pref: mp?.pref ?? null, pl: null, cat: '' });
  route.set({ route: to, prev: st.prev ?? null });
  /* it becomes its path, as a new step from the screen it was typed over */
  if (oldHash) {
    route.set({ prev: from.name });
    write(true, formatRoute(to));
  }
  hook(to, from, 'pop');
}

/** Reads the start route and takes over history. */
export function startRouter() {
  const oldHash = location.hash.startsWith('#/') ? parseRoute(location.hash) : null;
  /* a path that is no screen opens home */
  const fromPath = oldHash ? null : parseRoute(location.pathname);
  const st = history.state as HistState | null;
  /* the old board's ?v= links come in at the root */
  const legacy = location.pathname === '/' ? legacyRoute(location.search) : null;
  const start: Route = oldHash ?? legacy ?? fromPath ?? { name: 'home' };
  /* a reload or a return keeps the map's mode and where ‹ leads */
  const same = !!fromPath && start === fromPath && location.pathname === formatRoute(start);
  if (same && start.name === 'map' && st?.map) mapUi.set({ mode: st.map.mode, pref: st.map.pref });
  route.set({ route: start, prev: same ? (st?.prev ?? null) : null });
  write(true, formatRoute(start));
  addEventListener('popstate', onPop);
  hook(start, { name: 'home' }, 'pop');
}
