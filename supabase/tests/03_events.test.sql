-- Events: Y-K4~K9, G-23 (all four views), G-29, data_version.
begin;
\ir _helpers.sql
select plan(36);

create temp table ids (k text primary key, v uuid);
insert into ids values ('a', tests.user()), ('b', tests.user());
grant select on ids to public;
create function tests.id(text) returns uuid language sql as $$ select v from ids where k = $1 $$;
create function tests.ev(p_start date, p_weekly date default null, p_title text default 'Board games')
returns jsonb language sql as $$
  select public.create_event(gen_random_uuid(), p_title, p_start, '17:00', '19:00', p_weekly, 'Lounge', 'Come by', 'en')
$$;
create temp table r (k text primary key, v jsonb);
grant all on r to public;
create function tests.r(text) returns bigint language sql as $$ select (v->>'id')::bigint from r where k = $1 $$;
grant execute on all functions in schema tests to public;

select tests.as_user(tests.id('a'));
-- Y-K4: today or later; end after start
-- the latest slot of the day, so the test does not depend on the hour it runs
select is((public.create_event(gen_random_uuid(), 'Board games', tests.today(), '23:00', '23:59', null, 'Lounge', 'Come by', 'en'))->>'status',
  'ok', 'an event today');
select is((tests.ev(tests.today() - 1))->>'field', 'start_date', 'not in the past');
select is((public.create_event(gen_random_uuid(), 'x', tests.today(), '19:00', '19:00', null, '', '', 'en'))->>'field',
  'time', 'end must be after start');
select is((public.create_event(gen_random_uuid(), '', tests.today(), '17:00', '19:00', null, '', '', 'en'))->>'field',
  'title', 'title required');
select is((public.create_event(gen_random_uuid(), 'x', tests.today(), '17:00', '19:00', null, repeat('a', 61), '', 'en'))->>'field',
  'place_text', 'place at most 60');
-- M3: sane dates and times
select is((tests.ev(tests.today() + 366))->>'field', 'start_date', 'not more than a year ahead');
select is((public.create_event(gen_random_uuid(), 'x', 'infinity', '17:00', '19:00', null, '', '', 'en'))->>'field',
  'start_date', 'not infinity');
select is((public.create_event(gen_random_uuid(), 'x', tests.today() + 1, '23:00', '24:00', null, '', '', 'en'))->>'field',
  'time', '24:00 is not a time');
select is((public.create_event(gen_random_uuid(), 'x', tests.today() + 1, '10:00:30', '11:00', null, '', '', 'en'))->>'field',
  'time', 'whole minutes only');
select is((public.create_event(gen_random_uuid(), 'x', tests.today(), '00:00', '00:01', null, '', '', 'en'))->>'field',
  'time', 'a slot that already ended today');

-- Y-K6: weekly, same weekday, at most 26 times
insert into r select 'w', tests.ev(tests.today() + 1, tests.today() + 1 + 175);
select is((select v->>'status' from r where k = 'w'), 'ok', '26 weeks is fine');
select is((tests.ev(tests.today(), tests.today() + 182))->>'field', 'weekly_until', '27 weeks is too many');
select is((tests.ev(tests.today(), tests.today() + 10))->>'field', 'weekly_until', 'end must fall on the same weekday');

-- Y-K7: one week changed or cancelled
select is((public.set_occurrence(tests.r('w'), tests.today() + 8, false, 'Karaoke', null, null, null, null))->>'status',
  'ok', 'change one week');
select is((public.set_occurrence(tests.r('w'), tests.today() + 15, true, null, null, null, null, null))->>'status',
  'ok', 'cancel one week');
select is((public.set_occurrence(tests.r('w'), tests.today() + 9, true, null, null, null, null, null))->>'field',
  'occurs_on', 'a day that is not in the series');
select is((public.set_occurrence(tests.r('w'), tests.today() + 8, false, null, '20:00', null, null, null))->>'field',
  'time', 'changed start must stay before the end');
select is((select title from public.event_occurrences_public where event_id = tests.r('w') and occurs_on = tests.today() + 8),
  'Karaoke', 'the change is public');
select is((public.clear_occurrence(tests.r('w'), tests.today() + 8))->>'status', 'ok', 'undo a change');
select is((select count(*)::int from public.event_occurrences_public where event_id = tests.r('w')), 1, 'one change left');

-- moving the series drops changes that no longer land on its dates
select is((public.update_event(tests.r('w'), 'Board games', tests.today() + 2, '17:00', '19:00', tests.today() + 2 + 7, '', '', 'en'))->>'status',
  'ok', 'move a series that has not started');
