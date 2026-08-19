-- L'upsert du dashboard n'envoie pas owner_id : il se déduit de la session,
-- comme sur venue_tables et venue_events.
alter table public.venue_portals
  alter column owner_id set default auth.uid();
