-- PostgREST runs app.db_pre_request() before every request, as the request's
-- role. service_role (the ops monitor's secret key) had neither USAGE on the
-- app schema nor EXECUTE on the function, so every service_role request failed
-- with "permission denied for schema app" (403) before reaching ops_health().
-- Found by the first monitor run against the hosted project (2026-10-23).
--
-- Grant exactly those two rights. USAGE on a schema gives no rights on its
-- tables (checks ② still holds: no client role can touch an app table), and
-- db_pre_request is already executable by anon, so check ⑩'s service-only list
-- stays {ops_health}.
grant usage on schema app to service_role;
grant execute on function app.db_pre_request() to service_role;

do $$
begin
  if not pg_catalog.has_function_privilege('service_role', 'app.db_pre_request()', 'execute') then
    raise exception 'service_role cannot run the pre-request hook';
  end if;
  if exists (
    select 1 from pg_catalog.pg_class c
    where c.relnamespace = 'app'::regnamespace and c.relkind in ('r', 'v', 'm')
      and pg_catalog.has_table_privilege('service_role', c.oid, 'select,insert,update,delete,truncate,references,trigger')
  ) then
    raise exception 'service_role must still have no rights on app tables';
  end if;
end $$;
