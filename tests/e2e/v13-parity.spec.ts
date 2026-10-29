/* The v1.3 browser checks (docs/08-qa/legacy/v1.3-browser-checks.js), ported.
   Y-1 is done when this file passes (RFC-0003 §19.1). IDs: PRD-MLP ML-*, PRD-YUNABI Y-*. */
import { readFileSync } from 'node:fs';
import { expect, mapReady, tap, test, y } from './fixtures';

const DORM = { latitude: 34.8252, longitude: 135.653 };

test.describe('home, tabs, language, back', () => {
  test('ML-01 home is the first screen with three cards and four tabs; no board leftovers', async ({
    page,
    errors,
  }) => {
    void errors;
    await page.goto('./');
    await expect(page.locator('.hcard')).toHaveCount(3);
    await expect(page.locator('.tabbar button')).toHaveCount(4);
    await expect(page.locator('#boards, .fab, #raflag, #profbtn')).toHaveCount(0);
  });

  test('ML-02 home card → learn, ‹ and OS back', async ({ page, errors }) => {
    void errors;
    await page.goto('./');
    await tap(page, '.hcard.jp');
    await expect(page.locator('.lesson')).toHaveCount(8);
    await tap(page, '[data-lesson="l1"]');
    /* two comic pages of four panels (Y-J1), each with its artwork as a
       full-screen button, and a play button per recorded line (D35) */
    await expect(page.locator('.cpage')).toHaveCount(2);
    await expect(page.locator('.panels li')).toHaveCount(8);
    await expect(page.locator('[data-zoom]')).toHaveCount(2);
    await expect(page.locator('.panels .say')).toHaveCount(8);
    await tap(page, '.bar .back');
    await expect(page.locator('.lesson')).toHaveCount(8);
    await page.goBack();
    await expect(page.locator('.hcard')).toHaveCount(3);
  });

  test('Y-B3 language is remembered and labels follow it', async ({ page, errors }) => {
    void errors;
    await page.goto('./');
    await tap(page, '.globe');
    await tap(page, '[data-l="ko"]');
    /* the Korean strings load first; the choice is saved once they are in */
    await page.waitForFunction(() => document.documentElement.lang === 'ko');
    await page.reload();
    expect(await y(page, (a) => a.prefs.get().lang)).toBe('ko');
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('ko');
    await expect(page.locator('[aria-label="Language"],[aria-label="Previous month"]')).toHaveCount(
      0,
    );
  });

  test('ML-03 menu closes on a tap outside and the tap still lands', async ({ page, errors }) => {
    void errors;
    await page.goto('./');
    await tap(page, '.globe');
    await expect(page.locator('.langmenu')).toBeVisible();
    await page.mouse.click(200, 400);
    await expect(page.locator('.langmenu')).toBeHidden();
  });

  test('ML-04 reload keeps the screen; re-tapping a tab adds one entry; old shortcuts', async ({
    page,
    errors,
  }) => {
    void errors;
    await page.goto('./');
    await tap(page, '[data-t="1"]');
    await tap(page, '[data-lesson="l2"]');
    await page.reload();
    expect(await y(page, (a) => a.route.get().route)).toEqual({ name: 'lesson', lid: 'l2' });
    const n0 = await page.evaluate(() => history.length);
    for (let i = 0; i < 3; i++) await tap(page, '[data-t="0"]');
    expect(await page.evaluate(() => history.length)).toBe(n0 + 1);
    await page.goto('./?v=map');
    expect(await y(page, (a) => a.route.get().route.name)).toBe('map');
    expect(await page.evaluate(() => location.search)).toBe('');
    expect(await page.evaluate(() => location.hash)).toBe('#/map');
    await page.goto('./?tab=1');
    expect(await y(page, (a) => a.route.get().route.name)).toBe('cal');
    await page.goto('./?compose=1');
    expect(await y(page, (a) => a.route.get().route.name)).toBe('home');
  });

  test('ML-14 a tap opens a screen at the top; system back keeps the scroll', async ({
    page,
    errors,
  }) => {
    void errors;
    await page.goto('./#/learn');
    await expect(page.locator('.lesson')).toHaveCount(8);
    await page.evaluate(() => scrollTo(0, 245));
    await tap(page, '[data-lesson="l5"]');
    await expect(page.locator('.cpage').first()).toBeVisible();
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await page.goBack();
    await expect(page.locator('.lesson')).toHaveCount(8);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(200);
  });

  test('Y-C hash links open their screen', async ({ page, errors }) => {
    void errors;
    await page.goto('./#/learn/collection');
    await expect(page.locator('.cgrid')).toBeVisible();
    await tap(page, '.bar .back');
    await expect(page.locator('.lesson')).toHaveCount(8);
  });
});

