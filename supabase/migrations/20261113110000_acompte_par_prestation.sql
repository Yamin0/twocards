-- Acompte par prestation : prix du partenaire + marge twocards.
--
-- À lancer APRÈS l'acompte Stripe (20261113100000_acompte_stripe_apres_debit.sql
-- en production ; elle remplace
-- qr_deposit_quote, créée par celle-ci). Première utilisation : l'offre
-- « Quad & buggy dans le désert d'Agafay » (partenaire Rachid Quad), voir
-- supabase/scripts/20261113_rachid_quad_agafay.sql.
--
-- Principe (règle fixée par Yamin le 11 nov. 2026) :
--   prix affiché au client = prix du partenaire + 20 %, arrondi à la
--   tranche de 50 MAD supérieure ;
--   acompte payé en ligne    = prix affiché − prix du partenaire.
-- twocards garde l'acompte ; le client règle le prix du partenaire sur place.
-- Exemples : 250 → 300 (acompte 50), 1 700 → 2 050 (acompte 350).
--
-- 1. twocards_prix_client(prix_partenaire) : la règle, en un seul endroit.
--    Toute prestation qui porte un prix partenaire en profite d'office.
-- 2. venue_services : prix du partenaire, devise, places par véhicule,
--    traductions ; owner_id devient facultatif (prestation tenue par twocards
--    pour un partenaire qui n'a pas encore de compte : invisible et non
--    modifiable depuis les dashboards, la RLS ne la montre à personne).
--    catalog_offers : traductions (nom, description, étiquette).
-- 3. qr_menu_extras(slugs) : ce que le menu client lit en plus de
--    qr_get_menu (prix affichés et acomptes calculés ici, traductions), pour
--    ne pas retoucher qr_get_menu.
-- 4. qr_deposit_quote(code, slug, personnes, prestation) — nouvelle
--    signature ; celle à 3 arguments devient un relais. L'acompte d'une
--    prestation à prix partenaire = marge × nombre de véhicules
--    (personnes ÷ places, arrondi au-dessus). Appelée sans prestation (garde
--    « Acompte requis » de qr_create_reservation, inchangée), elle renvoie
--    l'acompte de la première prestation : une adresse à prestations payantes
--    ne peut donc jamais être réservée sans payer.

begin;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'catalog_offers' and column_name = 'deposit_mode'
  ) then
    raise exception 'Lancer d''abord l''acompte Stripe (20261113100000_acompte_stripe_apres_debit.sql)';
  end if;
end;
$$;

-- ─── 1. La règle de prix ───────────────────────────────────────────────────

create or replace function public.twocards_prix_client(
  p_prix_partenaire numeric,
  p_marge numeric default 0.20,
  p_tranche numeric default 50
)
 returns numeric
 language sql
 immutable
 parallel safe
 set search_path to ''
as $function$
  select case
    when p_prix_partenaire is null or p_prix_partenaire <= 0 then null
    else ceil(p_prix_partenaire * (1 + p_marge) / p_tranche) * p_tranche
  end;
$function$;

revoke execute on function public.twocards_prix_client(numeric, numeric, numeric) from public;
grant execute on function public.twocards_prix_client(numeric, numeric, numeric) to anon, authenticated, service_role;

-- ─── 2. Colonnes ───────────────────────────────────────────────────────────

alter table public.venue_services alter column owner_id drop not null;

alter table public.venue_services
  add column if not exists partner_price numeric(10, 2),
  add column if not exists price_currency text not null default 'mad',
  add column if not exists seats smallint,
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.venue_services drop constraint if exists venue_services_partner_price_check;
alter table public.venue_services add constraint venue_services_partner_price_check
  check (partner_price is null or (partner_price >= 10 and partner_price <= 100000));

alter table public.venue_services drop constraint if exists venue_services_price_currency_check;
alter table public.venue_services add constraint venue_services_price_currency_check
  check (price_currency in ('mad', 'eur', 'usd'));

alter table public.venue_services drop constraint if exists venue_services_seats_check;
alter table public.venue_services add constraint venue_services_seats_check
  check (seats is null or seats between 1 and 20);

alter table public.venue_services drop constraint if exists venue_services_translations_check;
alter table public.venue_services add constraint venue_services_translations_check
  check (jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 4000);

alter table public.catalog_offers
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.catalog_offers drop constraint if exists catalog_offers_translations_check;
alter table public.catalog_offers add constraint catalog_offers_translations_check
  check (jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 4000);

-- ─── 3. Compléments du menu client ─────────────────────────────────────────

