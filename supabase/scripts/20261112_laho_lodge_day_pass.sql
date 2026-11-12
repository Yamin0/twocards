-- Offre « Day pass piscine & déjeuner » — Lahô Lodge (lac de Lalla Takerkoust).
-- Menu client (QR en chambre), catégorie Activités, ville Marrakech.
--
-- Même mécanique que Rachid Quad (20261113_rachid_quad_agafay.sql) : les prix
-- saisis sont ceux du PARTENAIRE ; twocards_prix_client() ajoute 20 % et
-- arrondit à la tranche de 50 MAD supérieure. L'acompte payé en ligne (Stripe,
-- Twocards LLC) = la part twocards ; le reste se paie sur place au Lodge.
--   adulte : 360 MAD partenaire -> 450 MAD affiché (45 €), acompte 90 MAD (9 €)
--   enfant : 280 MAD partenaire -> 350 MAD affiché (35 €), acompte 70 MAD (7 €)
-- Identique à la fiche Marrakech Best Of (450 / 90 et 350 / 70).
--
-- Sans nombre de places (seats null), le menu affiche des « entrées » à la
-- personne (adulte, enfant) au lieu de véhicules.
--
-- Sources (12 nov. 2026) :
--   https://www.laho-lodge.com/ (day pass : piscine, transat, serviette, menu
--     entrée-plat-dessert ; adultes dès 12 ans 450 MAD, enfants 3-11 ans 350 MAD ;
--     tous les jours dès 11 h jusqu'au coucher du soleil)
--   https://marrakechbestof.com/bon-plan/laho-lodge/ (4,8/5 sur 120 avis ;
--     acompte 90 / 70 MAD ; retard de plus de 30 min = réservation annulée)
-- Photos : celles du site laho-lodge.com et de la fiche Best Of (Lahô Lodge,
-- établissement de Yamin) -> public/images/partners/laho-lodge-N.webp.
--
-- Relançable : remplace l'offre et ses prestations tenues par twocards.
-- Description limitée à 300 caractères (catalog_offers_description_check).
-- APPLIQUÉ en production le 12 nov. 2026 par Claude (offre désactivée ; le
-- connecteur Supabase refuse le delete, d'où un insert simple ce jour-là).

begin;

insert into public.catalog_offers (
  slug, category, name, city, tag, description, price, image_url, images, sort_order, active, translations
)
values (
  'laho-lodge-day-pass',
  'activites',
  'Day pass au Lahô Lodge',
  'Marrakech',
  'Piscine & déjeuner',
  'Piscine à débordement face au lac de Lalla Takerkoust et à l''Atlas, à moins d''une heure de Marrakech. Transat, serviette et déjeuner entrée, plat, dessert du potager bio. Tous les jours dès 11 h. Acompte en ligne, le reste sur place ; au-delà de 30 min de retard, la réservation est annulée.',
  null, -- la carte affiche « dès » le plus petit prix des prestations
  '/images/partners/laho-lodge-1.webp',
  array[
    '/images/partners/laho-lodge-2.webp',
    '/images/partners/laho-lodge-3.webp',
    '/images/partners/laho-lodge-4.webp',
    '/images/partners/laho-lodge-5.webp',
    '/images/partners/laho-lodge-6.webp',
    '/images/partners/laho-lodge-7.webp'
  ],
  12,
  false, -- passer à true une fois le code (entrées à la personne) déployé
  jsonb_build_object('en', jsonb_build_object(
    'name', 'Day pass at Lahô Lodge',
    'tag', 'Pool & lunch',
    'description', 'Infinity pool overlooking Lake Lalla Takerkoust and the Atlas, less than an hour from Marrakech. Sun lounger, towel and a three-course lunch from the organic garden. Every day from 11 am. Deposit online, the rest on site; bookings more than 30 min late are cancelled.'
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
  translations = excluded.translations,
  updated_at = now();

delete from public.venue_services
 where venue_slug = 'laho-lodge-day-pass' and owner_id is null;

insert into public.venue_services (
  owner_id, venue_slug, name, description, duration, price,
  partner_price, price_currency, seats, sort_order, active, translations
)
select
  null,
  'laho-lodge-day-pass',
  v.name,
  v.description,
  '',
  public.twocards_prix_client(v.partner_price)::integer || ' MAD',
  v.partner_price,
  'mad',
  null,
  v.sort_order,
  true,
  jsonb_build_object('en', jsonb_build_object('name', v.name_en, 'description', v.description_en))
from (values
  ('Adulte',              'Dès 12 ans · piscine, transat, serviette, déjeuner entrée, plat, dessert', 360::numeric, 10, 'Adult',            'From 12 · pool, sun lounger, towel, three-course lunch'),
  ('Enfant (3 à 11 ans)', 'Piscine, transat, serviette, déjeuner entrée, plat, dessert',              280,          20, 'Child (3 to 11)',  'Pool, sun lounger, towel, three-course lunch')
) as v(name, description, partner_price, sort_order, name_en, description_en);

commit;

-- Contrôle : 360/450/90 et 280/350/70.
select name,
       partner_price as prix_partenaire,
       public.twocards_prix_client(partner_price) as prix_affiche,
       public.twocards_prix_client(partner_price) - partner_price as acompte
  from public.venue_services
 where venue_slug = 'laho-lodge-day-pass'
 order by sort_order;
