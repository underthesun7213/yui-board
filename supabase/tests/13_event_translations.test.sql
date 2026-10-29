-- TR-Q2: event translation — the queue trigger, event work in claim and apply,
-- the public view, and the place path unchanged beside it (G-80~).
begin;
\ir _helpers.sql
select plan(24);

create temp table ids (k text primary key, v uuid);
insert into ids values ('a', tests.user());
grant select on ids to public;
create temp table r (k text primary key, v jsonb);
grant all on r to public;
create function tests.id(text) returns uuid language sql as $$ select v from ids where k = $1 $$;
create function tests.eid(text) returns bigint language sql as $$ select (v->>'id')::bigint from r where k = $1 $$;
create function tests.job(text) returns jsonb language sql as $$ select v->'jobs'->0 from r where k = $1 $$;
create function tests.result(p_claim text, p_extra jsonb) returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object(
    'claim', tests.job(p_claim)->>'claim', 'event_id', (tests.job(p_claim)->>'event_id')::bigint,
    'hash', tests.job(p_claim)->>'hash') || p_extra) $$;
create function tests.due() returns void language sql security definer as $$
  update app.event_translation_jobs set next_attempt_at = now() - interval '1 second', claim_id = null;
  update app.translation_jobs set next_attempt_at = now() + interval '1 day' $$;
grant execute on all functions in schema tests to public;

-- an event written in Japanese with no body is queued
select tests.as_user(tests.id('a'));
insert into r select 'e1', public.create_event(gen_random_uuid(), '花火大会', tests.today() + 3, '19:00', '20:30',
  null, '中庭', '', 'ja');
select tests.as_owner();
select is((select count(*)::int from app.event_translation_jobs where event_id = tests.eid('e1')), 1,
  'G-80 a new event is queued');

update app.settings set int_value = 1 where key = 'translation_enabled';
select tests.due();
set local role service_role;
insert into r select 'c1', public.translation_claim(10);
reset role;
select is(jsonb_array_length((select v->'jobs' from r where k = 'c1')), 1, 'G-81 claim hands out the event');
select is(tests.job('c1')->'texts', '{"title": "花火大会", "place_text": "中庭"}'::jsonb,
  'with its non-empty texts by name (no empty body)');
select is(tests.job('c1')->'targets', '["en", "ko"]'::jsonb, 'into the other two languages');
select set_eq($$select jsonb_object_keys(tests.job('c1'))$$, array['claim', 'event_id', 'texts', 'src', 'targets', 'hash'],
  'nothing about the event beyond its id, texts and language');

-- results go in and the view shows them
set local role service_role;
insert into r select 'a1', public.translation_apply('azure', tests.result('c1',
  '{"out": [{"lang": "en", "title": "Fireworks", "place_text": "Courtyard"},
            {"lang": "ko", "title": "불꽃놀이", "place_text": "안뜰"}]}'));
reset role;
select is((select v->>'stored' from r where k = 'a1'), '2', 'G-82 both languages stored');
select is((select count(*)::int from app.event_translation_jobs where event_id = tests.eid('e1')), 0, 'the job is done');
select tests.as_anon();
select set_eq($$select lang || ':' || title || ':' || place_text || ':' || body
                from public.event_translations_public where event_id = tests.eid('e1')$$,
  array['en:Fireworks:Courtyard:', 'ko:불꽃놀이:안뜰:'], 'anyone reads them through the view');
select tests.as_owner();
select columns_are('public', 'event_translations_public', array['event_id', 'lang', 'title', 'place_text', 'body'],
  'the view shows no hash, provider or time');

-- a body the original does not have, a missing title or hidden characters are refused
select tests.as_user(tests.id('a'));
select is((public.update_event(tests.eid('e1'), '花火大会', tests.today() + 3, '19:00', '20:30', null, '中庭',
  '雨天中止です。', 'ja'))->>'status', 'ok', 'the owner adds a body');
select tests.as_owner();
select is((select count(*)::int from app.event_translations where event_id = tests.eid('e1')), 0,
  'G-83 old translations are gone');
select tests.due();
set local role service_role;
insert into r select 'c2', public.translation_claim(10);
insert into r select 'a2', public.translation_apply('azure', tests.result('c2',
  jsonb_build_object('out', jsonb_build_array(
    jsonb_build_object('lang', 'en', 'title', 'Fireworks', 'place_text', 'Courtyard'),
    jsonb_build_object('lang', 'ko', 'place_text', '안뜰', 'body', '비가 오면 취소.'),
    jsonb_build_object('lang', 'fr', 'title', 'Feux', 'place_text', 'Cour', 'body', 'Annulé.'),
    jsonb_build_object('lang', 'en', 'title', 'Fire' || chr(8238) || 'works', 'place_text', 'Courtyard', 'body', 'Off if rain.')))));
