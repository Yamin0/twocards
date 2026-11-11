-- Une note ne peut être laissée qu'à partir du jour de la sortie.
--
-- Avant : qr_rate_reservation acceptait une note sur une réservation à venir
-- (le lien /avis/<id> fonctionne dès la création). Une note posée avant la
-- sortie fausse la satisfaction affichée à l'établissement et à l'hôtel.
--
-- Même signature, mêmes contrôles, mêmes droits (anon et authenticated).
-- Seul ajout : le refus « Sortie à venir ». La veille est tolérée d'un jour
-- pour les décalages de fuseau, comme dans qr_create_reservation.
--
-- NON LANCÉ : à relire puis à exécuter dans l'éditeur SQL Supabase.
-- Vérification sans effet de bord : appeler la fonction avec un identifiant
-- inexistant doit toujours répondre « Réservation introuvable ou déjà notée ».

create or replace function public.qr_rate_reservation(p_id uuid, p_rating integer, p_comment text default null::text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Note invalide';
  end if;
  if char_length(coalesce(p_comment, '')) > 500 then
    raise exception 'Commentaire trop long';
  end if;

  if exists (
    select 1 from qr_reservations
     where id = p_id
       and reservation_date > current_date + 1
  ) then
    raise exception 'Sortie à venir';
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
$function$
;

revoke all on function public.qr_rate_reservation(p_id uuid, p_rating integer, p_comment text) from public, anon, authenticated;
grant execute on function public.qr_rate_reservation(p_id uuid, p_rating integer, p_comment text) to anon;
grant execute on function public.qr_rate_reservation(p_id uuid, p_rating integer, p_comment text) to authenticated;
