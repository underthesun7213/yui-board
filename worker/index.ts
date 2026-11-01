/* The user app's Worker (ADR-0027): it serves the built app from its static
   assets and answers one question the browser cannot ask itself — where does
   a maps.app.goo.gl link lead? (CORS keeps a page from following another
   site's redirect.) Only /api/* reaches this code (run_worker_first in
   wrangler.app.jsonc); every other request goes straight to the assets.

   GET /api/maps-link?u=https://maps.app.goo.gl/<id>
     → { status: 'ok', lat, lng } | { status: 'none' } | { status: 'invalid' }
       | { status: 'limit' } (429) | { status: 'fail' } (502)

   It is not an open proxy: only a maps.app.goo.gl link is fetched, without
   following redirects, and only the Location it answers with is read — never
   a page — and only when that is a Google Maps link. Nothing is stored or
   logged; the link itself is all the person sends. */
import { LONG_LINK, SHORT_LINK, pairFromLink } from '../src/domain/maps-coords';

interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  /** Workers rate limiting binding: per person, so a script cannot use us to hammer Google */
  LINKS?: { limit(o: { key: string }): Promise<{ success: boolean }> };
}

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });

/** the long link a short one points to, or null; at most two hops, Google only */
async function expand(id: string): Promise<string | null> {
  let url = `https://maps.app.goo.gl/${id}`;
  for (let hop = 0; hop < 2; hop++) {
    const r = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; yunabi-maps-link)' },
    });
    const to = r.headers.get('location');
    if (r.status < 300 || r.status > 399 || !to) return null;
    const next = new URL(to, url).href;
    if (LONG_LINK.test(next)) return next;
    /* goo.gl may hand over to itself once (an old link) */
    if (!next.startsWith('https://maps.app.goo.gl/') && !next.startsWith('https://goo.gl/maps/'))
      return null;
    url = next;
  }
  return null;
}

export async function mapsLink(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'GET') return json({ status: 'invalid' }, 405);
  const u = new URL(req.url).searchParams.get('u') ?? '';
  const m = SHORT_LINK.exec(u);
  if (!m) return json({ status: 'invalid' }, 400);
  if (env.LINKS) {
    const who = req.headers.get('cf-connecting-ip') ?? 'unknown';
    if (!(await env.LINKS.limit({ key: who })).success) return json({ status: 'limit' }, 429);
  }
  let long: string | null;
  try {
    long = await expand(m[1]!);
  } catch {
    return json({ status: 'fail' }, 502);
  }
  if (!long) return json({ status: 'none' });
  const at = pairFromLink(long);
  return json(at ? { status: 'ok', lat: at.lat, lng: at.lng } : { status: 'none' });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const path = new URL(req.url).pathname;
    if (path === '/api/maps-link') return mapsLink(req, env);
    if (path.startsWith('/api/')) return json({ status: 'invalid' }, 404);
    return env.ASSETS.fetch(req);
  },
};