test.describe('game and collection', () => {
  test('ML-05 playing episode 8 collects a card that survives reload', async ({ page, errors }) => {
    void errors;
    await page.goto('./#/learn/l8');
    await tap(page, '[data-route="osaka"]');
    /* play to the end however many scenes the route has: a reply, a walk, the
       smart-ball match, and the 유우키 미니게임 (its own test plays it; here it skips
       to the bill) */
    for (let i = 0; i < 20 && !(await page.locator('.vnend').count()); i++) {
      /* the game's chunk loads on first use: wait for the scene to show */
      await page
        .locator('.yk, .vnwrap > .opts, [data-ball], [data-next], .vnend')
        .first()
        .waitFor();
      if (await page.locator('.vnend').count()) break;
      if (await page.locator('.yk').count()) {
        await y(page, (a) => a.yuki.set({ step: 'end' }));
        await tap(page, '[data-yk="done"]');
        continue;
      }
      if (await page.locator('.vnwrap > .opts').count()) await tap(page, '[data-opt="0"]');
      if (await page.locator('[data-ball]').count()) await tap(page, '[data-ball]');
      await tap(page, '[data-next]');
    }
    await expect(page.locator('.vnend')).toHaveCount(1);
    await expect(page.locator('.toast.on')).toHaveCount(1);
    await page.reload();
    expect(Object.keys(await y(page, (a) => a.collection.get().cg)).length).toBeGreaterThanOrEqual(
      1,
    );
    await page.goto('./#/learn/collection');
    await expect(page.locator('.card:not(.lock)')).toHaveCount(1);
  });
});

test.describe('calendar', () => {
  test('ML-06 real date, weekly override, .ics file, back', async ({ page, errors }) => {
    void errors;
    await page.goto('./#/cal');
    const today = await page.evaluate(() =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()),
    );
    await expect(page.locator(`.cell.today[data-d="${today}"]`)).toHaveCount(1);
    await page.goto('./#/cal/event/4/2026-09-22');
    await expect(page.locator('.evwrap h1')).toHaveText('GIP: Karaoke Night');
    const [dl] = await Promise.all([page.waitForEvent('download'), tap(page, '[data-ics]')]);
    const ics = readFileSync((await dl.path())!, 'utf8');
    expect(ics).toContain('BEGIN:VTIMEZONE');
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics.split('\r\n').every((l) => Buffer.byteLength(l) <= 75)).toBe(true);
    await tap(page, '.bar .back');
    expect(await y(page, (a) => a.route.get().route.name)).toBe('cal');
  });

  test('Y-K a cancelled week and a missing date say there is nothing', async ({ page, errors }) => {
    void errors;
    await page.goto('./#/cal/event/4/2026-10-20');
    await expect(page.locator('.empty')).toHaveCount(1);
  });
});

