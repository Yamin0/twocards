# Rapport de refonte twocards

Branche `refonte/structure-design`, 18 commits depuis `master` (57150b8). **Rien n'est poussé ni déployé.** Aucune migration lancée.

## À lire en premier

Ce qui touche à la sécurité, aux RPC publiques ou au comportement métier :

1. **Deux RPC publiques — SQL écrit, non lancé.** Le second fichier, `20261111110000_avis_apres_la_sortie.sql`, fait refuser à `qr_rate_reservation` une note avant le jour de la sortie. Le premier : `supabase/migrations/20261111100000_qr_reservation_respecte_masquages.sql`. Aujourd'hui, une adresse masquée au niveau du profil hôtel, ou une catégorie masquée, reste réservable par appel direct. Le fichier ajoute ces deux contrôles, sans changer la signature, les droits ni la commission. À relire puis à exécuter dans l'éditeur SQL.
2. **Règle de sécurité ajoutée.** `next.config.ts` envoie `Content-Security-Policy: frame-ancestors 'self'` et `X-Frame-Options: SAMEORIGIN` sur toutes les pages sauf `/r/*`. Avant, toute l'application (connexion comprise) pouvait être affichée dans l'iframe d'un autre site. Le portail `/r/…` reste intégrable partout.
3. **Réservations de l'établissement, trois changements de comportement** (le calcul de commission n'est pas touché, mêmes colonnes écrites) :
   - l'addition ne se saisit plus sur une réservation annulée ou no-show (avant, elle repassait en « confirmée » sans le dire) ;
   - « Rétablir » remet une annulée **en attente** (avant : confirmée d'office) ; un no-show redevient confirmé ;
   - le bouton « Message » vers un hôtel est retiré de Réseau : l'hôtel n'a pas de messagerie, le message n'était lu par personne.
4. **Espace concierge : refait sur de vraies données, sans migration.** Les écrans simulés et les chiffres factices sont supprimés. La base laissait déjà un concierge posséder ses QR, son menu et lire ses réservations (les règles testent le propriétaire, pas le rôle) : l'espace réutilise donc le store de l'hôtel. Seul l'assistant reste « Pas encore disponible ».
5. **Un QR qui a des réservations n'est plus supprimé, il est désactivé** (hôtel et concierge). La suppression effaçait en cascade ses réservations et leurs commissions, chez l'établissement et dans l'admin aussi.
6. **Fond photo océan retiré des espaces connectés**, remplacé par un fond papier clair et un rail bleu nuit. Raison : il imposait du texte blanc à 30-40 % d'opacité (192 occurrences), illisible en plein jour.
7. **`/influenceurs` n'a plus sa vidéo pilotée par le défilement.** La page téléchargeait 9 à 20 Mo avant d'afficher quoi que ce soit ; la séquence est devenue un fond de héros. À valider.
8. **`proxy.ts`** : en embed (`/r/…?embed=1`), `?lang=` n'est plus retiré de l'adresse, sinon la langue se perdait dans une iframe tierce.
9. **`eslint.config.mjs`** : les dossiers hors application (`.claude`, `.agents`, `mobile`, `video`, `dashboard-video`, supports commerciaux) sont exclus du lint. Ils produisaient 682 erreurs sans rapport avec le site.
10. **`images.dangerouslyAllowLocalIP`** est activé **en développement seulement** : sur ce PC, le DNS résout le stockage Supabase en NAT64 et l'optimiseur d'images le refusait. En production la protection reste active. À retirer si vous préférez.

## Critères de fin

| Critère | État |
|---|---|
| Types, lint, build verts | **Oui.** `tsc` 0 erreur, `eslint .` 0 erreur 0 avertissement, `next build` 63 pages. |
| Aucune erreur console sur les pages visitées | **Oui pour les pages publiques et clientes** : 68 captures, 0 erreur. **Non vérifié** pour les pages connectées. |
| Chaque écran vérifié en FR et EN, à 390 et 1440 px | **Partiel.** Fait pour 17 adresses publiques et clientes. **Aucune page connectée n'a été vue avec ses données** : je n'ai pas de compte, et je n'ai pas contourné la connexion. Seuls la coque et le kit ont été vus, sur la planche `/kit`. |
| Aucune URL cassée | **Oui.** Routes identiques ; `/onboarding` (supprimée) redirige en permanence vers `/signup`. Les vues de l'admin passent dans l'URL (`/admin?vue=comptes`). |
| Réservation par QR | Vérifiée jusqu'à la confirmation en mode aperçu (`?apercu=1`, rien n'est écrit), FR et EN, 114 contrôles automatiques. Pas de vraie réservation en production. |
| Portail direct | Vérifié jusqu'au formulaire, sans envoi (base de production). |
| Confirmation, arrivée, addition, commission | **Non exécutés.** Les écritures sont les mêmes qu'avant (relues) ; à tester connecté. |
| Messagerie | Non modifiée, non testée. |
| Impression des cartes de chambre | CSS d'impression rejoué sur une maquette ; **à vérifier sur la vraie page**, en aperçu A4. |
| Sélecteur de langue | Vérifié sur les pages publiques et clientes. |
| Aucune page au-delà d'environ 400 lignes | **Oui.** La plus longue fait 395 lignes (`hotel/adresses`) ; `signup` est passée de 821 à 16, découpée en composants. |
| Lighthouse ≥ 90 | **Oui, en local** : 91 et 93 en performance, 100 ailleurs. À remesurer sur le site déployé. |

