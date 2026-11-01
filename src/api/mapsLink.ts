/* The app's own Worker (worker/index.ts, ADR-0027): where a maps.app.goo.gl
   link leads. Same origin, so the CSP's connect-src 'self' covers it. */
export type LinkAnswer =
  { status: 'ok'; lat: number; lng: number } | { status: 'none' | 'invalid' | 'limit' | 'fail' };

export async function expandShortLink(u: string): Promise<LinkAnswer> {
  try {
    const r = await fetch(`/api/maps-link?u=${encodeURIComponent(u)}`, {
      headers: { accept: 'application/json' },
    });
    if (!(r.headers.get('content-type') ?? '').includes('application/json'))
      return { status: 'fail' };
    const a = (await r.json()) as LinkAnswer;
    if (a.status === 'ok' && Number.isFinite(a.lat) && Number.isFinite(a.lng)) return a;
    return a.status === 'ok' ? { status: 'fail' } : a;
  } catch {
    return { status: 'fail' };
  }
}
