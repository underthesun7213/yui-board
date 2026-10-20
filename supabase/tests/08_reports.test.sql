-- Reports: G-24 (one per person), G-25 (owner not counted), G-26 (auto-hide at
-- three), G-28 (suspended reporters), Y-R1~R3, report quota.
begin;
\ir _helpers.sql
select plan(26);

create temp table ids (k text primary key, v uuid);
insert into ids values ('o', tests.user()), ('r1', tests.user()), ('r2', tests.user()), ('r3', tests.user()),
  ('r4', tests.user()), ('r5', tests.user());
grant select on ids to public;
create function tests.id(text) returns uuid language sql as $$ select v from ids where k = $1 $$;
grant execute on function tests.id(text) to public;
create temp table it (k text primary key, v bigint);
grant all on it to public;
create function tests.it(text) returns bigint language sql as $$ select v from it where k = $1 $$;
grant execute on function tests.it(text) to public;
create function tests.report(p_who text, p_kind app.item_kind, p_item text, p_reason app.report_reason default 'spam')
returns text language plpgsql as $$
declare
  r jsonb;
begin
  perform tests.as_user(tests.id(p_who));
  r := public.submit_report(p_kind, tests.it(p_item), p_reason);
  perform tests.as_owner();
  return coalesce(r->>'status', '') || coalesce(':' || (r->>'field'), '');
end $$;
grant execute on function tests.report to public;

-- the owner posts a place and an event
select tests.as_user(tests.id('o'));
insert into it select 'p', (public.create_place(gen_random_uuid(), 'Corner shop', 'daily', '', null, 34.8244, 135.6525, 'en')->>'id')::bigint;
insert into it select 'e', (public.create_event(gen_random_uuid(), 'Tea night', tests.today() + 1, '17:00', '19:00', null, 'Lounge', '', 'en')->>'id')::bigint;
select tests.as_owner();

-- malformed and missing targets
select tests.as_user(tests.id('r1'));
select is(public.submit_report('place', tests.it('p'), null)->>'field', 'reason', 'no reason: invalid reason');
select is(public.submit_report(null, tests.it('p'), 'spam')->>'field', 'target', 'no kind: invalid target');
select is(public.submit_report('place', null, 'spam')->>'field', 'target', 'no id: invalid target');
select is(public.submit_report('place', -1, 'spam')->>'status', 'not_found', 'unknown place');
select tests.as_owner();

-- G-24: one report per person per item
select is(tests.report('r1', 'place', 'p'), 'ok', 'first report');
select is(tests.report('r1', 'place', 'p', 'wrong'), 'already_reported', 'second report by the same person');
select is((select count(*)::int from app.reports where place_id = tests.it('p')), 1, 'one row');

-- G-25: the owner's own report is kept but does not count
select is(tests.report('o', 'place', 'p'), 'ok', 'owner may report their own');
select ok((select by_owner from app.reports where place_id = tests.it('p') and reporter_id = tests.id('o')), 'marked by_owner');
select is(tests.report('r2', 'place', 'p', 'inappropriate'), 'ok', 'second person');
select ok((select auto_hidden_at is null from app.places where id = tests.it('p')), 'two others and the owner: still shown');

-- G-28: a reporter suspended later no longer counts, and a suspended account cannot report
update app.accounts set suspended_at = now() where user_id = tests.id('r2');
select is(tests.report('r2', 'event', 'e'), 'suspended', 'suspended account cannot report');
select is(tests.report('r3', 'place', 'p'), 'ok', 'third person');
select ok((select auto_hidden_at is null from app.places where id = tests.it('p')),
  'r1 + r3 count, r2 is suspended: still shown');

-- G-26: three distinct, unsuspended, non-owner reporters hide it
select is(tests.report('r4', 'place', 'p', 'privacy'), 'ok', 'fourth person');
select ok((select auto_hidden_at is not null from app.places where id = tests.it('p')), 'hidden at three');
select is((select count(*)::int from public.places_public where id = tests.it('p')), 0, 'gone from the public view');
select is((select detail->>'reporters' from app.mod_actions where action = 'auto_hide' and target_id = tests.it('p')),
  '3', 'auto_hide logged with three reporters');
select is((select (detail->'reasons'->>'privacy')::int from app.mod_actions where action = 'auto_hide' and target_id = tests.it('p')),
  1, '… and the reasons');
select is(tests.report('r5', 'place', 'p'), 'not_found', 'a hidden item cannot be reported');

-- events work the same way
select is(tests.report('r1', 'event', 'e', 'wrong'), 'ok', 'event report');
select is(tests.report('r3', 'event', 'e'), 'ok', 'event report 2');
select is(tests.report('r4', 'event', 'e'), 'ok', 'event report 3');
select ok((select auto_hidden_at is not null from app.events where id = tests.it('e')), 'event hidden at three');

-- report quota per account per day
-- r1 has used two (p, e); refusals and repeats cost nothing
update app.settings set int_value = 2 where key = 'report_per_day';
select tests.as_user(tests.id('o'));
insert into it select 'p2', (public.create_place(gen_random_uuid(), 'Bakery', 'food', '', null, 34.8244, 135.6525, 'en')->>'id')::bigint;
select tests.as_owner();
select is(tests.report('r1', 'place', 'p2'), 'rate_limited', 'over the daily report quota');

-- anonymous visitors (no account) cannot call it at all
select tests.as_anon();
select throws_ok(format('select public.submit_report(%L, %s, %L)', 'place', tests.it('p2'), 'spam'), '42501', null,
  'anon cannot report');
select tests.as_owner();

select * from finish();
rollback;
