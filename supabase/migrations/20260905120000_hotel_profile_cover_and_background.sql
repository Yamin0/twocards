-- Couverture et fond du menu client, choisis par l'hôtel.
-- La photo de couverture vit dans le bucket « avatars » sous le dossier de
-- l'hôtel (mêmes règles que la photo de profil et la couverture du portail
-- établissement) ; seule son URL publique est stockée ici.

alter table public.hotel_profiles
  add column if not exists cover_url text
    check (cover_url is null or char_length(cover_url) <= 500),
  add column if not exists background_color text not null default '#f4f3ef'
    check (background_color ~ '^#[0-9a-fA-F]{6}$');

-- Le type de retour change : Postgres impose de supprimer la fonction avant.
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
  show_prices boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    q.label,
    q.hidden_offers,
    p.hotel_name,
    p.city,
    coalesce(p.accent_color, '#13305c'),
    coalesce(p.background_color, '#f4f3ef'),
    p.cover_url,
    p.welcome_message,
    p.reception_phone,
    coalesce(p.show_prices, true)
  from hotel_qr_codes q
  left join hotel_profiles p on p.user_id = q.user_id
  where q.code = p_code
    and q.active
    and char_length(p_code) <= 32;
$$;

revoke all on function public.qr_get_menu(text) from public;
grant execute on function public.qr_get_menu(text) to anon, authenticated;
