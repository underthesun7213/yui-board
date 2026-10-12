-- Take everything back from the client roles — including PUBLIC, which every
-- role belongs to and which gets EXECUTE on new functions by default
-- ([검토 #2]) — then grant exactly the table in ERD v2 §5.2.

revoke all on all tables in schema public, app from public, anon, authenticated, service_role;
revoke all on all sequences in schema public, app from public, anon, authenticated, service_role;
revoke execute on all functions in schema public, app from public, anon, authenticated, service_role;
revoke all on schema app from public, anon, authenticated, service_role;

alter default privileges in schema public, app revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema public, app revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges in schema public, app revoke execute on functions from public, anon, authenticated, service_role;
-- Per-schema defaults only add to the global ones, so PUBLIC's EXECUTE on new
-- functions has to be taken back globally, for the role that creates them.
alter default privileges for role postgres revoke execute on functions from public;
do $$
begin
  -- Supabase's own admin role also sets defaults; only where it exists and we may
  if exists (select 1 from pg_roles where rolname = 'supabase_admin') then
    begin
      execute 'alter default privileges for role supabase_admin revoke execute on functions from public';
      execute 'alter default privileges for role supabase_admin in schema public, app revoke execute on functions from anon, authenticated';
    exception when insufficient_privilege then
      raise notice 'cannot alter supabase_admin default privileges; checks below still verify the result';
    end;
  end if;
end $$;

-- reads
grant select on public.places_public, public.events_public, public.event_occurrences_public,
  public.prefecture_counts to anon, authenticated;
grant execute on function public.data_version() to anon, authenticated;

-- writes (anonymous users are `authenticated`)
grant execute on function
  public.create_place(uuid, text, app.place_category, text, text, double precision, double precision, app.ui_lang),
  public.update_place(bigint, text, app.place_category, text, text, double precision, double precision, app.ui_lang),
  public.delete_place(bigint),
  public.create_event(uuid, text, date, time, time, date, text, text, app.ui_lang),
  public.update_event(bigint, text, date, time, time, date, text, text, app.ui_lang),
  public.delete_event(bigint),
  public.set_occurrence(bigint, date, boolean, text, time, time, text, text),
  public.clear_occurrence(bigint, date),
  public.my_items(),
  public.my_place(bigint),
  public.my_event(bigint)
to authenticated;
-- the enum types in those signatures
grant usage on schema app to anon, authenticated;
grant usage on type app.place_category, app.ui_lang, app.item_kind, app.report_reason to authenticated;

-- the IP limiter runs as the request's role
grant execute on function app.db_pre_request() to anon, authenticated;

-- monitoring
grant execute on function public.ops_health() to service_role;

-- the Auth hook
grant usage on schema app to supabase_auth_admin;
grant execute on function app.hook_before_user_created(jsonb) to supabase_auth_admin;
