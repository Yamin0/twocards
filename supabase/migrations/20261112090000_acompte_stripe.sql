-- Acompte en ligne (Stripe) pour les adresses du réseau à prix fixe.
--
-- Principe : pour un menu fixe ou une activité, le client paie un acompte en
-- réservant depuis le menu QR. L'acompte vaut la commission twocards et est
-- encaissé par Twocards, LLC : la réservation n'existe qu'une fois payée.
--
-- 1. catalog_offers : réglage de l'acompte par adresse
--      deposit_mode   'none' (défaut) | 'per_person' | 'fixed'
--      deposit_amount montant (par personne ou pour la réservation)
--      deposit_currency 'mad' (défaut) | 'eur' | 'usd'
-- 2. qr_reservations : trace du paiement (montant, devise, session et
--    paiement Stripe, date de paiement, date de remboursement).
-- 3. qr_apply_commission : une réservation dont l'acompte est payé (et non
--    remboursé) a pour commission l'acompte lui-même, quelle que soit
--    l'addition saisie ensuite. Pour une devise autre que MAD, la commission
--    reste calculée comme avant (les tableaux de commission sont en MAD).
-- 4. qr_deposit_quote : montant de l'acompte pour une adresse d'un QR
--    (public, lu par la page client et par le serveur avant le paiement).
-- 5. qr_create_reservation : refuse « Acompte requis » quand l'adresse
--    demande un acompte et que l'appel ne vient pas du serveur (service_role).
--    Sans ce garde, un appel direct à la RPC contournerait le paiement.
--    Le reste est identique à 20261111100000_qr_reservation_respecte_masquages
--    (qu'elle inclut : inutile de lancer celle-ci d'abord).
-- 6. qr_record_paid_reservation : appelée par le serveur seulement, après un
--    paiement confirmé par Stripe. Idempotente (même session = même
--    réservation), protégée par un verrou contre l'appel simultané du
--    webhook et de la page de retour.

begin;

-- Garde-fou (ajouté le 11 nov. 2026) : la production a reçu depuis
-- 20261112110000 (plafond 300/h pour un concierge). Cette version-ci
-- l'effacerait : utiliser 20261113100000_acompte_stripe_apres_debit.sql.
do $guard$
begin
  if position('then 300 else 30 end' in pg_get_functiondef(
       'public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text)'::regprocedure)) > 0 then
    raise exception 'Débit concierge déjà en place : lancer 20261113100000_acompte_stripe_apres_debit.sql à la place';
  end if;
end
$guard$;

-- ─── 1. Réglage par adresse ────────────────────────────────────────────────

alter table public.catalog_offers
  add column if not exists deposit_mode text not null default 'none',
  add column if not exists deposit_amount numeric(10, 2),
  add column if not exists deposit_currency text not null default 'mad';

alter table public.catalog_offers drop constraint if exists catalog_offers_deposit_mode_check;
alter table public.catalog_offers add constraint catalog_offers_deposit_mode_check
  check (deposit_mode in ('none', 'per_person', 'fixed'));

alter table public.catalog_offers drop constraint if exists catalog_offers_deposit_amount_check;
alter table public.catalog_offers add constraint catalog_offers_deposit_amount_check
  check (
    deposit_mode = 'none'
    or (deposit_amount is not null and deposit_amount >= 10 and deposit_amount <= 100000)
  );

alter table public.catalog_offers drop constraint if exists catalog_offers_deposit_currency_check;
alter table public.catalog_offers add constraint catalog_offers_deposit_currency_check
  check (deposit_currency in ('mad', 'eur', 'usd'));

-- ─── 2. Trace du paiement ──────────────────────────────────────────────────

alter table public.qr_reservations
  add column if not exists deposit_amount numeric(10, 2),
  add column if not exists deposit_currency text,
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent text,
  add column if not exists deposit_paid_at timestamptz,
  add column if not exists deposit_refunded_at timestamptz;

create unique index if not exists qr_reservations_stripe_session_key
  on public.qr_reservations (stripe_session_id)
  where stripe_session_id is not null;

-- ─── 3. Commission = acompte payé ──────────────────────────────────────────

create or replace function public.qr_apply_commission()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  -- Acompte payé, non remboursé, en dirhams : c'est la commission, déjà
  -- encaissée par twocards.
  if new.deposit_paid_at is not null
     and new.deposit_refunded_at is null
     and new.deposit_currency = 'mad' then
    new.commission := coalesce(new.deposit_amount, 0);
    return new;
  end if;
  -- Toujours recalculée : aucune dérive possible entre montant et commission.
  new.commission := coalesce(round(new.amount_spent * new.commission_rate, 2), 0);
  return new;
end;
$function$;

-- ─── 4. Devis de l'acompte ─────────────────────────────────────────────────

