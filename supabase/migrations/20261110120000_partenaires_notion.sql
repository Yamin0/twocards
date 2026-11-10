-- Menu client : tous les établissements partenaires (statut « ✅ Accord »
-- dans la base Notion « Établissements partenaires » au 10 novembre 2026).
--
-- Le catalogue réseau (catalog_offers) est partagé par tous les hôtels :
-- une ligne ajoutée ici apparaît d'office dans le menu client et dans le
-- dashboard de chaque hôtel de Marrakech, existant ou à venir (un nouvel
-- hôtel part avec hidden_offers = '{}', il voit donc tout).
--
-- Les photos sont servies par le site (public/images/partners/) : ce script
-- ne doit passer qu'une fois ces fichiers déployés. Couverture = image_url,
-- photos suivantes = images.
--
-- Idempotent : on peut le relancer sans doublon.

insert into public.catalog_offers
  (slug, category, name, city, tag, description, price, image_url, images, active, sort_order)
values
  -- ─── Restaurants ─────────────────────────────────────────────────────────
  ('nobu-marrakech', 'restaurants', 'Nobu Marrakech', 'Marrakech', 'Japonais-péruvien',
   'La table du chef Nobu Matsuhisa au Nobu Hotel : cuisine japonaise aux accents péruviens, quelques créations aux produits marocains. Black cod miso, rock shrimp tempura, sashimi de sériole. Tous les soirs dès 19 h.',
   null,
   null, -- couverture actuelle (choisie depuis l'admin) conservée
   array['/images/partners/nobu-marrakech-2.webp', '/images/partners/nobu-marrakech-3.webp'],
   true, 10),

  ('la-table-du-marche', 'restaurants', 'La Table du Marché', 'Marrakech', 'Franco-méditerranéen',
   'La table de l''hôtel Le Hivernage : cuisine de saison et produits du marché, inspirations françaises, méditerranéennes et marocaines, grillades au four Josper. Véranda ouverte sur un jardin tropical, chanteuse live le soir.',
   null,
   '/images/partners/la-table-du-marche-1.webp',
   array['/images/partners/la-table-du-marche-2.webp', '/images/partners/la-table-du-marche-3.webp'],
   true, 20),

  ('villa-chakamani', 'restaurants', 'Villa Chakamani', 'Marrakech', 'Gastronomique',
   'Une villa de 1958 au cœur de l''Hivernage devenue table franco-méditerranéenne. Grande salle Art déco sous verrière, terrasse ombragée dans le jardin, musique live et soirées DJ.',
   null,
   '/images/partners/villa-chakamani-1.webp',
   array['/images/partners/villa-chakamani-2.webp', '/images/partners/villa-chakamani-3.webp'],
   true, 30),

  ('verde', 'restaurants', 'Verde', 'Marrakech', 'Restaurant festif',
   'Restaurant-lounge chic de l''Hivernage : cuisine internationale aux accents asiatiques, sushis et assiettes à partager dans un décor de jungle tropicale. Le dîner est rythmé par un show (danseurs, artistes, musique) environ toutes les 30 minutes.',
   null,
   '/images/partners/verde-1.webp',
   array['/images/partners/verde-2.webp', '/images/partners/verde-3.webp'],
   true, 40),

  ('venue-3', 'restaurants', 'Noto Marrakech', 'Marrakech', 'Italien festif',
   'Une ode à la cuisine italienne, généreuse et ensoleillée, à la Villa Yvette dans l''Hivernage. Guitare et chanteurs passent entre les tables dès l''ouverture, puis un DJ transforme la salle en piste de danse. Tous les soirs dès 19 h.',
   null,
   null, -- couverture actuelle (choisie depuis l'admin) conservée
   array['/images/partners/venue-3-2.webp', '/images/partners/venue-3-3.webp'],
   true, 50),

  ('nobu-rooftop', 'restaurants', 'Nobu Rooftop', 'Marrakech', 'Rooftop',
   'Le toit du Nobu Hotel : vue à 360° sur Marrakech et l''Atlas, piscine ronde et cabanas. Cuisine méditerranéenne aux inspirations marocaines, bar à sushis, cocktails signature et DJ sets au coucher du soleil.',
   null,
   '/images/partners/nobu-rooftop-1.webp',
   array['/images/partners/nobu-rooftop-2.webp', '/images/partners/nobu-rooftop-3.webp'],
   true, 60),

  ('jad-mahal', 'restaurants', 'Jad Mahal', 'Marrakech', 'Dîner-spectacle',
   'Palais festif de l''Hivernage, zelliges et arches dorées. Cuisine marocaine (tajines, pastillas, couscous royal), plats bistrot et thaïs. Spectacles orientaux et musique live chaque soir, sans supplément ; l''ambiance monte à partir de 23 h.',
   null,
   '/images/partners/jad-mahal-1.webp',
   array['/images/partners/jad-mahal-2.webp', '/images/partners/jad-mahal-3.webp'],
   true, 70),

  ('buddha-bar', 'restaurants', 'Buddha-Bar Marrakech', 'Marrakech', 'Dîner-spectacle',
   '1 500 m² sur deux niveaux, accueillis par un Bouddha géant. Spécialités asiatiques et show de danseurs, chanteurs et musiciens pendant le dîner ; la soirée se prolonge au bar. Près de la Ménara.',
   null,
   '/images/partners/buddha-bar-1.webp',
   array['/images/partners/buddha-bar-2.webp', '/images/partners/buddha-bar-3.webp'],
   true, 80),

  ('dar-soukkar', 'restaurants', 'Dar Soukkar', 'Marrakech', 'Dîner-spectacle',
   'Un palais du XVIe siècle, ancienne sucrerie, sur la route de l''Ourika. Dîner-spectacle tous les soirs : danseuses, chanteurs et musiciens, puis DJ en fin de soirée. Cuisine marocaine, asiatique et méditerranéenne, menu unique.',
   'Menu 690 MAD / pers.',
   '/images/partners/dar-soukkar-1.webp',
   array['/images/partners/dar-soukkar-2.webp', '/images/partners/dar-soukkar-3.webp'],
   true, 90),

  ('malak-emeraude', 'restaurants', 'Malak Emeraude', 'Marrakech', 'Dîner-spectacle',
   'Grand cabaret oriental entre la Ménara et la médina. Menu fixe et spectacles qui s''enchaînent toute la soirée : danseuses, musique chaâbi, artistes sur scène.',
   'Menu 600 MAD / pers.',
   '/images/partners/malak-emeraude-1.webp',
   array['/images/partners/malak-emeraude-2.webp', '/images/partners/malak-emeraude-3.webp'],
   true, 100),

  -- ─── Clubs ───────────────────────────────────────────────────────────────
  ('venue-2', 'clubs', 'Babouchka Marrakech', 'Marrakech', 'Club',
   'Club de l''Hivernage au décor impérial russe : velours rouge, lustres et baroque. House et afro avec DJ résidents et invités internationaux, shows de danse et cocktails. Tous les soirs de minuit à 5 h.',
   null,
   null, -- couverture actuelle (choisie depuis l'admin) conservée
   array['/images/partners/venue-2-2.webp', '/images/partners/venue-2-3.webp'],
   true, 10),

  ('leone', 'clubs', 'Leone', 'Marrakech', 'Club',
   'Club chic d''inspiration parisienne à la Villa Yvette, dans l''Hivernage. Deep house par des DJ locaux et internationaux, cabine au milieu de la foule. Entrée ou table, tenue élégante exigée.',
   null,
   '/images/partners/leone-1.webp',
   array['/images/partners/leone-2.webp', '/images/partners/leone-3.webp'],
   true, 20),

  -- ─── Activités ───────────────────────────────────────────────────────────
  ('spa-nobu', 'activites', 'The Pearl Spa · Nobu', 'Marrakech', 'Bien-être',
   'Le spa du Nobu Hotel : plus de 2 000 m², piscine en mosaïque chauffée, hammam marocain et suites de soins privées. Rituels d''inspiration japonaise et soins Natura Bissé. Tous les jours de 9 h à 22 h.',
   null,
   '/images/partners/spa-nobu-1.webp',
   array['/images/partners/spa-nobu-2.webp', '/images/partners/spa-nobu-3.webp'],
   true, 5)
on conflict (slug) do update set
  category    = excluded.category,
  name        = excluded.name,
  city        = excluded.city,
  tag         = excluded.tag,
  description = excluded.description,
  price       = excluded.price,
  -- Une couverture déjà choisie depuis l'admin (Noto, Babouchka) est gardée.
  image_url   = coalesce(excluded.image_url, catalog_offers.image_url),
  images      = excluded.images,
  active      = true,
  sort_order  = excluded.sort_order;

-- Theatro reste au menu (accord en cours) : description passée en français.
update public.catalog_offers
   set description = 'Le club mythique de l''Es Saadi, dans l''Hivernage : grandes soirées, artistes et DJ internationaux.',
       sort_order = 30
 where slug = 'venue-1';

-- Le restaurant de démo (compte de revue Apple) passe après les vrais partenaires.
update public.catalog_offers set sort_order = 110 where slug = 'venue-5';

-- Hôtels déjà créés : un partenaire masqué auparavant revient au menu.
update public.hotel_profiles
   set hidden_offers = array(
         select x from unnest(hidden_offers) x
          where x <> all (array['nobu-marrakech','la-table-du-marche','villa-chakamani','verde',
                                'venue-3','nobu-rooftop','jad-mahal','buddha-bar','dar-soukkar',
                                'malak-emeraude','venue-2','leone','spa-nobu']))
 where hidden_offers && array['nobu-marrakech','la-table-du-marche','villa-chakamani','verde',
                              'venue-3','nobu-rooftop','jad-mahal','buddha-bar','dar-soukkar',
                              'malak-emeraude','venue-2','leone','spa-nobu'];
