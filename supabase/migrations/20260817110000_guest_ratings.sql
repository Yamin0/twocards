-- Satisfaction client (modèle SevenRooms : feedback post-visite rattaché à
-- la réservation, agrégé dans les dashboards hôtel et établissement).
-- Le client note sa sortie via /avis/[id] — l'UUID de la réservation sert
-- de jeton porteur, non devinable. Une seule note par réservation.

alter table public.qr_reservations
  add column if not exists rating int
    check (rating is null or rating between 1 and 5),
  add column if not exists rating_comment text,
  add column if not exists rated_at timestamptz;

-- Contexte affiché sur la page d'avis (nom de la sortie, date, déjà noté ?).
-- SECURITY DEFINER : le client anonyme n'a aucun droit direct sur la table.
create or replace function public.qr_rating_context(p_id uuid)
returns table (venue_name text, reservation_date date, already_rated boolean)
language sql
security definer
set search_path = public
stable
as $$
  select r.venue_name, r.reservation_date, r.rated_at is not null
  from qr_reservations r
  where r.id = p_id and r.status <> 'annulée';
$$;

create or replace function public.qr_rate_reservation(
  p_id uuid,
  p_rating int,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Note invalide';
  end if;
  if char_length(coalesce(p_comment, '')) > 500 then
    raise exception 'Commentaire trop long';
  end if;

  update qr_reservations
     set rating = p_rating,
         rating_comment = nullif(trim(coalesce(p_comment, '')), ''),
         rated_at = now()
   where id = p_id
     and rated_at is null
     and status <> 'annulée';

  if not found then
    raise exception 'Réservation introuvable ou déjà notée';
  end if;
end;
$$;

revoke all on function public.qr_rating_context(uuid) from public;
revoke all on function public.qr_rate_reservation(uuid, int, text) from public;
grant execute on function public.qr_rating_context(uuid) to anon, authenticated;
grant execute on function public.qr_rate_reservation(uuid, int, text) to anon, authenticated;