## Ce qui est livré

### A. Structure du code

- **Une coque** (`src/components/app/shell/`) pour les quatre espaces, avec une configuration de navigation par rôle. Les layouts passent de 365, 377 et 336 lignes à 27, 64 et 14 ; l'admin, qui dessinait sa propre coque dans la page, reçoit un layout de 10 lignes. Sur téléphone : barre d'onglets en bas.
- **Un kit** (`src/components/app/ui/`) : `Button`, `IconButton`, `Card`, `Badge`, `StatusPill`, `KpiCard`, `Table` (repli en cartes sous 768 px), `Drawer`, `Modal`, `ConfirmDialog` (piège de focus, Échap, restitution du focus), `Segmented`, `SearchInput`, `Switch`, `Field`, `EmptyState`, `ErrorState`, `Skeleton`, toasts (`useNotify`), `PageHeader`. Les anciens kits sont supprimés.
- **Pages découpées** : `events` 1 384 → 350, `floor-plan` 1 179 → 363, `guest-experience` 1 096 → 184, `reservations` 1 058 → 275, `hotel/chambres` 841 → 336, `analytics` 811 → 295, `settings` 793 → 124, `admin` 784 → 292, `portal-experience` 623 → 156.
- **Données** : types de la base générés par l'outil Supabase (`src/lib/supabase/database.types.ts`) ; hooks avec état d'erreur et rechargement ; plus aucune donnée factice ni drapeau `isDemo`.
- **Code mort supprimé** : 3 116 lignes au lot 1, puis les anciens kits.
- Bilan sur `src` : 25 429 lignes retirées, 24 606 ajoutées, 273 fichiers.

- Les types générés sont **branchés** sur les clients Supabase navigateur et serveur : noms de tables, de colonnes et de RPC vérifiés à la compilation.
- Dépendances sans import retirées : `gsap`, `@radix-ui/react-slot`, `@base-ui/react`, `class-variance-authority`.

**Non fait :** les pages connectées restent des composants client. Seules `/s`, `/r`, `/avis` et `/signup` chargent ou lisent côté serveur.

### B. Dashboards

- **Système de design** : jetons de couleur, d'ombre et de typographie dans `globals.css` (encre, papier, rail `#13305c`), tous les couples texte / fond en AA, plancher de texte à 12 px, plus de capitales espacées.
- **Établissement** : accueil « Aujourd'hui » (à confirmer, ce jour, additions à saisir, commissions du mois, messages non lus) ; confirmer, refuser, arrivé et addition dans la liste ; vue et recherche dans l'URL (`?vue=a-traiter|aujourdhui|a-venir|passees|toutes&q=`).
- **Hôtel** : accueil « Aujourd'hui » ; montant et commission par QR, tri, « le QR qui rapporte le plus » ; taux de commission lu dans la donnée ; export CSV protégé contre les formules.
- **Concierge** : « Aujourd'hui » avec son lien et son QR en tête (copier, WhatsApp, SVG, PNG, aperçu du menu) ; réservations suivies en quatre étapes jusqu'à la commission ; un lien par canal (`/concierge/liens`) ; commissions, clients, statistiques ; réglages de son menu.
- **Admin** : même coque, quatre vues dans le rail et dans l'URL.

