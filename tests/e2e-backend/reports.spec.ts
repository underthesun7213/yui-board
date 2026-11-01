/* Y-3 reports against the local backend: Y-R1~R3, Y-R8, SYS-03 as a history
   step, and G-60 (reports at the same moment hide an item once). */
import type { Browser, Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { expect, mapReady, tap, test } from '../e2e/fixtures';

const DORM = { latitude: 34.8252, longitude: 135.653 };
test.use({ geolocation: DORM, permissions: ['geolocation'] });
test.describe.configure({ mode: 'serial' });

const sql = (q: string) =>
  execSync(`psql -X -q -t -A -h 127.0.0.1 -p 54322 -U postgres -c "${q}"`).toString().trim();

test.beforeAll(() => {
  sql('delete from app.ip_hits');
});

async function device(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({
    ...test.info().project.use,
    geolocation: DORM,
    permissions: ['geolocation'],
  });
  await ctx.route('https://tile.openstreetmap.org/**', (r) => r.fulfill({ status: 404, body: '' }));
  return ctx.newPage();
}
async function openPlace(p: Page, name: string) {
  await p.goto('./map');
  await p.waitForFunction(
    (n) => window.__yunabi?.data.get().places.some((x) => x.name === n),
    name,
  );
  await mapReady(p);
  await tap(p, '[data-loc="skip"]');
  await p.locator('.plist button', { hasText: name }).click();
  await expect(p.locator('.pcard h3')).toHaveText(name);
}
async function report(p: Page, reason: number) {
  await p.click('[data-report-open]');
  await expect(p.getByRole('dialog')).toBeVisible();
  await p.locator('.reason').nth(reason).click();
  await p.click('[data-report-send]');
}
/** A place posted through SQL, owned by a fresh account. */
function seedPlace(name: string): number {
  return Number(
    sql(
      `with u as (insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at) values (gen_random_uuid(), 'authenticated', 'authenticated', true, now(), now()) returning id), a as (insert into app.accounts (user_id) select id from u returning user_id), p as (insert into app.places (name, category, description, lat, lng, pref, lang) values ('${name}', 'food', '', 34.8250, 135.6528, '27', 'en') returning id), o as (insert into app.place_owners (place_id, owner_id, client_token) select p.id, a.user_id, gen_random_uuid() from p, a) select id from p`,
    ),
  );
}

test('Y-R1 the sheet: five reasons, back closes it and keeps the card', async ({
  page,
  errors,
}) => {
  void errors;
  seedPlace('Sheet test');
  await openPlace(page, 'Sheet test');
  await page.click('[data-report-open]');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.reason')).toHaveCount(5);
  await expect(page.locator('[data-report-send]')).toBeDisabled();
  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.pcard h3')).toHaveText('Sheet test');
  expect(page.url()).toMatch(/#\/map$/);
  /* Escape closes it too, and takes its history step back with it */
  await page.click('[data-report-open]');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.pcard h3')).toHaveText('Sheet test');
  expect(await page.evaluate(() => !!(history.state as { sheet?: boolean } | null)?.sheet)).toBe(
    false,
  );
});

test('Y-R2/R3 one report per person; three people hide it everywhere', async ({
  page,
  browser,
  errors,
}) => {
  void errors;
  const id = seedPlace('Spam shop');
  const first = await device(browser);
  const others = [await device(browser), await device(browser)];
  const last = others[1]!;

  await openPlace(first, 'Spam shop');
  await report(first, 1);
  await expect(first.getByRole('dialog')).toHaveCount(0);
  await expect(first.locator('.toast')).toHaveText('Reported — thank you');
  /* the same person again */
  await report(first, 0);
  await expect(first.locator('.sheet .err')).toHaveText("You've already reported this.");

  for (const p of others) {
    await openPlace(p, 'Spam shop');
    await report(p, 1);
    await expect(p.getByRole('dialog')).toHaveCount(0);
  }
  expect(sql(`select auto_hidden_at is not null from app.places where id = ${id}`)).toBe('t');
  /* the third reporter's own map drops it at once */
  await expect(last.locator('.plist button', { hasText: 'Spam shop' })).toHaveCount(0);
  /* and a device that only reads drops it on its next poll */
  await page.goto('./map');
  await mapReady(page);
  await tap(page, '[data-loc="skip"]');
  await expect(page.locator('.plist button', { hasText: 'Sheet test' })).toBeVisible();
  await expect(page.locator('.plist button', { hasText: 'Spam shop' })).toHaveCount(0);
  for (const p of [first, ...others]) await p.context().close();
});

test('G-60 reports sent at the same moment hide the item once', async ({ browser, errors }) => {
  void errors;
  const id = seedPlace('Rush hour');
  const people = await Promise.all([0, 1, 2].map(() => device(browser)));
  for (const p of people) {
    await openPlace(p, 'Rush hour');
    await p.click('[data-report-open]');
    await p.locator('.reason').nth(2).click();
  }
  await Promise.all(people.map((p) => p.click('[data-report-send]')));
  for (const p of people) await expect(p.getByRole('dialog')).toHaveCount(0);
  expect(sql(`select count(*) from app.reports where place_id = ${id}`)).toBe('3');
  expect(
    sql(`select count(*) from app.mod_actions where action = 'auto_hide' and target_id = ${id}`),
  ).toBe('1');
  for (const p of people) await p.context().close();
});
