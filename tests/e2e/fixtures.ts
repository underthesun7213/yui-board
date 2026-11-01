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

/* Opens a screen by its path. Once the app is loaded this is a step inside
   it (pushState and popstate, as system back and forward make), so what the
   test set up in the page stays, as it did with hash links; the first visit
   loads the page. */
export async function go(page: Page, path: string) {
  const loaded = await page
    .evaluate(() => !!(window as unknown as { __yunabi?: unknown }).__yunabi)
    .catch(() => false);
  if (!loaded) {
    await page.goto('./' + path);
    return;
  }
  await page.evaluate((p) => {
    history.pushState(null, '', '/' + p);
    dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

type Handle = {
  route: { get(): { route: { name: string; lid?: string } } };
  prefs: { get(): { lang: string } };
  collection: { get(): { cg: Record<string, true> } };
  yuki: { set(p: { step: 'end' }): void };
  sbSettle(won: boolean): void;
  location: { get(): { state: string; refreshing: boolean } };
  mapUi: {
    get(): {
      mode: string;
      pref: string | null;
      tileFail: boolean;
      pick: { lat: number; lng: number } | null;
    };
  };
  data: {
    get(): {
      status: string;
      places: { id: number; name: string; description: string }[];
      overrides: unknown[];
      version: number | null;
    };
    set(p: { places: unknown[] }): void;
  };
  /** state/data.ts setData: replaces the data and rebuilds the schedule. Pass the
      current version, or the next screen change reads the fixtures again. */
  setData(
    places: unknown[],
    events: unknown[],
    overrides: unknown[],
    fetchedAt: string,
    version: number | null,
  ): void;
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
