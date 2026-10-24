-- Extensions live in their own schema: in public, PostGIS's hundreds of ST_*
-- functions would become Data API RPCs (ERD v2 §8 01, [재검토 #3]).
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists postgis with schema extensions;
-- pg_cron is a Supabase extension; schedules are added only where it exists.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
  end if;
end $$;
