-- Y-A3 (D30): new places and new events per account per rolling 24 hours,
-- 10 -> 15. The 10 was a first-draft proposal that was never decided; 15
-- leaves room for someone adding the places they know in one sitting. Edits
-- (30) and reports (20) stay. Migration 030 keeps its original values; this
-- row update is what changes a database that already ran it.
update app.settings set int_value = 15
where key in ('place_create_per_day', 'event_create_per_day');

do $$
begin
  if (select count(*) from app.settings
      where key in ('place_create_per_day', 'event_create_per_day') and int_value = 15) <> 2 then
    raise exception 'daily create limits not set to 15';
  end if;
end $$;
