-- Panier de véhicules : le client choisit d'abord le modèle, puis la durée,
-- et peut réserver plusieurs véhicules de modèles différents en une fois
-- (ex. 3 personnes : un buggy X3 2 places 2 h + un quad 300 cc 1 h).
--
-- À lancer après 20261113110000_acompte_par_prestation.sql.
--
-- 1. venue_services.model : le modèle (« Quad 300 cc », « Buggy X3 4 places »)
--    qui regroupe les durées dans le menu ; la durée va dans `duration`.
--    Traductions : translations.en.model / .duration.
-- 2. qr_menu_extras : renvoie aussi `model`.
-- 3. qr_deposit_quote_lines(code, slug, lignes) : devis d'un panier
--    [{id, qty}] — acompte = somme des marges twocards, reste sur place =
--    somme des prix partenaires. Au plus 10 lignes et 20 véhicules.
--    La garde « Acompte requis » de qr_create_reservation ne change pas.
-- 4. Données de l'offre quad-buggy-agafay : modèle et durée renseignés.

-- ─── 1. Modèle ─────────────────────────────────────────────────────────────

alter table public.venue_services
  add column if not exists model text;

alter table public.venue_services drop constraint if exists venue_services_model_check;
alter table public.venue_services add constraint venue_services_model_check
  check (model is null or char_length(model) between 1 and 80);

-- ─── 2. Compléments du menu ────────────────────────────────────────────────

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
               'model', s.model,
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
         and (s.partner_price is not null or s.seats is not null
              or s.model is not null or s.translations <> '{}'::jsonb)
    ), '[]'::jsonb)
  );
$function$;

revoke execute on function public.qr_menu_extras(text[]) from public;
grant execute on function public.qr_menu_extras(text[]) to anon, authenticated, service_role;

-- ─── 3. Devis d'un panier ──────────────────────────────────────────────────

create or replace function public.qr_deposit_quote_lines(
  p_code text,
  p_venue_slug text,
  p_lines jsonb
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
  v_count integer;
  v_result jsonb;
begin
  if v_slug is null or char_length(v_slug) > 40 or char_length(coalesce(p_code, '')) > 32
     or jsonb_typeof(p_lines) is distinct from 'array'
     or jsonb_array_length(p_lines) not between 1 and 10 then
    return null;
  end if;

  select q.user_id into v_user
  from hotel_qr_codes q
  where q.code = p_code and q.active;
  if v_user is null then
    return null;
  end if;

  -- Adresse maison de l'hôtel : jamais d'acompte.
  if exists (select 1 from hotel_offers o
             where o.slug = v_slug and o.user_id = v_user and o.active) then
    return null;
  end if;

  with lines as (
    select (l->>'id') as id,
           case when (l->>'qty') ~ '^[0-9]{1,2}$' then (l->>'qty')::integer end as qty
      from jsonb_array_elements(p_lines) l
  ),
  valid as (
    select s.id, s.name, s.price_currency as currency, s.partner_price,
           public.twocards_prix_client(s.partner_price) as client_price,
           l.qty, s.sort_order
      from lines l
      join venue_services s
        on s.id::text = l.id
       and s.venue_slug = v_slug
       and s.active
       and s.partner_price is not null
      join catalog_offers c on c.slug = s.venue_slug and c.active
     where l.qty between 1 and 20
  )
  select count(*),
         case when count(distinct currency) = 1
                   and sum(qty) <= 20
                   and count(distinct id) = count(*) then
           jsonb_build_object(
             'mode', 'lines',
             'currency', min(currency),
             'units', sum(qty),
             'amount', sum(qty * (client_price - partner_price)),
             'on_site', sum(qty * partner_price),
             'lines', jsonb_agg(jsonb_build_object(
                        'id', id, 'name', name, 'qty', qty,
                        'unit', client_price - partner_price,
                        'client_price', client_price
                      ) order by sort_order, name)
           )
         end
    into v_count, v_result
    from valid;

  -- Une ligne inconnue, en double ou hors limites : pas de devis.
  if v_count <> jsonb_array_length(p_lines) then
    return null;
  end if;
  return v_result;
end;
$function$;

revoke execute on function public.qr_deposit_quote_lines(text, text, jsonb) from public;
grant execute on function public.qr_deposit_quote_lines(text, text, jsonb) to anon, authenticated, service_role;

-- ─── 4. Données : modèle et durée de l'offre Rachid Quad ───────────────────

update public.venue_services s
   set model = v.model,
       duration = v.duration,
       translations = jsonb_build_object('en', jsonb_build_object(
         'name', v.name_en, 'description', v.description_en,
         'model', v.model_en, 'duration', v.duration_en))
  from (values
    ('Quad 300 cc · 1 h',        'Quad 300 cc',        '1 h', '300 cc quad · 1 hr',      'Kymco Maxxer 300 · 1 rider per quad',       '300 cc quad',     '1 hr'),
    ('Quad 300 cc · 2 h',        'Quad 300 cc',        '2 h', '300 cc quad · 2 hrs',     'Kymco Maxxer 300 · 1 rider per quad',       '300 cc quad',     '2 hrs'),
    ('Quad 520 cc · 1 h',        'Quad 520 cc',        '1 h', '520 cc quad · 1 hr',      'CFMOTO CFORCE 520 · 1 rider per quad',      '520 cc quad',     '1 hr'),
    ('Quad 520 cc · 2 h',        'Quad 520 cc',        '2 h', '520 cc quad · 2 hrs',     'CFMOTO CFORCE 520 · 1 rider per quad',      '520 cc quad',     '2 hrs'),
    ('Buggy · 1 h',              'Buggy',              '1 h', 'Buggy · 1 hr',            'Can-Am Maverick Trail · 2 seats',           'Buggy',           '1 hr'),
    ('Buggy · 2 h',              'Buggy',              '2 h', 'Buggy · 2 hrs',           'Can-Am Maverick Trail · 2 seats',           'Buggy',           '2 hrs'),
    ('Buggy X3 · 1 h',           'Buggy X3',           '1 h', 'X3 buggy · 1 hr',         'Can-Am Maverick X3 Turbo R · 2 seats',      'X3 buggy',        '1 hr'),
    ('Buggy X3 · 2 h',           'Buggy X3',           '2 h', 'X3 buggy · 2 hrs',        'Can-Am Maverick X3 Turbo R · 2 seats',      'X3 buggy',        '2 hrs'),
    ('Buggy X3 4 places · 1 h',  'Buggy X3 4 places',  '1 h', '4-seat X3 buggy · 1 hr',  'Can-Am Maverick X3 MAX Turbo RR · 4 seats', '4-seat X3 buggy', '1 hr'),
    ('Buggy X3 4 places · 2 h',  'Buggy X3 4 places',  '2 h', '4-seat X3 buggy · 2 hrs', 'Can-Am Maverick X3 MAX Turbo RR · 4 seats', '4-seat X3 buggy', '2 hrs')
  ) as v(name, model, duration, name_en, description_en, model_en, duration_en)
 where s.venue_slug = 'quad-buggy-agafay' and s.name = v.name;

notify pgrst, 'reload schema';
