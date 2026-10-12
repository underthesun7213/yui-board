-- Cleanup (ERD v2 §6). Each condition is time-based, so a run after the free
-- plan's pause catches up by itself.

create function app.purge_deleted() returns void
language sql security definer set search_path = '' as $$
  delete from app.places where deleted_at < now() - make_interval(days => app.setting('deleted_retention_days'));
  delete from app.events where deleted_at < now() - make_interval(days => app.setting('deleted_retention_days'));
$$;

create function app.purge_past_events() returns void
language sql security definer set search_path = '' as $$
  delete from app.events where last_date < app.tokyo_today() - 365;
$$;

create function app.purge_records() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from app.reports where resolution <> 'open' and resolved_at < now() - interval '1 year';
  perform set_config('app.purging', 'on', true);
  delete from app.mod_actions where created_at < now() - interval '1 year';
  perform set_config('app.purging', 'off', true);
  delete from app.security_events where at < now() - interval '90 days';
  update app.security_events set ip_key = null where ip_key is not null and at < now() - interval '48 hours';
  delete from app.write_log where at < now() - interval '48 hours';
  delete from app.ip_hits where window_start < now() - interval '1 hour';
  delete from app.salts where day < app.tokyo_today() - 1;
end $$;

-- A year without writing: the anonymous user goes, their items stay without
-- an owner (Y-P5). Admins are never removed here.
create function app.purge_inactive_accounts() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users u
  where u.is_anonymous
    and not exists (select 1 from app.admins a where a.user_id = u.id)
    and coalesce((select a.last_active_at from app.accounts a where a.user_id = u.id), u.created_at)
        < now() - interval '1 year';
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('yunabi-purge-deleted', '0 19 * * *', 'select app.purge_deleted()');        -- 04:00 JST
    perform cron.schedule('yunabi-purge-past-events', '10 19 * * *', 'select app.purge_past_events()');
    perform cron.schedule('yunabi-purge-records', '5 * * * *', 'select app.purge_records()');
    perform cron.schedule('yunabi-purge-inactive', '20 19 * * *', 'select app.purge_inactive_accounts()');
  end if;
end $$;
