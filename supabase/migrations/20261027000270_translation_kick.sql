-- D32 / ADR-0026: wake the translate Edge Function, and clean up after it.
--
-- app.translation_kick runs every minute from pg_cron. It does nothing unless
-- translation is on, not paused, and some work is due; then it POSTs an empty
-- body to the function with the wake-up secret. The function's address and
-- that secret live in Vault (names translate_function_url and
-- translate_kick_secret), put there by the owner (runbook §7.4) — never in a
-- migration. Missing either, the kick does nothing.
--
-- The schedule is added only where pg_cron, pg_net and Vault all exist: the
-- hosted project. The local stack has none of them, so there the kick is never
-- scheduled and tests call it only on paths that return before Vault.

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
  end if;
end $$;

create function app.translation_kick() returns void
language plpgsql security definer set search_path = '' as $$
declare
  url text;
  secret text;
begin
  if app.setting('translation_enabled') = 0 then return; end if;
  if exists (select 1 from app.translation_state where paused_until > now()) then return; end if;
  if not exists (
    select 1 from app.translation_jobs j
    join app.places p on p.id = j.place_id
    where j.next_attempt_at <= now()
      and (j.claim_id is null
           or j.claimed_at < now() - pg_catalog.make_interval(secs => app.setting('translation_lease_seconds')))
      and j.attempts < app.setting('translation_max_attempts')
      and p.deleted_at is null and p.auto_hidden_at is null and p.suspension_hidden_at is null
  ) then
    return;
  end if;
  select s.decrypted_secret into url from vault.decrypted_secrets s where s.name = 'translate_function_url';
  select s.decrypted_secret into secret from vault.decrypted_secrets s where s.name = 'translate_kick_secret';
  if url is null or secret is null then return; end if;
  perform net.http_post(
    url := url,
    body := '{}'::jsonb,
    headers := jsonb_build_object('x-yunabi-kick', secret, 'content-type', 'application/json'),
    timeout_milliseconds := 30000);
end $$;

-- Usage rows after 90 days, and work that ran out of attempts 30 days ago
-- (ERD v2 §6 — kept apart from purge_records so that function stays as it was).
create function app.purge_translation_records() returns void
language sql security definer set search_path = '' as $$
  delete from app.translation_usage where day < (now() at time zone 'UTC')::date - 90;
  delete from app.translation_jobs
  where attempts >= app.setting('translation_max_attempts') and enqueued_at < now() - interval '30 days';
$$;

revoke execute on function app.translation_kick(), app.purge_translation_records()
  from public, anon, authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('yunabi-purge-translation', '15 * * * *', 'select app.purge_translation_records()');
    if exists (select 1 from pg_extension where extname = 'pg_net')
       and exists (select 1 from pg_namespace where nspname = 'vault') then
      perform cron.schedule('yunabi-translation-kick', '* * * * *', 'select app.translation_kick()');
    end if;
  end if;
end $$;

do $$
declare
  bad text;
begin
  select string_agg(p.proname, ', ') into bad
  from pg_catalog.pg_proc p
  where p.oid in ('app.translation_kick()'::regprocedure, 'app.purge_translation_records()'::regprocedure)
    and (not p.prosecdef or not coalesce('search_path=""' = any (p.proconfig), false) or p.prosrc ~* '\mexecute\M'
         or pg_catalog.has_function_privilege('anon', p.oid, 'execute')
         or pg_catalog.has_function_privilege('authenticated', p.oid, 'execute')
         or pg_catalog.has_function_privilege('service_role', p.oid, 'execute'));
  if bad is not null then raise exception 'translation jobs: definer, search_path, no dynamic SQL, no client EXECUTE: %', bad; end if;
end $$;
