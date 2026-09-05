-- Renommage du catalogue : « Twiga Marrakech » devient « Table du Marché
-- Hivernage ». Le slug (venue-5) ne bouge pas : les réservations déjà
-- rattachées à cet établissement le restent, et le compte propriétaire aussi.
--
-- Le nom est dupliqué dans qr_reservations.venue_name, figé à la réservation
-- pour que l'historique reste lisible même si une fiche disparaît. On le
-- remet donc à jour ligne par ligne, sinon les dashboards continueraient
-- d'afficher l'ancien nom sur les sorties passées.

update public.venues
   set name = 'Table du Marché Hivernage'
 where slug = 'venue-5';

update public.qr_reservations
   set venue_name = 'Table du Marché Hivernage'
 where venue_slug = 'venue-5'
    or venue_name = 'Twiga Marrakech';
