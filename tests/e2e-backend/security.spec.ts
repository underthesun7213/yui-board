/* ERD v2 §9 through the real API (PostgREST + Auth), not just in SQL:
   G-01, G-02, G-03, G-10, G-12, G-15, G-21, G-23, G-30 ①~③, G-31, G-52,
   G-55, T-19a and the signup hook (map: ERD v2 §9.1).

   Local stack only. The local gateway does not turn the apikey into an
   Authorization header, so a request without an account is "not
   authenticated" (401) here; behind Supabase's gateway the same request may be
   a 403. Statuses (PostgREST v13): 42501 → 401 without an account, 403 with
   one; a `stable` function called with POST fails read-only before any
   permission check (405), so those are called with GET. */
import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import { execSync } from 'node:child_process';
import { psql } from './db';

const API = 'http://127.0.0.1:54321';
const key = (name: string) =>
  execSync(`node -e 'import("./scripts/local-stack/keys.mjs").then(k=>console.log(k.${name}))'`)
    .toString()
    .trim();
const ANON = key('ANON_KEY');
const SERVICE = key('SERVICE_KEY');
const H = { apikey: ANON, 'content-type': 'application/json' };
type Headers = Record<string, string>;
test.describe.configure({ mode: 'serial' });

/* earlier specs wrote from this address in the same five minutes */
test.beforeAll(() => {
  psql('delete from app.ip_hits');
});

