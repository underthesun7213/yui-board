// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

/* A Leaflet stand-in that records what the runtime does. fitBounds moves the
   view to zoom 5, so a restored view is easy to tell from a fresh fit. */
const rec = vi.hoisted(() => ({ map: 0, fit: 0, setView: 0, z: 0, c: { lat: 0, lng: 0 } }));
vi.mock('leaflet', () => {
  const layer = () => {
    const l = {
      addTo: () => l,
      on: () => l,
      setIcon: () => l,
      setLatLng: () => l,
      setStyle: () => l,
      eachLayer: () => {},
    };
    return l;
  };
  const L = {
    map: () => {
      rec.map++;
      return {
        invalidateSize() {},
        getCenter: () => rec.c,
        getZoom: () => rec.z,
        setView: (c: { lat: number; lng: number } | [number, number], z: number) => {
          rec.setView++;
          rec.z = z;
          rec.c = Array.isArray(c) ? { lat: c[0], lng: c[1] } : c;
        },
        fitBounds: () => {
          rec.fit++;
          rec.z = 5;
        },
        once() {},
        addLayer() {},
        hasLayer: () => false,
        removeLayer() {},
      };
    },
    control: { zoom: () => ({ addTo() {} }) },
    tileLayer: layer,
    marker: layer,
    geoJSON: layer,
    divIcon: (o: unknown) => o,
    latLng: (lat: number, lng: number) => ({ lat, lng }),
    latLngBounds: () => ({ pad: () => ({}) }),
    markerClusterGroup: () => ({ clearLayers() {}, addLayer() {} }),
  };
  return { default: L };
});
vi.mock('leaflet.markercluster', () => ({}));

const rt = await import('../../src/map/runtime');
const { mapUi } = await import('../../src/state/mapUi');
const { data, setData } = await import('../../src/state/data');

const slot = () => {
  const el = document.createElement('div');
  document.body.append(el);
  return el;
};
const has = (el: HTMLElement) => !!el.querySelector('#lmap');
const zoomTo = (z: number) => {
  rec.z = z;
  rec.c = { lat: z, lng: z };
};
const place = {
  id: 1,
  name: 'a',
  category: 'daily',
  description: '',
  gmaps_url: null,
  lat: 34.82,
  lng: 135.65,
  pref: '27',
  lang: 'en',
  created_on: '2026-09-01',
  edited_on: null,
} as const;

describe('map runtime', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('creates L.map once across StrictMode attach → detach → attach', async () => {
    const a = slot();
    const p1 = rt.attach(a);
    rt.detach(a);
    const p2 = rt.attach(a);
    await Promise.all([p1, p2]);
    expect(rec.map).toBe(1);
    expect(has(a)).toBe(true);
    rt.detach(a);
  });

  it('does not attach when detached while Leaflet was loading', async () => {
    const a = slot();
    const p = rt.attach(a);
    rt.detach(a);
    await p;
    expect(has(a)).toBe(false);
  });

  it('does not let an old slot detach the new one', async () => {
    const a = slot();
    const b = slot();
    await rt.attach(a);
    await rt.attach(b);
    rt.detach(a);
    expect(has(b)).toBe(true);
    expect(rec.map).toBe(1);
    rt.detach(b);
  });

  it('follows the stores while attached and only then', async () => {
    const a = slot();
    await rt.attach(a);
    const before = rt.stats.syncs;
    mapUi.set((s) => ({ fitSeq: s.fitSeq + 1 }));
    expect(rt.stats.syncs).toBe(before + 1);
    rt.detach(a);
    mapUi.set((s) => ({ fitSeq: s.fitSeq + 1 }));
    expect(rt.stats.syncs).toBe(before + 1);
    await rt.attach(a);
    expect(rt.stats.syncs).toBe(before + 2);
    rt.detach(a);
  });

  it('returns each mode to where it was last left, every round trip', async () => {
    const a = slot();
    await rt.attach(a);
    mapUi.set({ mode: 'near' });
    zoomTo(15);
    mapUi.set({ mode: 'japan' }); // first visit: fits
    expect(rec.z).toBe(5);
    zoomTo(8);
    mapUi.set({ mode: 'near' });
    expect(rec.z).toBe(15);
    zoomTo(18);
    mapUi.set({ mode: 'japan' });
    expect(rec.z).toBe(8);
    zoomTo(9);
    mapUi.set({ mode: 'near' });
    expect(rec.z).toBe(18);
    mapUi.set({ mode: 'japan' });
    expect(rec.z).toBe(9);
    rt.detach(a);
  });

  it('saves the view of a mode left while the map was off screen', async () => {
    const a = slot();
    await rt.attach(a);
    mapUi.set({ mode: 'japan' });
    zoomTo(7);
    rt.detach(a);
    mapUi.set({ mode: 'near' }); // D14 on the way back to the map
    await rt.attach(a);
    mapUi.set({ mode: 'japan' });
    expect(rec.z).toBe(7);
    rt.detach(a);
  });

  it('fits when places arrive after the map, and not for a pin selection', async () => {
    mapUi.set({ mode: 'near', pl: null });
    setData([], [], [], 'x');
    const a = slot();
    await rt.attach(a);
    zoomTo(16);
    const fits = rec.fit;
    setData([place], [], [], 'y');
    expect(rec.fit).toBe(fits + 1);
    zoomTo(12);
    const after = rec.fit;
    mapUi.set({ pl: 1 });
    expect(rec.fit).toBe(after);
    expect(rec.z).toBe(15); // pans to the pin at street level
    expect(data.get().places).toHaveLength(1);
    rt.detach(a);
  });
});