### C. Site public

- Une seule grammaire pour l'accueil et les quatre pages métiers ; sur-titres en capitales et pastilles « en direct » répétées retirés.
- `robots.txt` ne bloque plus `/concierges` ; image de partage, JSON-LD `Organization` et `WebSite`, métadonnées et `canonical` par page, sitemap réduit aux cinq pages indexables.
- Connexion, mot de passe oublié et réinitialisation sur le même modèle ; erreurs Supabase traduites ; lien « Connexion » dans le menu mobile.
- Polices : Manrope et Inter retirées, seule Satoshi est préchargée. Vidéos et shader chargés quand ils sont visibles ; mouvement réduit respecté.

**Parcours « Demander un accès » : deux écrans au lieu de trois.**

| | Avant | Après |
|---|---|---|
| Écrans | 3 | 2 |
| Clics depuis l'accueil / une page métier | 4 / 3 | 3 / 2 |
| Champs obligatoires (hôtel / créateur / concierge) | 5 / 4 / 3 | 5 / 4 / 3, inchangés |
| Champs affichés d'emblée (hôtel / concierge) | 8 / 6 | 5 / 3, les facultatifs repliés |
| Validation | `required` seul | message par champ, focus sur l'erreur |

Le contenu envoyé à Supabase est identique : 215 040 combinaisons comparées à l'ancien code, 0 différence. L'envoi réel n'a pas été testé.

**Lighthouse mobile, build de production servi en local, trois passes par page.**

| Page | | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| `/` | après le lot 6 | 85 | 100 | 100 | 100 | 4,4 s | 70 ms | 0 |
| `/` | maintenant | 91 | 100 | 100 | 100 | 3,5 s | 40 ms | 0 |
| `/hotels` | après le lot 6 | 89 | 100 | 100 | 100 | 3,8 s | 30 ms | 0 |
| `/hotels` | maintenant | 93 | 100 | 100 | 100 | 3,2 s | 30 ms | 0 |

Il n'y a **pas de mesure sur `master`** : je ne l'ai pas prise avant de commencer. Ce qui a fait gagner : le client Supabase ne part plus sur les pages publiques, l'affiche du héros est une image prioritaire, l'icône du site passe de 26 Ko à 2 Ko. Mesure locale en HTTP/1.1 : à refaire sur le site déployé.

### D. Pages clients

- Entrée à la première étape ne soumet plus la réservation sans nom ; erreurs par cause (débit, date, adresse, réseau) ; panne réseau distincte d'un menu vide, avec « Réessayer » ; heure passée refusée.
- Champs à 16 px (plus de zoom iOS), cibles de 44 px, vrais labels, feuille de réservation accessible au clavier.
- Données chargées côté serveur ; le navigateur ne reçoit plus le catalogue de toutes les villes. Photos du stockage optimisées (268 Ko → 90 Ko mesuré sur une photo).
- « Propulsé par twocards. » présent sur les trois pages, embed compris.

**Le nombre de taps n'a pas baissé** : `/s` 4 taps et 2 champs, `/r` 3 taps et 3 champs, comme avant. Le bouton « Continuer » est maintenant collé en bas de la feuille.

## Captures

Dans `REFONTE/captures/` : `avant/` (60 images, pages publiques et clientes, prises sur `master`) et `apres/` (68 images, mêmes pages plus `/kit`), FR et EN, 390 et 1440 px, avec `console.json`. `apres-lot5/parcours/` contient les étapes du parcours de réservation.

Il n'y a **ni « avant » ni « après » des pages connectées**.

## Commits

