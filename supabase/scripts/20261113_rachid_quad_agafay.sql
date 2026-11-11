-- Offre « Quad & buggy dans le désert d'Agafay » — partenaire Rachid Quad.
-- Menu client (QR en chambre), catégorie Activités, ville Marrakech.
--
-- APPLIQUÉ en production le 11 nov. 2026 par Claude (offre désactivée).
-- Pour la mettre en ligne, après déploiement du code :
--   update catalog_offers set active = true where slug = 'quad-buggy-agafay';
--
-- À lancer dans l'éditeur SQL Supabase, dans cet ordre :
--   1. supabase/migrations/20261113100000_acompte_stripe_apres_debit.sql
--   2. supabase/migrations/20261113110000_acompte_par_prestation.sql
--   3. ce script (relançable : il remplace l'offre et ses prestations)
--
-- Les prix saisis ici sont ceux du PARTENAIRE. Le prix affiché au client et
-- l'acompte sont calculés par twocards_prix_client() (+20 %, arrondi à la
-- tranche de 50 MAD supérieure ; acompte = différence). Les colonnes texte
-- `price` ne servent que de secours et sont remplies par la même fonction.
--
-- Photos (public/images/partners/quad-buggy-agafay-N.webp), libres d'usage
-- commercial sans attribution obligatoire, licences vérifiées le 11 nov. 2026 :
--   1 couverture, buggies et quads à Agafay — Mohamed Abira, Unsplash
--     https://unsplash.com/photos/0DRWuRYglVo
--   2 Can-Am Maverick X3 MAX (dunes) — Romero Gonzales Miocid King Piero, Pexels
--     https://www.pexels.com/photo/off-road-adventure-in-desert-sand-dunes-32543655/
--   3 Kymco Maxxer 300 rouge, désert de Marrakech — Abdellah Ziki, Pexels
--     https://www.pexels.com/photo/quad-ride-27549787/
--   4 Can-Am Maverick X3 2 places rouge — Levi Vaagenes, Pexels
--     https://www.pexels.com/photo/black-and-red-atv-on-white-sand-11504433/
--   5 quads utilitaires gris (type CFMOTO CFORCE), désert marocain — Mike Art, Pexels
--     https://www.pexels.com/photo/adventurers-on-atvs-in-moroccan-desert-36579388/
--   6 quads au coucher du soleil, Agafay — André Filipe, Unsplash
--     https://unsplash.com/photos/l9EXJyDBju8
-- Licences : https://unsplash.com/license · https://www.pexels.com/license/
-- Pas de photo libre d'un Maverick Trail rouge ni d'un CFORCE 520 au logo visible.

