/* ERD v2 §9 through the real API (PostgREST + Auth), not just in SQL:
   G-01, G-03, G-10, G-12, G-15, the per-IP limit with encoded names, and the
   signup hook. */
import { expect, test, type APIRequestContext } from '@playwright/test';
import { execSync } from 'node:child_process';

const API = 'http://127.0.0.1:54321';
const ANON = execSync(
  `node -e 'import("./scripts/local-stack/keys.mjs").then(k=>console.log(k.ANON_KEY))'`,
)
  .toString()
  .trim();
const H = { apikey: ANON, 'content-type': 'application/json' };
test.describe.configure({ mode: 'serial' });

async function account(r: APIRequestContext): Promise<Record<string, string>> {
  const res = await r.post(`${API}/auth/v1/signup`, { headers: H, data: {} });
  expect(res.status()).toBe(200);
  const { access_token } = (await res.json()) as { access_token: string };
  return { ...H, authorization: `Bearer ${access_token}` };
}
const place = (over: Record<string, unknown> = {}) => ({
  p_client_token: crypto.randomUUID(),
  p_name: 'x',
  p_category: 'food',
  p_description: '',
  p_gmaps_url: null,
  p_lat: 34.82,
  p_lng: 135.65,
  p_lang: 'en',
  ...over,
});

test('G-01 the app schema and its tables are not reachable', async ({ request }) => {
  for (const t of ['places', 'accounts', 'settings', 'place_owners', 'security_events'])
    expect((await request.get(`${API}/rest/v1/${t}`, { headers: H })).status(), t).toBe(404);
  const prof = await request.get(`${API}/rest/v1/places`, {
    headers: { ...H, 'accept-profile': 'app' },
  });
  expect(prof.status()).toBe(406);
});

test('G-03 / G-12 without an account nothing writes; monitoring is closed', async ({ request }) => {
  for (const fn of ['create_place', 'delete_place', 'my_items', 'ops_health'])
    expect([401, 403, 404, 405]).toContain(
      (await request.post(`${API}/rest/v1/rpc/${fn}`, { headers: H, data: {} })).status(),
    );
  expect((await request.get(`${API}/rest/v1/rpc/data_version`, { headers: H })).status()).toBe(200);
});

test('G-10 / G-15 another person cannot touch my place; bad input is a status', async ({
  request,
}) => {
  const a = await account(request);
  const b = await account(request);
  const made = (await (
    await request.post(`${API}/rest/v1/rpc/create_place`, { headers: a, data: place() })
  ).json()) as { id: number };
  const r = await request.post(`${API}/rest/v1/rpc/delete_place`, {
    headers: b,
    data: { p_id: made.id },
  });
  expect(await r.json()).toEqual({ status: 'not_found' });
  for (const [over, field] of [
    [{ p_name: 'a‮b' }, 'name'],
    [{ p_gmaps_url: 'https://www.google.com/maps/../url?q=https://evil.example' }, 'gmaps_url'],
    [{ p_lat: 37.56, p_lng: 126.97 }, 'location'],
    [{ p_description: 'x'.repeat(501) }, 'description'],
  ] as const) {
    const res = await request.post(`${API}/rest/v1/rpc/create_place`, {
      headers: a,
      data: place(over),
    });
    expect(await res.json(), field).toEqual({ status: 'invalid', field });
  }
});

test('Y-S7 writes are limited per IP, whatever the function name looks like', async ({
  request,
}) => {
  const a = await account(request);
  execSync(
    `psql -X -q -h 127.0.0.1 -p 54322 -U postgres -c "delete from app.ip_hits; update app.settings set int_value = 3 where key = 'ip_writes_per_5min'"`,
  );
  try {
    const codes: number[] = [];
    for (const name of ['%64elete_place', 'delete%5Fplace', 'delete_place', 'delete_place'])
      codes.push(
        (
          await request.post(`${API}/rest/v1/rpc/${name}`, { headers: a, data: { p_id: 1 } })
        ).status(),
      );
    expect(codes).toEqual([200, 200, 200, 429]);
    /* reads still pass */
    expect(
      (
        await request.get(`${API}/rest/v1/places_public?select=id&limit=1`, { headers: H })
      ).status(),
    ).toBe(200);
  } finally {
    execSync(
      `psql -X -q -h 127.0.0.1 -p 54322 -U postgres -c "delete from app.ip_hits; update app.settings set int_value = 60 where key = 'ip_writes_per_5min'"`,
    );
  }
});

test('the signup hook: email signups only for invited addresses', async ({ request }) => {
  const r = await request.post(`${API}/auth/v1/signup`, {
    headers: H,
    data: { email: 'stranger@example.com', password: 'a-long-password-1' },
  });
  expect(r.status()).toBe(403);
});