```
c427f46 fondations : audit, jetons, kit UI et coque
6b6b1aa lot 1 : suppression du code mort
4ff81b4 lot 2 : coque unique et thème clair sur les quatre espaces
70c5aa3 lots 3-4 : établissement et concierge, fin des données factices
3e3e4bb types de la base générés par Supabase
ba5f910 lot 4 : outils de l'établissement
7556cf3 lot 4 : espace hôtel
1640db3 lot 6 : site public
e5040d7 suppression des anciens kits
20b2b42 lot 5 : pages clients, en-têtes de sécurité, SQL proposé
01f3a45 lot 7 : découpe de l'admin, journal et rapport
cd3e0d7 types branchés, dépendances retirées, /onboarding supprimée
1fa5b35 note après la sortie (SQL), contact unique, fichiers publics inutiles
7d21aa7 concierge : espace réel ; QR avec réservations désactivé, pas supprimé
9c423ac signup en deux écrans
12ffb88 performance : Lighthouse 91 et 93
(dernier) rapport et journal à jour
```

## SQL à exécuter

| Fichier | Effet | Urgence |
|---|---|---|
| `supabase/migrations/20261111100000_qr_reservation_respecte_masquages.sql` | `qr_create_reservation` refuse une adresse masquée par le profil hôtel ou une catégorie masquée. | À relire d'abord : RPC publique. |
| `supabase/migrations/20261111110000_avis_apres_la_sortie.sql` | `qr_rate_reservation` refuse une note avant le jour de la sortie (« Sortie à venir »). La page `/avis` affiche déjà le message. | RPC publique, sans urgence. |

Pour vérifier qu'elle est passée : réserver une adresse masquée depuis un QR doit répondre « Adresse indisponible ».

## Blancs des pages légales (24, rien rempli)

- `src/app/legal/mentions-legales/page.tsx` l. 25-26 : raison sociale, forme juridique, montant du capital, ville, RC, adresse complète ; l. 29-30 : IF, ICE, nom du représentant légal ; l. 60-61 : raison sociale.
- `src/app/legal/confidentialite/page.tsx` l. 25-26 : raison sociale.
- `src/app/legal/cgu/page.tsx` l. 86-87 : ville (tribunal compétent).

Chaque blanc existe en français et en anglais.

## À vérifier une fois connecté

En FR puis en EN, à 390 et 1440 px. Commencer par un tour rapide de chaque page : la conversion des couleurs a été faite par script, puis relue sans écran.

