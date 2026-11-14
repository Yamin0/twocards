-- Carte des soins « The Pearl Spa · Nobu » (offre spa-nobu, catégorie Activités).
--
-- Prix PUBLICS du spa, sans commission ajoutée (demande de Yamin, 14 nov. 2026) :
-- pas de prix partenaire, donc pas d'acompte en ligne ; le client règle au spa.
-- La commission de 10 % (accord Spa Nobu) se règle à part, comme un restaurant.
--
-- Source : brochure officielle « The Pearl Spa » d'avril 2025,
--   https://www.nobuhotels.com/marrakech/content/uploads/2025/04/the-pearl-spa-digital.pdf
-- (spa ouvert tous les jours de 9 h à 22 h, dernier soin à 21 h ; soins du
-- visage, jacuzzi et salle de sport dès 16 ans). Coiffure, épilation, beauté
-- des mains et abonnements laissés de côté : le menu garde les soins.
--
-- L'ordre compte : la carte du menu affiche « dès » le prix de la première
-- prestation (accès au spa, 500 MAD), et la première est proposée d'office.
-- Le connecteur Supabase refuse un SQL qui contient un delete : pour relancer
-- ce script, supprimer d'abord les prestations de spa-nobu à la main.
-- APPLIQUÉ en production le 14 nov. 2026 par Claude.

insert into public.venue_services (
  owner_id, venue_slug, name, description, duration, price,
  partner_price, price_currency, seats, sort_order, active, translations
)
select
  null,
  'spa-nobu',
  v.name,
  v.description,
  v.duration,
  v.price,
  null,
  'mad',
  null,
  v.sort_order,
  true,
  jsonb_build_object('en', jsonb_build_object('name', v.name_en, 'description', v.description_en))
