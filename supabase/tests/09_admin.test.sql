-- The admin functions: G-30~G-36 (who is an admin, fail-closed), G-27
-- (restore protection until the owner edits), Y-R4~R7, Y-S3.
begin;
\ir _helpers.sql
select plan(62);

create temp table ids (k text primary key, v uuid);
insert into ids values ('o', tests.user()), ('r1', tests.user()), ('r2', tests.user()), ('r3', tests.user()),
  ('r4', tests.user()), ('r5', tests.user()), ('r6', tests.user()),
  ('adm', tests.user(false, 'owner@example.com')), ('stranger', tests.user(false, 'someone@example.com')),
  ('old', tests.user(false, 'former@example.com'));
grant select on ids to public;
create function tests.id(text) returns uuid language sql as $$ select v from ids where k = $1 $$;
grant execute on function tests.id(text) to public;
create temp table it (k text primary key, v bigint);
grant all on it to public;
create function tests.it(text) returns bigint language sql as $$ select v from it where k = $1 $$;
grant execute on function tests.it(text) to public;

insert into app.admins (user_id, email) values (tests.id('adm'), 'owner@example.com');
insert into app.admins (user_id, email, active) values (tests.id('old'), 'former@example.com', false);

-- sessions as Auth keeps them
create temp table sess (k text primary key, v uuid);
grant select on sess to public;
insert into sess values ('adm', gen_random_uuid()), ('adm_aal1', gen_random_uuid()), ('adm_old', gen_random_uuid()),
  ('adm_ended', gen_random_uuid()),
  ('stranger', gen_random_uuid()), ('old', gen_random_uuid());
insert into auth.sessions (id, user_id, created_at, aal, not_after) values
  ((select v from sess where k = 'adm_ended'), tests.id('adm'), now() - interval '1 hour', 'aal2', now() - interval '1 minute');
insert into auth.sessions (id, user_id, created_at, aal) values
  ((select v from sess where k = 'adm'), tests.id('adm'), now() - interval '1 hour', 'aal2'),
  ((select v from sess where k = 'adm_aal1'), tests.id('adm'), now(), 'aal1'),
  ((select v from sess where k = 'adm_old'), tests.id('adm'), now() - interval '13 hours', 'aal2'),
  ((select v from sess where k = 'stranger'), tests.id('stranger'), now(), 'aal2'),
  ((select v from sess where k = 'old'), tests.id('old'), now(), 'aal2');

-- Act as a signed-in, non-anonymous user at aal2 on a session, unless told otherwise.
create function tests.as_admin(p_user text, p_sess text, p_extra jsonb default '{}') returns void
language sql as $$
  select tests.as_user(tests.id(p_user), jsonb_build_object('is_anonymous', false, 'aal', 'aal2',
    'session_id', (select v from sess where k = p_sess)) || p_extra)
$$;
grant execute on function tests.as_admin to public;
create function tests.whoami(p_user text, p_sess text, p_extra jsonb default '{}') returns text
language plpgsql as $$
declare
  r jsonb;
begin
  perform tests.as_admin(p_user, p_sess, p_extra);
  r := public.admin_whoami();
  perform tests.as_owner();
  return r->>'status';
end $$;
grant execute on function tests.whoami to public;
create function tests.queue_refused(p_user text, p_sess text, p_extra jsonb default '{}') returns boolean
language plpgsql as $$
begin
  perform tests.as_admin(p_user, p_sess, p_extra);
  perform * from public.admin_queue();
  perform tests.as_owner();
  return false;
exception when insufficient_privilege then
  perform tests.as_owner();
  return true;
end $$;
grant execute on function tests.queue_refused to public;
create function tests.report(p_who text, p_kind app.item_kind, p_item text) returns text
language plpgsql as $$
declare
  r jsonb;
begin
  perform tests.as_user(tests.id(p_who));
  r := public.submit_report(p_kind, tests.it(p_item), 'spam');
  perform tests.as_owner();
  return r->>'status';
end $$;
grant execute on function tests.report to public;

