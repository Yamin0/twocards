# Journal de la refonte

## Lot 0 — Audit et fondations (`c427f46`)

- **Changé** : `REFONTE/AUDIT.md` ; jetons sémantiques du back-office dans `globals.css` ; kit `src/components/app/ui/` ; coque `src/components/app/shell/` (non branchés).
- **Pourquoi** : poser le système avant de toucher aux pages.
- **Vérifié** : types.
- **Non vérifié** : rien à l'écran, la coque n'était pas branchée.

## Lot 1 — Code mort (`6b6b1aa`)

- **Changé** : suppression de `lib/constants.ts` (966 lignes de données factices), `types/index.ts`, huit composants landing, trois composants `ui/`, les exports de démonstration du shader et 170 lignes de CSS sans usage. 3 116 lignes en moins.
- **Pourquoi** : aucun import (revérifié par recherche avant suppression).
- **Vérifié** : types et lint verts.
- **Non vérifié** : build (fait au lot 2).

## Lot 2 — Coque unique et thème clair (`4ff81b4`)

- **Changé**
  - Les layouts établissement, hôtel et concierge passent de 365, 377 et 336 lignes à 27, 64 et 14. L'admin reçoit un layout (10 lignes) et ses onglets deviennent des entrées du rail, portées par `/admin?vue=comptes|catalogue|commissions`.
  - `components/hotel/ui.tsx` (961 lignes) n'est plus qu'un renvoi vers le kit unique. Les squelettes de chargement renvoient aussi au kit.
  - Toutes les pages connectées (60 fichiers) sont converties du verre sombre aux jetons clairs par `REFONTE/outils/theme-clair.py` : plus aucune classe `text-white/…`, `bg-black/…` ou `border-white/…` dans les quatre espaces ; plus de texte sous 12 px ; plus de capitales espacées.
  - Le fond photo océan est retiré des espaces : il imposait du texte blanc à 30-40 % d'opacité, illisible en plein jour. Fond papier, cartes blanches, rail bleu nuit `#13305c`.
  - Téléphone : barre d'onglets en bas (quatre écrans du quotidien et le menu).
  - Impression : coque, bandeaux, toasts et bandeau d'impersonation ne sortent plus sur les cartes de chambre.
  - Mode application (`.tc-app`) : les 110 lignes de CSS qui retraduisaient le sombre en clair sont supprimées, les pages étant claires d'origine.
  - Corrigé au passage : `Button` qui se réactivait pendant `loading` (A12), « Aide » du concierge qui menait aux paramètres (A24).
  - Page `/kit` : planche des composants, en développement seulement (404 en production).
- **Bilan** : 4 193 lignes retirées, 2 334 ajoutées.
- **Vérifié** : types, lint, build ; `/kit` à 390 et 1440 px sans erreur console (`captures/apres-lot2/`) : rail, barre du haut, onglets du bas, tableau replié en cartes, états vide / erreur / chargement, badges.
- **Non vérifié** : **aucune page connectée n'a été vue avec ses données** (pas de compte). La conversion des couleurs est mécanique : une page peut garder un détail mal contrasté (texte sur un aplat de couleur, graphique). À parcourir une fois connecté ; liste dans `RAPPORT.md`.

## Lots 3-4 — Établissement et concierge (`70c5aa3`)

