-- qr_create_reservation respecte tous les masquages du menu (audit D6).
--
-- Constat : qr_get_menu retire du menu
--   1. les adresses masquées sur le QR (hotel_qr_codes.hidden_offers),
--   2. les adresses masquées pour tout l'hôtel (hotel_profiles.hidden_offers),
--   3. les catégories retirées du QR (hotel_qr_codes.hidden_categories, tant
--      que hidden_until est vide ou à venir),
-- mais qr_create_reservation ne vérifiait que le point 1. Une adresse masquée
-- au niveau du profil, ou rangée dans une catégorie retirée, restait donc
-- réservable par un appel direct à la RPC.
--
-- Cette migration repart de la définition en place (schema.sql, issue de
-- 20260924120000_security_hardening) : même signature, mêmes contrôles, même
-- débit, même insertion, mêmes messages d'erreur. Seul le bloc « l'adresse
-- doit être au menu » est complété ; le refus garde le message
-- « Adresse indisponible », déjà géré par la page client.
--
-- RPC publique (anon) : à relire avant exécution. Aucun changement de
-- commission ni de règle RLS.

begin;

create or replace function public.qr_create_reservation(
  p_code text,
  p_category text,
  p_venue text,
  p_guest_name text,
  p_guest_phone text,
  p_date date,
  p_time text,
  p_party_size integer,
  p_notes text,
  p_venue_slug text default null::text,
  p_service text default null::text
)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_qr record;
  v_slug text := nullif(trim(coalesce(p_venue_slug, '')), '');
  v_phone text := trim(coalesce(p_guest_phone, ''));
  v_offer_category text;
  v_id uuid;
begin
  if coalesce(trim(p_guest_name), '') = '' or char_length(p_guest_name) > 120 then
    raise exception 'Nom invalide';
  end if;
  if v_phone = '' or char_length(v_phone) > 40 then
    raise exception 'Téléphone invalide';
  end if;
  if char_length(coalesce(p_category, '')) > 40
     or char_length(coalesce(p_venue, '')) > 120
     or char_length(coalesce(p_time, '')) > 20
     or char_length(coalesce(p_notes, '')) > 500
     or char_length(coalesce(v_slug, '')) > 40
     or char_length(coalesce(p_service, '')) > 80 then
    raise exception 'Champ trop long';
  end if;
  -- Veille tolérée : le convive peut réserver après minuit pour la soirée.
  if p_date is null or p_date < current_date - 1 or p_date > current_date + 366 then
    raise exception 'Date invalide';
  end if;

  -- Mêmes masquages que qr_get_menu : ceux du QR et ceux du profil de
  -- l'hôtel réunis ; les catégories retirées ne comptent que tant que leur
  -- date de fin n'est pas passée.
  select q.id,
         q.user_id,
         coalesce(q.hidden_offers, '{}') || coalesce(p.hidden_offers, '{}') as hidden,
         case when q.hidden_until is null or q.hidden_until >= current_date
              then coalesce(q.hidden_categories, '{}') else '{}'::text[] end as hidden_categories
    into v_qr
  from hotel_qr_codes q
  left join hotel_profiles p on p.user_id = q.user_id
  where q.code = p_code and q.active;

  if v_qr.id is null then
    raise exception 'QR code introuvable ou inactif';
  end if;

  -- L'adresse doit être au menu de cet hôtel : catalogue réseau actif ou
  -- adresse maison de l'hôtel, non masquée (QR ou profil), et dans une
  -- catégorie que ce QR propose encore. L'adresse maison passe d'abord,
  -- comme dans le menu.
  if v_slug is not null then
    select coalesce(
      (select o.category from hotel_offers o
        where o.slug = v_slug and o.user_id = v_qr.user_id and o.active
        limit 1),
      (select c.category from catalog_offers c
        where c.slug = v_slug and c.active
        limit 1)
    ) into v_offer_category;

    if v_offer_category is null
       or v_slug = any (v_qr.hidden)
       or v_offer_category = any (v_qr.hidden_categories) then
      raise exception 'Adresse indisponible';
    end if;
  end if;

  -- Débit : 3 demandes par numéro en 10 min, 30 par QR en une heure.
  if (select count(*) from qr_reservations
      where guest_phone = v_phone and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from qr_reservations
         where qr_code_id = v_qr.id and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Trop de demandes, réessayez dans quelques minutes';
  end if;

  insert into qr_reservations (
    qr_code_id, category, venue_name, guest_name, guest_phone,
    reservation_date, reservation_time, party_size, notes, venue_slug,
    service_name
  )
  values (
    v_qr.id, p_category, p_venue, trim(p_guest_name), v_phone,
    p_date, nullif(trim(coalesce(p_time, '')), ''),
    least(greatest(coalesce(p_party_size, 2), 1), 50),
    nullif(trim(coalesce(p_notes, '')), ''),
    v_slug,
    nullif(trim(coalesce(p_service, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$function$;

-- CREATE OR REPLACE conserve les droits existants ; ils sont rappelés ici
-- pour que la migration se suffise (mêmes grants que schema.sql).
revoke execute on function public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text) from public;
grant execute on function public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text) to anon;
grant execute on function public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text) to authenticated;

commit;
