-- Portail de réservation directe (modèle SevenRooms « direct booking ») :
-- chaque établissement peut publier une page de réservation hébergée par
-- twocards (/r/[slug]) et l'intégrer à son site en iframe. Les réservations
-- du portail entrent dans le même pipeline que celles des QR hôtels, mais
-- sans apporteur : commission à 0 — le canal direct est gratuit, c'est
-- l'argument d'adoption.

-- 1. Une réservation peut désormais exister sans QR d'hôtel.
alter table public.qr_reservations
  alter column qr_code_id drop not null;

alter table public.qr_reservations
  add column if not exists source text not null default 'qr'
    check (source in ('qr', 'portal')),
  -- Rattachement direct au compte établissement pour les réservations du
  -- portail (les réservations QR passent, elles, par venue_slug -> venues).
  add column if not exists venue_owner_id uuid references auth.users (id) on delete set null;

-- 2. Les policies établissement couvrent les deux chemins de rattachement.
drop policy if exists "venue lit ses réservations" on public.qr_reservations;
create policy "venue lit ses réservations"
  on public.qr_reservations for select to authenticated
  using (
    venue_owner_id = auth.uid()
    or exists (
      select 1 from public.venues v
      where v.slug = qr_reservations.venue_slug
        and v.owner_id = auth.uid()
    )
  );

drop policy if exists "venue saisit le montant de ses réservations" on public.qr_reservations;
create policy "venue saisit le montant de ses réservations"
  on public.qr_reservations for update to authenticated
  using (
    venue_owner_id = auth.uid()
    or exists (
      select 1 from public.venues v
      where v.slug = qr_reservations.venue_slug
        and v.owner_id = auth.uid()
    )
  );

-- 3. Configuration du portail, une par établissement.
create table if not exists public.venue_portals (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  tagline text not null default '' check (char_length(tagline) <= 160),
  accent_color text not null default '#13305c'
    check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  party_max int not null default 8 check (party_max between 1 and 20),
  start_time text not null default '19:00' check (start_time ~ '^\d{2}:\d{2}$'),
  end_time text not null default '01:00' check (end_time ~ '^\d{2}:\d{2}$'),
  interval_minutes int not null default 30 check (interval_minutes in (15, 30, 60)),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.venue_portals enable row level security;

create policy "owner gère son portail"
  on public.venue_portals for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 4. Lecture publique de la configuration (page /r/[slug]) — via RPC pour ne
--    jamais exposer la table aux anonymes.
create or replace function public.portal_get(p_slug text)
returns table (
  display_name text,
  tagline text,
  accent_color text,
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
  select vp.display_name, vp.tagline, vp.accent_color, vp.party_max,
         vp.start_time, vp.end_time, vp.interval_minutes
  from venue_portals vp
  where vp.slug = p_slug and vp.active
    and char_length(p_slug) <= 40;
$$;

-- 5. Dépôt d'une réservation depuis le portail (visiteur anonyme).
create or replace function public.portal_create_reservation(
  p_slug text,
  p_guest_name text,
  p_guest_phone text,
  p_date date,
  p_time text,
  p_party_size int,
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
  v_id uuid;
begin
  if coalesce(trim(p_guest_name), '') = '' or char_length(p_guest_name) > 120 then
    raise exception 'Nom invalide';
  end if;
  if coalesce(trim(p_guest_phone), '') = '' or char_length(p_guest_phone) > 40 then
    raise exception 'Téléphone invalide';
  end if;
  if p_date is null or p_date < current_date then
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

  select slug into v_slug from venues where owner_id = v_portal.owner_id limit 1;

  insert into qr_reservations (
    qr_code_id, category, venue_name, guest_name, guest_phone,
    reservation_date, reservation_time, party_size, notes,
    venue_slug, venue_owner_id, source, commission_rate
  )
  values (
    null, 'Direct', v_portal.display_name, trim(p_guest_name),
    trim(p_guest_phone), p_date, nullif(trim(coalesce(p_time, '')), ''),
    least(greatest(coalesce(p_party_size, 2), 1), v_portal.party_max),
    nullif(trim(coalesce(p_notes, '')), ''),
    v_slug, v_portal.owner_id, 'portal', 0
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.portal_get(text) from public;
revoke all on function public.portal_create_reservation(text, text, text, date, text, int, text) from public;
grant execute on function public.portal_get(text) to anon, authenticated;
grant execute on function public.portal_create_reservation(text, text, text, date, text, int, text)
  to anon, authenticated;
