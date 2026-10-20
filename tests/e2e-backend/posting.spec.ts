/* Y-2 against the local backend: the seed holds the 13 sample places and 6
   events. Tests run in order on one database. */
import type { Page } from '@playwright/test';
import { expect, mapReady, tap, test, y } from '../e2e/fixtures';

const DORM = { latitude: 34.8252, longitude: 135.653 };
test.use({ geolocation: DORM, permissions: ['geolocation'] });
test.describe.configure({ mode: 'serial' });

const hasAccount = (p: Page) => p.evaluate(() => !!localStorage.getItem('yui.auth'));
async function tapMapCenter(p: Page) {
  await mapReady(p);
  await p.evaluate(() => window.__yunabi.map().container!.scrollIntoView({ block: 'center' }));
  const box = (await p.locator('#lmap').boundingBox())!;
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
async function fillPlace(p: Page, name: string) {
  await p.goto('./#/map/new');
  await tapMapCenter(p);
  await expect(p.locator('.form .hint').first()).not.toHaveText('');
  await p.fill('#pf-name', name);
  await p.locator('.chiprow label').nth(2).click(); // food
}

test('Y-A1 reading makes no account; the seed is shared data from the server', async ({
  page,
  errors,
}) => {
  void errors;
  await page.goto('./#/map');
  await mapReady(page);
  await tap(page, '[data-loc="skip"]');
  await expect(page.locator('.plist [data-pl]')).toHaveCount(13);
  await page.goto('./#/cal');
  await expect(page.locator('.mnav')).toBeVisible();
  expect(await hasAccount(page)).toBe(false);
});

test('Y-M6 the first post creates the account; another device sees the place', async ({
  page,
  browser,
  errors,
}) => {
  void errors;
  await fillPlace(page, 'Corner bakery');
  await expect(page.locator('.note')).toBeVisible(); // Y-A2: tied to this browser
  await page.click('.form button[type=submit]');
  await expect(page.locator('.pcard h3')).toHaveText('Corner bakery');
  expect(await hasAccount(page)).toBe(true);
  expect(await y(page, (a) => a.mapUi.get().pref)).toBe('27');
  /* the owner sees edit and delete */
  await expect(page.locator('.pcard .mine')).toBeVisible();

  const other = await browser.newContext({
    ...test.info().project.use,
    geolocation: DORM,
    permissions: ['geolocation'],
  });
  const p2 = await other.newPage();
  await p2.goto('./#/map');
  await p2.waitForFunction(() =>
    window.__yunabi?.data.get().places.some((p) => p.name === 'Corner bakery'),
  );
  await tap(p2, '[data-loc="skip"]');
  await p2.locator('.plist button', { hasText: 'Corner bakery' }).click();
  await expect(p2.locator('.pcard h3')).toHaveText('Corner bakery');
  await expect(p2.locator('.pcard .mine')).toHaveCount(0); // not theirs: no edit/delete (Y-M8)
  await other.close();
});

test('Y-C4 a send whose answer is lost does not post twice', async ({ page, errors }) => {
  await fillPlace(page, 'Sent twice');
  let drop = true;
  await page.route('**/rest/v1/rpc/create_place', async (route) => {
    const res = await route.fetch(); // reaches the server …
    if (drop) {
      drop = false;
      await route.abort('connectionreset'); // … but the answer never arrives
    } else await route.fulfill({ response: res });
  });
  await page.click('.form button[type=submit]');
  await expect(page.locator('.form .err')).toBeVisible();
  await expect(page.locator('#pf-name')).toHaveValue('Sent twice'); // input kept
  await page.click('.form button[type=submit]');
  await expect(page.locator('.pcard h3')).toHaveText('Sent twice');
  expect(
    await y(page, (a) => a.data.get().places.filter((p) => p.name === 'Sent twice').length),
  ).toBe(1);
  /* the aborted request is the one expected error */
  errors.splice(
    0,
    errors.length,
    ...errors.filter((e) => !/ERR_CONNECTION_RESET|Failed to fetch/.test(e)),
  );
});

test('Y-A5 the server refuses what the form would refuse', async ({ page, errors }) => {
  void errors;
  await fillPlace(page, 'Bad link');
  await page.fill('#pf-link', 'https://evil.example/maps');
  await page.click('.form button[type=submit]');
  await expect(page.locator('#pf-link-err')).toBeVisible(); // caught before sending
  /* straight to the API, skipping the form */
  const r = await page.evaluate(async () => {
    /* an anonymous account of its own, as the app would make */
    const su = await fetch('http://127.0.0.1:54321/auth/v1/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: 'x' },
      body: '{}',
    });
    const token = ((await su.json()) as { access_token: string }).access_token;
    const res = await fetch('http://127.0.0.1:54321/rest/v1/rpc/create_place', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        apikey: 'x',
      },
      body: JSON.stringify({
        p_client_token: crypto.randomUUID(),
        p_name: 'x',
        p_category: 'food',
        p_description: '',
        p_gmaps_url: 'javascript:alert(1)',
        p_lat: 34.82,
        p_lng: 135.65,
        p_lang: 'en',
      }),
    });
    return res.json();
  });
  expect(r).toEqual({ status: 'invalid', field: 'gmaps_url' });
});

