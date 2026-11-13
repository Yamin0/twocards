-- Offre « Vol en montgolfière » — Atlas Sky (marrakechhotairballoons.com).
-- Menu client (QR en chambre), catégorie Activités, ville Marrakech.
--
-- Prix PARTENAIRE en euros, envoyés par Atlas Sky le 13 nov. 2026 :
--   vol classique adulte 95 €, enfant de moins de 10 ans 70 €,
--   vol privé & romantique 450 € / pers., vol royal 650 € / pers.
-- twocards_prix_client() ajoute 20 % ; en euros, arrondi à l'euro
-- (migration 20261113130000_prix_client_par_devise.sql) :
--   95 -> 114 € (acompte 19), 70 -> 84 (14), 450 -> 540 (90), 650 -> 780 (130).
-- L'acompte payé en ligne (Stripe, Twocards LLC) = la part twocards ;
-- le reste se paie sur place à Atlas Sky.
--
-- Sans nombre de places (seats null) : entrées à la personne dans le menu.
--
-- Sources : e-mail d'Atlas Sky (13 nov. 2026) ; https://marrakechhotairballoons.com
-- (/vols : enfants dès 6 ans, nacelle de 12 pers. max en vol partagé,
-- 40 à 60 min de vol, décollage à Bourousse, pilotes certifiés DGAC,
-- annulation gratuite jusqu'à 48 h, report météo sans frais).
-- Photos : celles du site du partenaire (accueil, sans filigrane ; la
-- galerie porte un filigrane « ATLAS SKY ») -> montgolfiere-atlas-sky-N.webp.
--
-- Création : offre désactivée. Après déploiement des photos :
--   update catalog_offers set active = true where slug = 'montgolfiere-atlas-sky';
-- Le connecteur Supabase refuse un SQL qui contient un delete : ce script
-- n'en a pas ; pour le relancer, supprimer d'abord les prestations à la main.

insert into public.catalog_offers (
  slug, category, name, city, tag, description, price, image_url, images, sort_order, active, translations
)
values (
  'montgolfiere-atlas-sky',
  'activites',
  'Vol en montgolfière au lever du soleil',
  'Marrakech',
  'Atlas Sky',
  'Vol au lever du soleil au-dessus de la palmeraie, face à l''Atlas, avec des pilotes certifiés DGAC. Prise en charge à l''hôtel à l''aube, thé et café, gonflage, 40 à 60 min de vol, petit-déjeuner berbère et certificat. Retour vers 10 h. Dès 6 ans. Acompte en ligne, le reste sur place.',
  null,
  '/images/partners/montgolfiere-atlas-sky-1.webp',
  array[
    '/images/partners/montgolfiere-atlas-sky-2.webp',
    '/images/partners/montgolfiere-atlas-sky-3.webp',
    '/images/partners/montgolfiere-atlas-sky-4.webp',
    '/images/partners/montgolfiere-atlas-sky-5.webp',
    '/images/partners/montgolfiere-atlas-sky-6.webp',
    '/images/partners/montgolfiere-atlas-sky-7.webp',
    '/images/partners/montgolfiere-atlas-sky-8.webp'
  ],
  8,
  false,
  jsonb_build_object('en', jsonb_build_object(
    'name', 'Sunrise hot-air balloon flight',
    'tag', 'Atlas Sky',
    'description', 'Sunrise flight over the palm grove facing the Atlas, with DGAC-certified pilots. Hotel pick-up at dawn, tea and coffee, inflation, 40 to 60 min in the air, Berber breakfast and flight certificate. Back around 10 am. From age 6. Deposit online, the rest on site.'
  ))
);

insert into public.venue_services (
  owner_id, venue_slug, name, description, duration, price,
  partner_price, price_currency, seats, sort_order, active, translations
)
select
  null,
  'montgolfiere-atlas-sky',
  v.name,
  v.description,
  '',
  public.twocards_prix_client(v.partner_price, 0.20, public.twocards_tranche('eur'))::integer || ' €',
  v.partner_price,
  'eur',
  null,
  v.sort_order,
  true,
  jsonb_build_object('en', jsonb_build_object('name', v.name_en, 'description', v.description_en))
from (values
  ('Vol classique · adulte',
   'Ballon partagé (12 pers. max) · transfert, thé et café, gonflage, vol, petit-déjeuner berbère, certificat, assurance',
   95::numeric, 10,
   'Classic flight · adult',
   'Shared balloon (12 max) · transfer, tea and coffee, inflation, flight, Berber breakfast, certificate, insurance'),
  ('Vol classique · enfant (6 à 9 ans)',
   'Même vol, accompagné d''un adulte',
   70, 20,
   'Classic flight · child (6 to 9)',
   'Same flight, with an adult'),
  ('Vol privé & romantique',
   'Ballon privatisé pour votre groupe · transfert privé, pilote et équipage dédiés, vol prolongé, petit-déjeuner gourmet, photos, certificat',
   450, 30,
   'Private & romantic flight',
   'Private balloon for your group · private transfer, dedicated pilot and crew, longer flight, gourmet breakfast, photos, certificate'),
  ('Vol royal VIP',
   'Ballon privatisé · voiture de luxe, vol le plus long, pilote senior et hôte, petit-déjeuner servi dans le ciel, photos et vidéo pro',
   650, 40,
   'Royal VIP flight',
   'Private balloon · luxury car, longest flight, senior pilot and host, breakfast served in the sky, pro photos and video')
) as v(name, description, partner_price, sort_order, name_en, description_en);

-- Contrôle : 95/114/19, 70/84/14, 450/540/90, 650/780/130.
select name, partner_price,
       public.twocards_prix_client(partner_price, 0.20, public.twocards_tranche(price_currency)) as prix_affiche,
       public.twocards_prix_client(partner_price, 0.20, public.twocards_tranche(price_currency)) - partner_price as acompte
  from public.venue_services
 where venue_slug = 'montgolfiere-atlas-sky'
 order by sort_order;
