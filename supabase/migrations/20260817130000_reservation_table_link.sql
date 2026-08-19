-- Rattachement d'une réservation QR à une table du plan de salle : le plan
-- affiche alors les occupations réelles au lieu des réservations de démo.
-- L'établissement assigne la table depuis sa page Réservations — la colonne
-- s'ajoute donc au GRANT par colonne existant (amount_spent, status).

alter table public.qr_reservations
  add column if not exists table_id bigint
    references public.venue_tables (id) on delete set null;

create index if not exists qr_reservations_table_idx
  on public.qr_reservations (table_id);

grant update (amount_spent, status, table_id)
  on public.qr_reservations to authenticated;
