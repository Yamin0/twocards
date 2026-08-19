-- Événements et plan de salle du Venue Manager : jusqu'ici purement démo
-- (état React en mémoire, masqué hors compte de démonstration — un compte
-- réel créait un événement qui ne s'affichait nulle part). Les deux
-- deviennent des données réelles, propriété du compte établissement.

create table if not exists public.venue_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  venue text not null default '',
  event_day int,
  event_month int,
  event_year int,
  time_range text not null default '',
  status text not null default 'Brouillon'
    check (status in ('Ouvert', 'Bientôt complet', 'Fermé', 'Brouillon')),
  genres text[] not null default '{}',
  gradient text not null default '',
  icon_idx int not null default 0,
  cover_image text,
  total_spots int not null default 0,
  spots int not null default 0,
  reservations int not null default 0,
  revenue text not null default '0 MAD',
  rp_count int not null default 0,
  closed boolean not null default false,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists venue_events_owner_idx on public.venue_events (owner_id);

alter table public.venue_events enable row level security;

create policy "owner gère ses événements"
  on public.venue_events for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create table if not exists public.venue_tables (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null,
  x numeric not null default 100,
  y numeric not null default 100,
  shape text not null default 'round' check (shape in ('round', 'rect')),
  status text not null default 'available'
    check (status in ('available', 'occupied', 'blocked')),
  vip boolean not null default false,
  capacity int not null default 4 check (capacity between 1 and 50),
  created_at timestamptz not null default now()
);

create index if not exists venue_tables_owner_idx on public.venue_tables (owner_id);

alter table public.venue_tables enable row level security;

create policy "owner gère ses tables"
  on public.venue_tables for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