test.describe('map', () => {
  test.use({ geolocation: DORM, permissions: ['geolocation'] });

  test('ML-07 notice before location; allow; survives language change and tab round trip; card', async ({
    page,
    errors,
  }) => {
    void errors;
    await page.goto('./#/map');
    await mapReady(page);
    await expect(page.locator('[data-loc="use"]')).toHaveCount(1);
    expect(await y(page, (a) => a.location.get().state)).toBe('ask');
    await tap(page, '[data-loc="use"]');
    await page.waitForFunction(() => window.__yunabi.location.get().state === 'ok');
    await expect(page.locator('.mew')).toHaveCount(1);
    expect(await page.locator('.plist .pmin').count()).toBeGreaterThan(0);
    await tap(page, '.globe');
    await tap(page, '[data-l="ja"]');
    expect(
      await y(
        page,
        (a) =>
          !!a.map().container?.isConnected && !!a.map().container?.querySelector('.leaflet-pane'),
      ),
    ).toBe(true);
    await tap(page, '[data-t="0"]');
    await tap(page, '[data-t="2"]');
    await mapReady(page);
    expect(await y(page, (a) => a.map().created)).toBe(1);
    expect(await page.locator('.leaflet-container').count()).toBe(1);
    await tap(page, '[data-pl]');
    await expect(page.locator('.pcard')).toHaveCount(1);
  });

  test('ML-08 all of Japan: 47 shapes, Osaka places, Tokyo empty, tapping a shape', async ({
    page,
    errors,
  }) => {
    void errors;
    await page.goto('./#/map');
    await mapReady(page);
    await tap(page, '[data-mode="japan"]');
    await page.waitForFunction(() => !!window.__yunabi.map().prefLayer);
    expect(await y(page, (a) => a.map().prefLayer!.getLayers().length)).toBe(47);
    await expect(page.locator('.preflist button')).toHaveCount(47);
    await tap(page, '[data-pref="27"]');
    await expect(page.locator('.plist [data-pl]')).toHaveCount(13);
    await tap(page, '.prefbar [data-pref=""]');
    await tap(page, '[data-pref="13"]');
    await expect(page.locator('.empty')).toHaveCount(1);
    await tap(page, '.prefbar [data-pref=""]');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.__yunabi.map().container!.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(200);
    const hit = await y(page, (a) => {
      const { map, prefLayer, container } = a.map();
      let c: { x: number; y: number } | null = null;
      prefLayer!.eachLayer((l) => {
        const f = (l as L.Polygon).feature as { properties: { c: string } };
        if (f.properties.c === '01')
          c = map!.latLngToContainerPoint((l as L.Polygon).getBounds().getCenter());
      });
      const r = container!.getBoundingClientRect();
      return { x: r.left + c!.x, y: r.top + c!.y };
    });
    await page.mouse.click(hit.x, hit.y);
    expect(await y(page, (a) => a.mapUi.get().pref)).toBe('01');
  });

  test('ML-09 location denied: guidance, places around 結 still listed', async ({
    page,
    errors,
  }) => {
    void errors;
    await page.goto('./#/map');
    await mapReady(page);
    await page.evaluate(() => {
      navigator.geolocation.getCurrentPosition = (_ok, no) =>
        no?.({ code: 1 } as GeolocationPositionError);
    });
    await tap(page, '[data-loc="use"]');
    expect(await y(page, (a) => a.location.get().state)).toBe('denied');
    expect((await page.locator('.mstatus').innerText()).length).toBeGreaterThan(20);
    expect(await page.locator('.plist [data-pl]').count()).toBeGreaterThan(0);
  });

  test('ML-10 async results that arrive off the map; D14; zoom kept per mode; zoom labels', async ({
    page,
    context,
    errors,
  }) => {
    void errors;
    await context.route('**/data/japan-prefectures.geojson', async (r) => {
      await new Promise((x) => setTimeout(x, 1500));
      await r.continue();
    });
    await page.goto('./#/map');
    await mapReady(page);
    await page.evaluate(() => {
      const g = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = (a, b, o) =>
        void setTimeout(() => g(a, b, o), 1500);
    });
    await tap(page, '[data-loc="use"]');
    await tap(page, '[data-t="3"]');
    await page.waitForTimeout(2200);
    await tap(page, '[data-t="2"]');
    await mapReady(page);
    /* v2 locates again on entry when location was allowed (Y-M1) */
    await page.waitForFunction(() => window.__yunabi.location.get().state === 'ok');
    expect(
      await y(
        page,
        (a) =>
          a.location.get().state === 'ok' && !!a.map().me && a.map().map!.hasLayer(a.map().me!),
      ),
    ).toBe(true);
    await tap(page, '[data-mode="japan"]');
    await tap(page, '[data-t="3"]');
    await page.waitForTimeout(2200);
    await tap(page, '[data-t="2"]');
    await mapReady(page);
    await page.waitForTimeout(600);
    expect(
      await y(
        page,
        (a) =>
          a.mapUi.get().mode === 'near' &&
          !(a.map().prefLayer && a.map().map!.hasLayer(a.map().prefLayer!)),
      ),
    ).toBe(true);
    await tap(page, '[data-mode="japan"]');
    await page.waitForTimeout(600);
    expect(
      await y(page, (a) => !!a.map().prefLayer && a.map().map!.hasLayer(a.map().prefLayer!)),
    ).toBe(true);
    /* each mode comes back where it was last left, every round trip, after
       the position has settled */
    const settle = () =>
      page.waitForFunction(
        () =>
          !window.__yunabi.location.get().refreshing &&
          window.__yunabi.location.get().state === 'ok',
      );
    const zoom = () => y(page, (a) => a.map().map!.getZoom());
    const setZoom = (z: number) =>
      page.evaluate((zz) => window.__yunabi.map().map!.setZoom(zz, { animate: false }), z);
    await tap(page, '[data-mode="near"]');
    await settle();
    await page.waitForTimeout(600);
    await setZoom(17);
    await tap(page, '[data-mode="japan"]');
    await page.waitForTimeout(300);
    await setZoom(7);
    await tap(page, '[data-mode="near"]');
    await page.waitForTimeout(2000);
    await settle();
    expect(await zoom()).toBe(17);
    await setZoom(15);
    await tap(page, '[data-mode="japan"]');
    await page.waitForTimeout(300);
    expect(await zoom()).toBe(7);
    await tap(page, '[data-mode="near"]');
    await page.waitForTimeout(300);
    expect(await zoom()).toBe(15);
    await tap(page, '.globe');
    await tap(page, '[data-l="ko"]');
    /* the Korean strings load as their own chunk */
    await page.waitForFunction(() => window.__yunabi.prefs.get().lang === 'ko');
    expect(
      await y(
        page,
        (a) => a.map().container!.querySelector<HTMLElement>('.leaflet-control-zoom-in')!.title,
      ),
    ).toBe('확대');
  });

  test('ML-11 skip can be undone; Tokyo fits its mainland; back from a prefecture', async ({
    page,
    errors,
  }) => {
    void errors;
    await page.goto('./#/map');
    await mapReady(page);
    await tap(page, '[data-loc="skip"]');
    await expect(page.locator('.mstatus [data-loc="use"]')).toHaveCount(1);
    await tap(page, '.mstatus [data-loc="use"]');
    await page.waitForFunction(() => window.__yunabi.location.get().state === 'ok');
    expect(await y(page, (a) => a.mapUi.get().tileFail)).toBe(false);
    await tap(page, '[data-mode="japan"]');
    await page.waitForFunction(() => !!window.__yunabi.map().prefLayer);
    await page.waitForTimeout(600);
    await tap(page, '[data-pref="13"]');
    await page.waitForTimeout(900);
    const tb = await y(page, (a) => ({
      s: a.map().map!.getBounds().getSouth(),
      z: a.map().map!.getZoom(),
    }));
    expect(tb.s).toBeGreaterThan(34.5);
    expect(tb.z).toBeGreaterThanOrEqual(9);
    await page.goBack();
    await page.waitForTimeout(600);
    expect(
      await y(page, (a) => [a.route.get().route.name, a.mapUi.get().mode, a.mapUi.get().pref]),
    ).toEqual(['map', 'japan', null]);
    await tap(page, '[data-pref="27"]');
    await tap(page, '.prefbar [data-pref=""]');
    expect(await y(page, (a) => [a.mapUi.get().mode, a.mapUi.get().pref])).toEqual(['japan', null]);
  });
});

