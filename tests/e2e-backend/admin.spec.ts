/* Y-3 admin console against the local backend: sign-in with password and a
   real TOTP, two authenticators, the queue, restore / suspend / bulk restore,
   the log, signing in with the backup authenticator (R-7 ①), the 12-hour
   session limit, and a non-admin being refused (G-30~G-36 in a browser). */
import type { Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { expect, test } from '../e2e/fixtures';
import { ADMIN_BASE } from '../../playwright.backend.config';
import { psql } from './db';

test.describe.configure({ mode: 'serial' });
test.use({ baseURL: ADMIN_BASE, viewport: { width: 1000, height: 900 } });

const sql = (q: string) =>
  execSync(`psql -X -q -t -A -h 127.0.0.1 -p 54322 -U postgres -c "${q}"`).toString().trim();
const SERVICE = execSync(
  `node -e 'import("./scripts/local-stack/keys.mjs").then(k=>console.log(k.SERVICE_KEY))'`,
)
  .toString()
  .trim();

/** RFC 6238 with the defaults Supabase uses: SHA-1, 6 digits, 30 seconds. */
function totp(secret: string, at = Date.now()): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret.replace(/=+$/, '').toUpperCase())
    bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const h = createHmac('sha1', key).update(counter).digest();
  const o = h[h.length - 1]! & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