from (values
  ('Accès piscine, sauna et hammam', 'Piscine intérieure de 25 m, sauna, jacuzzi, bain de vapeur et salle de sport', 'Journée', '500 MAD', 10,
   'Pool, sauna and steam access', '25 m indoor pool, sauna, jacuzzi, steam bath and gym'),
  ('Massage dos, cou et épaules', 'Massage ciblé pour dénouer les tensions', '30 min', '600 MAD', 20,
   'Back, neck and shoulder massage', 'Targeted massage to release tension'),
  ('Massage jambes légères', 'Massage drainant des jambes', '30 min', '600 MAD', 30,
   'Lighter legs massage', 'Draining leg massage'),
  ('Escale à Marrakech', 'Hammam : gommage au savon noir et fleur d''oranger, enveloppement au ghassoul, miel et argan', '45 min', '700 MAD', 40,
   'Marrakech escape', 'Hammam: black soap and orange blossom scrub, ghassoul wrap with honey and argan'),
  ('Délice au miel', 'Hammam : gommage au sucre et au miel, enveloppement au ghassoul, miel et argan', '45 min', '800 MAD', 50,
   'Honey delights', 'Hammam: sugar and honey scrub, ghassoul wrap with honey and argan'),
  ('Massage signature The Pearl', 'Le massage maison du spa', '45 min', '800 MAD', 60,
   'The Pearl signature massage', 'The spa''s own signature massage'),
  ('Massage signature The Pearl', 'Le massage maison du spa, version longue', '60 min', '1 100 MAD', 70,
   'The Pearl signature massage', 'The spa''s own signature massage, longer version'),
  ('Hammam royal', 'Gommage aux sels marins et enveloppement aux algues', '60 min', '1 000 MAD', 80,
   'Royal hammam', 'Sea salt scrub and seaweed wrap'),
  ('Muscles revigorés', 'Massage profond pour les muscles fatigués', '50 min', '1 000 MAD', 90,
   'Muscle reviver', 'Deep massage for tired muscles'),
  ('Massage aux pierres chaudes', 'Massage relaxant aux pierres chaudes', '50 min', '1 100 MAD', 100,
   'Hot stones massage', 'Relaxing hot stones massage'),
  ('Rituel express', 'Hammam au savon noir 30 min + massage relaxant 45 min', '75 min', '1 200 MAD', 110,
   'Express ritual', 'Black soap hammam 30 min + relaxing massage 45 min'),
  ('Diamond Well-Living · Natura Bissé', 'Soin du corps au choix : Fitness, Energizing, Detox ou Destress', '60 min', '1 400 MAD', 120,
   'Diamond Well-Living · Natura Bissé', 'Body treatment of your choice: Fitness, Energizing, Detox or Destress'),
  ('Massage thaï', 'Massage traditionnel thaïlandais', '90 min', '1 500 MAD', 130,
   'Thai massage', 'Traditional Thai massage'),
  ('Massage 4 mains', 'Deux praticiens, un seul massage', '50 min', '1 500 MAD', 140,
   '4 hands massage', 'Two therapists, one massage'),
  ('Évasion des sens', 'Hammam royal 60 min + massage 50 min à l''argan et à la fleur d''oranger', '110 min', '1 800 MAD', 150,
   'Sensory escape', 'Royal hammam 60 min + 50 min argan and orange blossom massage'),
  ('Soin du visage oxygénant · Natura Bissé', 'The O₂ Relax : hydrate et redonne bonne mine (dès 16 ans)', '60 min', '1 700 MAD', 160,
   'Oxygenating facial · Natura Bissé', 'The O₂ Relax: hydrates and restores a healthy glow (from 16)'),
  ('Soin du visage vitamine C · Natura Bissé', 'The Citrus Essence : fermeté et éclat (dès 16 ans)', '60 min', '2 000 MAD', 170,
   'Vitamin C facial · Natura Bissé', 'The Citrus Essence: firmness and radiance (from 16)'),
  ('Nobu Zen · Natura Bissé', 'Massage signature Nobu, adapté à vos besoins', '75 min', '2 000 MAD', 180,
   'Nobu Zen · Natura Bissé', 'Nobu signature massage, tailored to your needs'),
  ('Japanese Silk · Natura Bissé', 'Rituel corporel inspiré de la tradition japonaise', '75 min', '2 000 MAD', 190,
   'Japanese Silk · Natura Bissé', 'Body ritual inspired by Japanese tradition'),
  ('Rituel The Pearl Signature · Natura Bissé', 'Hammam, gommage, enveloppement, soin visage vitamine C et massage signature', '150 min', '3 000 MAD', 200,
   'The Pearl Signature ritual · Natura Bissé', 'Hammam, scrub, body wrap, vitamin C facial and signature massage'),
  ('Escapade The Pearl', 'Suite privée 2 h, 2 personnes minimum : hammam 30 min + massage 30 min', '2 h', '4 000 MAD', 210,
   'The Pearl escape', 'Private suite 2 h, 2 guests minimum: hammam 30 min + massage 30 min'),
  ('Sérénité à deux', 'Suite privée 3 h : 2 massages de 45 min et attentions VIP', '3 h', '6 000 MAD', 220,
   'Couple serenity', 'Private suite 3 h: two 45 min massages and VIP amenities'),
  ('Éveil sensoriel', 'Suite privée 3 h : 2 hammams, 2 massages de 45 min et une bouteille de champagne', '3 h', '8 000 MAD', 230,
   'Sensory awakening', 'Private suite 3 h: 2 hammams, two 45 min massages and a bottle of champagne'),
  ('Hammam découverte · enfant', 'Premier hammam en douceur, avec un adulte', '20 min', '300 MAD', 240,
   'Hammam discovery · child', 'A gentle first hammam, with an adult'),
  ('Massage découverte · enfant', 'Massage doux pour les enfants, avec un adulte', '30 min', '400 MAD', 250,
   'Massage discovery · child', 'Gentle massage for children, with an adult')
) as v(name, description, duration, price, sort_order, name_en, description_en);

-- Contrôle : 25 prestations, de 500 MAD (accès) à 8 000 MAD (suite privée).
select sort_order, name, duration, price
  from public.venue_services
 where venue_slug = 'spa-nobu'
 order by sort_order;
