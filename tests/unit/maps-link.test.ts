import { afterEach, describe, expect, it, vi } from 'vitest';
import { LONG_LINK, SHORT_LINK, pairFromLink, pairFromText } from '../../src/domain/maps-coords';
import worker, { mapsLink } from '../../worker/index';

/* The long links below are the shapes maps.app.goo.gl answered with in
   November 2026 (place, route, and a phone share without a position). */
const PLACE =
  'https://www.google.com/maps/place/Park%27s+Inn/@33.5708898,-98.1173305,10z/data=!4m9!3m8!1s0x865280b963143181:0x27427fb05da544ea!5m2!4m1!1i2!8m2!3d33.5633544!4d-97.8578567!16s%2Fg%2F1tf9t7b6?entry=tts';
const ROUTE =
  'https://www.google.com/maps/dir/Pantheon/Vatican+City/@41.9104795,12.4867194,14.25z/am=t/data=!4m13!1m5!1m1!1s0x1:0x2!2m2!1d12.4768729!2d41.8986108';
const NO_POS =
  'https://www.google.com/maps/place/Somewhere/data=!4m2!3m1!1s0x477f322085032267:0x971009d62c31f087?utm_source=mstt_1&entry=gps';

describe('pairFromText', () => {
  it('reads what Google Maps copies from a long press', () => {
    expect(pairFromText('34.8244, 135.6525')).toEqual({ lat: 34.8244, lng: 135.6525 });
    expect(pairFromText(' 34.8244,135.6525 ')).toEqual({ lat: 34.8244, lng: 135.6525 });
    expect(pairFromText('34.8244 135.6525')).toEqual({ lat: 34.8244, lng: 135.6525 });
    expect(pairFromText('３４．８２４４，１３５．６５２５')).toEqual({
      lat: 34.8244,
      lng: 135.6525,
    });
    expect(pairFromText('-33.8, 150.7')).toEqual({ lat: -33.8, lng: 150.7 });
  });
  it('refuses anything else', () => {
    for (const s of ['', '34.8', '95, 10', '10, 190', '0, 0', 'abc, def', '34.8, 135.6, 1'])
      expect(pairFromText(s)).toBeNull();
  });
});

describe('pairFromLink', () => {
  it("takes the place's own pin before the screen's centre", () => {
    expect(pairFromLink(PLACE)).toEqual({ lat: 33.5633544, lng: -97.8578567 });
  });
  it('falls back to @lat,lng', () => {
    expect(pairFromLink(ROUTE)).toEqual({ lat: 41.9104795, lng: 12.4867194 });
  });
  it('reads q= and query=', () => {
    expect(pairFromLink('https://maps.google.com/?q=34.81,135.65')).toEqual({
      lat: 34.81,
      lng: 135.65,
    });
    expect(pairFromLink('https://www.google.com/maps/search/?api=1&query=34.81%2C135.65')).toEqual({
      lat: 34.81,
      lng: 135.65,
    });
  });
  it('finds nothing in a share link without a position', () => {
    expect(pairFromLink(NO_POS)).toBeNull();
  });
});

describe('link shapes', () => {
  it('knows a short link', () => {
    expect(SHORT_LINK.test('https://maps.app.goo.gl/RvL7iSNSsNaVBRru8')).toBe(true);
    expect(SHORT_LINK.test('https://maps.app.goo.gl/RvL7iSNSsNaVBRru8?g_st=ic')).toBe(true);
    for (const u of [
      'http://maps.app.goo.gl/RvL7iSNSsNaVBRru8',
      'https://maps.app.goo.gl.evil.com/RvL7iSNSsNaVBRru8',
      'https://maps.app.goo.gl/../x',
      'https://evil.com/?https://maps.app.goo.gl/abcd',
    ])
      expect(SHORT_LINK.test(u)).toBe(false);
  });
  it('knows where a short link may lead', () => {
    expect(LONG_LINK.test(PLACE)).toBe(true);
    expect(LONG_LINK.test('https://maps.google.com/maps?cid=1')).toBe(true);
    expect(LONG_LINK.test('https://www.google.com.evil.com/maps')).toBe(false);
    expect(LONG_LINK.test('https://consent.google.com/ml?continue=x')).toBe(false);
  });
});

describe('the Worker', () => {
  afterEach(() => vi.unstubAllGlobals());
  const env = (ok = true) => ({
    ASSETS: { fetch: vi.fn(async () => new Response('app')) },
    LINKS: { limit: vi.fn(async () => ({ success: ok })) },
  });
  const ask = (u: string, e = env()) =>
    mapsLink(new Request(`https://yunabi.juha.dev/api/maps-link?u=${encodeURIComponent(u)}`), e);
  const redirect = (to: string) =>
    vi.fn(async () => new Response(null, { status: 302, headers: { location: to } }));

  it('turns a short link into the place', async () => {
    const f = redirect(PLACE);
    vi.stubGlobal('fetch', f);
    const r = await ask('https://maps.app.goo.gl/RvL7iSNSsNaVBRru8?g_st=ic');
    expect(await r.json()).toEqual({ status: 'ok', lat: 33.5633544, lng: -97.8578567 });
    expect(r.headers.get('cache-control')).toBe('no-store');
    /* only goo.gl itself is asked, and the query is not passed on */
    expect(f).toHaveBeenCalledTimes(1);
    expect((f.mock.calls[0] as unknown[])[0]).toBe('https://maps.app.goo.gl/RvL7iSNSsNaVBRru8');
  });
  it('says none when the long link has no position', async () => {
    vi.stubGlobal('fetch', redirect(NO_POS));
    expect(await (await ask('https://maps.app.goo.gl/91jma2zHp9mWgG6M6')).json()).toEqual({
      status: 'none',
    });
  });
  it('does not follow a redirect off Google Maps', async () => {
    const f = redirect('https://evil.example/?@34.8,135.6');
    vi.stubGlobal('fetch', f);
    expect(await (await ask('https://maps.app.goo.gl/abcd1234')).json()).toEqual({
      status: 'none',
    });
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('fetches nothing for a link that is not a short one', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    for (const u of ['https://evil.example/', 'https://www.google.com/maps/@1,2', ''])
      expect((await ask(u)).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it('stops a caller past the limit', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const r = await ask('https://maps.app.goo.gl/abcd1234', env(false));
    expect(r.status).toBe(429);
    expect(f).not.toHaveBeenCalled();
  });
  it('reports a failed fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('down');
      }),
    );
    expect((await ask('https://maps.app.goo.gl/abcd1234')).status).toBe(502);
  });
  it('leaves every other path to the assets', async () => {
    const e = env();
    const r = await worker.fetch(new Request('https://yunabi.juha.dev/map'), e);
    expect(await r.text()).toBe('app');
    expect((await worker.fetch(new Request('https://yunabi.juha.dev/api/x'), e)).status).toBe(404);
  });
});
