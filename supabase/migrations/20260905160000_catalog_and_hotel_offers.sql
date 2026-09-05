-- Catalogue des adresses proposées après un scan de QR code hôtel.
--
-- Jusqu'ici le catalogue était écrit en dur dans le code (constants.ts et
-- guest-catalog.ts) : ajouter une adresse demandait un déploiement. Deux
-- tables le remplacent :
--
--   catalog_offers  le catalogue du réseau twocards, tenu par l'administrateur,
--                   partagé par tous les hôtels (filtré par ville côté client) ;
--   hotel_offers    les « adresses maison » qu'un hôtel ajoute lui-même, visibles
--                   sur ses seuls QR codes (son spa, son chauffeur, un partenaire).
--
-- Les slugs des offres existantes (venue-1…6, act-1…5, srv-1…4) sont conservés
-- tels quels : les listes hidden_offers déjà enregistrées par chambre et les
-- venue_slug des réservations passées restent valables.

-- ─── Catalogue réseau ─────────────────────────────────────────────────────────

create table if not exists public.catalog_offers (
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,39}$'),
  category text not null
    check (category in ('restaurants', 'activites', 'clubs', 'services')),
  name text not null check (char_length(name) between 1 and 120),
  city text check (city is null or char_length(city) <= 80),
  tag text not null default '' check (char_length(tag) <= 40),
  description text not null default '' check (char_length(description) <= 300),
  price text check (price is null or char_length(price) <= 40),
  image_url text check (image_url is null or char_length(image_url) <= 500),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalog_offers enable row level security;

-- Lecture : tout le monde voit les offres actives (menu client anonyme,
-- dashboards hôtel) ; l'administrateur voit aussi les offres désactivées.
drop policy if exists "catalogue lisible" on public.catalog_offers;
create policy "catalogue lisible"
  on public.catalog_offers for select to anon, authenticated
  using (
    active
    or coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false)
  );

-- Écriture : administrateur uniquement (drapeau app_metadata, hors de portée
-- du client).
drop policy if exists "admin gère le catalogue" on public.catalog_offers;
create policy "admin gère le catalogue"
  on public.catalog_offers for all to authenticated
  using (coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false))
  with check (coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false));

grant select on public.catalog_offers to anon, authenticated;
grant insert, update, delete on public.catalog_offers to authenticated;

-- Chaque offre du catalogue a sa fiche dans venues : c'est par ce slug que
-- la réservation est rattachée au compte de l'établissement (montant
-- dépensé, commission). Le type n'est jamais écrasé sur une fiche existante,
-- le rattachement owner_id non plus. Une fiche n'est jamais supprimée : les
-- réservations passées la référencent.
create or replace function public.catalog_sync_venue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into venues (slug, name, type, city)
  values (
    new.slug,
    new.name,
    case new.category
      when 'restaurants' then 'restaurant'
      when 'clubs' then 'club'
      when 'activites' then 'activite'
      else 'service'
    end,
    coalesce(new.city, '')
  )
  on conflict (slug) do update
    set name = excluded.name,
        city = excluded.city;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_catalog_sync_venue on public.catalog_offers;
create trigger trg_catalog_sync_venue
  before insert or update on public.catalog_offers
  for each row execute function public.catalog_sync_venue();

-- ─── Adresses maison de l'hôtel ───────────────────────────────────────────────

create table if not exists public.hotel_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- Slug court et stable (≤ 40 caractères, limite de qr_create_reservation) :
  -- clé dans hidden_offers et venue_slug des réservations.
  slug text not null unique default ('h-' || substr(md5(gen_random_uuid()::text), 1, 12)),
  category text not null
    check (category in ('restaurants', 'activites', 'clubs', 'services')),
  name text not null check (char_length(name) between 1 and 120),
  tag text not null default '' check (char_length(tag) <= 40),
  description text not null default '' check (char_length(description) <= 300),
  price text check (price is null or char_length(price) <= 40),
  image_url text check (image_url is null or char_length(image_url) <= 500),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hotel_offers_user_id_idx on public.hotel_offers (user_id);

alter table public.hotel_offers enable row level security;

drop policy if exists "hotel gère ses adresses" on public.hotel_offers;
create policy "hotel gère ses adresses"
  on public.hotel_offers for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.hotel_offers to authenticated;
