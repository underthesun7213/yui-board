import { writeFileSync } from 'node:fs';
import { expect, go, test, type Sent } from './fixtures';

/* Usage statistics (D40): what is sent, what never is, and the off switch.
   The e2e build carries a made-up token; the fixtures answer Mixpanel's API
   and record each event (tests/e2e/fixtures.ts). */
type Handle = {
  __yunabi: {
    nextScene(): void;
    vn: { get(): { route: string | null }; set(p: { route: null; i: number }): void };
  };
};
const named = (sent: Sent[], event: string) => sent.filter((s) => s.event === event);
const aid = (page: import('@playwright/test').Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('yui.v1.aid') ?? 'null') as string | null);

test('D40 app_open: a random ID and four fields; ip=0, no address, referrer or cookie', async ({
  page,
  errors,
  stats,
}, info) => {
  void errors;
  await go(page, '');
  await expect.poll(() => named(stats, 'app_open').length).toBe(1);
  const [open] = named(stats, 'app_open');
  const id = await aid(page);
  expect(id).toMatch(/^[0-9a-f-]{36}$/);
  expect(open!.url).toBe('https://api-js.mixpanel.com/track?ip=0');
  expect(open!.referer).toBeUndefined();
  expect(open!.cookie).toBeUndefined();
  /* exactly these properties: nothing about the page, the place or the person */
  expect(Object.keys(open!.properties).sort()).toEqual(
    ['$insert_id', 'distinct_id', 'lang', 'mode', 'platform', 'time', 'token'].sort(),
  );
  expect(open!.properties).toMatchObject({
    distinct_id: id,
    lang: 'en',
    mode: 'browser',
    platform: 'android',
    token: '0123456789abcdef0123456789abcdef',
  });
  writeFileSync(info.outputPath('app_open.json'), JSON.stringify(stats, null, 2));
});

test('D40 install_tap, game_start and game_finish carry only what they name', async ({
  page,
  errors,
  stats,
}, info) => {
  void errors;
  await go(page, '');
  /* Android without the browser's dialog: the tap opens the steps */
  await page.locator('.hhead button.install').click();
  await expect.poll(() => named(stats, 'install_tap').length).toBe(1);
  expect(named(stats, 'install_tap')[0]!.properties.kind).toBe('android');
  /* closing the steps again is not another tap */
  await page.locator('.hhead button.install').click();
  /* the game: start Osaka, then run it to its ending */
  await go(page, 'japanese/l8');
  await page.locator('[data-route="osaka"]').click();
  await expect.poll(() => named(stats, 'game_start').length).toBe(1);
  expect(named(stats, 'game_start')[0]!.properties.route).toBe('osaka');
  for (let i = 0; i < 60 && !named(stats, 'game_finish').length; i++)
    await page.evaluate(() => (window as unknown as Handle).__yunabi.nextScene());
  await expect.poll(() => named(stats, 'game_finish').length).toBe(1);
  const fin = named(stats, 'game_finish')[0]!.properties;
  expect(fin.route).toBe('osaka');
  expect(['good', 'normal', 'bad']).toContain(fin.ending);
  /* one ID for the whole visit */
  expect(new Set(stats.map((s) => s.properties.distinct_id)).size).toBe(1);
  expect(named(stats, 'install_tap')).toHaveLength(1);
  writeFileSync(info.outputPath('events.json'), JSON.stringify(stats, null, 2));
});

test('D40 the switch on the terms screen stops sending and forgets the ID', async ({
  page,
  errors,
  stats,
}, info) => {
  void errors;
  await go(page, '');
  await expect.poll(() => named(stats, 'app_open').length).toBe(1);
  expect(await aid(page)).not.toBeNull();
  await go(page, 'legal');
  const box = page.locator('.statsopt input');
  await expect(box).toBeChecked();
  await box.uncheck();
  expect(await aid(page)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('yui.v1.stats'))).toBe('"off"');
  await page.screenshot({ path: info.outputPath('legal-off.png') });
  /* off survives a reload, and nothing more is sent: no open, no game */
  const before = stats.length;
  await page.reload();
  await expect(page.locator('.statsopt input')).not.toBeChecked();
  await go(page, 'japanese/l8');
  await page.locator('[data-route="osaka"]').click();
  await page.waitForTimeout(500);
  expect(stats.length).toBe(before);
  expect(await aid(page)).toBeNull();
  /* on again: a new ID, never the old one */
  await go(page, 'legal');
  await page.locator('.statsopt input').check();
  /* back to the route picker, as opening the lesson from the list does */
  await page.evaluate(() => (window as unknown as Handle).__yunabi.vn.set({ route: null, i: 0 }));
  await go(page, 'japanese/l8');
  await page.locator('[data-route="osaka"]').click();
  await expect.poll(() => named(stats, 'game_start').length).toBe(1);
  expect(named(stats, 'game_start')[0]!.properties.distinct_id).not.toBe(
    named(stats, 'app_open')[0]!.properties.distinct_id,
  );
});

test('D40 a browser that sends Global Privacy Control starts with statistics off', async ({
  page,
  errors,
  stats,
}) => {
  void errors;
  await page.addInitScript(() =>
    Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true }),
  );
  await go(page, '');
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForTimeout(500);
  expect(stats).toHaveLength(0);
  expect(await aid(page)).toBeNull();
  await go(page, 'legal');
  await expect(page.locator('.statsopt input')).not.toBeChecked();
});
