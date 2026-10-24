import type * as Leaflet from 'leaflet';
import { CAT } from '../domain/categories';
import { HOME, JAPAN_BOUNDS, mainBounds, shownPlaces, type PrefGeometry } from '../domain/geo/geo';
import type { LatLng, Place } from '../domain/types';
import { t } from '../i18n';
import { data } from '../state/data';
import { location } from '../state/location';
import { mapUi } from '../state/mapUi';
import { prefs } from '../state/prefs';
import {
  ATTRIBUTION,
  clusterIcon,
  homeIcon,
  meIcon as meDivIcon,
  pickIcon,
  pinIcon as pinDivIcon,
  PREF_STYLE,
  TILE_URL,
} from './icons';

/* The Leaflet map is created once and is never removed. Its container lives
   outside React: MapSlot hands over an empty slot on mount (attach) and takes
   it back on unmount (detach). Leaving the tab, changing language or opening
   another screen never destroys the map, and StrictMode's mount → unmount →
   mount in development still creates exactly one L.map.

   While attached, the runtime follows the stores itself, so React effects
   never move the map. Changes that arrive while detached are applied on the
   next attach. */

type LT = typeof Leaflet;
type View = { c: Leaflet.LatLng; z: number };
interface Applied {
  mode: 'near' | 'japan';
  pref: string | null;
  cat: string;
  pl: number | null;
  fitSeq: number;
  places: Place[];
  loc: LatLng | null;
  locOk: boolean;
  lang: string;
  prefReady: boolean;
  picking: boolean;
  pickLat: number | null;
  pickLng: number | null;
}

export interface MapHandlers {
  onPin(id: number): void;
  onPref(code: string): void;
  onMapClick(at: { lat: number; lng: number }): void;
}

let L: LT | null = null;
let ready: Promise<void> | null = null;
let container: HTMLDivElement | null = null;
let map: Leaflet.Map | null = null;
let cluster: Leaflet.MarkerClusterGroup | null = null;
let homeMarker: Leaflet.Marker | null = null;
let me: Leaflet.Marker | null = null;
let pickMarker: Leaflet.Marker | null = null;
let prefLayer: Leaflet.GeoJSON | null = null;
let prefGeo: unknown = null;
const pins = new Map<number, Leaflet.Marker>();
const modeView: Partial<Record<'near' | 'japan', View>> = {};
let applied: Applied | null = null;
/** the mode the map was last showing, to save its view when the mode changes */
let seenMode: 'near' | 'japan' | null = null;
let currentSlot: HTMLElement | null = null;
let gen = 0;
let handlers: MapHandlers = { onPin() {}, onPref() {}, onMapClick() {} };

/** For tests: how many times L.map was called. */
export const stats = { created: 0, syncs: 0 };

export function setHandlers(h: MapHandlers) {
  handlers = h;
}
export function setPrefGeo(g: unknown) {
  prefGeo = g;
  if (prefLayer && map) {
    map.removeLayer(prefLayer);
    prefLayer = null;
  }
}
/** Forget where a mode was left, so its next visit fits instead of restoring. */
export function forgetView(m: 'near' | 'japan') {
  delete modeView[m];
}

const ref = (a: Applied): LatLng => (a.locOk && a.loc ? a.loc : HOME);
function snapshot(): Applied {
  const m = mapUi.get();
  const l = location.get();
  return {
    mode: m.mode,
    pref: m.pref,
    cat: m.cat,
    pl: m.pl,
    fitSeq: m.fitSeq,
    places: data.get().places,
    loc: l.loc,
    locOk: l.state === 'ok',
    lang: prefs.get().lang,
    prefReady: m.prefReady,
    picking: m.picking,
    pickLat: m.pick?.lat ?? null,
    pickLng: m.pick?.lng ?? null,
  };
}
const shown = (a: Applied) =>
  shownPlaces(a.places, { mode: a.mode, pref: a.pref, cat: a.cat as '' }, ref(a));

/** Loads Leaflet and creates the map, once. Memoized; a failed load can retry. */
export function ensure(): Promise<void> {
  ready ??= (async () => {
    const mod = await import('leaflet');
    L = (mod.default ?? mod) as LT;
    /* markercluster is a classic plugin that extends the global L */
    (globalThis as { L?: LT }).L = L;
    await import('leaflet.markercluster');
    create(L);
  })().catch((e: unknown) => {
    ready = null;
    throw e;
  });
  return ready;
}

