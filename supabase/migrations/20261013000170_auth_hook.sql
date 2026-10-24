-- Supabase Auth "before user created" hook. A secondary guard: the cap that
-- holds is the one in require_writer ([재검토 #1]). Email signups must be
-- invited (admins only, [검토 #4]). Whether Auth calls this for anonymous
-- signups is checked against the real project (OQ-E5).
create function app.hook_before_user_created(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  u jsonb := event -> 'user';
  anon boolean := coalesce((u ->> 'is_anonymous')::boolean, false);
  v_email text := lower(coalesce(u ->> 'email', ''));
begin
  if anon then
    if (select count(*) from auth.users where is_anonymous and created_at > now() - interval '1 hour')
       >= app.setting('anon_signups_per_hour') then
      insert into app.security_events (kind, detail) values ('signup_throttled', 'anon_signups_per_hour');
      return jsonb_build_object('error', jsonb_build_object('http_code', 429, 'message', 'Too many new accounts. Try again later.'));
    end if;
    return '{}'::jsonb;
  end if;
  if v_email = '' or not exists (select 1 from app.admin_invites i where lower(i.email::text) = v_email and i.used_at is null) then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Signups are closed.'));
  end if;
  return '{}'::jsonb;
end $$;
