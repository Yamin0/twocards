# Rapport de refonte twocards

Branche `refonte/structure-design`, 12 commits depuis `master` (57150b8). **Rien n'est poussé ni déployé.** Aucune migration lancée.

## À lire en premier

Ce qui touche à la sécurité, aux RPC publiques ou au comportement métier :

1. **RPC publique `qr_create_reservation` — SQL écrit, non lancé.** `supabase/migrations/20261111100000_qr_reservation_respecte_masquages.sql`. Aujourd'hui, une adresse masquée au niveau du profil hôtel, ou une catégorie masquée, reste réservable par appel direct. Le fichier ajoute ces deux contrôles, sans changer la signature, les droits ni la commission. À relire puis à exécuter dans l'éditeur SQL.
2. **Règle de sécurité ajoutée.** `next.config.ts` envoie `Content-Security-Policy: frame-ancestors 'self'` et `X-Frame-Options: SAMEORIGIN` sur toutes les pages sauf `/r/*`. Avant, toute l'application (connexion comprise) pouvait être affichée dans l'iframe d'un autre site. Le portail `/r/…` reste intégrable partout.
3. **Réservations de l'établissement, trois changements de comportement** (le calcul de commission n'est pas touché, mêmes colonnes écrites) :
   - l'addition ne se saisit plus sur une réservation annulée ou no-show (avant, elle repassait en « confirmée » sans le dire) ;
   - « Rétablir » remet une annulée **en attente** (avant : confirmée d'office) ; un no-show redevient confirmé ;
   - le bouton « Message » vers un hôtel est retiré de Réseau : l'hôtel n'a pas de messagerie, le message n'était lu par personne.
4. **Espace concierge : les écrans simulés sont retirés.** Créer une réservation ou un client n'écrivait rien en base ; les chiffres, clients et lieux étaient factices. L'espace montre maintenant ce qui existe (annuaire, messagerie, paramètres réellement enregistrés). Les autres adresses répondent « Pas encore disponible ».
5. **Fond photo océan retiré des espaces connectés**, remplacé par un fond papier clair et un rail bleu nuit. Raison : il imposait du texte blanc à 30-40 % d'opacité (192 occurrences), illisible en plein jour.
6. **`/influenceurs` n'a plus sa vidéo pilotée par le défilement.** La page téléchargeait 9 à 20 Mo avant d'afficher quoi que ce soit ; la séquence est devenue un fond de héros. À valider.
7. **`proxy.ts`** : en embed (`/r/…?embed=1`), `?lang=` n'est plus retiré de l'adresse, sinon la langue se perdait dans une iframe tierce.
8. **`eslint.config.mjs`** : les dossiers hors application (`.claude`, `.agents`, `mobile`, `video`, `dashboard-video`, supports commerciaux) sont exclus du lint. Ils produisaient 682 erreurs sans rapport avec le site.
9. **`images.dangerouslyAllowLocalIP`** est activé **en développement seulement** : sur ce PC, le DNS résout le stockage Supabase en NAT64 et l'optimiseur d'images le refusait. En production la protection reste active. À retirer si vous préférez.

## Critères de fin

| Critère | État |
|---|---|
| Types, lint, build verts | **Oui.** `tsc` 0 erreur, `eslint .` 0 erreur 0 avertissement, `next build` 62 pages. |
| Aucune erreur console sur les pages visitées | **Oui pour les pages publiques et clientes** : 68 captures, 0 erreur. **Non vérifié** pour les pages connectées. |
| Chaque écran vérifié en FR et EN, à 390 et 1440 px | **Partiel.** Fait pour 17 adresses publiques et clientes. **Aucune page connectée n'a été vue avec ses données** : je n'ai pas de compte, et je n'ai pas contourné la connexion. Seuls la coque et le kit ont été vus, sur la planche `/kit`. |
| Aucune URL cassée | **Oui.** Routes identiques ; `/onboarding` redirige vers `/signup`, `/concierge/venues` vers `/concierge`. Les vues de l'admin passent dans l'URL (`/admin?vue=comptes`). |
| Réservation par QR | Vérifiée jusqu'à la confirmation en mode aperçu (`?apercu=1`, rien n'est écrit), FR et EN, 114 contrôles automatiques. Pas de vraie réservation en production. |
| Portail direct | Vérifié jusqu'au formulaire, sans envoi (base de production). |
| Confirmation, arrivée, addition, commission | **Non exécutés.** Les écritures sont les mêmes qu'avant (relues) ; à tester connecté. |
| Messagerie | Non modifiée, non testée. |
| Impression des cartes de chambre | CSS d'impression rejoué sur une maquette ; **à vérifier sur la vraie page**, en aperçu A4. |
| Sélecteur de langue | Vérifié sur les pages publiques et clientes. |
| Aucune page au-delà d'environ 400 lignes | **Sauf une** : `signup/page.tsx` fait 589 lignes (821 avant). Le reste est sous 400. |
| Lighthouse ≥ 90 | **Performance non atteinte** : 85 et 89. Les trois autres notes sont à 100. Détail plus bas. |

