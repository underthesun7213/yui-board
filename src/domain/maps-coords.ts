/* Where a pasted Google Maps link or a pair of numbers puts the pin (Y-BL-02).
   Pure, shared by the place form and the link Worker (worker/index.ts).

   - "34.8244, 135.6525": what Google Maps copies from a long press (phone) or
     a right click (computer).
   - A long link: `!3d<lat>!4d<lng>` is the place itself and comes first;
     `@<lat>,<lng>` is only where the screen was centred, so it is the last
     resort; `q=`, `query=`, `ll=` and `center=` carry a pair as well.
   - A short link (maps.app.goo.gl, the phone app's Share) has no position in
     it: the Worker opens it and reads the long link it leads to. */

export interface LatLngPair {
  lat: number;
  lng: number;
}

const NUM = String.raw`[-+]?\d{1,3}(?:\.\d+)?`;
const PAIR = new RegExp(String.raw`^\s*(${NUM})\s*[,，、 ]\s*(${NUM})\s*$`);

function ok(lat: number, lng: number): LatLngPair | null {
  return Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
    ? { lat, lng }
    : null;
}

/** "34.8244, 135.6525" (a space or a Japanese comma also works), or null */
export function pairFromText(s: string): LatLngPair | null {
  const m = PAIR.exec(s.normalize('NFKC'));
  return m ? ok(Number(m[1]), Number(m[2])) : null;
}

/** the position a long Google Maps link carries, or null */
export function pairFromLink(u: string): LatLngPair | null {
  let s = u;
  try {
    s = decodeURIComponent(u);
  } catch {
    /* a stray % — read it as it is */
  }
  /* the place's own pin: the last !3d…!4d… pair (a route lists its stops first) */
  const pins = [...s.matchAll(new RegExp(String.raw`!3d(${NUM})!4d(${NUM})`, 'g'))];
  const pin = pins.at(-1);
  if (pin) return ok(Number(pin[1]), Number(pin[2]));
  const param = new RegExp(String.raw`[?&](?:q|query|ll|center|destination)=(${NUM}),\s*(${NUM})`);
  const p = param.exec(s);
  if (p) return ok(Number(p[1]), Number(p[2]));
  const at = new RegExp(String.raw`/@(${NUM}),(${NUM})`).exec(s);
  return at ? ok(Number(at[1]), Number(at[2])) : null;
}

/** a link from the phone app's Share: maps.app.goo.gl/<id>, maybe with ?g_st=… */
export const SHORT_LINK =
  /^https:\/\/maps\.app\.goo\.gl\/([A-Za-z0-9_-]{4,64})\/?(?:\?[\w.=&-]{0,120})?$/;

/** where the long links a short one leads to may point: Google Maps only */
export const LONG_LINK = /^https:\/\/(?:www\.|maps\.)?google\.(?:com|co\.jp)\/(?:maps)?[/?#]?/;
