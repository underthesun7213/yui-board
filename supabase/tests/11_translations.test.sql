-- D32 / ADR-0026: description translation — the queue trigger, claim and apply,
-- the public view, and who may call what (ERD v2 §4.8, §7.5; G-70~).
begin;
\ir _helpers.sql
select plan(31);

create temp table ids (k text primary key, v uuid);
insert into ids values ('a', tests.user());
grant select on ids to public;
create temp table r (k text primary key, v jsonb);
grant all on r to public;
create function tests.id(text) returns uuid language sql as $$ select v from ids where k = $1 $$;
create function tests.pid(text) returns bigint language sql as $$ select (v->>'id')::bigint from r where k = $1 $$;
create function tests.job(text) returns jsonb language sql as $$ select v->'jobs'->0 from r where k = $1 $$;
-- results for a claimed job: the claim, id and hash it was given, plus what to say
create function tests.result(p_claim text, p_extra jsonb) returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object(
    'claim', tests.job(p_claim)->>'claim', 'place_id', (tests.job(p_claim)->>'place_id')::bigint,
    'hash', tests.job(p_claim)->>'hash') || p_extra) $$;
-- make queued work due now (the trigger waits translation_delay_seconds)
create function tests.due() returns void language sql security definer as $$
  update app.translation_jobs set next_attempt_at = now() - interval '1 second' $$;
grant execute on all functions in schema tests to public;

-- a place written in Japanese is queued, not translated yet
select tests.as_user(tests.id('a'));
insert into r select 'p1', public.create_place(gen_random_uuid(), 'Gotenyama Station', 'transit',
  'いちばん近い駅です。', null, 34.8293, 135.6541, 'ja');
select tests.as_owner();
select is((select count(*)::int from app.translation_jobs where place_id = tests.pid('p1')), 1, 'G-70 a new description is queued');
select is((select count(*)::int from public.place_translations_public where place_id = tests.pid('p1')), 0, 'nothing public yet');

-- off by default
select tests.due();
set local role service_role;
insert into r select 'off', public.translation_claim(10);
reset role;
select is((select v->>'status' from r where k = 'off'), 'disabled', 'G-71 claim says disabled until the owner turns it on');
select is((select attempts::int from app.translation_jobs where place_id = tests.pid('p1')), 0, 'and takes nothing');

update app.settings set int_value = 1 where key = 'translation_enabled';
set local role service_role;
insert into r select 'c1', public.translation_claim(10);
reset role;
select is((select v->>'status' from r where k = 'c1'), 'ok', 'G-72 claim takes due work');
select is(jsonb_array_length((select v->'jobs' from r where k = 'c1')), 1, 'one job');
select is(tests.job('c1')->>'text', 'いちばん近い駅です。', 'with the description');
select is(tests.job('c1')->>'src', 'ja', 'its language');
select is(tests.job('c1')->'targets', '["en", "ko"]'::jsonb, 'and the other two as targets');
select set_eq($$select jsonb_object_keys(tests.job('c1'))$$, array['claim', 'place_id', 'text', 'src', 'targets', 'hash'],
  'nothing about the place beyond id, text and language (no name, author or location)');

-- claimed work is not handed out twice while its lease runs
set local role service_role;
insert into r select 'c1b', public.translation_claim(10);
reset role;
select is(jsonb_array_length((select v->'jobs' from r where k = 'c1b')), 0, 'G-73 a claimed job is not claimed again');

-- results go in, the job goes away, the view shows them
set local role service_role;
insert into r select 'a1', public.translation_apply('azure', tests.result('c1',
  '{"out": [{"lang": "en", "text": "The nearest station."}, {"lang": "ko", "text": "가장 가까운 역입니다."}]}'));
reset role;
select is((select v->>'stored' from r where k = 'a1'), '2', 'G-74 both languages stored');
select is((select count(*)::int from app.translation_jobs where place_id = tests.pid('p1')), 0, 'the job is done');
select tests.as_anon();
select set_eq($$select lang || ':' || description from public.place_translations_public where place_id = tests.pid('p1')$$,
  array['en:The nearest station.', 'ko:가장 가까운 역입니다.'], 'anyone reads them through the view');
select tests.as_owner();
select columns_are('public', 'place_translations_public', array['place_id', 'lang', 'description'],
  'the view shows no hash, provider or time');