## Ce qui est livré

### A. Structure du code

- **Une coque** (`src/components/app/shell/`) pour les quatre espaces, avec une configuration de navigation par rôle. Les layouts passent de 365, 377 et 336 lignes à 27, 64 et 14 ; l'admin, qui dessinait sa propre coque dans la page, reçoit un layout de 10 lignes. Sur téléphone : barre d'onglets en bas.
- **Un kit** (`src/components/app/ui/`) : `Button`, `IconButton`, `Card`, `Badge`, `StatusPill`, `KpiCard`, `Table` (repli en cartes sous 768 px), `Drawer`, `Modal`, `ConfirmDialog` (piège de focus, Échap, restitution du focus), `Segmented`, `SearchInput`, `Switch`, `Field`, `EmptyState`, `ErrorState`, `Skeleton`, toasts (`useNotify`), `PageHeader`. Les anciens kits sont supprimés.
- **Pages découpées** : `events` 1 384 → 350, `floor-plan` 1 179 → 363, `guest-experience` 1 096 → 184, `reservations` 1 058 → 275, `hotel/chambres` 841 → 336, `analytics` 811 → 295, `settings` 793 → 124, `admin` 784 → 292, `portal-experience` 623 → 156.
- **Données** : types de la base générés par l'outil Supabase (`src/lib/supabase/database.types.ts`) ; hooks avec état d'erreur et rechargement ; plus aucune donnée factice ni drapeau `isDemo`.
- **Code mort supprimé** : 3 116 lignes au lot 1, puis les anciens kits.
- Bilan sur `src` : 25 429 lignes retirées, 24 606 ajoutées, 273 fichiers.

**Non fait :**
- Les types générés ne sont **pas branchés** sur les clients Supabase (`createClient<Database>`). Le fichier existe et sert de référence ; le brancher demande de retirer les types locaux page par page.
- Les pages connectées restent des composants client. Seules `/s`, `/r`, `/avis` chargent maintenant leurs données côté serveur.

### B. Dashboards

