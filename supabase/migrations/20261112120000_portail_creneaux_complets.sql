-- ════════════════════════════════════════════════════════════════════════════
-- Portail direct : un créneau « complet » compte enfin les demandes du portail.
--
-- ⚠️  NON LANCÉ. Migration écrite le 11/11/2026, à exécuter à la main dans
--     l'éditeur SQL de Supabase après relecture. Aucune colonne, aucune table
--     nouvelle : seulement des fonctions.
--
-- CE QUE ÇA CHANGE
--   Avant (20260820130000_venue_manager_core, toujours en place) :
--     portal_full_slots déclarait complet un créneau quand le nombre de TABLES
--     DISTINCTES portant une réservation à cette heure atteignait le nombre de
--     tables non bloquées du plan de salle. Une demande venue du portail n'a
--     pas de table tant que l'équipe ne l'a pas placée : elle ne comptait pas,
--     un créneau n'était donc jamais complet pour le portail. Et
--     portal_create_reservation ne revérifiait rien à l'envoi.
--   Après :
--     • un créneau est complet quand la somme des COUVERTS (party_size) des
--       réservations non annulées (statut ni 'annulée' ni 'no-show') de
--       l'établissement, à cette date et cette heure, avec ou sans table,
--       atteint la capacité du plan de salle (somme de venue_tables.capacity
--       des tables non bloquées, comme le filtre 'blocked' d'avant) ;
--     • portal_create_reservation refuse un tel créneau :
--       raise exception 'Créneau complet' (la page /r le traduit et recharge
--       les créneaux). Deux envois simultanés sur le même créneau sont mis en
--       file par un verrou de transaction (pg_advisory_xact_lock) : le second
--       voit la demande du premier.
--   Le rattachement d'une réservation à l'établissement ne change pas :
--   venue_owner_id = propriétaire du portail, OU venue_slug d'une fiche
--   venues dont il est propriétaire (exactement comme avant).
--
-- EFFET ATTENDU
--   • Établissement AVEC tables (ex. 10 tables de 4 = 40 couverts) : dès que
--     les demandes et réservations de 20:00 totalisent 40 couverts, 20:00
--     disparaît des créneaux du portail et un envoi sur 20:00 est refusé.
--     Les demandes « en attente » comptent : elles occupent la salle tant que
--     l'équipe ne les a pas annulées.
--   • Établissement SANS table (activités, services, plan de salle jamais
--     rempli, ou toutes les tables bloquées) : capacité inconnue, aucun
--     créneau n'est jamais complet, aucun envoi n'est refusé pour ce motif.
--     Comportement identique à aujourd'hui.
--
-- CAS LIMITES
--   • Réservation sans heure : ne compte pour aucun créneau (comme avant).
--   • Heures comparées sur leurs 5 premiers caractères (« 20:00 », comme
--     avant) : une heure saisie « 20h » ou « 8:00 » ne compte pas.
--   • Créneau après minuit : le portail envoie la date du SOIR (« samedi,
--     00:30 » = nuit de samedi à dimanche). Une réservation saisie ailleurs
--     avec la date du lendemain (« dimanche, 00:30 ») ne compte pas pour le
--     créneau du portail. Limite inchangée.
--   • Le verrou ne sérialise que les envois du portail entre eux ; une
--     réservation saisie au même instant par l'équipe ou un QR peut encore
--     dépasser de peu (ce sont des demandes, confirmées par l'établissement).
--
-- VÉRIFICATION (lecture seule, sans effet de bord) — capacité et couverts
-- par créneau pour les 14 prochains jours, avec la règle de cette migration.
-- À lancer avant (pour prévoir) et après (pour comparer à portal_full_slots) :
--
--   with p as (
--     select vp.slug, vp.owner_id,
--            (select coalesce(sum(vt.capacity), 0) from venue_tables vt
--              where vt.owner_id = vp.owner_id and vt.status <> 'blocked') as capacite
--     from venue_portals vp where vp.active
--   )
--   select p.slug, p.capacite, r.reservation_date,
--          left(trim(r.reservation_time), 5) as creneau,
--          sum(r.party_size) as couverts,
--          (p.capacite > 0 and sum(r.party_size) >= p.capacite) as complet
--   from p
--   join qr_reservations r
--     on r.venue_owner_id = p.owner_id
--     or exists (select 1 from venues v
--                where v.slug = r.venue_slug and v.owner_id = p.owner_id)
--   where r.reservation_date between current_date and current_date + 14
--     and r.status not in ('annulée', 'no-show')
--     and coalesce(trim(r.reservation_time), '') <> ''
--   group by p.slug, p.capacite, r.reservation_date, left(trim(r.reservation_time), 5)
--   order by p.slug, r.reservation_date, creneau;
--
--   Après la migration, pour un portail et un jour donnés :
--   select * from public.portal_full_slots('table-du-marche', current_date);
--   (doit rendre exactement les lignes « complet = true » ci-dessus.)
--
-- MARCHE ARRIÈRE
--   1. Réappliquer portal_full_slots tel qu'écrit dans
--      supabase/migrations/20260820130000_venue_manager_core.sql (§ 5).
--   2. Réappliquer portal_create_reservation tel qu'écrit dans
--      supabase/migrations/20260924120000_security_hardening.sql (§ 3),
--      avec ses revoke / grant.
--   3. Puis : drop function public.portal_slots_complets(uuid, date);
--   4. Rappeler les droits :
--      grant execute on function public.portal_full_slots(text, date) to anon, authenticated;
--      grant execute on function public.portal_create_reservation(text, text, text, date, text, integer, text) to anon, authenticated;
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. La règle, une seule fois ────────────────────────────────────────────
-- Fonction interne : jamais appelée par l'API (droits retirés plus bas).
-- Les deux fonctions publiques, SECURITY DEFINER, l'appellent avec les droits
-- de leur propriétaire. Elle-même est SECURITY INVOKER : appelée directement
-- par un anonyme, elle serait refusée de toute façon.
create or replace function public.portal_slots_complets(p_owner_id uuid, p_date date)
returns table (slot text)
language sql
stable
set search_path = public
as $$
  with capacite as (
    -- Capacité du plan de salle : somme des couverts des tables non bloquées.
    -- Zéro (aucune table) = capacité inconnue = rien n'est jamais complet.
    select coalesce(sum(vt.capacity), 0) as total
    from venue_tables vt
    where vt.owner_id = p_owner_id
      and vt.status <> 'blocked'
  )
  select left(trim(r.reservation_time), 5)
  from qr_reservations r
  cross join capacite c
  where (r.venue_owner_id = p_owner_id
         or exists (
           select 1 from venues v
           where v.slug = r.venue_slug and v.owner_id = p_owner_id
         ))
    and r.reservation_date = p_date
    and r.status not in ('annulée', 'no-show')
    and coalesce(trim(r.reservation_time), '') <> ''
    and c.total > 0
  group by left(trim(r.reservation_time), 5), c.total
  having sum(r.party_size) >= c.total;
$$;

revoke all on function public.portal_slots_complets(uuid, date) from public, anon, authenticated;

-- ─── 2. Créneaux complets lus par le portail ────────────────────────────────
-- Même signature, même garde sur le slug, même portail actif : seul le calcul
-- passe par la règle commune.
create or replace function public.portal_full_slots(p_slug text, p_date date)
returns table (slot text)
language sql
security definer
set search_path = public
stable
as $$
  select s.slot
  from venue_portals vp
  cross join lateral public.portal_slots_complets(vp.owner_id, p_date) s
  where vp.slug = p_slug and vp.active
    and char_length(p_slug) <= 40;
$$;

-- create or replace conserve les droits, mais on les réaffirme.
revoke execute on function public.portal_full_slots(text, date) from public;
grant execute on function public.portal_full_slots(text, date) to anon, authenticated;

-- ─── 3. Envoi d'une demande : refus d'un créneau complet ────────────────────
-- Copie de la version de 20260924120000_security_hardening, à l'identique,
-- plus le seul bloc « Créneau complet » (verrou + contrôle) avant l'insertion.
create or replace function public.portal_create_reservation(
  p_slug text,
  p_guest_name text,
  p_guest_phone text,
  p_date date,
  p_time text,
  p_party_size integer,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_portal record;
  v_slug text;
  v_phone text := trim(coalesce(p_guest_phone, ''));
  v_id uuid;
  v_slot text := left(trim(coalesce(p_time, '')), 5);
begin
  if coalesce(trim(p_guest_name), '') = '' or char_length(p_guest_name) > 120 then
    raise exception 'Nom invalide';
  end if;
  if v_phone = '' or char_length(v_phone) > 40 then
    raise exception 'Téléphone invalide';
  end if;
  if p_date is null or p_date < current_date or p_date > current_date + 366 then
    raise exception 'Date invalide';
  end if;
  if char_length(coalesce(p_time, '')) > 20 or char_length(coalesce(p_notes, '')) > 500 then
    raise exception 'Champ trop long';
  end if;

  select owner_id, display_name, party_max into v_portal
  from venue_portals
  where slug = p_slug and active;

  if v_portal is null then
    raise exception 'Portail introuvable ou désactivé';
  end if;

  -- Débit : 3 demandes par numéro en 10 min, 60 par portail en une heure.
  if (select count(*) from qr_reservations
      where guest_phone = v_phone and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from qr_reservations
         where venue_owner_id = v_portal.owner_id and source = 'portal'
           and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'Trop de demandes, réessayez dans quelques minutes';
  end if;

  -- Créneau complet : même règle que portal_full_slots. Le verrou (levé en
  -- fin de transaction) met en file deux envois sur le même créneau du même
  -- établissement : le second voit la demande du premier. Sans heure, pas de
  -- créneau à vérifier.
  if v_slot <> '' then
    perform pg_advisory_xact_lock(
      hashtextextended('portal_slot:' || v_portal.owner_id::text || ':' || p_date::text || ':' || v_slot, 0)
    );
    if exists (
      select 1 from public.portal_slots_complets(v_portal.owner_id, p_date) s
      where s.slot = v_slot
    ) then
      raise exception 'Créneau complet';
    end if;
  end if;

  select slug into v_slug from venues where owner_id = v_portal.owner_id limit 1;

  insert into qr_reservations (
    qr_code_id, category, venue_name, guest_name, guest_phone,
    reservation_date, reservation_time, party_size, notes,
    venue_slug, venue_owner_id, source, commission_rate
  )
  values (
    null, 'Direct', v_portal.display_name, trim(p_guest_name),
    v_phone, p_date, nullif(trim(coalesce(p_time, '')), ''),
    least(greatest(coalesce(p_party_size, 2), 1), v_portal.party_max),
    nullif(trim(coalesce(p_notes, '')), ''),
    v_slug, v_portal.owner_id, 'portal', 0
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- create or replace conserve les droits, mais on les réaffirme.
revoke execute on function public.portal_create_reservation(text, text, text, date, text, integer, text) from public;
grant execute on function public.portal_create_reservation(text, text, text, date, text, integer, text) to anon, authenticated;