async function account(r: APIRequestContext): Promise<Headers> {
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
/** status and PostgREST error code, for one assertion with a readable diff */
async function outcome(r: APIResponse): Promise<{ status: number; code: unknown }> {
  const text = await r.text();
  let code: unknown;
  try {
    code = (JSON.parse(text) as { code?: unknown } | null)?.code;
  } catch {
    code = undefined;
  }
  return { status: r.status(), code };
}
const ipHits = () => Number(psql('select coalesce(sum(n), 0) from app.ip_hits'));

test('G-01 the app schema and its tables are not reachable (GET, PATCH, DELETE)', async ({
  request,
}) => {
  for (const t of ['places', 'accounts', 'settings', 'place_owners', 'security_events'])
    expect((await request.get(`${API}/rest/v1/${t}`, { headers: H })).status(), t).toBe(404);
  const prof = await request.get(`${API}/rest/v1/places`, {
    headers: { ...H, 'accept-profile': 'app' },
  });
  expect(prof.status()).toBe(406);
  const patch = await request.patch(`${API}/rest/v1/places?id=eq.1`, {
    headers: H,
    data: { name: 'x' },
  });
  expect(await outcome(patch)).toEqual({ status: 404, code: 'PGRST205' });
  const del = await request.delete(`${API}/rest/v1/places?id=eq.1`, { headers: H });
  expect(await outcome(del)).toEqual({ status: 404, code: 'PGRST205' });
});

test('G-02 the public views cannot be written over HTTP', async ({ request }) => {
  const v0 = psql('select v from app.data_version where id = 1');
  const a = await account(request);
  const writes = (view: string, filter: string, body: Record<string, unknown>) => [
    { m: 'POST', url: `${API}/rest/v1/${view}`, body },
    { m: 'PATCH', url: `${API}/rest/v1/${view}?${filter}`, body },
    { m: 'DELETE', url: `${API}/rest/v1/${view}?${filter}`, body: undefined },
  ];
  const send = (w: { m: string; url: string; body?: Record<string, unknown> }, h: Headers) =>
    request.fetch(w.url, { method: w.m, headers: h, data: w.body });

  /* simple views PostgreSQL could update: refused by the missing privilege */
  for (const [view, body] of [
    ['places_public', { name: 'x' }],
    ['events_public', { title: 'x' }],
  ] as const)
    for (const w of writes(view, 'id=eq.-1', body)) {
      expect(await outcome(await send(w, H)), `anon ${w.m} ${view}`).toEqual({
        status: 401,
        code: '42501',
      });
      expect(await outcome(await send(w, a)), `account ${w.m} ${view}`).toEqual({
        status: 403,
        code: '42501',
      });
    }

  /* a join and a GROUP BY: PostgreSQL refuses these as views it cannot update,
     before it looks at privileges (the value seen on the first CI run) */
  for (const [view, filter, body] of [
    ['event_occurrences_public', 'event_id=eq.-1', { cancelled: true }],
    ['prefecture_counts', 'pref=eq.00', { n: 0 }],
  ] as const)
    for (const w of writes(view, filter, body))
      for (const [who, h] of [
        ['anon', H],
        ['account', a],
      ] as const)
        expect(await outcome(await send(w, h)), `${who} ${w.m} ${view}`).toEqual({
          status: 500,
          code: '55000',
        });

  /* and the privileges themselves */
  expect(
    psql(`select count(*) from unnest(array['anon','authenticated']) r,
      unnest(array['public.places_public','public.events_public',
                   'public.event_occurrences_public','public.prefecture_counts']) v,
      unnest(array['INSERT','UPDATE','DELETE']) m
    where has_table_privilege(r, v::regclass, m)`),
  ).toBe('0');
  expect(psql('select v from app.data_version where id = 1')).toBe(v0);
});

test('G-23 hidden and deleted items are in none of the four public views', async ({ request }) => {
  const count = async () => {
    const r = await request.get(`${API}/rest/v1/prefecture_counts?select=n&pref=eq.27`, {
      headers: H,
    });
    expect(r.status()).toBe(200);
    return ((await r.json()) as { n: number }[])[0]?.n ?? 0;
  };
  const n0 = await count();
  try {
    const places = JSON.parse(
      psql(`with p as (
  insert into app.places (name, category, description, lat, lng, pref, lang,
                          auto_hidden_at, suspension_hidden_at, deleted_at, deleted_by)
  values ('G23 visible',   'food', '', 34.8250, 135.6528, '27', 'en', null,  null,  null,  null),
         ('G23 auto',      'food', '', 34.8250, 135.6528, '27', 'en', now(), null,  null,  null),
         ('G23 suspended', 'food', '', 34.8250, 135.6528, '27', 'en', null,  now(), null,  null),
         ('G23 deleted',   'food', '', 34.8250, 135.6528, '27', 'en', null,  null,  now(), 'owner')
  returning id, name)
select json_object_agg(name, id) from p;`),
    ) as Record<string, number>;
    const ev = JSON.parse(
      psql(`with d as (select (now() at time zone 'Asia/Tokyo')::date + 7 as day),
e as (
  insert into app.events (title, start_date, start_time, end_time, weekly_until, lang,
                          auto_hidden_at, suspension_hidden_at, deleted_at, deleted_by)
  select t.title, d.day, time '10:00', time '11:00', d.day + 14, 'en'::app.ui_lang, t.a, t.s, t.x, t.b
  from d, (values ('G23 visible', null::timestamptz, null::timestamptz, null::timestamptz, null::text),
                  ('G23 auto', now(), null, null, null),
                  ('G23 suspended', null, now(), null, null),
                  ('G23 deleted', null, null, now(), 'owner')) t(title, a, s, x, b)
  returning id, title),
o as (
  insert into app.event_occurrences (event_id, occurs_on, cancelled, title)
  select e.id, d.day + 7, false, 'G23 week' from e, d returning event_id)
select json_build_object('events', (select json_object_agg(title, id) from e),
                         'weeks', (select count(*) from o));`),
    ) as { events: Record<string, number>; weeks: number };
    expect(ev.weeks).toBe(4);
    const pIds = Object.values(places).join(',');
    const eIds = Object.values(ev.events).join(',');
    expect(Object.keys(places)).toHaveLength(4);
    expect(Object.keys(ev.events)).toHaveLength(4);

    const get = async (path: string) => {
      const r = await request.get(`${API}/rest/v1/${path}`, { headers: H });
      expect(r.status(), path).toBe(200);
      return r.json();
    };
    expect(await get(`places_public?select=id&id=in.(${pIds})`)).toEqual([
      { id: places['G23 visible'] },
    ]);
    expect(await get(`events_public?select=id&id=in.(${eIds})`)).toEqual([
      { id: ev.events['G23 visible'] },
    ]);
    expect(await get(`event_occurrences_public?select=event_id&event_id=in.(${eIds})`)).toEqual([
      { event_id: ev.events['G23 visible'] },
    ]);
    expect(await count()).toBe(n0 + 1);
  } finally {
    psql(
      "delete from app.places where name like 'G23 %'; delete from app.events where title like 'G23 %'",
    );
  }
});

test('G-21 another account sees none of my items; my own carry no owner column', async ({
  request,
}) => {
  const a = await account(request);
  const b = await account(request);
  const made = await request.post(`${API}/rest/v1/rpc/create_place`, {
    headers: a,
    data: place(),
  });
  expect(made.status()).toBe(200);
  const { status, id } = (await made.json()) as { status: string; id: number };
  expect(status).toBe('ok');

  const get = async (path: string, h: Headers) => {
    const r = await request.get(`${API}/rest/v1/rpc/${path}`, { headers: h });
    expect(r.status(), path).toBe(200);
    return r.json() as Promise<unknown>;
  };
  expect(await get('my_items', b)).toEqual([]);
  expect(await get(`my_place?p_id=${id}`, b)).toBeNull();
  const mine = (await get('my_items', a)) as Record<string, unknown>[];
  expect(mine).toHaveLength(1);
  expect(Object.keys(mine[0]!).sort()).toEqual([
    'created_on',
    'deleted_on',
    'edited_on',
    'id',
    'kind',
    'last_date',
    'state',
    'title',
  ]);
  const one = (await get(`my_place?p_id=${id}`, a)) as Record<string, unknown>;
  expect(Object.keys(one).sort()).toEqual([
    'category',
    'description',
    'gmaps_url',
    'id',
    'lang',
    'lat',
    'lng',
    'name',
    'pref',
  ]);
});

/* Every function clients may execute, with arguments of the right types. X is
   an id that does not exist, so nothing changes even with a protection removed. */
const X = 999999999;
const D = '2030-01-07';
const CALLS: Record<string, { get?: string; post?: Record<string, unknown> }> = {
  data_version: { get: '' },
  my_items: { get: '' },
  my_place: { get: `?p_id=${X}` },
  my_event: { get: `?p_id=${X}` },
  ops_health: { get: '' },
  create_place: { post: place() },
  update_place: {
    post: {
      p_id: X,
      p_name: 'x',
      p_category: 'food',
      p_description: '',
      p_gmaps_url: null,
      p_lat: 34.82,
      p_lng: 135.65,
      p_lang: 'en',
    },
  },
  delete_place: { post: { p_id: X } },
  create_event: {
    post: {
      p_client_token: crypto.randomUUID(),
      p_title: 'x',
      p_start_date: D,
      p_start_time: '10:00',
      p_end_time: '11:00',
      p_weekly_until: null,
      p_place_text: '',
      p_body: '',
      p_lang: 'en',
    },
  },
  update_event: {
    post: {
      p_id: X,
      p_title: 'x',
      p_start_date: D,
      p_start_time: '10:00',
      p_end_time: '11:00',
      p_weekly_until: null,
      p_place_text: '',
      p_body: '',
      p_lang: 'en',
    },
  },
  delete_event: { post: { p_id: X } },
  set_occurrence: {
    post: {
      p_event_id: X,
      p_occurs_on: D,
      p_cancelled: true,
      p_title: null,
      p_start_time: null,
      p_end_time: null,
      p_place_text: null,
      p_body: null,
    },
  },
  clear_occurrence: { post: { p_event_id: X, p_occurs_on: D } },
  submit_report: { post: { p_kind: 'place', p_id: X, p_reason: 'spam' } },
  admin_whoami: { post: {} },
  admin_queue: { post: { p_filter: 'all', p_limit: 1, p_offset: 0 } },
  admin_item: { post: { p_kind: 'place', p_id: X } },
  admin_restore: { post: { p_kind: 'place', p_id: X, p_note: null } },
  admin_restore_bulk: {
    post: {
      p_since: '2026-01-01T00:00:00Z',
      p_until: '2026-01-02T00:00:00Z',
      p_note: null,
      p_dry_run: true,
      p_expected: null,
    },
  },
  admin_delete: { post: { p_kind: 'place', p_id: X, p_note: null } },
  admin_dismiss: { post: { p_kind: 'place', p_id: X, p_note: null } },
  admin_suspend: { post: { p_account_ref: 'nobody', p_note: null } },
  admin_unsuspend: { post: { p_account_ref: 'nobody', p_note: null } },
  admin_search: { post: { p_q: 'x', p_pref: null } },
  admin_audit_log: { post: { p_limit: 1, p_before: null } },
};
const call = (r: APIRequestContext, fn: string, h: Headers) => {
  const c = CALLS[fn]!;
  return c.post
    ? r.post(`${API}/rest/v1/rpc/${fn}`, { headers: h, data: c.post })
    : r.get(`${API}/rest/v1/rpc/${fn}${c.get}`, { headers: h });
};
const ADMIN_FNS = Object.keys(CALLS).filter((f) => f.startsWith('admin_') && f !== 'admin_whoami');

test('G-03 the test covers every function clients may execute', () => {
  const granted = psql(`select string_agg(p.proname, ',' order by p.proname) from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and (has_function_privilege('anon', p.oid, 'execute')
       or has_function_privilege('authenticated', p.oid, 'execute')
       or has_function_privilege('service_role', p.oid, 'execute'))`);
  expect(granted.split(',')).toEqual(Object.keys(CALLS).sort());
});

test('G-03 / G-12 / G-30 ① anon: every function in the allowlist but data_version is 401', async ({
  request,
}) => {
  for (const fn of Object.keys(CALLS)) {
    const got = await outcome(await call(request, fn, H));
    if (fn === 'data_version') expect(got.status, fn).toBe(200);
    else expect(got, fn).toEqual({ status: 401, code: '42501' });
  }
});

test('G-30 ②③ / G-31 a non-admin account: admin functions are 403, admin_whoami answers forbidden', async ({
  request,
}) => {
  /* ② an anonymous account */
  const a = await account(request);
  for (const fn of [...ADMIN_FNS, 'ops_health'])
    expect(await outcome(await call(request, fn, a)), fn).toEqual({ status: 403, code: '42501' });
  const denied = () =>
    Number(psql("select count(*) from app.security_events where kind = 'admin_denied'"));
  const before = denied();
  const who = await call(request, 'admin_whoami', a);
  expect(who.status()).toBe(200);
  expect(await who.json()).toEqual({ status: 'forbidden' });
  expect(denied()).toBe(before + 1);

  /* ③ an invited, password-only (aal1) account */
  const email = `aal1-${Date.now()}@yunabi.test`;
  const password = 'local-only-Passw0rd!';
  psql(
    "insert into app.admin_invites (email, invited_at) values (:'email', now() - interval '1 minute')",
    {
      email,
    },
  );
  const made = await request.post(`${API}/auth/v1/admin/users`, {
    headers: {
      apikey: SERVICE,
      authorization: `Bearer ${SERVICE}`,
      'content-type': 'application/json',
    },
    data: { email, password, email_confirm: true },
  });
  expect(made.status()).toBe(200);
  const tok = await request.post(`${API}/auth/v1/token?grant_type=password`, {
    headers: H,
    data: { email, password },
  });
  expect(tok.status()).toBe(200);
  const { access_token } = (await tok.json()) as { access_token: string };
  const aal1 = { ...H, authorization: `Bearer ${access_token}` };
  expect(await outcome(await call(request, 'admin_queue', aal1))).toEqual({
    status: 403,
    code: '42501',
  });
});

test('T-19a GraphQL is not reachable through /rpc', async ({ request }) => {
  const r = await request.post(`${API}/rest/v1/rpc/graphql`, {
    headers: H,
    data: { query: '{__typename}' },
  });
  expect(await outcome(r)).toEqual({ status: 404, code: 'PGRST202' });
});

test('G-55 a malformed write is still counted per IP; one PostgREST cannot convert is not', async ({
  request,
}) => {
  const a = await account(request);
  const h0 = ipHits();
  const bad = await request.post(`${API}/rest/v1/rpc/create_place`, {
    headers: a,
    data: place({ p_name: '' }),
  });
  expect(bad.status()).toBe(200);
  expect(await bad.json()).toEqual({ status: 'invalid', field: 'name' });
  expect(ipHits()).toBe(h0 + 1);
  /* ERD G-55's remaining gap: a value PostgREST cannot convert rolls the count back */
  const unconvertible = await request.post(`${API}/rest/v1/rpc/create_place`, {
    headers: a,
    data: place({ p_category: 'nope' }),
  });
  expect(unconvertible.status()).toBe(400);
  expect(ipHits()).toBe(h0 + 1);
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

test('Y-S7 / G-52 writes are limited per IP, whatever the function name looks like', async ({
  request,
}) => {
  const a = await account(request);
  psql(
    "delete from app.ip_hits; update app.settings set int_value = 3 where key = 'ip_writes_per_5min'",
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
    psql(
      "delete from app.ip_hits; update app.settings set int_value = 60 where key = 'ip_writes_per_5min'",
    );
  }
});

test('G-37 the signup hook: email signups only for invited addresses', async ({ request }) => {
  const r = await request.post(`${API}/auth/v1/signup`, {
    headers: H,
    data: { email: 'stranger@example.com', password: 'a-long-password-1' },
  });
  expect(r.status()).toBe(403);
});