-- {offers: [{slug, translations}], services: [{id, slug, translations, seats,
-- currency, client_price, deposit}]} pour les adresses actives demandées.
-- Ne renvoie jamais le prix du partenaire en tant que tel.
create or replace function public.qr_menu_extras(p_slugs text[])
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'offers', coalesce((
      select jsonb_agg(jsonb_build_object('slug', c.slug, 'translations', c.translations))
        from catalog_offers c
       where c.active
         and c.slug = any (p_slugs[1:200])
         and c.translations <> '{}'::jsonb
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', s.id,
               'slug', s.venue_slug,
               'translations', s.translations,
               'seats', s.seats,
               'currency', s.price_currency,
               'client_price', public.twocards_prix_client(s.partner_price),
               'deposit', public.twocards_prix_client(s.partner_price) - s.partner_price
             ) order by s.sort_order, s.name)
        from venue_services s
        join catalog_offers c on c.slug = s.venue_slug and c.active
       where s.active
         and s.venue_slug = any (p_slugs[1:200])
         and (s.partner_price is not null or s.seats is not null or s.translations <> '{}'::jsonb)
    ), '[]'::jsonb)
  );
$function$;

revoke execute on function public.qr_menu_extras(text[]) from public;
grant execute on function public.qr_menu_extras(text[]) to anon, authenticated, service_role;

-- ─── 4. Devis de l'acompte, prestation comprise ────────────────────────────

-- Nouvelle signature à 4 arguments, SANS valeur par défaut : la version à
-- 3 arguments reste (le connecteur Supabase refuse un drop function) et
-- devient un relais. Un appel à 3 arguments (garde de qr_create_reservation)
-- tombe donc exactement sur elle, sans ambiguïté.
create or replace function public.qr_deposit_quote(
  p_code text,
  p_venue_slug text,
  p_party_size integer,
  p_service text
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
  v_service text := nullif(trim(coalesce(p_service, '')), '');
  v_party integer := least(greatest(coalesce(p_party_size, 2), 1), 50);
  v_offer record;
  v_line record;
  v_price numeric;
  v_unit numeric;
  v_units integer;
begin
  if v_slug is null or char_length(v_slug) > 40 or char_length(coalesce(p_code, '')) > 32
     or char_length(coalesce(v_service, '')) > 80 then
    return null;
  end if;

  select q.user_id into v_user
  from hotel_qr_codes q
  where q.code = p_code and q.active;
  if v_user is null then
    return null;
  end if;

  -- L'adresse maison d'un hôtel passe avant le catalogue et n'a jamais
  -- d'acompte.
  if exists (select 1 from hotel_offers o
             where o.slug = v_slug and o.user_id = v_user and o.active) then
    return null;
  end if;

  -- Prestations à prix partenaire : acompte = marge twocards, par véhicule.
  if exists (select 1
               from venue_services s
               join catalog_offers c on c.slug = s.venue_slug and c.active
              where s.venue_slug = v_slug and s.active and s.partner_price is not null) then
    select s.name, s.partner_price, s.seats, s.price_currency into v_line
      from venue_services s
     where s.venue_slug = v_slug and s.active and s.partner_price is not null
       and (v_service is null or s.name = v_service)
     order by s.sort_order, s.name
     limit 1;
    -- Prestation inconnue ou retirée : pas de devis, pas de paiement.
    if not found then
      return null;
    end if;

    v_price := public.twocards_prix_client(v_line.partner_price);
    v_unit := v_price - v_line.partner_price;
    v_units := case when v_line.seats is null then 1
                    else ceil(v_party::numeric / v_line.seats)::integer end;
    if v_unit <= 0 then
      return null;
    end if;

    return jsonb_build_object(
      'mode', 'per_vehicle',
      'unit', v_unit,
      'units', v_units,
      'currency', v_line.price_currency,
      'amount', v_unit * v_units,
      'service', v_line.name,
      'client_price', v_price,
      'on_site', v_line.partner_price * v_units
    );
  end if;

  -- Sinon : réglage de l'adresse du catalogue, comme avant.
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

revoke execute on function public.qr_deposit_quote(text, text, integer, text) from public;
grant execute on function public.qr_deposit_quote(text, text, integer, text) to anon, authenticated, service_role;

-- Relais : sans prestation, l'acompte de la première prestation payante
-- (ou le réglage de l'adresse) ; garde « Acompte requis » inchangée.
create or replace function public.qr_deposit_quote(
  p_code text,
  p_venue_slug text,
  p_party_size integer
)
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select public.qr_deposit_quote(p_code, p_venue_slug, p_party_size, null::text);
$function$;

revoke execute on function public.qr_deposit_quote(text, text, integer) from public;
grant execute on function public.qr_deposit_quote(text, text, integer) to anon, authenticated, service_role;

commit;

-- PostgREST relit les signatures (nouvel argument, nouvelle fonction).
notify pgrst, 'reload schema';