async function createUser(email: string, password: string): Promise<string> {
  sql(
    `insert into app.admin_invites (email, invited_at) values ('${email}', now() - interval '1 minute')`,
  );
  const r = await fetch('http://127.0.0.1:54321/auth/v1/admin/users', {
    method: 'POST',
    headers: {
      apikey: SERVICE,
      authorization: `Bearer ${SERVICE}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  expect(r.status).toBe(200);
  return ((await r.json()) as { id: string }).id;
}
function seedHidden(name: string, at = 'now()'): { id: number; ref: string } {
  const [id, ref] = sql(
    `with u as (insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at) values (gen_random_uuid(), 'authenticated', 'authenticated', true, now(), now()) returning id), a as (insert into app.accounts (user_id) select id from u returning user_id, ref), p as (insert into app.places (name, category, description, lat, lng, pref, lang, auto_hidden_at) values ('${name}', 'food', 'cheap pills', 34.8250, 135.6528, '27', 'en', ${at}) returning id), o as (insert into app.place_owners (place_id, owner_id, client_token) select p.id, a.user_id, gen_random_uuid() from p, a) select p.id || '|' || a.ref from p, a`,
  ).split('|');
  return { id: Number(id), ref: ref! };
}

const ADMIN = { email: 'owner@yunabi.test', password: 'local-only-Passw0rd!' };
const STRANGER = { email: 'stranger@yunabi.test', password: 'local-only-Passw0rd!' };
const secrets: string[] = [];
/* the 30-second window each authenticator last gave a code in */
const usedWindow: number[] = [];
/** A code for secrets[i] from a window that authenticator has not used yet:
    the tests alternate authenticators on purpose, and a code is never sent twice. */
async function freshCode(i: number): Promise<string> {
  let t = Date.now();
  while (usedWindow[i] === Math.floor(t / 30_000)) {
    await new Promise((r) => setTimeout(r, 500));
    t = Date.now();
  }
  usedWindow[i] = Math.floor(t / 30_000);
  return totp(secrets[i]!, t);
}
let target: { id: number; ref: string };

test.beforeAll(async () => {
  sql('delete from app.ip_hits');
  const id = await createUser(ADMIN.email, ADMIN.password);
  sql(`select app.bind_admin('${id}', '${ADMIN.email}')`);
  await createUser(STRANGER.email, STRANGER.password); /* invited, never bound */
  target = seedHidden('Pill shop');
});

/* later specs count the seed's places: take ours away again */
test.afterAll(() => {
  sql("delete from app.places where name in ('Pill shop', 'Wave one', 'Wave two')");
});

async function signIn(p: Page, who: { email: string; password: string }) {
  await p.goto('./');
  await p.fill('input[name=email]', who.email);
  await p.fill('input[name=password]', who.password);
  await p.click('button[type=submit]');
}
/** Registers one authenticator and returns its secret. With `slot`, the window
    its code came from is recorded, so freshCode(slot) never sends it again. */
async function enrollOne(p: Page, slot?: number): Promise<string> {
  await p.getByRole('button', { name: 'Show the QR code' }).click();
  await expect(p.locator('img.qr')).toBeVisible();
  const secret = (await p.locator('[data-secret]').textContent())!.trim();
  const t = Date.now();
  if (slot !== undefined) usedWindow[slot] = Math.floor(t / 30_000);
  await p.fill('input[name=code]', totp(secret, t));
  await p.getByRole('button', { name: 'Verify' }).click();
  return secret;
}

test('first sign-in sets up two authenticators, then the console opens', async ({
  page,
  errors,
}) => {
  void errors;
  await signIn(page, ADMIN);
  await expect(page.getByRole('heading', { name: 'Set up two authenticators' })).toBeVisible();
  await expect(page.locator('.step')).toHaveText('Authenticator 1 of 2');
  secrets.push(await enrollOne(page, 0));
  await expect(page.locator('.step')).toHaveText('Authenticator 2 of 2');
  await expect(page.locator('input[name=factor-name]')).toHaveValue('Backup');
  secrets.push(await enrollOne(page, 1));
  await expect(page.locator('[data-email]')).toHaveText(ADMIN.email);
  await expect(page.locator('.warn')).toHaveCount(0); // two authenticators: no warning
  /* the session lives in this tab only */
  expect(await page.evaluate(() => !!sessionStorage.getItem('yui.admin.auth'))).toBe(true);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test('Y-R4 / G-34 restore a hidden item; Y-R7 suspend its account; the log says who', async ({
  page,
  errors,
}) => {
  void errors;
  page.on('dialog', (d) => void d.accept());
  await signIn(page, ADMIN);
  await page.locator('.choices label', { hasText: 'Main phone' }).click();
  await page.fill('input[name=code]', await freshCode(0));
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.locator('[data-email]')).toHaveText(ADMIN.email);

  await page.click(`[data-item="place:${target.id}"]`);
  await expect(page.locator('[data-state]')).toHaveAttribute('data-state', 'auto_hidden');
  await expect(page.locator('[data-ref]')).toHaveText(target.ref);
  await page.fill('textarea[name=note]', 'checked: fine');
  await page.click('[data-act=restore]');
  await expect(page.locator('[data-state]')).toHaveAttribute('data-state', 'visible');
  await expect(page.locator('.tag')).toHaveText('Protected until edited');
  await expect(page.locator('[data-history] li').first()).toContainText(ADMIN.email);
  await expect(page.locator('[data-history] li').first()).toContainText('checked: fine');
  expect(
    sql(
      `select actor_email from app.mod_actions where action = 'restore' and target_id = ${target.id}`,
    ),
  ).toBe(ADMIN.email);

  await page.click('[data-act=suspend]');
  await expect(page.locator('[data-state]')).toHaveAttribute('data-state', 'suspension_hidden');
  expect(sql(`select suspended_at is not null from app.accounts where ref = '${target.ref}'`)).toBe(
    't',
  );
  await expect(page.locator('[data-act=unsuspend]')).toBeVisible();

  await page.click('[data-tab=log]');
  await expect(page.locator('[data-log] li').first()).toContainText('Account suspended');
});

test('M-6a / G-36 bulk restore lists first and changes nothing until confirmed', async ({
  page,
  errors,
}) => {
  void errors;
  const a = seedHidden('Wave one');
  const b = seedHidden('Wave two');
  await signIn(page, ADMIN);
  await page.locator('.choices label', { hasText: 'Backup' }).click(); // R-7 ①: the backup works
  await page.fill('input[name=code]', await freshCode(1));
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.locator('[data-email]')).toHaveText(ADMIN.email);

  const jst = (ms: number) => new Date(Date.now() + 9 * 3600_000 + ms).toISOString().slice(0, 16);
  await page.fill('input[name=since]', jst(-3600_000));
  await page.fill('input[name=until]', jst(3600_000));
  await page.click('[data-bulk=preview]');
  await expect(page.locator('[data-bulk-count]')).toHaveAttribute('data-bulk-count', '2');
  expect(
    sql(
      `select count(*) from app.places where id in (${a.id}, ${b.id}) and auto_hidden_at is null`,
    ),
  ).toBe('0');
  await page.click('[data-bulk=run]');
  await expect(page.getByRole('status')).toHaveText('2 restored');
  expect(
    sql(
      `select count(*) from app.places where id in (${a.id}, ${b.id}) and auto_hidden_at is null`,
    ),
  ).toBe('2');
});

/* Y-S4 in the console: markup in a place's name and description is shown as
   text in the queue and in the detail. The console's CSP would block inline
   handlers anyway, so the main checks are the text and that no img exists. */
const NAME = `<img src=x onerror="window.__xss=1">"'&`;
const BODY = `<script>window.__xss=2</script><img src=x onerror="window.__xss=3">"'&`;

test('Y-S4 user text in the console stays text: queue and item detail', async ({
  page,
  errors,
}) => {
  void errors;
  let dialogs = 0;
  page.on('dialog', (d) => {
    dialogs++;
    void d.dismiss();
  });
  const id = psql(
    `with u as (insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at)
           values (gen_random_uuid(), 'authenticated', 'authenticated', true, now(), now()) returning id),
a as (insert into app.accounts (user_id) select id from u returning user_id),
p as (insert into app.places (name, category, description, lat, lng, pref, lang, auto_hidden_at)
      values (:'name', 'food', :'body', 34.8250, 135.6528, '27', 'en', now()) returning id),
o as (insert into app.place_owners (place_id, owner_id, client_token)
      select p.id, a.user_id, gen_random_uuid() from p, a)
select id from p;`,
    { name: NAME, body: BODY },
  );
  try {
    await signIn(page, ADMIN);
    /* the backup: M-6a just used it, so this waits for the next window */
    await page.locator('.choices label', { hasText: 'Backup' }).click();
    await page.fill('input[name=code]', await freshCode(1));
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.locator('[data-email]')).toHaveText(ADMIN.email);

    await expect(page.locator(`[data-item="place:${id}"] b`)).toHaveText(NAME);
    await page.click(`[data-item="place:${id}"]`);
    const dd = page.locator('.detail dd');
    await expect(page.locator(`[data-detail="place:${id}"]`)).toBeVisible();
    const texts = await dd.allTextContents();
    expect(texts.filter((t) => t === NAME)).toHaveLength(1);
    expect(texts.filter((t) => t === BODY)).toHaveLength(1);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBe(
      undefined,
    );
    expect(await page.locator('img[src="x"]').count()).toBe(0);
    expect(dialogs).toBe(0);
  } finally {
    psql("delete from app.places where id = :'id'", { id });
  }
});

test('G-30 ⑤ a session older than 12 hours is refused and sent back to sign-in', async ({
  page,
  errors,
}) => {
  await signIn(page, ADMIN);
  await page.locator('.choices label', { hasText: 'Main phone' }).click();
  await page.fill('input[name=code]', await freshCode(0));
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.locator('[data-email]')).toHaveText(ADMIN.email);
  sql(
    `update auth.sessions set created_at = now() - interval '13 hours' where user_id = (select user_id from app.admins where email = '${ADMIN.email}')`,
  );
  await page.click('[data-tab=log]');
  await expect(page.getByRole('alert')).toHaveText(
    /cannot use the admin console|session has ended/,
  );
  await expect(page.locator('input[name=email]')).toBeVisible();
  /* the refusal itself is the browser's one logged 403 here */
  const refused = errors.filter((e) => /status of 403/.test(e));
  expect(refused).toHaveLength(1);
  errors.splice(errors.indexOf(refused[0]!), 1);
});

test('G-30 ⑥ / G-31 a signed-in account that is not an admin gets nothing', async ({
  page,
  errors,
}) => {
  void errors;
  const before = Number(
    sql(`select count(*) from app.security_events where kind = 'admin_denied'`),
  );
  await signIn(page, STRANGER);
  await enrollOne(page);
  await enrollOne(page);
  await expect(page.getByRole('alert')).toHaveText(/cannot use the admin console/);
  await expect(page.locator('[data-tab]')).toHaveCount(0);
  expect(Number(sql(`select count(*) from app.security_events where kind = 'admin_denied'`))).toBe(
    before + 1,
  );
});