reset role;
select is((select v->>'rejected' from r where k = 'a2'), '4',
  'G-84 a missing body or title, a foreign language and hidden characters are refused');
select is((select last_error from app.event_translation_jobs where event_id = tests.eid('e1')), 'rejected_output',
  'the job waits for another try');

-- a result for text that changed after the claim is not stored
select tests.due();
set local role service_role;
insert into r select 'c3', public.translation_claim(10);
insert into r select 'a3', public.translation_apply('azure',
  jsonb_set(tests.result('c3', '{"out": [{"lang": "en", "title": "F", "place_text": "C", "body": "B"}]}'),
  '{0,hash}', '"00"'));
reset role;
select is((select v->>'stale' from r where k = 'a3'), '1', 'G-85 a stale result is counted, not stored');

-- events go first, places after them, in one claim
select tests.as_user(tests.id('a'));
insert into r select 'p1', public.create_place(gen_random_uuid(), 'Claim Cafe', 'food', 'いいカフェ。', null,
  34.82, 135.65, 'ja');
select tests.as_owner();
select tests.due();
update app.translation_jobs set next_attempt_at = now() - interval '1 second';
set local role service_role;
insert into r select 'c4', public.translation_claim(10);
reset role;
select is((select string_agg(case when j ? 'event_id' then 'event' else 'place' end, ',' order by n)
           from jsonb_array_elements((select v->'jobs' from r where k = 'c4')) with ordinality x(j, n)),
  'event,place', 'G-86 one claim carries events first, then places');
select is((select v->'jobs'->1->>'text' from r where k = 'c4'), 'いいカフェ。', 'the place job is as before');

-- a week's override does not queue anything; an event that is over is not claimed
select tests.as_user(tests.id('a'));
-- starts tomorrow: one that started today is refused once its time has passed
insert into r select 'w', public.create_event(gen_random_uuid(), 'Weekly tea', tests.today() + 1, '17:00', '18:00',
  tests.today() + 15, 'Lounge', '', 'en');
select tests.as_owner();
delete from app.event_translation_jobs where event_id = tests.eid('w');
select tests.as_user(tests.id('a'));
select is((public.set_occurrence(tests.eid('w'), tests.today() + 8, false, 'Karaoke', null, null, null, null))->>'status',
  'ok', 'the owner rewrites one week');
select tests.as_owner();
select is((select count(*)::int from app.event_translation_jobs where event_id = tests.eid('w')), 0,
  'G-87 a week''s override is not queued');
update app.events set start_date = tests.today() - 1 where id = tests.eid('e1');
select tests.due();
update app.translation_jobs set claim_id = null, next_attempt_at = now() + interval '1 day';
set local role service_role;
insert into r select 'c5', public.translation_claim(10);
reset role;
select is(jsonb_array_length((select v->'jobs' from r where k = 'c5')), 0, 'G-88 an event that is over is not claimed');
select app.purge_translation_records();
select is((select count(*)::int from app.event_translation_jobs where event_id = tests.eid('e1')), 0,
  'and the cleanup drops its work');
update app.events set start_date = tests.today() + 3 where id = tests.eid('e1');

-- hidden events leave the view; deleted ones lose their translations
insert into app.event_translations (event_id, lang, title, place_text, body, source_hash, provider)
select tests.eid('e1'), 'en', 'Fireworks', 'Courtyard', 'Off if rain.',
       app.event_text_hash(title, place_text, body), 'azure'
from app.events where id = tests.eid('e1');
update app.events set auto_hidden_at = now() where id = tests.eid('e1');
select is((select count(*)::int from public.event_translations_public where event_id = tests.eid('e1')), 0,
  'G-89 a hidden event''s translations are not public');
update app.events set auto_hidden_at = null where id = tests.eid('e1');
select tests.as_user(tests.id('a'));
select is((public.delete_event(tests.eid('e1')))->>'status', 'ok', 'the owner deletes the event');
select tests.as_owner();
select is((select count(*)::int from app.event_translations where event_id = tests.eid('e1'))
        + (select count(*)::int from app.event_translation_jobs where event_id = tests.eid('e1')), 0,
  'its translations and work are gone');

select tests.as_user(tests.id('a'));
select throws_ok('select * from app.event_translations', '42501', null, 'an account cannot read the table');

select * from finish();
rollback;
