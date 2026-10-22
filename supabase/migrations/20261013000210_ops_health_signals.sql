-- ops_health v2: the signals runbook §6.1 needs (RFC-0003 §17.4). Same
-- signature, so the owner, the one grant (service_role) and the 200_checks
-- allowlists stay. Numbers only: no ids, keys, addresses, emails or text.
-- plpgsql so pg_cron is read only where it exists; still stable (called by GET).
create or replace function public.ops_health() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  lim_default integer := app.setting('ip_writes_per_5min');
  lim_dorm integer := coalesce(app.setting('ip_writes_per_5min_dorm'), app.setting('ip_writes_per_5min'));
  kinds text[] := array['forbidden', 'not_owner', 'rate_limited_account', 'rate_limited_ip',
                        'suspended_write', 'admin_denied', 'signup_throttled', 'invalid_input'];
  v_ip jsonb;
  v_cron jsonb := null;
begin
  -- Last hour's IP windows against their own tier's limit. The dorm's keys are
  -- rebuilt as app.ip_key builds them, with today's and yesterday's salt; ranges
  -- too wide to rebuild are only counted (their windows use the default limit).
  with dorm_text as (
    select pg_catalog.host(t.range + g.i) as k
    from app.ip_tiers t,
         pg_catalog.generate_series(0::bigint,
           case when t.tier = 'dorm' and pg_catalog.family(t.range) = 4 and pg_catalog.masklen(t.range) >= 22
                then (1::bigint << (32 - pg_catalog.masklen(t.range))) - 1 else -1 end) as g(i)
    union all
    select pg_catalog.network(pg_catalog.set_masklen(t.range::inet, 64))::text from app.ip_tiers t
    where t.tier = 'dorm' and pg_catalog.family(t.range) = 6 and pg_catalog.masklen(t.range) >= 64
  ),
  dorm_keys as (
    select distinct pg_catalog.sha256(pg_catalog.convert_to(d.k, 'UTF8') || s.salt) as ip_key
    from dorm_text d, app.salts s where s.day >= app.tokyo_today() - 1
  ),
  w as (
    select h.ip_key, h.n, (dk.ip_key is not null) as dorm
    from app.ip_hits h left join dorm_keys dk on dk.ip_key = h.ip_key
    where h.window_start > now() - interval '1 hour'
  ),
  at_limit as (
    select w.ip_key, w.dorm from w where w.n >= case when w.dorm then lim_dorm else lim_default end
  )
  select jsonb_build_object(
    'default_windows_at_limit', (select count(*) from at_limit a where not a.dorm),
    'dorm_windows_at_limit', (select count(*) from at_limit a where a.dorm),
    'dorm_windows_over_default', (select count(*) from w where w.dorm and w.n >= lim_default),
    'default_keys_3_windows', (select count(*) from (
        select 1 from at_limit a where not a.dorm group by a.ip_key having count(*) >= 3) x),
    'dorm_keys_3_windows', (select count(*) from (
        select 1 from at_limit a where a.dorm group by a.ip_key having count(*) >= 3) x),
    'dorm_ranges_not_rebuilt', (select count(*) from app.ip_tiers t where t.tier = 'dorm'
        and ((pg_catalog.family(t.range) = 4 and pg_catalog.masklen(t.range) < 22)
          or (pg_catalog.family(t.range) = 6 and pg_catalog.masklen(t.range) < 64))))
  into v_ip;

  -- The cleanup jobs (20261013000180_jobs.sql), where pg_cron exists and the
  -- owner may read its tables; otherwise null or a flag, never an error.
  begin
    if pg_catalog.to_regclass('cron.job') is not null and pg_catalog.to_regclass('cron.job_run_details') is not null then
      select jsonb_build_object(
        'jobs', (select count(*) from cron.job j where j.jobname like 'yunabi-%'),
        'succeeded_24h', (select count(*) from cron.job_run_details d join cron.job j on j.jobid = d.jobid
            where j.jobname like 'yunabi-%' and d.status = 'succeeded' and d.start_time > now() - interval '24 hours'),
        'failed_24h', (select count(*) from cron.job_run_details d join cron.job j on j.jobid = d.jobid
            where j.jobname like 'yunabi-%' and d.status = 'failed' and d.start_time > now() - interval '24 hours'),
        'unreadable', 0)
      into v_cron;
    end if;
  exception when insufficient_privilege then
    v_cron := jsonb_build_object('jobs', 0, 'succeeded_24h', 0, 'failed_24h', 0, 'unreadable', 1);
  end;

  return jsonb_build_object(
    'version', 2,
    'at_epoch', floor(extract(epoch from now()))::bigint,
    'security_1h', (select jsonb_object_agg(k.kind, coalesce(c.n, 0)) from unnest(kinds) as k(kind)
        left join (select e.kind, count(*) as n from app.security_events e
                   where e.at > now() - interval '1 hour' group by e.kind) c on c.kind = k.kind),
    'security_24h', (select jsonb_object_agg(k.kind, coalesce(c.n, 0)) from unnest(kinds) as k(kind)
        left join (select e.kind, count(*) as n from app.security_events e
                   where e.at > now() - interval '24 hours' group by e.kind) c on c.kind = k.kind),
    'accounts_1h', (select count(*) from app.accounts a where a.created_at > now() - interval '1 hour'),
    'anon_users_1h', (select count(*) from auth.users u where u.is_anonymous and u.created_at > now() - interval '1 hour'),
    'auto_hides_1h', (select count(*) from app.mod_actions m where m.action = 'auto_hide' and m.created_at > now() - interval '1 hour'),
    'auto_hides_24h', (select count(*) from app.mod_actions m where m.action = 'auto_hide' and m.created_at > now() - interval '24 hours'),
    'admin_actions_24h', (select count(*) from app.mod_actions m where m.actor_kind = 'admin' and m.created_at > now() - interval '24 hours'),
    'admin_actions_by_kind_24h', (select jsonb_object_agg(k.action, coalesce(c.n, 0))
        from unnest(array['restore', 'delete', 'dismiss', 'suspend', 'unsuspend']) as k(action)
        left join (select m.action, count(*) as n from app.mod_actions m
                   where m.actor_kind = 'admin' and m.created_at > now() - interval '24 hours'
                   group by m.action) c on c.action = k.action),
    'reports_open_over_24h', (select count(*) from app.reports r
        where r.resolution = 'open' and r.created_at < now() - interval '24 hours'),
    'ip_windows_at_limit_1h', (v_ip ->> 'default_windows_at_limit')::bigint + (v_ip ->> 'dorm_windows_at_limit')::bigint,
    'ip_1h', v_ip,
    'limits', jsonb_build_object('ip_writes_per_5min', lim_default, 'ip_writes_per_5min_dorm', lim_dorm,
        'anon_signups_per_hour', app.setting('anon_signups_per_hour'),
        'accounts_per_hour', app.setting('accounts_per_hour')),
    'cron', v_cron,
    'db_bytes', pg_catalog.pg_database_size(pg_catalog.current_database())
  );
end $$;

-- 200_checks runs before this file on a fresh database and not again in
-- production (runbook §7.1), so this file checks its own effect: the grants,
-- definer + stable + pinned search_path, and check ⑥ (no dynamic SQL).
do $$
begin
  if not has_function_privilege('service_role', 'public.ops_health()', 'execute')
     or has_function_privilege('anon', 'public.ops_health()', 'execute')
     or has_function_privilege('authenticated', 'public.ops_health()', 'execute')
     or has_function_privilege('public', 'public.ops_health()', 'execute')
     or not exists (select 1 from pg_proc p where p.oid = 'public.ops_health()'::regprocedure
                    and p.prosecdef and p.provolatile = 's' and 'search_path=""' = any (p.proconfig)
                    and p.prosrc !~* '\mexecute\M') then
    raise exception 'ops_health v2: must stay a service_role-only stable definer with search_path pinned and no dynamic SQL';
  end if;
end $$;