-- Le client anonyme ne lit ces lignes qu'à travers qr_get_menu.

-- ─── Menu client : catalogue et adresses maison voyagent avec le menu ─────────

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
    q.hidden_offers,
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

-- ─── Reprise du catalogue codé en dur ─────────────────────────────────────────

insert into public.catalog_offers
  (slug, category, name, city, tag, description, price, image_url, sort_order)
values
  ('venue-4', 'restaurants', 'Le Comptoir de la Sqala', 'Casablanca', 'Restaurant',
   'Chic Casablanca restaurant with late-night dining and a curated cocktail program.',
   null, '/images/carousel/05.jpg', 10),
  ('venue-5', 'restaurants', 'Table du Marché Hivernage', 'Marrakech', 'Restaurant',
   'Cuisine de marché et produits de saison, servis dans un patio contemporain au cœur du quartier Hivernage.',
   null, '/images/carousel/06.jpg', 20),
  ('venue-3', 'restaurants', 'Baoli Tanger', 'Tanger', 'Restaurant',
   'Asian-fusion restaurant and lounge on the waterfront, a staple of Tanger nightlife.',
   null, '/images/carousel/04.jpg', 30),
  ('venue-2', 'clubs', 'Jimmy''z Marrakech', 'Marrakech', 'Club',
   'Legendary Marrakech nightclub, the playground of the jet-set in the Red City.',
   null, '/images/carousel/03.jpg', 10),
  ('venue-1', 'clubs', 'L''Arc Casablanca', 'Casablanca', 'Club',
   'Iconic Casablanca nightclub on the Corniche, blending fine dining with world-class clubbing.',
   null, '/images/carousel/02.jpg', 20),
  ('venue-6', 'clubs', 'Le Bar Long', 'Casablanca', 'Bar',
   'Elegantly designed hotel bar serving avant-garde cocktails in an intimate setting.',
   null, '/images/carousel/07.jpg', 30),
  ('act-1', 'activites', 'Montgolfière au lever du soleil', 'Marrakech', 'Aventure',
   'Survol du désert d''Agafay et des palmeraies, petit-déjeuner berbère inclus.',
   'dès 1 100 MAD', '/images/carousel/02.jpg', 10),
  ('act-2', 'activites', 'Quad & dromadaire dans la Palmeraie', 'Marrakech', 'Aventure',
   'Randonnée guidée entre pistes et palmiers, pause thé à la menthe au campement.',
   'dès 450 MAD', '/images/carousel/04.jpg', 20),
  ('act-3', 'activites', 'Hammam & spa traditionnel', null, 'Bien-être',
   'Rituel complet : gommage au savon noir, enveloppement au ghassoul, massage à l''huile d''argan.',
   'dès 600 MAD', '/images/carousel/06.jpg', 30),
  ('act-4', 'activites', 'Cours de cuisine marocaine', null, 'Culture',
   'Marché aux épices, tajine et pâtisseries avec une dada, repas dégusté ensemble.',
   'dès 500 MAD', '/images/carousel/08.jpg', 40),
  ('act-5', 'activites', 'Excursion vallée de l''Ourika', 'Marrakech', 'Excursion',
   'Villages berbères, cascades et déjeuner au bord de l''oued, transport privé.',
   'dès 700 MAD', '/images/carousel/09.jpg', 50),
  ('srv-1', 'services', 'Chauffeur privé & transferts', null, 'Transport',
   'Berline avec chauffeur pour vos sorties, transferts aéroport et excursions.',
   null, '/images/carousel/01.jpg', 10),
  ('srv-2', 'services', 'Photographe privé', null, 'Lifestyle',
   'Séance photo lifestyle dans les plus beaux décors de la ville, clichés retouchés sous 48 h.',
   'dès 900 MAD', '/images/carousel/03.jpg', 20),
  ('srv-3', 'services', 'Baby-sitting de confiance', null, 'Famille',
   'Intervenantes vérifiées, français et anglais parlés, à l''hôtel ou en villa.',
   null, '/images/carousel/05.jpg', 30),
  ('srv-4', 'services', 'Demande sur mesure', null, 'Conciergerie',
   'Fleurs, anniversaire, demande spéciale… Dites-nous tout, on s''occupe du reste.',
   null, '/images/carousel/07.jpg', 40)
on conflict (slug) do nothing;
