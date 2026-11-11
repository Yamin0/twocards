-- Ticket de test de la caisse : un statut à part dans le journal.
--
-- Avant : le bouton « Envoyer un ticket de test » du dashboard postait un
-- vrai ticket de 1 234 MAD sur la première table du plan de salle. S'il se
-- rapprochait d'une réservation ouverte, le webhook y écrivait le montant
-- (amount_source = 'pos', verrouillé par qr_lock_pos_amount) et une
-- commission réelle.
--
-- Après : le dashboard envoie { "test": true } sans table ni montant, et la
-- fonction Edge pos-webhook journalise l'appel avec le statut « test » sans
-- lire ni modifier aucune réservation. Ce statut doit être admis par la
-- contrainte CHECK de pos_events.
--
-- Effets de bord vérifiés :
--   - notify_pos_unmatched ne réagit qu'au statut 'unmatched' : un test ne
--     crée ni notification ni push ;
--   - l'index unique pos_events_ticket_uniq ne porte que sur 'matched' : un
--     test ne bloque jamais un vrai ticket ;
--   - aucune ligne existante ne change (le nouveau CHECK est plus large).
--
-- Ordre conseillé : appliquer cette migration, PUIS redéployer pos-webhook.
-- Dans l'ordre inverse, les tests restent inoffensifs mais ne sont pas
-- journalisés (la fonction répond logged: false) tant que la migration
-- n'est pas passée.

alter table public.pos_events
  drop constraint if exists pos_events_status_check;

alter table public.pos_events
  add constraint pos_events_status_check
  check (status in ('matched', 'unmatched', 'duplicate', 'test'));
