-- Profil public de l'hôtel, lu par le menu client (/s/[code]).
--
-- Jusqu'ici, le nom et la ville de l'hôtel voyageaient dans l'URL encodée
-- dans le QR (?h=…&c=…) : un hôtel renommé devait réimprimer tous ses codes,
-- et rien ne permettait de personnaliser le menu (couleur, message d'accueil,
-- numéro de la réception). Le profil vit désormais en base, et la RPC
-- anonyme qr_get_menu le renvoie avec le menu : les QR déjà imprimés
-- profitent de chaque changement, sans réimpression.

create table if not exists public.hotel_profiles (
  user_id uuid primary key default auth.uid()
    references auth.users(id) on delete cascade,
  hotel_name text check (char_length(hotel_name) <= 120),
  city text check (char_length(city) <= 80),
  accent_color text not null default '#13305c'
    check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  welcome_message text check (char_length(welcome_message) <= 240),
  reception_phone text check (char_length(reception_phone) <= 40),
  show_prices boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.hotel_profiles enable row level security;

drop policy if exists "hotel lit son profil" on public.hotel_profiles;
create policy "hotel lit son profil"
  on public.hotel_profiles for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "hotel crée son profil" on public.hotel_profiles;
create policy "hotel crée son profil"
  on public.hotel_profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "hotel met à jour son profil" on public.hotel_profiles;
create policy "hotel met à jour son profil"
  on public.hotel_profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.hotel_profiles to authenticated;

-- ─── Menu client : le profil voyage avec le menu ──────────────────────────────

-- Le type de retour change : Postgres impose de supprimer la fonction avant.
drop function if exists public.qr_get_menu(text);

create function public.qr_get_menu(p_code text)
returns table (
  label text,
  hidden_offers text[],
  hotel_name text,
  city text,
  accent_color text,
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

-- ─── Scans en temps réel dans le dashboard ────────────────────────────────────

-- Chaque scan incrémente hotel_qr_codes.scans via qr_track_scan : diffuser
-- la table permet au dashboard de suivre les scans sans recharger. La RLS
-- s'applique aussi aux événements Realtime — un hôtel ne voit que les siens.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public' and tablename = 'hotel_qr_codes'
     ) then
    alter publication supabase_realtime add table public.hotel_qr_codes;
  end if;
end;
$$;
