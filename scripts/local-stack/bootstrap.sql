-- What a Supabase database has before any project migration runs: the API
-- roles, the auth admin role, and the extensions schema. Local stack only.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login noinherit password 'local-authenticator';
grant anon, authenticated, service_role to authenticator;
create role supabase_auth_admin login noinherit createrole password 'local-auth-admin';
create role supabase_admin login superuser password 'local-supabase-admin';

create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists pgtap with schema extensions;

create schema auth authorization supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role;
alter role supabase_auth_admin set search_path = auth;

grant usage on schema public to anon, authenticated, service_role;
-- Supabase's defaults: everything new in public is granted to the API roles.
-- The project's grants migration has to undo this, so the local stack keeps it.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
