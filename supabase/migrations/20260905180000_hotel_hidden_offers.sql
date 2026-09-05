-- Menu au niveau de l'hôtel : ce que l'hôtel retire du catalogue réseau pour
-- tous ses QR codes (page « Mes adresses »), en plus des retraits chambre par
-- chambre déjà portés par hotel_qr_codes.hidden_offers. Le menu client
-- applique l'union des deux listes.

alter table public.hotel_profiles
  add column if not exists hidden_offers text[] not null default '{}';

drop function if exists public.qr_get_menu(text);

create function public.qr_get_menu(p_code text)
returns table (
  label text,
  hidden_offers text[],
  hotel_name text,
  city text,
  accent_color text,
  background_color text,
  cover_url text,
  welcome_message text,
  reception_phone text,
  show_prices boolean,
  catalog jsonb,
  hotel_offers jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    q.label,
    (select coalesce(array_agg(distinct x), '{}')
       from unnest(q.hidden_offers || coalesce(p.hidden_offers, '{}')) as x),
    p.hotel_name,
    p.city,
    coalesce(p.accent_color, '#13305c'),
    coalesce(p.background_color, '#f4f3ef'),
    p.cover_url,
    p.welcome_message,
    p.reception_phone,
    coalesce(p.show_prices, true),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', c.slug, 'category', c.category, 'name', c.name, 'city', c.city,
        'tag', c.tag, 'description', c.description, 'price', c.price,
        'image_url', c.image_url, 'sort_order', c.sort_order
      ) order by c.sort_order, c.name)
      from catalog_offers c where c.active
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', h.slug, 'category', h.category, 'name', h.name,
        'tag', h.tag, 'description', h.description, 'price', h.price,
        'image_url', h.image_url, 'sort_order', h.sort_order
      ) order by h.sort_order, h.name)
      from hotel_offers h where h.user_id = q.user_id and h.active
    ), '[]'::jsonb)
  from hotel_qr_codes q
  left join hotel_profiles p on p.user_id = q.user_id
  where q.code = p_code
    and q.active
    and char_length(p_code) <= 32;
$$;

revoke all on function public.qr_get_menu(text) from public;
grant execute on function public.qr_get_menu(text) to anon, authenticated;