**Établissement (`tablemarche@venue.com`)**
1. `/dashboard` : les quatre indicateurs, « À faire maintenant ». Confirmer une demande, marquer une arrivée, saisir une addition : le toast annonce la commission, et la ligne quitte « À faire ».
2. `/dashboard/reservations` : changer de vue et chercher, puis recharger (l'URL garde tout). Refuser, no-show, Rétablir. Créer une réservation. Assigner une table. Sur téléphone : boutons en pleine largeur.
3. Une addition venue de la caisse doit rester verrouillée (badge « Caisse »).
4. `/dashboard/commissions` et `/dashboard/network` : chiffres identiques à avant.
5. `/dashboard/messages` : hauteur de la messagerie, envoi d'un message.
6. `/dashboard/floor-plan` : lisibilité des quatre états de table, glisser une table, « Marquer arrivé », walk-in.
7. `/dashboard/events` : créer, modifier, dupliquer, supprimer ; titre lisible sur une photo claire.
8. `/dashboard/settings`, `/portal`, `/prestations`, `/integrations`, `/guests`, `/analytics`, `/notifications` (en anglais : textes traduits).

**Hôtel (`salim@hotel.com`)**
1. `/hotel` : demandes en attente, sorties du jour, QR en tête, taux affiché.
2. `/hotel/chambres` : `?nouveau=1`, tris, sélection multiple, téléchargement SVG et PNG (Safari et Firefox aussi).
3. `/hotel/chambres/imprimer` : aperçu A4 réel, seules les cartes sortent, sur fond blanc, aucune carte coupée.
4. `/hotel/commissions` : « Mois dernier » et le nom du fichier exporté ; CSV ouvert dans Excel.
5. `/hotel/reservations`, `/clients`, `/adresses`, `/analyses`, `/settings` (aperçu du menu aux couleurs de l'hôtel).

**Concierge** : il n'existe plus de compte concierge en production. En créer un par `/signup?role=concierge`, puis :
1. `/concierge` sans lien : « Créer mon lien » crée le premier lien ; copier, WhatsApp, SVG, PNG, aperçu.
2. `/concierge/settings` : régler le menu, puis ouvrir le lien.
3. Une vraie réservation par ce lien, confirmée puis addition saisie côté établissement : le suivi doit avancer jusqu'à la commission.
4. `/concierge/liens` : second lien, renommer, désactiver ; supprimer un lien qui a des réservations doit le désactiver.

**Hôtel, en plus** : supprimer un QR qui a des réservations doit le désactiver et le dire ; un QR sans réservation se supprime.

**Admin** : `/admin`, `?vue=comptes`, `?vue=catalogue`, `?vue=commissions` ; « se connecter en tant que » : le bandeau jaune doit apparaître, et « Revenir à l'administration » doit fonctionner (son chargement a été différé).

**Application mobile** : ouvrir un espace dans la WebView (rail, barre du haut et onglets doivent être masqués ; le contenu ne doit pas passer sous les onglets natifs).

**Pages clientes** : une vraie réservation par QR et par le portail ; `/avis/…` avec une vraie réservation et le lien Google ; Safari sur iPhone.

## Décisions prises pour vous (à défaire si vous n'êtes pas d'accord)

1. **Concierge** : il utilise les mêmes tables que l'hôtel (`hotel_qr_codes`, `hotel_profiles`). Sa commission affichée est celle de la réservation, comme pour un hôtel.
2. **« Combien ça coûte ? »** : une seule réponse partout, celle de l'accueil.
3. **`/onboarding`** supprimée (redirection vers `/signup`).
4. **Dépendances sans import** retirées de `package.json`.
5. **Contact** : l'aide et les paramètres de l'établissement écrivent à `contact@twocardspro.com` au lieu de `support@twocards.io`.
6. **Fichiers publics sans référence** supprimés : `dashboard-bg.jpg`, `images/etablissements-hero.jpg`, `dashboard-preview-v2.png`.
7. **Icône du site** remplacée par une version de 2 Ko tirée du logo (48 px). À regarder dans l'onglet du navigateur.

## Ce qui reste vraiment à vous

1. Parcourir la liste « à vérifier connecté » avant toute fusion : c'est le vrai risque de cette branche.
2. Relire et lancer les deux fichiers SQL.
3. Remplir les 24 blancs des pages légales.
4. Pousser et déployer : je ne l'ai pas fait.

## Limites connues, laissées en l'état

- **Menu client d'un concierge** : `/s/…` parle encore d'hôtel (« Sélection de l'hôtel », « Écrire à la réception »), et le nom du lien s'affiche au client. La base ne dit pas au menu si le propriétaire est un hôtel ou un concierge.
- **Débit de `qr_create_reservation`** : 30 demandes par QR et par heure, pensé pour une chambre ; un lien d'influenceur très partagé peut l'atteindre.
- **Un admin qui ouvre `/hotel` ou `/concierge`** voit toutes les réservations du réseau comme les siennes (il a le droit de tout lire).
- **`portal_full_slots`** ne compte que les réservations avec table : un créneau n'est jamais « complet » pour le portail.
- **Ticket de test de la caisse** : il écrit un vrai montant de 1 234 MAD s'il se rapproche d'une réservation.
- **Notifications** : écrites en français par la base, traduites à l'affichage ; les écrire dans les deux langues demanderait une migration.
- **Préférences de notification** de l'établissement : enregistrées, lues par rien ; une note le dit à l'écran.
- **Pages connectées** : toujours des composants client.

## Outils laissés dans le dépôt

- `REFONTE/outils/capture.mjs` : captures et erreurs console, sans dépendance.
- `REFONTE/outils/parcours-lot5.mjs` et `parcours-signup.mjs` : parcours pilotés (réservation, demande d'accès), sans écriture en base.
- `REFONTE/outils/signup-payload.mjs` : compare ce que `/signup` envoie à l'ancien code.
- `REFONTE/outils/theme-clair.py` : la conversion des couleurs, pour mémoire.
- `/kit` : planche des composants, en développement seulement (404 en production).
