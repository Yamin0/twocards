-- Quatre compléments pour que chacun voie clair dans les commissions et que
-- l'hôtel maîtrise son menu.
--
-- 1. L'hôtel d'origine voyage avec la réservation. L'établissement ne peut
--    pas lire hotel_qr_codes (RLS), il n'avait donc aucun moyen de savoir
--    quel hôtel lui envoie un client : le nom est recopié à la création.
-- 2. Un règlement de commission se note, par mois et par couple
--    établissement → hôtel, pour que « à régler » et « réglé » aient un sens.
-- 3. L'administrateur lit un grand livre de toutes les réservations, avec
--    qui doit quoi à qui.
-- 4. Un QR d'hôtel peut retirer des catégories entières du menu, avec une
--    échéance : « pas de clubs pour cette famille jusqu'à dimanche ».

-- ── 1. Hôtel d'origine ────────────────────────────────────────────────

alter table public.qr_reservations
  add column if not exists referrer_id uuid references auth.users (id) on delete set null,
  add column if not exists referrer_name text;

create or replace function public.qr_reservation_referrer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.qr_code_id is null then
    new.referrer_id := null;
    new.referrer_name := null;
    return new;
  end if;
  select q.user_id,
         coalesce(nullif(hp.hotel_name, ''), nullif(p.venue_name, ''),
                  nullif(p.full_name, ''), 'Hôtel partenaire')
    into new.referrer_id, new.referrer_name
    from hotel_qr_codes q
    left join hotel_profiles hp on hp.user_id = q.user_id
    left join profiles p on p.id = q.user_id
   where q.id = new.qr_code_id;
  return new;
end;
$$;

drop trigger if exists trg_qr_reservation_referrer on public.qr_reservations;
create trigger trg_qr_reservation_referrer
  before insert or update of qr_code_id on public.qr_reservations
  for each row execute function public.qr_reservation_referrer();

update public.qr_reservations r
   set referrer_id = q.user_id,
       referrer_name = coalesce(nullif(hp.hotel_name, ''), nullif(p.venue_name, ''),
                                nullif(p.full_name, ''), 'Hôtel partenaire')
  from public.hotel_qr_codes q
  left join public.hotel_profiles hp on hp.user_id = q.user_id
  left join public.profiles p on p.id = q.user_id
 where q.id = r.qr_code_id and r.referrer_id is null;

-- ── 2. Règlements ──────────────────────────────────────────────────────

create table if not exists public.commission_settlements (
  id uuid primary key default gen_random_uuid(),
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  venue_owner_id uuid not null references auth.users (id) on delete cascade,
  hotel_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null default 0,
  note text not null default '' check (char_length(note) <= 300),
  settled_at timestamptz not null default now(),
  settled_by uuid default auth.uid() references auth.users (id) on delete set null,
  unique (period, venue_owner_id, hotel_id)
);

alter table public.commission_settlements enable row level security;

drop policy if exists "admin gère les règlements" on public.commission_settlements;
create policy "admin gère les règlements"
  on public.commission_settlements for all to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false))
  with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

drop policy if exists "établissement lit ses règlements" on public.commission_settlements;
create policy "établissement lit ses règlements"
  on public.commission_settlements for select to authenticated
  using (venue_owner_id = auth.uid());

drop policy if exists "hôtel lit ses règlements" on public.commission_settlements;
create policy "hôtel lit ses règlements"
  on public.commission_settlements for select to authenticated
  using (hotel_id = auth.uid());

grant select, insert, update, delete on public.commission_settlements to authenticated;

-- ── 3. Grand livre de l'administrateur ─────────────────────────────────

create or replace function public.admin_commission_ledger()
returns table (
  id uuid,
  reservation_date date,
  created_at timestamptz,
  period text,
  guest_name text,
  category text,
  venue_slug text,
  venue_name text,
  venue_owner_id uuid,
  venue_account text,
  hotel_id uuid,
  hotel_name text,
  source text,
  status text,
  amount_spent numeric,
  commission_rate numeric,
  commission numeric,
  service_name text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) then
    raise exception 'Réservé à l''administrateur';
  end if;

  return query
  select r.id,
         r.reservation_date,
         r.created_at,
         to_char(r.reservation_date, 'YYYY-MM'),
         r.guest_name,
         r.category,
         r.venue_slug,
         r.venue_name,
         coalesce(r.venue_owner_id, v.owner_id),
         coalesce(pv.venue_name, pv.full_name, uv.email::text),
         r.referrer_id,
         r.referrer_name,
         r.source,
         r.status,
         r.amount_spent,
         r.commission_rate,
         r.commission,
         r.service_name
    from public.qr_reservations r
    left join public.venues v on v.slug = r.venue_slug
    left join public.profiles pv on pv.id = coalesce(r.venue_owner_id, v.owner_id)
    left join auth.users uv on uv.id = coalesce(r.venue_owner_id, v.owner_id)
   order by r.reservation_date desc, r.created_at desc;
end;
$$;

revoke all on function public.admin_commission_ledger() from public;
grant execute on function public.admin_commission_ledger() to authenticated;

-- ── 4. Catégories retirées d'un QR, avec échéance ──────────────────────

alter table public.hotel_qr_codes
  add column if not exists hidden_categories text[] not null default '{}',
  add column if not exists hidden_until date;

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
    -- Passée l'échéance, le retrait tombe de lui-même.
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
    ), '[]'::jsonb)
  from hotel_qr_codes q
  left join hotel_profiles p on p.user_id = q.user_id
  where q.code = p_code
    and q.active
    and char_length(p_code) <= 32;
$$;
revoke all on function public.qr_get_menu(text) from public;
grant execute on function public.qr_get_menu(text) to anon, authenticated;
