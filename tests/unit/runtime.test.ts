// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

/* A Leaflet stand-in that records what the runtime does. */
const calls = vi.hoisted(() => ({ map: 0, fit: 0, setView: 0 }));
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
      calls.map++;
      const m = {
        invalidateSize() {},
        getCenter: () => ({ lat: 0, lng: 0 }),
        getZoom: () => 10,
        setView: () => void calls.setView++,
        fitBounds: () => void calls.fit++,
        addLayer() {},
        hasLayer: () => false,
        removeLayer() {},
      };
      return m;
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

const slot = () => {
  const el = document.createElement('div');
  document.body.append(el);
  return el;
};
const has = (el: HTMLElement) => !!el.querySelector('#lmap');

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
    expect(calls.map).toBe(1);
    expect(has(a)).toBe(true);
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
    expect(calls.map).toBe(1);
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
  });
});