function create(L: LT) {
  container = document.createElement('div');
  container.id = 'lmap';
  map = L.map(container, { scrollWheelZoom: false, zoomControl: false });
  stats.created++;
  L.control.zoom().addTo(map);
  const tiles = L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
  /* Leaflet fires "load" once a batch settles, errors included, so count them per batch. */
  let errs = 0;
  tiles.on('loading', () => {
    errs = 0;
  });
  tiles.on('tileerror', () => {
    errs++;
  });
  tiles.on('load', () => mapUi.set({ tileFail: errs > 0 }));
  homeMarker = L.marker([HOME.lat, HOME.lng], { zIndexOffset: 1000, interactive: false }).addTo(
    map,
  );
  cluster = L.markerClusterGroup({
    maxClusterRadius: 42,
    showCoverageOnHover: false,
    spiderfyDistanceMultiplier: 1.4,
    iconCreateFunction: (c) => clusterIcon(L, c.getChildCount()),
  });
  map.addLayer(cluster);
  map.on('click', (e) => handlers.onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }));
  for (const s of [mapUi, data, location, prefs] as const) s.subscribe(onChange);
}

export async function attach(slot: HTMLElement) {
  currentSlot = slot;
  const g = ++gen;
  try {
    await ensure();
  } catch {
    if (gen === g) mapUi.set({ mapFail: true });
    return;
  }
  /* detached, or attached elsewhere, while Leaflet was loading */
  if (gen !== g || currentSlot !== slot || !map || !container) return;
  mapUi.set({ mapFail: false });
  slot.replaceChildren(container);
  map.invalidateSize();
  apply(snapshot());
  setTimeout(() => map?.invalidateSize(), 60);
}

export function detach(slot: HTMLElement) {
  if (currentSlot !== slot) return;
  currentSlot = null;
  gen++;
  container?.remove();
}

const attached = () => !!currentSlot && !!container?.isConnected;

function onChange() {
  if (!map) return;
  const next = snapshot();
  /* Leaving a mode saves where it was left, attached or not, every time. */
  if (seenMode && next.mode !== seenMode) modeView[seenMode] = view();
  seenMode = next.mode;
  /* the rest waits for the next attach */
  if (attached()) apply(next);
}

const view = (): View => ({ c: map!.getCenter(), z: map!.getZoom() });

function apply(next: Applied) {
  const prev = applied;
  applied = next;
  seenMode = next.mode;
  stats.syncs++;
  if (!prev || prev.lang !== next.lang) label(next);
  const onlyPin =
    prev &&
    prev.pl !== next.pl &&
    (Object.keys(next) as (keyof Applied)[]).every((k) => k === 'pl' || prev[k] === next[k]);
  if (onlyPin) {
    restylePins(next);
    const sel = next.places.find((p) => p.id === next.pl);
    if (sel) map!.setView([sel.lat, sel.lng], Math.max(map!.getZoom(), 15), { animate: true });
    return;
  }
  sync(next);
  /* the place form: a spot that did not come from a tap (current location,
     or the place being edited) is brought into view */
  if (
    next.picking &&
    next.pickLat != null &&
    next.pickLng != null &&
    (!prev || !prev.picking || prev.pickLat == null)
  ) {
    const at: [number, number] = [next.pickLat, next.pickLng];
    afterZoom(() => map!.setView(at, Math.max(map!.getZoom(), 16), { animate: false }));
    return;
  }
  if (!prev) return fit(next);
  if (prev.mode !== next.mode) {
    /* back to where this mode was left; the first visit fits */
    const v = modeView[next.mode];
    if (v && prev.fitSeq === next.fitSeq)
      afterZoom(() => map!.setView(v.c, v.z, { animate: false }));
    else fit(next);
    return;
  }
  if (
    prev.fitSeq !== next.fitSeq ||
    prev.prefReady !== next.prefReady ||
    prev.pref !== next.pref ||
    /* places arrived after the map (a slow first load) */
    (!prev.places.length && next.places.length)
  )
    fit(next);
}

/* Strings Leaflet draws itself, refreshed on language change. */
function label(a: Applied) {
  const m = t(a.lang as 'en');
  homeMarker!.setIcon(homeIcon(L!, m.here));
  const zi = container!.querySelector<HTMLElement>('.leaflet-control-zoom-in');
  const zo = container!.querySelector<HTMLElement>('.leaflet-control-zoom-out');
  if (zi) {
    zi.title = m.aZoomIn;
    zi.setAttribute('aria-label', m.aZoomIn);
  }
  if (zo) {
    zo.title = m.aZoomOut;
    zo.setAttribute('aria-label', m.aZoomOut);
  }
  me?.setIcon(meIcon(a));
}
const meIcon = (a: Applied) => meDivIcon(L!, t(a.lang as 'en').youHere);
const pinIcon = (p: Place, on: boolean) =>
  pinDivIcon(L!, CAT[p.category].color, CAT[p.category].icon, on);

