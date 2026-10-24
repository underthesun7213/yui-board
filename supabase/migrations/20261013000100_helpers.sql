-- Helpers called only from inside definer functions; nobody else gets EXECUTE.

create function app.tokyo_today() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Tokyo')::date
$$;

create function app.log_security(p_kind text, p_detail text default null) returns void
language sql security definer set search_path = '' as $$
  insert into app.security_events (kind, user_id, detail)
  values (p_kind, auth.uid(), left(p_detail, 200))
$$;

-- {status:'invalid', field} — malformed input is a status, not an exception,
-- so the IP counter that runs earlier in the same transaction still counts it.
create function app.invalid(p_field text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform app.log_security('invalid_input', p_field);
  return jsonb_build_object('status', 'invalid', 'field', p_field);
end $$;

-- Which prefecture a point is in: the nearest boundary within 10 km (the
-- simplified shapes drop small islands and some coast), or null outside Japan.
create function app.pref_of(p_lat double precision, p_lng double precision) returns char(2)
language sql stable security definer set search_path = '' as $$
  with pt as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  )
  select p.code
  from app.prefectures p, pt
  where p_lat between 20 and 46 and p_lng between 122 and 154
    and extensions.st_dwithin(p.geom, pt.g, 10000)
  order by extensions.st_distance(p.geom, pt.g)
  limit 1
$$;

-- Hash of an IPv4 address or IPv6 /64 with today's salt.
create function app.ip_key(p_ip inet) returns bytea
language plpgsql security definer set search_path = '' as $$
declare
  s bytea;
  k text;
begin
  insert into app.salts (day) values (app.tokyo_today()) on conflict do nothing;
  select salt into s from app.salts where day = app.tokyo_today();
  k := case when family(p_ip) = 6 then network(set_masklen(p_ip, 64))::text else host(p_ip) end;
  return sha256(convert_to(k, 'UTF8') || s);
end $$;

-- The first step of every write. Creates the account on the first write
-- (Y-A1) under a global cap on new accounts per hour ([재검토 #1]).
-- Returns 'ok', 'forbidden', 'rate_limited' or 'suspended'.
create function app.require_writer(p_allow_suspended boolean default false) returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  acc app.accounts;
begin
  if uid is null then
    perform app.log_security('forbidden', 'no user');
    return 'forbidden';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select * into acc from app.accounts where user_id = uid;
  if not found then
    perform pg_advisory_xact_lock(hashtextextended('accounts:create', 0));
    if (select count(*) from app.accounts where created_at > now() - interval '1 hour')
       >= app.setting('accounts_per_hour') then
      perform app.log_security('signup_throttled', 'accounts_per_hour');
      return 'rate_limited';
    end if;
    insert into app.accounts (user_id) values (uid) returning * into acc;
  end if;
  if acc.suspended_at is not null and not p_allow_suspended then
    perform app.log_security('suspended_write');
    return 'suspended';
  end if;
  update app.accounts set last_active_at = now() where user_id = uid;
  return 'ok';
end $$;

-- Daily per-account limits (Y-A3). Call after require_writer (which holds the
-- per-user lock); records the write when it is allowed.
create function app.take_quota(p_action text, p_setting text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if (select count(*) from app.write_log
      where user_id = uid and action = p_action and at > now() - interval '24 hours')
     >= app.setting(p_setting) then
    perform app.log_security('rate_limited_account', p_action);
    return false;
  end if;
  insert into app.write_log (user_id, action) values (uid, p_action);
  return true;
end $$;

-- Hide an item once enough distinct, unsuspended, non-owner people have open
-- reports on it — unless an admin restored it (Y-R3, Y-R6). Locks the row so
-- concurrent reports hide it once.
create function app.evaluate_item(p_kind app.item_kind, p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  restored timestamptz;
  hidden boolean;
  n integer;
  reasons jsonb;
begin
  if p_kind = 'place' then
    select restored_at, (deleted_at is not null or auto_hidden_at is not null or suspension_hidden_at is not null)
      into restored, hidden from app.places where id = p_id for update;
  else
    select restored_at, (deleted_at is not null or auto_hidden_at is not null or suspension_hidden_at is not null)
      into restored, hidden from app.events where id = p_id for update;
  end if;
  if not found or restored is not null or hidden then return; end if;

  select count(distinct r.reporter_id) into n
  from app.reports r
  join app.accounts a on a.user_id = r.reporter_id and a.suspended_at is null
  where r.resolution = 'open' and not r.by_owner
    and (case when p_kind = 'place' then r.place_id else r.event_id end) = p_id;

  if n >= app.setting('report_hide_threshold') then
    select jsonb_object_agg(reason, c) into reasons from (
      select r.reason::text as reason, count(*) as c from app.reports r
      where r.resolution = 'open' and not r.by_owner
        and (case when p_kind = 'place' then r.place_id else r.event_id end) = p_id
      group by r.reason
    ) t;
    if p_kind = 'place' then
      update app.places set auto_hidden_at = now() where id = p_id;
    else
      update app.events set auto_hidden_at = now() where id = p_id;
    end if;
    insert into app.mod_actions (actor_kind, action, target_kind, target_id, detail)
    values ('system', 'auto_hide', p_kind::text, p_id, jsonb_build_object('reasons', reasons, 'reporters', n));
  end if;
end $$;
