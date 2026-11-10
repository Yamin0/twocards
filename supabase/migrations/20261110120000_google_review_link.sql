-- Lien d'avis Google de l'établissement, proposé au client après sa note.
--
-- L'établissement saisit le lien « Demander des avis » de sa fiche Google
-- dans ses réglages (/dashboard/settings, onglet Établissement) ; il est
-- rangé dans ses métadonnées de compte (google_review_url), comme ses autres
-- champs descriptifs. La page publique /avis/[id] le lit par
-- qr_rating_context, qui le renvoie désormais en quatrième colonne.
--
-- L'invitation est montrée à tous les clients, quelle que soit leur note :
-- la réserver aux meilleures notes est interdit par les règles de Google.
--
-- Le type de retour change : CREATE OR REPLACE ne le permet pas, d'où le
-- DROP puis le CREATE, et le grant à rétablir (les nouvelles fonctions
-- naissent fermées depuis 20260924120000_security_hardening).

begin;

drop function if exists public.qr_rating_context(uuid);

create function public.qr_rating_context(p_id uuid)
 returns table(venue_name text, reservation_date date, already_rated boolean, google_review_url text)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select r.venue_name,
         r.reservation_date,
         r.rated_at is not null,
         case
           when u.raw_user_meta_data->>'google_review_url' ~* '^https://\S+$'
             then u.raw_user_meta_data->>'google_review_url'
         end
  from qr_reservations r
  left join auth.users u on u.id = public.qr_reservation_owner(r)
  where r.id = p_id and r.status <> 'annulée';
$function$;

revoke execute on function public.qr_rating_context(uuid) from public;
grant execute on function public.qr_rating_context(uuid) to anon, authenticated;

commit;