-- editing the description drops the old translations and queues the new text
select tests.as_user(tests.id('a'));
select is((public.update_place(tests.pid('p1'), 'Gotenyama Station', 'transit', '各駅停車だけが止まります。', null,
  34.8293, 135.6541, 'ja'))->>'status', 'ok', 'the owner edits the description');
select tests.as_owner();
select is((select count(*)::int from app.place_translations where place_id = tests.pid('p1')), 0, 'G-75 old translations are gone');
select is((select attempts::int from app.translation_jobs where place_id = tests.pid('p1')), 0, 'and the new text is queued afresh');

-- a result for text that changed after the claim is not stored
select tests.due();
set local role service_role;
insert into r select 'c2', public.translation_claim(10);
insert into r select 'a2', public.translation_apply('azure',
  jsonb_set(tests.result('c2', '{"out": [{"lang": "en", "text": "Only locals stop."}]}'), '{0,hash}', '"00"'));
reset role;
select is((select v->>'stale' from r where k = 'a2'), '1', 'G-76 a stale result is counted, not stored');
select is((select count(*)::int from app.place_translations where place_id = tests.pid('p1')), 0, 'nothing stored');

-- output that fails the text rules, or a language that was not asked for, is refused
select tests.due();
update app.translation_jobs set claim_id = null;
set local role service_role;
insert into r select 'c3', public.translation_claim(10);
insert into r select 'a3', public.translation_apply('azure', tests.result('c3',
  jsonb_build_object('out', jsonb_build_array(
    jsonb_build_object('lang', 'fr', 'text', 'Seulement les omnibus.'),
    jsonb_build_object('lang', 'en', 'text', 'Only ' || chr(8238) || 'locals')))));
reset role;
select is((select v->>'rejected' from r where k = 'a3'), '2', 'G-77 a foreign language and hidden characters are refused');
select is((select last_error from app.translation_jobs where place_id = tests.pid('p1')), 'rejected_output', 'the job waits for another try');

-- a quota error pauses all translation
select tests.due();
update app.translation_jobs set claim_id = null;
set local role service_role;
insert into r select 'c4', public.translation_claim(10);
insert into r select 'a4', public.translation_apply('azure', tests.result('c4', '{"error": "quota"}'));
insert into r select 'c5', public.translation_claim(10);
reset role;
select is((select v->>'status' from r where k = 'c5'), 'paused', 'G-78 after a quota error claim says paused');
update app.translation_state set paused_until = null, paused_reason = null;

-- hidden places are not sent out, and their translations leave the view
insert into app.place_translations (place_id, lang, description, source_hash, provider)
select tests.pid('p1'), 'en', 'Only locals stop.', sha256(convert_to(description, 'UTF8')), 'azure'
from app.places where id = tests.pid('p1');
update app.places set auto_hidden_at = now() where id = tests.pid('p1');
select tests.due();
update app.translation_jobs set claim_id = null, attempts = 0;
set local role service_role;
insert into r select 'c6', public.translation_claim(10);
reset role;
select is(jsonb_array_length((select v->'jobs' from r where k = 'c6')), 0, 'a hidden place is not claimed');
select is((select count(*)::int from public.place_translations_public where place_id = tests.pid('p1')), 0,
  'and its translations are not public');
update app.places set auto_hidden_at = null where id = tests.pid('p1');

-- deleting the place removes its translations and work
select tests.as_user(tests.id('a'));
select is((public.delete_place(tests.pid('p1')))->>'status', 'ok', 'the owner deletes the place');
select tests.as_owner();
select is((select count(*)::int from app.place_translations where place_id = tests.pid('p1'))
        + (select count(*)::int from app.translation_jobs where place_id = tests.pid('p1')), 0,
  'its translations and work are gone');

-- malformed input is a status; clients cannot call either function
set local role service_role;
select is(public.translation_claim(0)->>'field', 'max_jobs', 'G-79 claim refuses 0 jobs');
select is(public.translation_apply('openai', '[]')->>'field', 'provider', 'apply refuses an unknown provider');
select is(public.translation_apply('azure', '{}')->>'field', 'results', 'apply wants an array');
reset role;
select tests.as_user(tests.id('a'));
select throws_ok('select public.translation_claim(1)', '42501', null, 'an account cannot claim work');

select * from finish();
rollback;