- **Système de design** : jetons de couleur, d'ombre et de typographie dans `globals.css` (encre, papier, rail `#13305c`), tous les couples texte / fond en AA, plancher de texte à 12 px, plus de capitales espacées.
- **Établissement** : accueil « Aujourd'hui » (à confirmer, ce jour, additions à saisir, commissions du mois, messages non lus) ; confirmer, refuser, arrivé et addition dans la liste ; vue et recherche dans l'URL (`?vue=a-traiter|aujourdhui|a-venir|passees|toutes&q=`).
- **Hôtel** : accueil « Aujourd'hui » ; montant et commission par QR, tri, « le QR qui rapporte le plus » ; taux de commission lu dans la donnée ; export CSV protégé contre les formules.
- **Concierge** : voir « À lire en premier », point 4. La demande du brief (lien et QR mis en avant, réservations suivies jusqu'à la commission) **n'est pas livrée** : la base ne donne au concierge ni QR ni réservations.
- **Admin** : même coque, quatre vues dans le rail et dans l'URL.

### C. Site public

- Une seule grammaire pour l'accueil et les quatre pages métiers ; sur-titres en capitales et pastilles « en direct » répétées retirés.
- `robots.txt` ne bloque plus `/concierges` ; image de partage, JSON-LD `Organization` et `WebSite`, métadonnées et `canonical` par page, sitemap réduit aux cinq pages indexables.
- Connexion, mot de passe oublié et réinitialisation sur le même modèle ; erreurs Supabase traduites ; lien « Connexion » dans le menu mobile.
- Polices : Manrope et Inter retirées, seule Satoshi est préchargée. Vidéos et shader chargés quand ils sont visibles ; mouvement réduit respecté.

**Parcours « Demander un accès » : le nombre d'étapes n'a pas baissé.**

| | Avant | Après |
|---|---|---|
| Clics depuis l'accueil / une page métier | 4 / 3 | 4 / 3 |
| Écrans | 3 | 3 |
| Champs obligatoires (hôtel / influenceur / concierge) | 5 / 4 / 3 | 5 / 4 / 3 |
| Validation | `required` seul | message par champ, focus sur l'erreur |

**Lighthouse mobile, build de production servi en local.** Pas de mesure « avant » : je ne l'ai pas prise sur `master` avant de commencer.

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/` | 85 | 100 | 100 | 100 | 4,4 s | 70 ms | 0 |
| `/hotels` | 89 | 100 | 100 | 100 | 3,8 s | 30 ms | 0 |

Ce qui retient la performance : la feuille de style bloquante (26 Ko, environ 400 ms simulés) et un fichier JavaScript de 60 Ko presque inutilisé au premier écran. À remesurer sur le site déployé.

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
c427f46 fondations : audit, jetons, kit UI et coque (non branchés)
6b6b1aa lot 1 : suppression du code mort
4ff81b4 lot 2 : coque unique et thème clair sur les quatre espaces
70c5aa3 lots 3-4 : établissement et concierge, fin des données factices
3e3e4bb types de la base générés par Supabase
ba5f910 lot 4 : outils de l'établissement découpés et passés au kit
7556cf3 lot 4 : espace hôtel
1640db3 lot 6 : site public
e5040d7 suppression des anciens kits
20b2b42 lot 5 : pages clients, en-têtes de sécurité, SQL proposé
(dernier) découpe admin et signup, rapport
```

## SQL à exécuter

| Fichier | Effet | Urgence |
|---|---|---|
| `supabase/migrations/20261111100000_qr_reservation_respecte_masquages.sql` | `qr_create_reservation` refuse une adresse masquée par le profil hôtel ou une catégorie masquée. | À relire d'abord : RPC publique. |

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

**Admin** : `/admin`, `?vue=comptes`, `?vue=catalogue`, `?vue=commissions` ; « se connecter en tant que », puis retour.

**Application mobile** : ouvrir un espace dans la WebView (rail, barre du haut et onglets doivent être masqués ; le contenu ne doit pas passer sous les onglets natifs).

**Pages clientes** : une vraie réservation par QR et par le portail ; `/avis/…` avec une vraie réservation et le lien Google ; Safari sur iPhone.

## Décisions qui vous reviennent

1. **Concierge** : lui donner un lien et un QR demande un changement de modèle de données (aujourd'hui, seul un hôtel possède des QR). Dites-moi le modèle voulu et j'écris la migration.
2. **« Combien ça coûte ? »** : les quatre réponses différentes sont alignées sur celle de l'accueil. Est-ce la bonne ?
3. **`/onboarding`** : redirigée vers `/signup`, dossier conservé. À supprimer ?
4. **Préférences de notification** de l'établissement : enregistrées mais lues par rien. Une note le dit à l'écran. À brancher ou à retirer ?
5. **Dépendances sans import** : `gsap`, `@radix-ui/react-slot`, `@base-ui/react`, `class-variance-authority`. Je propose de les retirer de `package.json` ; je n'y ai pas touché.
6. **Aide de l'établissement** : l'adresse `support@twocards.io` y figure, alors que le site utilise `contact@twocardspro.com`. Laquelle est la bonne ?
7. **Fichiers de `public/` jamais référencés** (non supprimés) : `dashboard-bg.jpg`, `dashboard-bg-ocean.jpg` (plus utilisé), `images/etablissements-hero.jpg`, `dashboard-preview-v2.png`.

## Ce que je recommande ensuite

1. Parcourir la liste « à vérifier connecté » avant toute fusion : c'est le vrai risque de cette branche.
2. Relire et lancer la migration SQL.
3. Brancher les types générés sur les clients Supabase.
4. Découper `signup/page.tsx` et réduire le parcours d'accès à deux écrans.
5. Constats côté base laissés en l'état : `portal_full_slots` ne compte que les réservations avec table (un créneau n'est jamais « complet » pour le portail) ; `qr_rate_reservation` accepte une note avant la sortie ; le ticket de test de la caisse écrit un vrai montant de 1 234 MAD s'il se rapproche d'une réservation.
6. Notifications : écrire les textes en base dans les deux langues plutôt que de les traduire à l'affichage.

## Outils laissés dans le dépôt

- `REFONTE/outils/capture.mjs` : captures et erreurs console, sans dépendance.
- `REFONTE/outils/parcours-lot5.mjs` : parcours de réservation piloté, sans écriture en base.
- `REFONTE/outils/theme-clair.py` : la conversion des couleurs, pour mémoire.
- `/kit` : planche des composants, en développement seulement (404 en production).
