-- Polled with GET every 30 s while the map or calendar is open (RFC-0003 §11.3).
create function public.data_version() returns bigint
language sql stable security definer set search_path = '' as $$
  select v from app.data_version where id = 1
$$;

-- Numbers only, for the monitoring job (service_role). No IPs, accounts or text.
create function public.ops_health() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'security_1h', (select coalesce(jsonb_object_agg(kind, n), '{}') from (
        select kind, count(*) as n from app.security_events where at > now() - interval '1 hour' group by kind) t),
    'security_24h', (select coalesce(jsonb_object_agg(kind, n), '{}') from (
        select kind, count(*) as n from app.security_events where at > now() - interval '24 hours' group by kind) t),
    'accounts_1h', (select count(*) from app.accounts where created_at > now() - interval '1 hour'),
    'auto_hides_24h', (select count(*) from app.mod_actions where action = 'auto_hide' and created_at > now() - interval '24 hours'),
    'admin_actions_24h', (select count(*) from app.mod_actions where actor_kind = 'admin' and created_at > now() - interval '24 hours'),
    'reports_open_over_24h', (select count(*) from app.reports where resolution = 'open' and created_at < now() - interval '24 hours'),
    'ip_windows_at_limit_1h', (select count(*) from app.ip_hits where n >= app.setting('ip_writes_per_5min')),
    'db_bytes', pg_database_size(current_database())
  )
$$;

-- PostgREST runs this before every request (pgrst.db_pre_request), as the
-- request's role. It counts write RPC calls per IP in 5-minute windows and
-- answers 429 over the limit; reads and the GET polls are not counted
-- ([검토 #1]). The address is the one the platform's proxy appended to
-- X-Forwarded-For — counted from the right, since clients can prepend
-- anything ([검토 #7]). The dorm's range gets a higher limit ([검토 #6]).
create function app.db_pre_request() returns void
language plpgsql security definer set search_path = '' as $$
declare
  path text := current_setting('request.path', true);
  hdr jsonb;
  parts text[];
  hops integer;
  raw text;
  ip inet;
  lim integer;
  k bytea;
  win timestamptz;
  n integer;
begin
  if coalesce(current_setting('request.method', true), '') <> 'POST'
     or path is null
     or path !~ '^/rpc/(create_place|update_place|delete_place|create_event|update_event|delete_event|set_occurrence|clear_occurrence|submit_report)$' then
    return;
  end if;
  hdr := nullif(current_setting('request.headers', true), '')::jsonb;
  parts := regexp_split_to_array(coalesce(hdr ->> 'x-forwarded-for', ''), '\s*,\s*');
  hops := greatest(1, coalesce(app.setting('xff_trusted_hops'), 1));
  raw := parts[greatest(1, cardinality(parts) - hops + 1)];
  begin
    ip := raw::inet;
  exception when others then
    ip := null;
  end;
  if ip is null then
    k := sha256(convert_to('unknown', 'UTF8'));
    lim := app.setting('ip_writes_per_5min');
  else
    k := app.ip_key(ip);
    lim := case when exists (select 1 from app.ip_tiers t where ip <<= t.range and t.tier = 'dorm')
                then app.setting('ip_writes_per_5min_dorm') else app.setting('ip_writes_per_5min') end;
  end if;
  win := to_timestamp(floor(extract(epoch from now()) / 300) * 300);
  insert into app.ip_hits as h (ip_key, window_start, n) values (k, win, 1)
  on conflict (ip_key, window_start) do update set n = h.n + 1
  returning h.n into n;
  if n > lim then
    raise sqlstate 'PT429' using message = 'rate_limited', detail = 'ip';
  end if;
end $$;
