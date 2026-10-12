-- Included by every test file (\ir _helpers.sql) inside its transaction.
set search_path = extensions, public;

create schema tests;
grant usage on schema tests to public;

-- A user as Supabase Auth would create it.
create function tests.user(p_anon boolean default true, p_email text default null) returns uuid
language sql security definer set search_path = '' as $$
  insert into auth.users (id, aud, role, is_anonymous, email, email_confirmed_at, created_at, updated_at)
  values (gen_random_uuid(), 'authenticated', 'authenticated', p_anon, p_email,
          case when p_email is null then null else now() end, now(), now())
  returning id
$$;

-- Act as that user from here on (like a request carrying their JWT).
create function tests.as_user(p_id uuid, p_extra jsonb default '{}') returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    (jsonb_build_object('sub', p_id, 'role', 'authenticated', 'is_anonymous', true) || p_extra)::text, true);
  execute 'set local role authenticated';
end $$;
create function tests.as_anon() returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;
create function tests.as_owner() returns void
language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;
grant execute on all functions in schema tests to public;

-- Today in Japan, for dates the write rules compare against.
create function tests.today() returns date language sql as $$ select (now() at time zone 'Asia/Tokyo')::date $$;
grant execute on function tests.today() to public;
