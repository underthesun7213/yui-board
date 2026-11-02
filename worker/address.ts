/* A long link the phone app's Share leads to often has no position, only the
   place's address (ADR-0027 §5):
     ?q=〒573-1196 Osaka, Hirakata, Nakamiyahonmachi, 4−9 ちゃんぽん亭 豊助
     ?q=Mandai Hirakata, … 2 Chome-46-3 Nishikinya, Hirakata, Osaka 573-1192
   The postal code names the town in Japanese (zipcloud), the block numbers
   are taken as written, and the GSI address search (国土地理院) turns
   "大阪府枚方市西禁野2-46-3" into the point of that block. Both services are
   free, keyless and Japanese; only the address in the link is sent. */
import type { LatLngPair } from '../src/domain/maps-coords';

/** the text of the place in a long link: its q=, or the /maps/place/<…>/ part */
export function placeText(long: string): string | null {
  let u: URL;
  try {
    u = new URL(long);
  } catch {
    return null;
  }
  const q = u.searchParams.get('q') ?? u.searchParams.get('query');
  if (q) return q;
  const m = /\/maps\/place\/([^/]+)/.exec(u.pathname);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]!.replace(/\+/g, ' '));
  } catch {
    return null;
  }
}

const tidy = (s: string) =>
  s
    .normalize('NFKC')
    .replace(/[‐‑‒–—―−ｰー]/g, '-')
    .replace(/\s+/g, ' ');

/** "573-1196" in the text, or null */
export function zipOf(text: string): string | null {
  const m = /(?<!\d)(\d{3})-(\d{4})(?!\d)/.exec(tidy(text));
  return m ? m[1]! + m[2]! : null;
}

/** the block numbers, as "2-46-3": "2 Chome-46-3", "2丁目46-3", "4-9" */
export function blockOf(text: string): string | null {
  const s = tidy(text).replace(/(?<!\d)\d{3}-\d{4}(?!\d)/g, ' ');
  const m =
    /(\d{1,3}) ?chome[ -]*(\d{1,4})(?:-(\d{1,4}))?/i.exec(s) ??
    /(\d{1,3})丁目 ?(\d{1,4})(?:番地?|-)? ?(\d{1,4})?/.exec(s) ??
    /(?<![\d-])(\d{1,4})-(\d{1,4})(?:-(\d{1,4}))?(?![\d-])/.exec(s);
  return m ? [m[1], m[2], m[3]].filter(Boolean).join('-') : null;
}

/* a fresh timeout per request: one made at load would run out for all of them */
const T = () => ({ signal: AbortSignal.timeout(4000) });

interface Town {
  address1: string;
  address2: string;
  address3: string;
}

async function towns(zip: string): Promise<Town[]> {
  const r = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`, T());
  if (!r.ok) return [];
  const j = (await r.json()) as { results?: Town[] | null };
  return (j.results ?? []).filter((t) => t.address1 && t.address2 && t.address3).slice(0, 3);
}

async function gsi(address: string, mustHave: string): Promise<LatLngPair | null> {
  const r = await fetch(
    `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`,
    T(),
  );
  if (!r.ok) return null;
  const hits = (await r.json()) as {
    geometry?: { coordinates?: [number, number] };
    properties?: { title?: string };
  }[];
  for (const h of Array.isArray(hits) ? hits.slice(0, 5) : []) {
    const [lng, lat] = h.geometry?.coordinates ?? [];
    const title = (h.properties?.title ?? '').normalize('NFKC');
    if (typeof lat === 'number' && typeof lng === 'number' && title.includes(mustHave))
      return { lat, lng };
  }
  return null;
}

/** the point of the address a long link names, or null; throws when a service is down */
export async function pairFromAddress(long: string): Promise<LatLngPair | null> {
  const text = placeText(long);
  if (!text) return null;
  const block = blockOf(text);
  if (!block) return null;
  const zip = zipOf(text);
  if (zip) {
    for (const t of await towns(zip)) {
      const at = await gsi(t.address1 + t.address2 + t.address3 + block, t.address2 + t.address3);
      if (at) return at;
    }
    return null;
  }
  /* no postal code: an address already written in Japanese, as GSI wants it */
  const ja = /[^\s,、]*?[都道府県市区町村郡][^\s,、]*?(?=\d)/.exec(tidy(text));
  return ja ? gsi(ja[0] + block, ja[0].replace(/^.{2,3}?[都道府県]/, '')) : null;
}