select is((select count(*)::int from public.event_occurrences_public where event_id = tests.r('w')), 0, 'stray week changes removed');

-- M2: a week change whose times no longer fit the edited series goes back to the series times
select public.set_occurrence(tests.r('w'), tests.today() + 9, false, null, null, '20:00', null, null);
select is((public.update_event(tests.r('w'), 'Board games', tests.today() + 2, '20:30', '21:30', tests.today() + 2 + 7, '', '', 'en'))->>'status',
  'ok', 'series moved later than the week''s own end');
select ok((select coalesce(o.end_time, '21:30') > coalesce(o.start_time, '20:30') from public.event_occurrences_public o
           where o.event_id = tests.r('w') and o.occurs_on = tests.today() + 9), 'the week never ends before it starts');

-- Y-K8: only the owner
select tests.as_owner();
select tests.as_user(tests.id('b'));
select is((public.update_event(tests.r('w'), 'mine', tests.today() + 2, '17:00', '19:00', null, '', '', 'en'))->>'status',
  'not_found', 'B cannot edit A''s event');
select is((public.set_occurrence(tests.r('w'), tests.today() + 2, true, null, null, null, null, null))->>'status',
  'not_found', 'B cannot cancel A''s week');

-- a week that is over cannot be changed or reset
select tests.as_owner();
insert into app.events (title, start_date, start_time, end_time, weekly_until, lang)
  values ('Running', tests.today() - 7, '00:00', '00:01', tests.today() + 7, 'en') returning id \gset run_
insert into app.event_owners (event_id, owner_id, client_token) values (:run_id, tests.id('a'), gen_random_uuid());
select tests.as_user(tests.id('a'));
select is((public.set_occurrence(:run_id, tests.today() - 7, true, null, null, null, null, null))->>'status',
  'past_event', 'cannot cancel a week that is over');
select is((public.clear_occurrence(:run_id, tests.today() - 7))->>'status', 'past_event', 'cannot reset a week that is over');

-- data_version moves when something public changes
select tests.as_owner();
create temp table v0 as select public.data_version() as v;
grant select on v0 to public;
select tests.as_user(tests.id('a'));
select public.create_event(gen_random_uuid(), 'bump', tests.today() + 3, '10:00', '11:00', null, '', '', 'en');
select ok(public.data_version() > (select v from v0), 'data_version goes up on a new event');

-- G-29 / Y-K9: an event that is over cannot be edited, but can be deleted
select tests.as_owner();
insert into app.events (title, start_date, start_time, end_time, lang)
  values ('Past', tests.today() - 3, '10:00', '11:00', 'en') returning id \gset past_
insert into app.event_owners (event_id, owner_id, client_token)
  select :past_id, tests.id('a'), gen_random_uuid() from app.accounts where user_id = tests.id('a');
select tests.as_user(tests.id('a'));
select is((public.update_event(:past_id, 'Past 2', tests.today() - 3, '10:00', '11:00', null, '', '', 'en'))->>'status',
  'past_event', 'past event cannot be edited');
select is((public.delete_event(:past_id))->>'status', 'ok', 'but can be deleted');

-- G-23: hidden or deleted events leave every view, their week changes too
insert into r select 'h', tests.ev(tests.today() + 7, tests.today() + 21, 'Hidden one');
select public.set_occurrence(tests.r('h'), tests.today() + 14, true, null, null, null, null, null);
select tests.as_owner();
update app.events set auto_hidden_at = now() where id = tests.r('h');
select is((select count(*)::int from public.events_public where id = tests.r('h')), 0, 'auto-hidden event not public');
select is((select count(*)::int from public.event_occurrences_public where event_id = tests.r('h')), 0, 'nor its week changes');
update app.events set auto_hidden_at = null, suspension_hidden_at = now() where id = tests.r('h');
select is((select count(*)::int from public.events_public where id = tests.r('h')), 0, 'suspension-hidden event not public');
update app.events set suspension_hidden_at = null, deleted_at = now(), deleted_by = 'owner' where id = tests.r('h');
select is((select count(*)::int from public.event_occurrences_public where event_id = tests.r('h')), 0, 'deleted event''s weeks not public');

-- G-23: prefecture_counts leaves hidden places out
select tests.as_owner();
create temp table pc as select coalesce((select n from public.prefecture_counts where pref = '27'), 0) as n;
insert into app.places (name, category, lat, lng, pref, lang, auto_hidden_at)
  values ('hidden one', 'food', 34.82, 135.65, '27', 'en', now());
select is(coalesce((select n from public.prefecture_counts where pref = '27'), 0), (select n from pc), 'a hidden place is not counted');

select * from finish();
rollback;
