-- L'administrateur en direct.
--
-- Le flux temps réel respecte les droits de lecture : sans policy sur les
-- réservations, l'admin ne recevait aucun événement et devait cliquer sur
-- « Actualiser ». Il lit désormais les réservations (en plus de la fonction
-- grand livre, qui reste la source des jointures), et les règlements sont
-- diffusés : un montant saisi ou un règlement noté se voit partout aussitôt.

drop policy if exists "admin lit les réservations" on public.qr_reservations;
create policy "admin lit les réservations"
  on public.qr_reservations for select to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'commission_settlements'
  ) then
    alter publication supabase_realtime add table public.commission_settlements;
  end if;
end $$;
