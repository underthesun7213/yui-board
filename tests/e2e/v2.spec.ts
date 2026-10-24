/* v2 checks beyond v1.3 parity. */
import { expect, mapReady, tap, test, y } from './fixtures';

test.describe('offline (service worker)', () => {
  test.use({ serviceWorkers: 'allow' });
  test('Y-C3 the app shell, lessons and map screen open offline after one visit', async ({
    page,
    context,
    errors,
  }) => {
    void errors;
    await page.goto('./');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    /* let the idle preload finish so every screen chunk is cached too */
    await page.waitForTimeout(500);
    await context.setOffline(true);
    await page.goto('./#/learn');
    await expect(page.locator('.lesson')).toHaveCount(8);
    await page.goto('./#/map');
    await mapReady(page);
    await tap(page, '[data-loc="skip"]');
    await tap(page, '[data-mode="japan"]');
    await page.waitForFunction(() => !!window.__yunabi.map().prefLayer);
    await context.setOffline(false);
  });
});

test.describe('user text stays text', () => {
  test.use({
    geolocation: { latitude: 34.8252, longitude: 135.653 },
    permissions: ['geolocation'],
  });
  test('Y-S4 a place named with markup renders as text in the list, card and pin', async ({
    page,
    errors,
  }) => {
    void errors;
    const payload = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>"\'&';
    let dialogs = 0;
    page.on('dialog', (d) => {
      dialogs++;
      void d.dismiss();
    });
    await page.goto('./#/map');
    await mapReady(page);
    await page.waitForFunction(() => window.__yunabi.data.get().status === 'ok');
    await page.evaluate((name) => {
      const d = window.__yunabi.data;
      const p = d.get().places;
      d.set({ places: p.map((x, i) => (i === 0 ? { ...x, name, description: name } : x)) });
    }, payload);
    await tap(page, '[data-loc="skip"]');
    await tap(page, '[data-pl="1"]');
    await expect(page.locator('.pcard h3')).toHaveText(payload);
    await expect(page.locator('.plist [data-pl="1"] b')).toHaveText(payload);
    await page.waitForTimeout(500);
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    expect(await page.locator('#lmap img[src="x"], #main img[src="x"]').count()).toBe(0);
    expect(dialogs).toBe(0);
    /* zoom in until the pin leaves its cluster */
    await page.evaluate(() => {
      const p = window.__yunabi.data.get().places[0] as unknown as { lat: number; lng: number };
      window.__yunabi.map().map!.setView([p.lat, p.lng], 19, { animate: false });
    });
    await page.waitForTimeout(500);
    const titles = await y(page, (a) =>
      [...a.map().container!.querySelectorAll('.leaflet-marker-icon')].map((e) =>
        e.getAttribute('title'),
      ),
    );
    expect(titles).toContain(payload);
  });

  test('Y-S4 an event with markup renders as text on home and in its detail', async ({
    page,
    errors,
  }) => {
    void errors;
    const NAME = `<img src=x onerror="window.__xss=1">"'&`;
    const BODY = `<script>window.__xss=2</script><img src=x onerror="window.__xss=3">"'&`;
    let dialogs = 0;
    page.on('dialog', (d) => {
      dialogs++;
      void d.dismiss();
    });
    await page.goto('./#/cal');
    await page.waitForFunction(() => window.__yunabi?.data.get().status === 'ok');
    /* tomorrow in Tokyo, and the only event, so it is the home card's "next" */
    const day = new Date(Date.now() + 9 * 3600e3 + 86400e3).toISOString().slice(0, 10);
    const ev = {
      id: 99,
      title: NAME,
      start_date: day,
      start_time: '09:00',
      end_time: '10:00',
      weekly_until: null,
      place_text: NAME,
      body: BODY,
      lang: 'en',
      created_on: day,
      edited_on: null,
    };
    await page.evaluate((e) => {
      const y = window.__yunabi;
      const d = y.data.get();
      /* the same version, so opening the detail does not read the fixtures again */
      y.setData(d.places, [e], [], new Date().toISOString(), d.version);
    }, ev);
    await page.goto('./#/');
    await expect(page.locator('.hcard.cal small span[lang]')).toHaveText(NAME);
    await page.goto(`./#/cal/event/99/${day}`);
    await expect(page.locator('.evwrap h1[lang]')).toHaveText(NAME);
    await expect(page.locator('.evwrap .facts dd[lang]')).toHaveText(NAME);
    await expect(page.locator('.evwrap .body[lang]')).toHaveText(BODY);
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    expect(await page.locator('#main img[src="x"]').count()).toBe(0);
    expect(dialogs).toBe(0);
  });
});
