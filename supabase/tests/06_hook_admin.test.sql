-- The signup hook (G-51, [검토 #4]) and binding an admin ([재검토 #2], G-37).
begin;
\ir _helpers.sql
select plan(11);

-- G-51: anonymous signups over the hourly cap are refused
update app.settings set int_value = (select count(*) from auth.users where is_anonymous and created_at > now() - interval '1 hour')::int
  where key = 'anon_signups_per_hour';
select is(app.hook_before_user_created('{"user":{"is_anonymous":true}}') -> 'error' ->> 'http_code', '429', 'anon over the cap');
update app.settings set int_value = 1000000 where key = 'anon_signups_per_hour';
select is(app.hook_before_user_created('{"user":{"is_anonymous":true}}'), '{}'::jsonb, 'anon under the cap');

-- email signups only for invited addresses
select is(app.hook_before_user_created('{"user":{"is_anonymous":false,"email":"x@example.com"}}') -> 'error' ->> 'http_code',
  '403', 'uninvited email refused');
insert into app.admin_invites (email, invited_at) values ('Owner@Example.com', now() - interval '1 minute');
select is(app.hook_before_user_created('{"user":{"is_anonymous":false,"email":"owner@example.com"}}'), '{}'::jsonb,
  'invited email allowed (case-insensitive)');

-- G-37: bind_admin refuses every takeover shape
create temp table u (k text primary key, v uuid);
insert into u values
  ('anon_linked', tests.user(true, 'owner@example.com')),     -- anonymous user who attached the invited email
  ('other_email', tests.user(false, 'someone@example.com'));
update auth.users set created_at = now() - interval '1 day' where id = (select v from u where k = 'other_email');
select throws_ok(format('select app.bind_admin(%L, %L)', (select v from u where k = 'anon_linked'), 'owner@example.com'),
  'P0001', 'admin_bind_rejected', 'anonymous account with the invited email');
select throws_ok(format('select app.bind_admin(%L, %L)', (select v from u where k = 'other_email'), 'owner@example.com'),
  'P0001', 'admin_bind_rejected', 'account whose email differs');
select throws_ok(format('select app.bind_admin(%L, %L)', gen_random_uuid(), 'nobody@example.com'),
  'P0001', 'admin_bind_no_invite', 'no invitation');
-- Two users can never share an email: Auth's own unique index refuses it, so
-- the lookalike has to go before the real account can exist at all.
select throws_ok(format($$insert into auth.users (id, aud, role, email) values (%L, 'authenticated', 'authenticated', 'owner@example.com')$$, gen_random_uuid()),
  '23505', null, 'Auth refuses a second user with the same email');
delete from auth.users where id = (select v from u where k = 'anon_linked');
insert into u values ('real', tests.user(false, 'owner@example.com'));
select lives_ok(format('select app.bind_admin(%L, %L)', (select v from u where k = 'real'), 'owner@example.com'),
  'invited, confirmed, created after the invite: bound');
select is((select count(*)::int from app.admins), 1, 'one admin');
select throws_ok(format('select app.bind_admin(%L, %L)', (select v from u where k = 'real'), 'owner@example.com'),
  'P0001', 'admin_bind_invite_used', 'an invitation works once');

select * from finish();
rollback;
