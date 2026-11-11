-- qr_get_menu renvoie le rôle du propriétaire du QR (colonne owner_role).
--
-- NON LANCÉ. À relire puis à exécuter par le propriétaire, dans l'éditeur SQL.
--
-- Ce que ça change : une seule colonne de plus, en DERNIÈRE position,
-- `owner_role text` = profiles.role du propriétaire du QR (hotel, concierge…),
-- 'hotel' par défaut si le profil n'a pas de ligne. Le menu client /s/<code>
-- s'en sert pour parler à un concierge sans dire « hôtel » ni « réception ».
-- Toutes les autres colonnes, leur ordre, leur calcul, les filtres (QR actif,
-- code de 32 caractères au plus), SECURITY DEFINER, STABLE, search_path et
-- les droits sont ceux de la définition en place (supabase/schema.sql).
--
-- Changer le type de retour d'une fonction impose DROP puis CREATE : tout est
-- dans une transaction, le menu n'est jamais absent pour un client.
-- Le code de l'application fonctionne avant ET après cette migration (sans
-- owner_role, il garde le vocabulaire de l'hôtel).
--
-- Vérification, sans effet de bord (lecture seule, à lancer après) :
--   -- le QR de démonstration (un hôtel) : attendu owner_role = 'hotel'
--   select label, hotel_name, owner_role from public.qr_get_menu('a1f3c07b');
--   -- un QR actif par rôle de propriétaire, pour comparer :
--   select distinct on (pr.role) pr.role, q.code, m.owner_role
--     from hotel_qr_codes q
--     join profiles pr on pr.id = q.user_id
--     cross join lateral public.qr_get_menu(q.code) m
--    where q.active
--    order by pr.role, q.created_at;
-- et, pour les droits :
--   select grantee, privilege_type from information_schema.routine_privileges
--    where routine_schema = 'public' and routine_name = 'qr_get_menu';
--   -- attendu : anon et authenticated (EXECUTE), pas PUBLIC.

begin;

drop function if exists public.qr_get_menu(text);

create function public.qr_get_menu(p_code text)
returns table (
  label text,
  hidden_offers text[],
  hidden_categories text[],
  hidden_until date,
  hotel_name text,
  city text,
  accent_color text,
  background_color text,
  cover_url text,
  welcome_message text,
  reception_phone text,
  show_prices boolean,
  category_images jsonb,
  catalog jsonb,
  hotel_offers jsonb,
  owner_role text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    q.label,
    (select coalesce(array_agg(distinct x), '{}')
       from unnest(q.hidden_offers || coalesce(p.hidden_offers, '{}')) as x),
    case when q.hidden_until is null or q.hidden_until >= current_date
         then q.hidden_categories else '{}'::text[] end,
    q.hidden_until,
    p.hotel_name,
    p.city,
    coalesce(p.accent_color, '#13305c'),
    coalesce(p.background_color, '#f4f3ef'),
    p.cover_url,
    p.welcome_message,
    p.reception_phone,
    coalesce(p.show_prices, true),
    coalesce(p.category_images, '{}'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', c.slug, 'category', c.category, 'name', c.name, 'city', c.city,
        'tag', c.tag, 'description', c.description, 'price', c.price,
        'image_url', c.image_url, 'images', c.images, 'sort_order', c.sort_order,
        'services', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', s.id, 'name', s.name, 'description', s.description,
            'duration', s.duration, 'price', s.price, 'image_url', s.image_url
          ) order by s.sort_order, s.name)
          from venue_services s
          where s.venue_slug = c.slug and s.active
        ), '[]'::jsonb)
      ) order by c.sort_order, c.name)
      from catalog_offers c where c.active
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', h.slug, 'category', h.category, 'name', h.name,
        'tag', h.tag, 'description', h.description, 'price', h.price,
        'image_url', h.image_url, 'images', h.images, 'sort_order', h.sort_order
      ) order by h.sort_order, h.name)
      from hotel_offers h where h.user_id = q.user_id and h.active
    ), '[]'::jsonb),
    -- Nouveau : le rôle du propriétaire (sous-requête sur la clé primaire,
    -- une valeur au plus ; aucune ligne de menu ne peut être dupliquée).
    coalesce((select r.role from profiles r where r.id = q.user_id), 'hotel')
  from hotel_qr_codes q
  left join hotel_profiles p on p.user_id = q.user_id
  where q.code = p_code
    and q.active
    and char_length(p_code) <= 32;
$function$;

-- Mêmes droits que schema.sql : personne par défaut, puis anon et
-- authenticated (le menu est lu sans compte).
revoke all on function public.qr_get_menu(p_code text) from public, anon, authenticated;
grant execute on function public.qr_get_menu(p_code text) to anon;
grant execute on function public.qr_get_menu(p_code text) to authenticated;

commit;
