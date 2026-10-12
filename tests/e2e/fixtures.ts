import { test as base, expect, type Page } from '@playwright/test';

/* Tiles come from OpenStreetMap; answer them locally so the map settles the
   same way everywhere. Every test also fails on a page error, a console error
   or a CSP violation. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export const test = base.extend<{ badTiles: boolean; errors: string[] }>({
  badTiles: [false, { option: true }],
  serviceWorkers: 'block',
  acceptDownloads: true,
  errors: async ({ page, context, badTiles }, use) => {
    await context.route('https://tile.openstreetmap.org/**', (r) =>
      badTiles
        ? r.fulfill({ status: 503, body: '' })
        : r.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
    );
    await context.addInitScript(() => {
      (window as unknown as { __csp: string[] }).__csp = [];
      document.addEventListener('securitypolicyviolation', (e) =>
        (window as unknown as { __csp: string[] }).__csp.push(
          `${e.violatedDirective} ${e.blockedURI}`,
        ),
      );
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/status of 503/.test(m.text())) errors.push(m.text());
    });
    await use(errors);
    const csp = await page
      .evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])
      .catch(() => []);
    expect([...errors, ...csp.map((c) => 'CSP ' + c)]).toEqual([]);
  },
});
export { expect };

type Handle = {
  route: { get(): { route: { name: string; lid?: string } } };
  prefs: { get(): { lang: string } };
  collection: { get(): { cg: Record<string, true> } };
  location: { get(): { state: string } };
  mapUi: { get(): { mode: string; pref: string | null; tileFail: boolean } };
  data: {
    get(): { status: string; places: { id: number; name: string; description: string }[] };
    set(p: { places: unknown[] }): void;
  };
  map(): {
    map: L.Map | null;
    container: HTMLElement | null;
    prefLayer: L.GeoJSON | null;
    me: L.Marker | null;
    created: number;
  };
};
declare global {
  interface Window {
    __yunabi: Handle;
  }
}
/** Runs fn in the page with the app's test handle. */
export async function y<R>(p: Page, fn: (y: Handle) => R): Promise<R> {
  await p.waitForFunction(() => !!window.__yunabi);
  return p.evaluate(`(${fn.toString()})(window.__yunabi)`) as Promise<R>;
}
export const mapReady = (p: Page) =>
  p.waitForFunction(() => !!window.__yunabi?.map().container?.isConnected);
export const tap = (p: Page, sel: string) => p.locator(sel).first().click();