-- G-30~G-36: every way of not being an admin is refused, and recorded
select is(tests.whoami('adm', 'adm'), 'ok', 'admin at aal2 on a fresh session');
select is(tests.whoami('adm', 'adm', '{"is_anonymous":true}'), 'forbidden', 'anonymous token');
select is(tests.whoami('adm', 'adm', '{"aal":"aal1"}'), 'forbidden', 'aal1 token');
select is(tests.whoami('adm', 'adm_aal1', '{}'), 'forbidden', 'aal2 token on an aal1 session');
select is(tests.whoami('adm', 'adm', '{"session_id":null}'), 'forbidden', 'no session id');
select is(tests.whoami('adm', 'adm', '{"session_id":"not-a-uuid"}'), 'forbidden', 'malformed session id');
select is(tests.whoami('adm', 'stranger'), 'forbidden', 'someone else''s session');
select is(tests.whoami('adm', 'nosuch'), 'forbidden', 'a session that no longer exists (signed out)');
select is(tests.whoami('adm', 'adm_old'), 'forbidden', 'session older than admin_session_hours');
select is(tests.whoami('stranger', 'stranger'), 'forbidden', 'not on the allowlist');
select is(tests.whoami('old', 'old'), 'forbidden', 'inactive admin');
select is(tests.whoami('adm', 'adm_ended'), 'forbidden', 'session past its not_after');
-- a missing session limit refuses instead of lifting the limit
delete from app.settings where key = 'admin_session_hours';
select is(tests.whoami('adm', 'adm'), 'forbidden', 'no admin_session_hours setting: refused');
insert into app.settings (key, int_value) values ('admin_session_hours', 12);
select is((select count(*)::int from app.security_events where kind = 'admin_denied'), 12, 'every refusal recorded');
select ok(tests.queue_refused('adm', 'adm', '{"aal":"aal1"}'), 'admin_queue raises for aal1');
select ok(tests.queue_refused('stranger', 'stranger'), 'admin_queue raises for a non-admin');
select ok(tests.queue_refused('adm', 'adm_old'), 'admin_queue raises on an old session');
select ok(not tests.queue_refused('adm', 'adm'), 'admin_queue answers the admin');
select tests.as_anon();
select throws_ok('select public.admin_whoami()', '42501', null, 'anon cannot even ask');
select tests.as_owner();
select tests.as_admin('adm', 'adm');
select is(public.admin_whoami()->>'email', 'owner@example.com', 'whoami returns the email');
select tests.as_owner();

-- content to moderate: a place hidden by three reports
select tests.as_user(tests.id('o'));
insert into it select 'p', (public.create_place(gen_random_uuid(), 'Corner 100%_shop', 'daily', '', null, 34.8244, 135.6525, 'en')->>'id')::bigint;
insert into it select 'p2', (public.create_place(gen_random_uuid(), 'Bakery', 'food', '', null, 34.8244, 135.6525, 'en')->>'id')::bigint;
insert into it select 'e', (public.create_event(gen_random_uuid(), 'Tea night', tests.today(), '17:00', '19:00', null, 'Lounge', '', 'en')->>'id')::bigint;
select tests.as_owner();
select tests.report('r1', 'place', 'p') is not null; select tests.report('r2', 'place', 'p') is not null; select tests.report('r3', 'place', 'p') is not null;
select tests.report('r1', 'event', 'e') is not null;
create temp table refs as select k, (select ref from app.accounts a where a.user_id = ids.v) as ref from ids;
grant select on refs to public;

select tests.as_admin('adm', 'adm');
-- Y-R4: the queue
select is((select state from public.admin_queue('hidden') where kind = 'place' and id = tests.it('p')), 'auto_hidden', 'queue: hidden');
select is((select reports_open from public.admin_queue('hidden') where kind = 'place' and id = tests.it('p')), 3, 'queue: three open reports');
select is((select (reasons->>'spam')::int from public.admin_queue('all') where kind = 'place' and id = tests.it('p')), 3, 'queue: by reason');
select is((select count(*)::int from public.admin_queue('reported') where kind = 'event' and id = tests.it('e')), 1, 'queue: reported but shown');
select is((select account_ref from public.admin_queue() where kind = 'place' and id = tests.it('p')),
  (select ref from refs where k = 'o'), 'queue: the owner''s pseudonym');
-- Y-R9: never who reported
select ok(public.admin_item('place', tests.it('p'))::text !~ (select string_agg(v::text, '|') from ids where k like 'r%'),
  'item: no reporter id anywhere');
select is(public.admin_item('place', -1)->>'status', 'not_found', 'item: unknown');

-- G-27 / Y-R6: restore protects until the owner edits
select is(public.admin_restore('place', tests.it('p'), 'false alarm')->>'status', 'ok', 'restore');
select tests.as_owner();
select ok((select auto_hidden_at is null and restored_at is not null from app.places where id = tests.it('p')), 'shown and protected');
select is((select count(*)::int from app.reports where place_id = tests.it('p') and resolution = 'restored'), 3, 'reports closed as restored');
select is((select actor_email::text from app.mod_actions where action = 'restore' and target_id = tests.it('p')),
  'owner@example.com', 'restore logged with the admin''s email');
select tests.report('r4', 'place', 'p') is not null; select tests.report('r5', 'place', 'p') is not null; select tests.report('r6', 'place', 'p') is not null;
select ok((select auto_hidden_at is null from app.places where id = tests.it('p')), 'three new reports: still shown (protected)');
select tests.as_user(tests.id('o'));
select public.update_place(tests.it('p'), 'Corner 100%_shop', 'daily', 'edited', null, 34.8244, 135.6525, 'en');
select tests.as_owner();
select ok((select auto_hidden_at is not null and restored_at is null from app.places where id = tests.it('p')),
  'the owner''s edit ends protection and the open reports hide it again');

