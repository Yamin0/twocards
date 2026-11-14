-- Horaire fixé par le prestataire : pour certaines activités (montgolfière au
-- lever du soleil…), le client ne choisit pas d'heure. Le menu remplace alors
-- les créneaux par une phrase d'information.
--
-- 1. catalog_offers.time_info : la phrase en français (200 caractères au
--    plus) ; l'anglais va dans translations.en.time_info.
-- 2. qr_menu_extras : renvoie aussi time_info (repart de la définition en
--    production au 14 nov. 2026, 20261113130000_prix_client_par_devise).
-- 3. Données : vol en montgolfière Atlas Sky (réponse de la gérante, 14 nov.).

alter table public.catalog_offers
  add column if not exists time_info text;

alter table public.catalog_offers drop constraint if exists catalog_offers_time_info_check;
alter table public.catalog_offers add constraint catalog_offers_time_info_check
  check (time_info is null or char_length(time_info) between 1 and 200);

create or replace function public.qr_menu_extras(p_slugs text[])
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'offers', coalesce((
      select jsonb_agg(jsonb_build_object(
               'slug', c.slug,
               'translations', c.translations,
               'time_info', c.time_info))
        from catalog_offers c
       where c.active
         and c.slug = any (p_slugs[1:200])
         and (c.translations <> '{}'::jsonb or c.time_info is not null)
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', s.id,
               'slug', s.venue_slug,
               'model', s.model,
               'translations', s.translations,
               'seats', s.seats,
               'currency', s.price_currency,
               'client_price', public.twocards_prix_client(s.partner_price, 0.20, public.twocards_tranche(s.price_currency)),
               'deposit', public.twocards_prix_client(s.partner_price, 0.20, public.twocards_tranche(s.price_currency)) - s.partner_price
             ) order by s.sort_order, s.name)
        from venue_services s
        join catalog_offers c on c.slug = s.venue_slug and c.active
       where s.active
         and s.venue_slug = any (p_slugs[1:200])
         and (s.partner_price is not null or s.seats is not null
              or s.model is not null or s.translations <> '{}'::jsonb)
    ), '[]'::jsonb)
  );
$function$;

revoke execute on function public.qr_menu_extras(text[]) from public;
grant execute on function public.qr_menu_extras(text[]) to anon, authenticated, service_role;

update public.catalog_offers
   set time_info = 'Prise en charge à votre hôtel entre 4 h 30 et 5 h 15 en ce moment : l''heure suit le lever du soleil, elle varie selon la saison et votre hôtel.',
       translations = jsonb_set(coalesce(translations, '{}'::jsonb), '{en,time_info}',
         to_jsonb('Hotel pick-up between 4:30 and 5:15 am at this time of year: it follows sunrise, so it varies with the season and your hotel.'::text))
 where slug = 'montgolfiere-atlas-sky';

notify pgrst, 'reload schema';
