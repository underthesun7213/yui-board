import type { LatLng } from '../domain/types';

export type GeoResult = { ok: true; loc: LatLng } | { ok: false; denied: boolean };

export function getPosition(): Promise<GeoResult> {
  return new Promise((done) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation)
      return done({ ok: false, denied: false });
    navigator.geolocation.getCurrentPosition(
      (p) => done({ ok: true, loc: { lat: p.coords.latitude, lng: p.coords.longitude } }),
      (e) => done({ ok: false, denied: e.code === 1 }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}
