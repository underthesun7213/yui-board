-- Anything that can change what the public sees moves the version number.
create function app.bump_data_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update app.data_version set v = v + 1 where id = 1;
  return null;
end $$;

create trigger places_version after insert or update or delete on app.places
  for each statement execute function app.bump_data_version();
create trigger events_version after insert or update or delete on app.events
  for each statement execute function app.bump_data_version();
create trigger occurrences_version after insert or update or delete on app.event_occurrences
  for each statement execute function app.bump_data_version();