test("Y-M8 / Y-E1 edit and delete one's own place; My posts shows the states", async ({
  page,
  errors,
}) => {
  void errors;
  await fillPlace(page, 'Corner bakery');
  await page.click('.form button[type=submit]');
  await expect(page.locator('.pcard h3')).toHaveText('Corner bakery');
  await page.goto('./#/me');
  await expect(page.locator('.my')).toHaveCount(1);
  await page
    .locator('.my', { hasText: 'Corner bakery' })
    .getByRole('button', { name: 'Edit' })
    .click();
  await page.fill('#pf-name', 'Corner bakery 2');
  await page.click('.form button[type=submit]');
  await expect(page.locator('.pcard h3')).toHaveText('Corner bakery 2');
  await expect(page.locator('.pcard .dates')).toContainText('Edited');
  page.once('dialog', (d) => void d.accept());
  await page.locator('.pcard').getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('.pcard')).toHaveCount(0);
  await page.goto('./#/me');
  await expect(page.locator('.my', { hasText: 'Corner bakery 2' }).locator('.state')).toHaveClass(
    /deleted/,
  );
});

test('Y-K4~K7 a weekly event, one week cancelled', async ({ page, errors }) => {
  void errors;
  await page.goto('./#/cal/new');
  await page.fill('#ef-title', 'Study group');
  /* tomorrow in Japan: the default slot today (18:00–19:00) has ended by evening */
  const start = new Date(Date.now() + (9 + 24) * 3600_000).toISOString().slice(0, 10);
  await page.fill('#ef-date', start);
  await page.check('.form .check input');
  await page.click('.form button[type=submit]');
  await expect(page.locator('.evwrap h1')).toHaveText('Study group');
  await expect(page.locator('.evwrap .note')).toBeVisible(); // Y-K11
  await page.getByRole('button', { name: 'This week only' }).click();
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Cancel this week' }).click();
  await expect(page.locator('.evwrap .empty, .empty')).toBeVisible(); // the cancelled week has no event
  const overrides = await y(page, (a) => a.data.get());
  expect(JSON.stringify(overrides)).toContain(start);
});

test.describe('offline', () => {
  test.use({ serviceWorkers: 'allow' });
  test('Y-C3 offline: last data with its time, posting off', async ({ page, context, errors }) => {
    void errors;
    await page.goto('./#/map');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.waitForFunction(() => window.__yunabi.data.get().status === 'ok');
    await page.waitForTimeout(500);
    await context.setOffline(true);
    await page.reload();
    await mapReady(page);
    await expect(page.locator('.dstatus.warn')).toBeVisible();
    await page.goto('./#/map/new');
    await expect(page.locator('.form button[type=submit]')).toBeDisabled();
    await context.setOffline(false);
    errors.splice(
      0,
      errors.length,
      ...errors.filter((e) => !/ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(e)),
    );
  });
});

test('Y-S4 a stored script stays text', async ({ page, errors }) => {
  void errors;
  const payload = '<img src=x onerror="window.__xss=1">';
  await fillPlace(page, payload);
  await page.click('.form button[type=submit]');
  await expect(page.locator('.pcard h3')).toHaveText(payload);
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
  ).toBeUndefined();
});

test('Y-E1 a hidden place can still be edited from My posts, and stays hidden', async ({
  page,
  errors,
}) => {
  void errors;
  await fillPlace(page, 'Hidden later');
  await page.click('.form button[type=submit]');
  await expect(page.locator('.pcard h3')).toHaveText('Hidden later');
  const { execSync } = await import('node:child_process');
  execSync(
    `psql -X -q -h 127.0.0.1 -p 54322 -U postgres -c "update app.places set auto_hidden_at = now() where name = 'Hidden later'"`,
  );
  await page.goto('./#/me');
  const row = page.locator('.my', { hasText: 'Hidden later' });
  await expect(row.locator('.state')).toHaveClass(/hidden_review/);
  await row.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#pf-name')).toHaveValue('Hidden later');
  await page.fill('#pf-name', 'Hidden later, fixed');
  await page.click('.form button[type=submit]');
  /* still hidden, so the app returns to My posts rather than the map */
  await page.waitForURL(/#\/me$/);
  await expect(
    page.locator('.my', { hasText: 'Hidden later, fixed' }).locator('.state'),
  ).toHaveClass(/hidden_review/);
});
