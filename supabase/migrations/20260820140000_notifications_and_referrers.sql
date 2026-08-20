-- Deux maquettes de plus deviennent réelles.
--
-- 1. Notifications : jusqu'ici une page de démo aux horodatages figés
--    (« il y a 5 min » pour toujours). Une vraie table, alimentée par
--    triggers sur les événements qui comptent pour un manager : nouvelle
--    réservation entrante, avis client déposé, ticket de caisse orphelin.
--
-- 2. Réseau apporteurs : le cœur de twocards — « quel hôtel m'envoie
--    qui » — n'était visible nulle part côté établissement, la RLS
--    réservant hotel_qr_codes à l'hôtel. Une RPC security definer expose
--    les agrégats par apporteur, rien d'autre.

-- ── 1. Table des notifications ─────────────────────────────────────────

create table if not exists public.venue_notifications (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('reservation', 'rating', 'pos')),
  title text not null,
  body text not null default '',
  href text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists venue_notifications_owner_idx
  on public.venue_notifications (owner_id, created_at desc);

alter table public.venue_notifications enable row level security;

create policy "owner lit ses notifications"
  on public.venue_notifications for select to authenticated
  using (owner_id = auth.uid());

create policy "owner marque lu ou purge"
  on public.venue_notifications for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owner supprime ses notifications"
  on public.venue_notifications for delete to authenticated
  using (owner_id = auth.uid());

-- Seule la coche « lu » est modifiable par le client.
grant select, delete on public.venue_notifications to authenticated;
grant update (read) on public.venue_notifications to authenticated;

-- ── Triggers d'alimentation ────────────────────────────────────────────

-- Propriétaire établissement d'une réservation, quel que soit le canal.
create or replace function public.qr_reservation_owner(r public.qr_reservations)
returns uuid
language sql
stable
as $$
  select coalesce(
    r.venue_owner_id,
    (select v.owner_id from venues v where v.slug = r.venue_slug limit 1)
  );
$$;

-- Nouvelle réservation entrante (QR hôtel ou portail — pas celles que
-- l'établissement crée lui-même).
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
    new.guest_name || ' · '
      || to_char(new.reservation_date, 'DD/MM')
      || coalesce(' · ' || new.reservation_time, '')
      || ' · ' || new.party_size || ' pers.'
      || case when new.source = 'portal' then ' · portail' else ' · QR hôtel' end,
    '/dashboard/reservations'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_reservation on public.qr_reservations;
create trigger trg_notify_new_reservation
  after insert on public.qr_reservations
  for each row execute function public.notify_new_reservation();

-- Avis client déposé (rating passe de null à renseigné).
create or replace function public.notify_new_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if old.rating is not null or new.rating is null then
    return new;
  end if;
  v_owner := qr_reservation_owner(new);
  if v_owner is null then
    return new;
  end if;
  insert into venue_notifications (owner_id, kind, title, body, href)
  values (
    v_owner,
    'rating',
    'Nouvel avis client',
    new.guest_name || ' — ' || new.rating || '/5'
      || coalesce(' · « ' || left(new.rating_comment, 80) || ' »', ''),
    '/dashboard/reservations'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_rating on public.qr_reservations;
create trigger trg_notify_new_rating
  after update on public.qr_reservations
  for each row execute function public.notify_new_rating();

-- Ticket de caisse sans réservation rapprochée : à traiter.
create or replace function public.notify_pos_unmatched()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'unmatched' then
    return new;
  end if;
  insert into venue_notifications (owner_id, kind, title, body, href)
  values (
    new.owner_id,
    'pos',
    'Ticket caisse non rapproché',
    'Table ' || coalesce(new.table_label, '?')
      || ' · ' || coalesce(new.amount::text, '?') || ' MAD'
      || coalesce(' · ' || new.reason, ''),
    '/dashboard/integrations'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_pos_unmatched on public.pos_events;
create trigger trg_notify_pos_unmatched
  after insert on public.pos_events
  for each row execute function public.notify_pos_unmatched();

-- Temps réel : la cloche s'allume sans recharger.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'venue_notifications'
  ) then
    alter publication supabase_realtime add table public.venue_notifications;
  end if;
end $$;

-- ── 2. Attribution par apporteur ───────────────────────────────────────

-- Agrégats par hôtel apporteur pour l'établissement connecté. Security
-- definer : l'établissement n'obtient que des sommes et un nom — jamais
-- les QR codes, les chambres ni les scans de l'hôtel.
create or replace function public.venue_referrers()
returns table (
  referrer_id uuid,
  referrer_name text,
  reservations bigint,
  covers bigint,
  revenue numeric,
  commissions numeric,
  last_reservation date,
  avg_rating numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    q.user_id,
    coalesce(p.venue_name, p.full_name, 'Hôtel partenaire'),
    count(*),
    coalesce(sum(r.party_size), 0),
    coalesce(sum(r.amount_spent), 0),
    coalesce(sum(r.commission), 0),
    max(r.reservation_date),
    avg(r.rating)
  from qr_reservations r
  join hotel_qr_codes q on q.id = r.qr_code_id
  left join profiles p on p.id = q.user_id
  where r.source = 'qr'
    and r.status not in ('annulée', 'no-show')
    and (
      r.venue_owner_id = auth.uid()
      or exists (
        select 1 from venues v
        where v.slug = r.venue_slug and v.owner_id = auth.uid()
      )
    )
  group by q.user_id, coalesce(p.venue_name, p.full_name, 'Hôtel partenaire')
  order by count(*) desc;
$$;

revoke all on function public.venue_referrers() from public;
grant execute on function public.venue_referrers() to authenticated;
