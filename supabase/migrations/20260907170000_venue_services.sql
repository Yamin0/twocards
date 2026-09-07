-- Prestations d'un établissement d'activité ou de service.
--
-- Un loueur de quads n'a pas « une table » : il vend des balades d'une
-- heure, d'une demi-journée, en quad ou en buggy, à des prix différents.
-- Jusqu'ici sa fiche du catalogue ne portait qu'un nom et un « dès X MAD »
-- tenus par l'administrateur. Il gère désormais lui-même ses prestations,
-- et le menu client les affiche sous sa fiche dès qu'elles sont actives :
-- le client choisit la prestation en même temps que la date.

-- ── Prestations ────────────────────────────────────────────────────────

create table if not exists public.venue_services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Fiche du catalogue sous laquelle la prestation apparaît. Renseignée
  -- automatiquement d'après le compte : le dashboard n'a pas à la connaître.
  venue_slug text references public.venues (slug) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 300),
  duration text not null default '' check (char_length(duration) <= 40),
  price text not null default '' check (char_length(price) <= 40),
  image_url text check (image_url is null or char_length(image_url) <= 500),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists venue_services_slug_idx
  on public.venue_services (venue_slug, sort_order) where active;
create index if not exists venue_services_owner_idx
  on public.venue_services (owner_id, sort_order);

alter table public.venue_services enable row level security;

drop policy if exists "owner lit ses prestations" on public.venue_services;
create policy "owner lit ses prestations"
  on public.venue_services for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "owner crée ses prestations" on public.venue_services;
create policy "owner crée ses prestations"
  on public.venue_services for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "owner modifie ses prestations" on public.venue_services;
create policy "owner modifie ses prestations"
  on public.venue_services for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "owner supprime ses prestations" on public.venue_services;
create policy "owner supprime ses prestations"
  on public.venue_services for delete to authenticated
  using (owner_id = auth.uid());

grant select, insert, update, delete on public.venue_services to authenticated;

-- La fiche de rattachement vient du compte ; l'horodatage suit chaque écriture.
create or replace function public.venue_services_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.venue_slug is null then
    select v.slug into new.venue_slug
      from venues v
     where v.owner_id = new.owner_id
     order by v.created_at
     limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_venue_services_defaults on public.venue_services;
create trigger trg_venue_services_defaults
  before insert or update on public.venue_services
  for each row execute function public.venue_services_defaults();

-- ── La prestation choisie voyage avec la réservation ───────────────────

alter table public.qr_reservations
  add column if not exists service_name text
    check (service_name is null or char_length(service_name) <= 80);

-- ── Menu client : les prestations sous chaque fiche ────────────────────

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
  category_images jsonb,
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
    ), '[]'::jsonb)
  from hotel_qr_codes q
  left join hotel_profiles p on p.user_id = q.user_id
  where q.code = p_code
    and q.active
    and char_length(p_code) <= 32;
$$;
revoke all on function public.qr_get_menu(text) from public;
grant execute on function public.qr_get_menu(text) to anon, authenticated;

-- ── Création de réservation : un paramètre de plus ─────────────────────

-- L'ancienne signature disparaît : deux fonctions du même nom laisseraient
-- l'API incapable de choisir.
drop function if exists public.qr_create_reservation(
  text, text, text, text, text, date, text, int, text, text
);

create function public.qr_create_reservation(
  p_code text,
  p_category text,
  p_venue text,
  p_guest_name text,
  p_guest_phone text,
  p_date date,
  p_time text,
  p_party_size int,
  p_notes text,
  p_venue_slug text default null,
  p_service text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qr uuid;
  v_id uuid;
begin
  if coalesce(trim(p_guest_name), '') = '' or char_length(p_guest_name) > 120 then
    raise exception 'Nom invalide';
  end if;
  if coalesce(trim(p_guest_phone), '') = '' or char_length(p_guest_phone) > 40 then
    raise exception 'Téléphone invalide';
  end if;
  if char_length(coalesce(p_category, '')) > 40
     or char_length(coalesce(p_venue, '')) > 120
     or char_length(coalesce(p_time, '')) > 20
     or char_length(coalesce(p_notes, '')) > 500
     or char_length(coalesce(p_venue_slug, '')) > 40
     or char_length(coalesce(p_service, '')) > 80 then
    raise exception 'Champ trop long';
  end if;

  select id into v_qr
  from hotel_qr_codes
  where code = p_code and active;

  if v_qr is null then
    raise exception 'QR code introuvable ou inactif';
  end if;

  insert into qr_reservations (
    qr_code_id, category, venue_name, guest_name, guest_phone,
    reservation_date, reservation_time, party_size, notes, venue_slug,
    service_name
  )
  values (
    v_qr, p_category, p_venue, trim(p_guest_name), trim(p_guest_phone),
    p_date, nullif(trim(coalesce(p_time, '')), ''),
    least(greatest(coalesce(p_party_size, 2), 1), 50),
    nullif(trim(coalesce(p_notes, '')), ''),
    nullif(trim(coalesce(p_venue_slug, '')), ''),
    nullif(trim(coalesce(p_service, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;
revoke all on function public.qr_create_reservation(
  text, text, text, text, text, date, text, int, text, text, text
) from public;
grant execute on function public.qr_create_reservation(
  text, text, text, text, text, date, text, int, text, text, text
) to anon, authenticated;

-- ── Les notifications nomment la prestation ────────────────────────────

create or replace function public.notify_new_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if new.source = 'venue' then
    return new;
  end if;
  v_owner := qr_reservation_owner(new);
  if v_owner is null then
    return new;
  end if;
  insert into venue_notifications (owner_id, kind, title, body, href)
  values (
    v_owner,
    'reservation',
    'Nouvelle réservation',
    new.guest_name
      || coalesce(' · ' || new.service_name, '')
      || ' · ' || to_char(new.reservation_date, 'DD/MM')
      || coalesce(' · ' || new.reservation_time, '')
      || ' · ' || new.party_size || ' pers.'
      || case when new.source = 'portal' then ' · portail' else ' · QR hôtel' end,
    '/dashboard/reservations'
  );
  return new;
end;
$$;

create or replace function public.push_hotel_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel uuid;
begin
  if new.qr_code_id is null then
    return new;
  end if;

  select q.user_id into v_hotel
    from hotel_qr_codes q
   where q.id = new.qr_code_id;

  perform push_to_user(
    v_hotel,
    'Nouvelle demande client',
    new.guest_name || ' · ' || new.venue_name
      || coalesce(' · ' || new.service_name, '')
      || ' · ' || to_char(new.reservation_date, 'DD/MM')
      || coalesce(' · ' || new.reservation_time, '')
      || ' · ' || new.party_size || ' pers.',
    '/hotel/reservations'
  );
  return new;
end;
$$;