-- Places par véhicule (seats) : quads 1, buggy et X3 2, X3 MAX 4. Le nombre
-- de véhicules (et donc l'acompte) = personnes ÷ places, arrondi au-dessus.
-- Pour un quad biplace, passer seats à 2.

begin;

-- Offre du catalogue réseau. Le déclencheur catalog_sync_venue crée la fiche
-- `venues` du même slug (sans compte propriétaire pour l'instant) : les
-- prestations s'y rattachent. Quand Rachid Quad aura un compte, lui donner
-- venues.owner_id et venue_services.owner_id pour qu'il les gère lui-même.
insert into public.catalog_offers (
  slug, category, name, city, tag, description, price, image_url, images, sort_order, active, translations
)
values (
  'quad-buggy-agafay',
  'activites',
  'Quad & buggy dans le désert d''Agafay',
  'Marrakech',
  'Balade privée',
  'Balade privée en quad ou en buggy Can-Am dans le désert de pierre d''Agafay, aux portes de Marrakech : pistes, collines et vue sur l''Atlas. Choisissez le véhicule et la durée ; l''acompte se paie en ligne, le reste sur place.',
  null, -- la carte affiche « dès » le plus petit prix des prestations
  '/images/partners/quad-buggy-agafay-1.webp',
  array[
    '/images/partners/quad-buggy-agafay-2.webp',
    '/images/partners/quad-buggy-agafay-3.webp',
    '/images/partners/quad-buggy-agafay-4.webp',
    '/images/partners/quad-buggy-agafay-5.webp',
    '/images/partners/quad-buggy-agafay-6.webp'
  ],
  15,
  false, -- passer à true une fois le code (acompte par prestation) déployé
  jsonb_build_object('en', jsonb_build_object(
    'name', 'Quad & buggy in the Agafay desert',
    'tag', 'Private ride',
    'description', 'A private quad or Can-Am buggy ride through the Agafay stone desert, just outside Marrakech: tracks, hills and views of the Atlas. Choose your vehicle and duration; pay the deposit online and the rest on site.'
  ))
)
on conflict (slug) do update set
  category = excluded.category,
  name = excluded.name,
  city = excluded.city,
  tag = excluded.tag,
  description = excluded.description,
  price = excluded.price,
  image_url = excluded.image_url,
  images = excluded.images,
  sort_order = excluded.sort_order,
  active = excluded.active,
  translations = excluded.translations,
  updated_at = now();

-- Prestations : remplacées à chaque passage (seulement celles tenues par
-- twocards, sans compte propriétaire).
delete from public.venue_services
 where venue_slug = 'quad-buggy-agafay' and owner_id is null;

insert into public.venue_services (
  owner_id, venue_slug, name, description, duration, price,
  partner_price, price_currency, seats, sort_order, active, translations
)
select
  null,
  'quad-buggy-agafay',
  v.name,
  v.description,
  '',
  public.twocards_prix_client(v.partner_price)::integer || ' MAD',
  v.partner_price,
  'mad',
  v.seats,
  v.sort_order,
  true,
  jsonb_build_object('en', jsonb_build_object('name', v.name_en, 'description', v.description_en))
from (values
  ('Quad 300 cc · 1 h',          'Kymco Maxxer 300 · 1 pers. par quad',            250::numeric, 1::smallint, 10,  '300 cc quad · 1 hr',              'Kymco Maxxer 300 · 1 rider per quad'),
  ('Quad 300 cc · 2 h',          'Kymco Maxxer 300 · 1 pers. par quad',            400,          1,           20,  '300 cc quad · 2 hrs',             'Kymco Maxxer 300 · 1 rider per quad'),
  ('Quad 520 cc · 1 h',          'CFMOTO CFORCE 520 · 1 pers. par quad',           400,          1,           30,  '520 cc quad · 1 hr',              'CFMOTO CFORCE 520 · 1 rider per quad'),
  ('Quad 520 cc · 2 h',          'CFMOTO CFORCE 520 · 1 pers. par quad',           600,          1,           40,  '520 cc quad · 2 hrs',             'CFMOTO CFORCE 520 · 1 rider per quad'),
  ('Buggy · 1 h',                'Can-Am Maverick Trail · 2 places',               700,          2,           50,  'Buggy · 1 hr',                    'Can-Am Maverick Trail · 2 seats'),
  ('Buggy · 2 h',                'Can-Am Maverick Trail · 2 places',               1300,         2,           60,  'Buggy · 2 hrs',                   'Can-Am Maverick Trail · 2 seats'),
  ('Buggy X3 · 1 h',             'Can-Am Maverick X3 Turbo R · 2 places',          1400,         2,           70,  'X3 buggy · 1 hr',                 'Can-Am Maverick X3 Turbo R · 2 seats'),
  ('Buggy X3 · 2 h',             'Can-Am Maverick X3 Turbo R · 2 places',          2300,         2,           80,  'X3 buggy · 2 hrs',                'Can-Am Maverick X3 Turbo R · 2 seats'),
  ('Buggy X3 4 places · 1 h',    'Can-Am Maverick X3 MAX Turbo RR · 4 places',     1700,         4,           90,  '4-seat X3 buggy · 1 hr',          'Can-Am Maverick X3 MAX Turbo RR · 4 seats'),
  ('Buggy X3 4 places · 2 h',    'Can-Am Maverick X3 MAX Turbo RR · 4 places',     2500,         4,           100, '4-seat X3 buggy · 2 hrs',         'Can-Am Maverick X3 MAX Turbo RR · 4 seats')
) as v(name, description, partner_price, seats, sort_order, name_en, description_en);

commit;

-- Contrôle : prix partenaire, prix affiché, acompte (doit donner
-- 250/300/50, 400/500/100, 400/500/100, 600/750/150, 700/850/150,
-- 1300/1600/300, 1400/1700/300, 2300/2800/500, 1700/2050/350, 2500/3000/500).
select name,
       partner_price as prix_partenaire,
       public.twocards_prix_client(partner_price) as prix_affiche,
       public.twocards_prix_client(partner_price) - partner_price as acompte,
       seats as places
  from public.venue_services
 where venue_slug = 'quad-buggy-agafay'
 order by sort_order;