test('Y-M2 a map that failed to load offers a reload that brings it back', async ({
  page,
  context,
  errors,
}) => {
  let block = true;
  await context.route('**/assets/leaflet-src-*.js', (r) => (block ? r.abort() : r.continue()));
  await page.goto('./#/map');
  await expect(page.locator('.maperr')).toHaveCount(1);
  /* the blocked request is the one expected error */
  errors.splice(0, errors.length, ...errors.filter((e) => !/ERR_FAILED/.test(e)));
  block = false;
  await tap(page, '.maperr button');
  await mapReady(page);
  await expect(page.locator('.maperr')).toHaveCount(0);
});

test.describe('map tiles failing', () => {
  test.use({ badTiles: true });
  test('ML-12 tile failure is explained', async ({ page, errors }) => {
    void errors;
    await page.goto('./#/map');
    await mapReady(page);
    await page.waitForFunction(() => window.__yunabi.mapUi.get().tileFail);
    expect((await page.locator('.mstatus').innerText()).length).toBeGreaterThan(10);
  });
});

test('ML-13 works with storage blocked', async ({ page, context, errors }) => {
  void errors;
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  await page.goto('./');
  await expect(page.locator('.hcard')).toHaveCount(3);
});

test('Y-C1 no horizontal overflow at 375px, every root screen, every language', async ({
  page,
  errors,
}) => {
  void errors;
  const over: string[] = [];
  for (const lang of ['en', 'ja', 'ko'])
    for (const h of [
      '#/',
      '#/learn',
      '#/cal',
      '#/map',
      '#/learn/collection',
      '#/learn/l8',
      '#/cal/event/4/2026-09-22',
    ]) {
      await page.goto('./' + h);
      await page.evaluate((l) => localStorage.setItem('yui.v1.lang', JSON.stringify(l)), lang);
      await page.reload();
      await page.waitForTimeout(200);
      const bad = await page.evaluate(() =>
        [...document.querySelectorAll('#app *, .tabbar *')]
          .filter((e) => {
            if (e.closest('.filters, .leaflet-container')) return false;
            const r = e.getBoundingClientRect();
            return (
              r.width &&
              (r.right > innerWidth + 1 ||
                (e.scrollWidth > e.clientWidth + 1 &&
                  getComputedStyle(e).overflowX === 'visible' &&
                  e.tagName !== 'svg'))
            );
          })
          .slice(0, 3)
          .map((e) => e.tagName + '.' + e.className),
      );
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
        over.push(`${lang}${h}: page scrolls sideways`);
      if (bad.length) over.push(`${lang}${h}: ${bad.join(',')}`);
      const wraps = await page.evaluate(() => {
        const b = document.querySelector('.globe');
        if (!b) return false;
        const r = document.createRange();
        r.selectNodeContents(b);
        const tops = [...r.getClientRects()].map((x) => Math.round(x.top + x.height / 2));
        return Math.max(...tops) - Math.min(...tops) > 6;
      });
      if (wraps) over.push(`${lang}${h}: language button wraps`);
    }
  expect(over).toEqual([]);
});