function restylePins(a: Applied) {
  for (const [id, m] of pins) {
    const p = a.places.find((x) => x.id === id);
    if (p) m.setIcon(pinIcon(p, a.pl === id));
  }
}

function prefStyle(f?: { properties?: { c?: string } }) {
  const c = f?.properties?.c;
  const a = applied!;
  if (c && c === a.pref) return PREF_STYLE.on;
  return a.places.some((p) => p.pref === c) ? PREF_STYLE.has : PREF_STYLE.base;
}

function sync(a: Applied) {
  const lf = L!;
  const m = map!;
  cluster!.clearLayers();
  pins.clear();
  /* choosing a spot in the place form: a clean map, so every tap lands */
  for (const p of a.picking ? [] : shown(a)) {
    const mk = lf.marker([p.lat, p.lng], {
      icon: pinIcon(p, a.pl === p.id),
      title: p.name,
      alt: p.name,
      keyboard: true,
    });
    mk.on('click', () => handlers.onPin(p.id));
    pins.set(p.id, mk);
    cluster!.addLayer(mk);
  }
  if (a.mode === 'near' && a.locOk && a.loc) {
    me ??= lf.marker([a.loc.lat, a.loc.lng], {
      icon: meIcon(a),
      zIndexOffset: 900,
      interactive: false,
    });
    me.setLatLng([a.loc.lat, a.loc.lng]);
    if (!m.hasLayer(me)) me.addTo(m);
  } else if (me && m.hasLayer(me)) m.removeLayer(me);
  if (a.picking && a.pickLat != null && a.pickLng != null) {
    pickMarker ??= lf.marker([a.pickLat, a.pickLng], {
      icon: pickIcon(lf),
      zIndexOffset: 2000,
      interactive: false,
    });
    pickMarker.setLatLng([a.pickLat, a.pickLng]);
    if (!m.hasLayer(pickMarker)) pickMarker.addTo(m);
  } else if (pickMarker && m.hasLayer(pickMarker)) m.removeLayer(pickMarker);
  if (a.mode === 'japan' && prefGeo) {
    prefLayer ??= lf.geoJSON(prefGeo as GeoJSON.GeoJsonObject, {
      style: prefStyle as Leaflet.StyleFunction,
      onEachFeature: (f: GeoJSON.Feature, layer) =>
        layer.on('click', () => handlers.onPref(String((f.properties as { c: string }).c))),
    });
    prefLayer.setStyle(prefStyle as Leaflet.StyleFunction);
    if (!m.hasLayer(prefLayer)) prefLayer.addTo(m);
  } else if (prefLayer && m.hasLayer(prefLayer)) m.removeLayer(prefLayer);
}

/* Leaflet drops a new view requested while a zoom animation is running (pick
   a prefecture, then quickly go back), so a view change asked for mid-
   animation waits for it. Only the latest request runs. */
let pendingView: (() => void) | null = null;
function afterZoom(fn: () => void) {
  const m = map!;
  if (!(m as unknown as { _animatingZoom?: boolean })._animatingZoom) return fn();
  if (!pendingView)
    m.once('zoomend', () => {
      const f = pendingView;
      pendingView = null;
      f?.();
    });
  pendingView = fn;
}
function fit(a: Applied) {
  afterZoom(() => fitNow(applied ?? a));
}
function fitNow(a: Applied) {
  const m = map!;
  const lf = L!;
  if (a.mode === 'near') {
    const r = ref(a);
    const pts = shown(a)
      .slice(0, 8)
      .map((p) => lf.latLng(p.lat, p.lng))
      .concat([lf.latLng(r.lat, r.lng)]);
    m.fitBounds(lf.latLngBounds(pts).pad(0.15), { maxZoom: 16 });
  } else if (a.pref) {
    let b: [[number, number], [number, number]] | null = null;
    prefLayer?.eachLayer((l) => {
      const f = (l as Leaflet.Polygon).feature as
        GeoJSON.Feature<PrefGeometry, { c: string }> | undefined;
      if (f?.properties.c === a.pref) b = mainBounds(f.geometry);
    });
    const pts = shown(a).map((p) => lf.latLng(p.lat, p.lng));
    if (b) m.fitBounds(b, { padding: [8, 8] });
    else if (pts.length) m.fitBounds(lf.latLngBounds(pts).pad(0.2), { maxZoom: 14 });
    else m.fitBounds(JAPAN_BOUNDS);
  } else m.fitBounds(JAPAN_BOUNDS);
}

/** For the browser tests only (exposed by src/e2e.ts in e2e builds). */
export const inspect = () => ({ map, container, prefLayer, me, created: stats.created });