select tests.as_admin('adm', 'adm');
-- bulk restore: a dry run changes nothing
select is((public.admin_restore_bulk(now() - interval '1 hour', now() + interval '1 hour'))->>'count', '1', 'dry run counts');
select is((select count(*)::int from public.admin_queue('hidden') where id = tests.it('p') and kind = 'place'), 1, 'dry run changed nothing');
select is((public.admin_restore_bulk(now() + interval '1 hour', now()))->>'field', 'period', 'bad period');
select is((public.admin_restore_bulk(now() - interval '1 hour', now() + interval '1 hour', 'wave', false, 2))->>'status',
  'changed', 'bulk restore stops when the list is not what was previewed');
select is((public.admin_restore_bulk(now() - interval '1 hour', now() + interval '1 hour', 'wave', false))->>'status',
  'changed', '… or when no count was given');
select is((public.admin_restore_bulk(now() - interval '1 hour', now() + interval '1 hour', 'wave', false, 1))->>'count', '1', 'bulk restore');
select is((select state from public.admin_queue() where id = tests.it('p') and kind = 'place'), 'visible', 'restored');

select is((public.admin_restore('event', tests.it('e')))->>'status', 'not_found', 'a shown item is not "restored"');
select tests.as_owner();

-- Y-R6 for weekly events: changing one week ends the protection too
select tests.as_user(tests.id('o'));
insert into it select 'w', (public.create_event(gen_random_uuid(), 'Weekly chat', tests.today() + 1, '17:00', '19:00',
  tests.today() + 8, 'Lounge', '', 'en')->>'id')::bigint;
select tests.as_owner();
select tests.report('r1', 'event', 'w') is not null; select tests.report('r2', 'event', 'w') is not null; select tests.report('r3', 'event', 'w') is not null;
select tests.as_admin('adm', 'adm');
select is((public.admin_restore('event', tests.it('w')))->>'status', 'ok', 'weekly event restored');
select tests.as_owner();
select tests.report('r4', 'event', 'w') is not null; select tests.report('r5', 'event', 'w') is not null; select tests.report('r6', 'event', 'w') is not null;
select ok((select auto_hidden_at is null from app.events where id = tests.it('w')), 'protected: still shown');
select tests.as_user(tests.id('o'));
select is((public.set_occurrence(tests.it('w'), tests.today() + 8, false, 'Buy pills', null, null, null, null))->>'status', 'ok', 'owner changes one week');
select tests.as_owner();
select ok((select auto_hidden_at is not null and restored_at is null from app.events where id = tests.it('w')),
  'one week changed: protection ends and the open reports hide it');
select tests.as_admin('adm', 'adm');

-- dismiss and delete
select is((public.admin_dismiss('event', tests.it('e')))->>'count', '1', 'dismiss the event''s report');
select is((public.admin_dismiss('event', tests.it('e')))->>'status', 'not_found', 'nothing left to dismiss');
select is((public.admin_delete('place', tests.it('p2'), 'request by mail'))->>'status', 'ok', 'delete');
select is((public.admin_delete('place', tests.it('p2')))->>'status', 'not_found', 'delete twice');
select is((public.admin_restore('place', tests.it('p2')))->>'status', 'not_found', 'a deleted item is not restored');

-- Y-R7: suspend hides everything the account shows; unsuspend leaves it hidden
select is((public.admin_suspend((select ref from refs where k = 'o'), 'spam wave'))->>'places_hidden',
  '1', 'suspend hides the shown place');
select is((public.admin_suspend('a-nosuch'))->>'status', 'not_found', 'unknown account');
-- nothing of a suspended account comes back, one by one or in bulk
select is((public.admin_restore('place', tests.it('p')))->>'status', 'account_suspended', 'restore waits for unsuspend');
select is((public.admin_restore_bulk(now() - interval '1 hour', now() + interval '1 hour'))->>'skipped_suspended', '1',
  'bulk restore leaves the suspended account''s hidden week out');
select is((public.admin_restore_bulk(now() - interval '1 hour', now() + interval '1 hour'))->>'count', '0', '… and lists nothing');
select tests.as_owner();
select is((select count(*)::int from public.events_public where id = tests.it('e')), 0, 'the event is hidden too');
select is(tests.report('o', 'place', 'p'), 'suspended', 'the suspended owner cannot report');
select tests.as_admin('adm', 'adm');
select is((public.admin_unsuspend((select ref from refs where k = 'o')))->>'status', 'ok', 'unsuspend');
select tests.as_owner();
select ok((select suspension_hidden_at is not null from app.events where id = tests.it('e')), 'items stay hidden after unsuspend');

-- search matches % and _ literally; the log is newest first
select tests.as_admin('adm', 'adm');
select is((select count(*)::int from public.admin_search('100%_')), 1, 'search: % and _ taken literally');
select is((select count(*)::int from public.admin_search('0%%')), 0, 'search: no wildcard');
select is((select action from public.admin_audit_log(1)), 'unsuspend', 'log: newest first');
select tests.as_owner();

select * from finish();
rollback;
