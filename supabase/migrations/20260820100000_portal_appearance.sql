-- Apparence du portail de réservation : couleur de fond de page et photo de
-- couverture importée (bucket avatars, dossier de l'utilisateur).

alter table public.venue_portals
  add column if not exists background_color text not null default '#f5f5f4'
    check (background_color ~ '^#[0-9a-fA-F]{6}$'),
  add column if not exists cover_url text
    check (cover_url is null or char_length(cover_url) <= 500);

-- Le type de retour change : DROP puis CREATE.
drop function if exists public.portal_get(text);

create or replace function public.portal_get(p_slug text)
returns table (
  display_name text,
  tagline text,
  accent_color text,
  background_color text,
  cover_url text,
  party_max int,
  start_time text,
  end_time text,
  interval_minutes int
)
language sql
security definer
set search_path = public
stable
as $$
  select vp.display_name, vp.tagline, vp.accent_color, vp.background_color,
         vp.cover_url, vp.party_max, vp.start_time, vp.end_time,
         vp.interval_minutes
  from venue_portals vp
  where vp.slug = p_slug and vp.active
    and char_length(p_slug) <= 40;
$$;

revoke all on function public.portal_get(text) from public;
grant execute on function public.portal_get(text) to anon, authenticated;