- **Changé, établissement**
  - `/dashboard` devient « Aujourd'hui » : quatre indicateurs cliquables (à confirmer, ce jour, additions à saisir, commissions du mois), les messages non lus, puis « À faire maintenant » où l'on confirme, refuse, marque arrivé et saisit l'addition sans changer de page.
  - `/dashboard/reservations` (1 058 lignes → 275) : une ligne par réservation avec son geste principal ; vue et recherche dans l'URL (`?vue=a-traiter|aujourdhui|a-venir|passees|toutes&q=`) ; sur téléphone, les boutons occupent la largeur, sous le pouce. Composants dans `components/venue/reservations/`, gestes dans `hooks/use-venue-reservations.ts`, règles dans `lib/venue/reservations.ts`.
  - `/dashboard/network` : tableau classé par chiffre apporté, replié en cartes sur téléphone. Le bouton « Message » vers un hôtel est retiré : l'hôtel n'a pas de messagerie, le message n'était lu par personne (A5).
  - `/dashboard/commissions` : en-tête et indicateurs du kit ; règles communes dans `lib/commissions.ts` (plus de doublon avec l'admin).
  - Chargements : un échec réseau affiche « Chargement impossible » et un bouton Réessayer au lieu d'une liste vide (A4).
- **Changé, comportement (A3)** — à connaître :
  - l'addition ne se saisit plus sur une réservation annulée ou no-show (avant : elle repassait en « confirmée » sans le dire) ;
  - « Rétablir » remet une annulée **en attente** (avant : confirmée d'office) ; un no-show redevient confirmé ;
  - saisir l'addition d'une réservation en attente la confirme toujours, comme avant.
  - **Le calcul de la commission n'est pas touché** : mêmes colonnes écrites (`status`, `arrived_at`, `amount_spent`, `table_id`), la commission reste recalculée par le trigger `qr_apply_commission`.
- **Changé, concierge (A1, A2)**
  - Supprimé : tous les chiffres, clients, lieux et réponses d'exemple ; la création de réservation et de client qui n'écrivait rien ; l'enregistrement simulé des paramètres ; les drapeaux `isDemoVenue` / `isDemoConcierge`.
  - L'accueil montre ce qui existe : l'annuaire réel des établissements et la messagerie. Les paramètres s'enregistrent réellement (métadonnées du compte).
  - `/concierge/reservations`, `/clients`, `/commissions`, `/stats`, `/ai` gardent leur adresse et disent qu'ils ne sont pas encore disponibles ; `/concierge/venues` redirige vers l'accueil. Ils ne sont plus au menu.
- **Changé, commun** : pages d'erreur, d'adresse inconnue et de chargement communes aux espaces (`components/app/shell/space-pages.tsx`) ; types de la base générés par l'outil Supabase (`lib/supabase/database.types.ts`).
- **Vérifié** : types et lint verts sur ces fichiers.
- **Non vérifié** : rien n'a été vu avec des données (pas de compte). Les gestes confirmer / arrivé / addition envoient exactement les mêmes écritures qu'avant, mais je ne les ai pas exécutés.

## Lot 4 — Outils de l'établissement (`ba5f910`) et espace hôtel (`7556cf3`)

- **Changé** : onze pages d'outils (événements, plan de salle, analyses, paramètres, portail, clients, prestations, caisse, notifications, aide, plus) et tout l'espace hôtel découpés en composants et hooks, passés au kit. Détail des tailles dans `RAPPORT.md`.
- **Pourquoi** : pages de 500 à 1 400 lignes, boutons et modales recodés à la main, sans nom accessible ni Échap.
- **Corrigé au passage** : « Arrivé » sans retour arrière sur le plan de salle (A6) ; indicateur « RP mobilisés » jamais calculé, retiré (A14) ; mois précédent faux un 31 ou en UTC+1 (A8) ; « 10 % » codé en dur (A16) ; paramètres d'URL non validés (A18) ; téléchargement du QR fragile sur Safari (A26).
- **Vérifié** : types et lint ; impression rejouée sur une maquette.
- **Non vérifié** : aucune de ces pages n'a été vue avec ses données.

## Lot 5 — Pages clients (`20b2b42`)

- **Changé** : `/s`, `/r`, `/avis` chargent leurs données côté serveur ; feuille de réservation accessible ; erreurs par cause ; images optimisées ; découpe. En-têtes anti-iframe partout sauf `/r/*`. SQL proposé pour `qr_create_reservation`.
- **Vérifié** : types, lint ; parcours QR jusqu'à la confirmation en mode aperçu, FR et EN (114 contrôles, aucune écriture) ; portail jusqu'au formulaire ; adresses inexistantes ; captures sans erreur console.
- **Non vérifié** : vraie réservation, vraie note, Safari sur iPhone, iframe sur un domaine tiers, la migration SQL (jamais exécutée).
- **Effet de bord** : les captures de `/s/a1f3c07b` sans `?apercu=1` ont compté quelques scans (une dizaine au plus) sur le QR de démonstration.

## Lot 6 — Site public (`1640db3`)

- **Changé** : gabarit commun, SEO, polices, vidéos, pages de compte, erreurs traduites. Voir `RAPPORT.md`.
- **Vérifié** : types, lint, 40 captures sans erreur console, `robots.txt`, JSON-LD, image de partage ; Lighthouse sur le build de production (85 et 89 en performance, 100 ailleurs).
- **Non vérifié** : un envoi réel à Supabase (inscription, connexion, mot de passe oublié).

## Lot 7 — Finitions

- **Changé** : anciens kits supprimés (`e5040d7`) ; page admin 721 → 292 lignes, signup 821 → 589 ; lint du dépôt limité à l'application ; `RAPPORT.md`.
- **Vérifié** : `tsc` 0 erreur, `eslint .` 0 erreur 0 avertissement, `next build` 62 pages, 68 captures « après » sans erreur console.