-- Renvoie {amount, currency, mode, unit} si l'adresse de ce QR demande un
-- acompte, null sinon. L'adresse maison d'un hôtel passe avant le catalogue
-- (comme dans le menu) et ne demande jamais d'acompte.
create or replace function public.qr_deposit_quote(
  p_code text,
  p_venue_slug text,
  p_party_size integer
)
 returns jsonb
 language plpgsql
 stable
 security definer
 set search_path to 'public'
as $function$
declare
  v_user uuid;
  v_slug text := nullif(trim(coalesce(p_venue_slug, '')), '');
  v_party integer := least(greatest(coalesce(p_party_size, 2), 1), 50);
  v_offer record;
begin
  if v_slug is null or char_length(v_slug) > 40 or char_length(coalesce(p_code, '')) > 32 then
    return null;
  end if;

  select q.user_id into v_user
  from hotel_qr_codes q
  where q.code = p_code and q.active;
  if v_user is null then
    return null;
  end if;

  if exists (select 1 from hotel_offers o
             where o.slug = v_slug and o.user_id = v_user and o.active) then
    return null;
  end if;

  select c.deposit_mode, c.deposit_amount, c.deposit_currency into v_offer
  from catalog_offers c
  where c.slug = v_slug and c.active;

  if v_offer.deposit_mode is null or v_offer.deposit_mode = 'none' or v_offer.deposit_amount is null then
    return null;
  end if;

  return jsonb_build_object(
    'mode', v_offer.deposit_mode,
    'unit', v_offer.deposit_amount,
    'currency', v_offer.deposit_currency,
    'amount', case when v_offer.deposit_mode = 'per_person'
                   then v_offer.deposit_amount * v_party
                   else v_offer.deposit_amount end
  );
end;
$function$;

revoke execute on function public.qr_deposit_quote(text, text, integer) from public;
grant execute on function public.qr_deposit_quote(text, text, integer) to anon, authenticated, service_role;

-- ─── 5. Réservation : garde « Acompte requis » ─────────────────────────────

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

    -- Adresse à acompte : seule la réservation payée, enregistrée par le
    -- serveur après confirmation de Stripe, passe.
    if coalesce(auth.role(), '') <> 'service_role'
       and public.qr_deposit_quote(p_code, v_slug, p_party_size) is not null then
      raise exception 'Acompte requis';
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

revoke execute on function public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text) from public;
grant execute on function public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text) to anon;
grant execute on function public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text) to authenticated;
grant execute on function public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text) to service_role;

-- ─── 6. Enregistrement d'une réservation payée ─────────────────────────────

create or replace function public.qr_record_paid_reservation(
  p_session_id text,
  p_payment_intent text,
  p_amount numeric,
  p_currency text,
  p_code text,
  p_category text,
  p_venue text,
  p_guest_name text,
  p_guest_phone text,
  p_date date,
  p_time text,
  p_party_size integer,
  p_notes text,
  p_venue_slug text,
  p_service text
)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Réservé au serveur';
  end if;
  if coalesce(p_session_id, '') = '' or char_length(p_session_id) > 255 then
    raise exception 'Session invalide';
  end if;

  -- Le webhook et la page de retour peuvent arriver en même temps : le
  -- second attend le premier, puis retrouve sa réservation.
  perform pg_advisory_xact_lock(hashtext('qr_paid:' || p_session_id));

  select id into v_id from qr_reservations where stripe_session_id = p_session_id;
  if v_id is not null then
    return v_id;
  end if;

  v_id := public.qr_create_reservation(
    p_code, p_category, p_venue, p_guest_name, p_guest_phone, p_date,
    p_time, p_party_size, p_notes, p_venue_slug, p_service
  );

  update qr_reservations
     set deposit_amount = p_amount,
         deposit_currency = lower(p_currency),
         stripe_session_id = p_session_id,
         stripe_payment_intent = nullif(p_payment_intent, ''),
         deposit_paid_at = now()
   where id = v_id;

  return v_id;
end;
$function$;

revoke execute on function public.qr_record_paid_reservation(text, text, numeric, text, text, text, text, text, text, date, text, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.qr_record_paid_reservation(text, text, numeric, text, text, text, text, text, text, date, text, integer, text, text, text) to service_role;

-- Remboursement noté par le serveur (webhook charge.refunded).
create or replace function public.qr_mark_deposit_refunded(p_payment_intent text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Réservé au serveur';
  end if;
  update qr_reservations
     set deposit_refunded_at = coalesce(deposit_refunded_at, now())
   where stripe_payment_intent = p_payment_intent;
end;
$function$;

revoke execute on function public.qr_mark_deposit_refunded(text) from public, anon, authenticated;
grant execute on function public.qr_mark_deposit_refunded(text) to service_role;

commit;
