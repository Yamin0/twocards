# Audit twocards — 10 novembre 2026

Branche `refonte/structure-design`, depuis `master` (57150b8).
Classement : **P1** cassé ou gênant pour un vrai utilisateur · **P2** incohérent ou lent · **P3** finition.
Abréviations : GE = `src/app/s/[code]/guest-experience.tsx`, PE = `src/app/r/[slug]/portal-experience.tsx`, RE = `src/app/avis/[id]/rating-experience.tsx`. Les numéros de ligne sont ceux de `master`.

## D. Pages clients (`/s/[code]`, `/r/[slug]`, `/avis/[id]`)

### P1

| # | Fichier | Ce qui ne va pas | Ce que je fais |
|---|---|---|---|
| D1 | GE:848, 1017 | Tout le parcours est un seul `<form>`. À l'étape 1, Entrée dans « Autre heure » envoie la réservation sans nom ni téléphone ; l'erreur n'apparaît qu'à l'étape 2. | La soumission n'est acceptée qu'à l'étape contact ; Entrée à l'étape 1 fait « Continuer ». |
| D2 | RE:79 | Un échec de l'envoi de la note ramène au formulaire sans aucun message. | Message d'erreur visible (`role="alert"`) et bouton réessayer. |
| D3 | GE:151-180, PE:132-137 | Une erreur réseau est confondue avec « menu vide » ou « portail introuvable », sans moyen de réessayer. | État d'erreur distinct, bouton « Réessayer ». |
| D4 | GE:800, 1054, 435 ; PE:495-525 ; RE:134 | Champs à 14-15 px : iOS zoome à chaque saisie. | Tous les champs à 16 px. |
| D5 | GE:781-791, PE:216-221 | Un seul message pour toutes les erreurs. La limite de débit (3 demandes / 10 min) répond « Réessayez », ce qui prolonge le blocage. | Messages par cause : débit, date invalide, adresse indisponible, nom invalide, réseau. |
| D6 | `schema.sql:885-906` vs `944-947` | `qr_create_reservation` ne vérifie que les masquages du QR ; une adresse masquée au niveau du profil hôtel, ou une catégorie masquée, reste réservable par appel direct. | **SQL proposé, non lancé** (touche une RPC publique : signalé en tête de rapport). |

### P2

| # | Fichier | Ce qui ne va pas | Ce que je fais |
|---|---|---|---|
| D7 | GE:1017, 718 | « Autre heure » accepte une heure passée ; la date par défaut reste aujourd'hui même si tous les créneaux sont passés (le portail, lui, passe à demain). | Contrôle de l'heure passée ; date par défaut alignée sur le portail. |
| D8 | GE, PE, RE | Aucun `<label>` : placeholders seuls. Feuille de réservation sans `aria-labelledby`, sans piège à focus ni restitution du focus. Erreurs sans `role="alert"`. Étoiles sans `radiogroup`. | Labels, dialogue accessible, annonces. |
| D9 | GE:520-1041, PE:456-597, sélecteur de langue | Cibles tactiles sous 44 px : chips (36), retour/fermer (36), stepper (40), créneaux (40), points de galerie (6), « Retour » du portail (~20), FR/EN (~19). | 44 px minimum partout. |
| D10 | PE:338-598, GE:1041 | Le portail force du texte blanc sur l'accent, quelle que soit sa luminosité ; lien en couleur d'accent sur blanc. Gris `neutral-400` 10-11 px ≈ 2,5:1. | Couleur de texte calculée d'après l'accent ; gris remontés à AA. |
| D11 | GE:355-857, PE:270 | `unoptimized` sur toutes les images distantes (Supabase Storage) : taille d'origine, ni WebP ni AVIF. La couverture du portail est un `<img>` brut, sans priorité. | Domaine Supabase déclaré dans `next.config.ts`, `next/image` optimisé, `priority` sur la couverture. |
| D12 | GE:580-591 | La galerie télécharge toutes les photos à l'ouverture de la feuille. | Seule la photo visible et la suivante sont chargées. |
| D13 | `s/[code]/page.tsx`, `r/[slug]/page.tsx` | Aucune donnée chargée côté serveur : HTML → JS → hydratation → RPC → images. Le portail est indexable mais son HTML ne contient que « … » en h1. | `portal_get` et `qr_get_menu` appelés côté serveur, passés en props ; métadonnées au nom de l'établissement. |
| D14 | `src/app/layout.tsx` | Manrope, Inter, Nunito, Gotham, Suisse et Satoshi sont préchargées sur toutes les pages, y compris `/s` et `/r`. | Voir chantier C (polices). |
| D15 | `proxy.ts:21-34` | En iframe tierce, le cookie `SameSite=Lax` n'est pas accepté : le choix de langue ne tient pas, `?lang=en` est perdu après la redirection. | En embed, la langue voyage dans l'URL (`?lang=`), sans redirection. |
| D16 | `next.config.ts` | Aucun `frame-ancestors` : toute l'application, connexion comprise, peut être mise en iframe (clickjacking). | En-têtes : `frame-ancestors 'self'` partout sauf `/r/*`. **Règle de sécurité : signalée en tête de rapport.** |
| D17 | GE:666-669, PE:79-88, GE:94 / PE:94 | Jours et mois codés à la main en double ; `isDarkHex` en double avec deux seuils (140 et 128). | `src/lib/booking/` : dates par `Intl`, créneaux, couleur. |

### P3

| # | Fichier | Ce qui ne va pas | Ce que je fais |
|---|---|---|---|
| D18 | GE:804-810 | Pas de `env(safe-area-inset-bottom)` : le bouton peut coller à la barre d'accueil iOS. | Marge de sécurité. |
| D19 | GE:943, PE:349, 439, 469 | « Date », « pers. », gabarit « Continuer · … » hors `t()`. | Passés par `t()`. |
| D20 | GE:257 | `scrollTo({behavior:"smooth"})` ignore `prefers-reduced-motion`. | Respecté. |
| D21 | GE (1 096 l.), PE (623 l.) | Fichiers géants. | Découpe en composants et hooks (`_components/`, `_hooks/`). |
| D22 | `dashboard/portal/page.tsx:123` | Le code d'intégration fixe `height="760"` alors que l'iframe est en `min-h-screen`. | Hauteur transmise par `postMessage`, snippet mis à jour. |

### Constats côté base, sans correction dans ce chantier (à décider par Yamin)

- `portal_full_slots` ne compte que les réservations avec `table_id` : une demande du portail ne rend jamais un créneau complet tant qu'aucune table n'est assignée (`schema.sql:654`). `portal_create_reservation` ne revérifie pas le créneau.
- `qr_get_menu` renvoie le catalogue actif de toutes les villes ; le filtre par ville est côté client (`guest-catalog.ts:220`).
- `qr_rate_reservation` accepte une note avant la date de la sortie.
- `p_venue` et `p_category` sont acceptés sans contrôle de cohérence avec le slug (`schema.sql:922`).
- Les dates sont calculées dans le fuseau de l'appareil, comparées à `current_date` du serveur.
- Le message d'accueil de l'hôtel n'a pas de version anglaise (contenu saisi en base).

### Ce qui est sain

- « Propulsé par twocards. » est présent sur les trois pages, embed compris (PE:606-619, sans condition).
- Les appels RPC correspondent aux signatures SQL (`portal_get`, `portal_full_slots`, `portal_create_reservation`, `qr_get_menu`, `qr_track_scan`, `qr_create_reservation`, `qr_rating_context`, `qr_rate_reservation`).
- `p_category` envoie bien le libellé français de `CATEGORY_LABELS`.
- Ni framer-motion ni gsap sur ces pages ; double soumission bloquée par `disabled`.

## C. Site public

### P1

| # | Fichier | Ce qui ne va pas | Ce que je fais |
|---|---|---|---|
| C1 | `src/app/robots.ts` | `disallow: /concierge` est une règle par préfixe : elle bloque aussi `/concierges`, page publique du sitemap. `/hotel`, `/admin`, `/s/`, `/r/`, `/avis` ne sont pas bloquées. | Règles avec `/concierge/` et `/concierge$`, ajout des routes privées. |
| C2 | `navbar.tsx:178, 216-235` | Sous 640 px, aucun accès à « Connexion » : le lien est `hidden sm:block` et absent du menu mobile. | Lien dans le menu mobile. |
| C3 | `scroll-video-hero.tsx:65-119` | `/influenceurs` télécharge la vidéo entière (20,4 Mo ordinateur, 9,3 Mo mobile) avant d'afficher quoi que ce soit, défilement bloqué. | Contenu visible tout de suite ; la vidéo se charge derrière, avec affiche. |
| C4 | `qr-hero.tsx:99-149`, `short-audience-page.tsx:126-154`, `section-header.tsx:27` | Titre, intro et CTA rendus en `opacity:0` côté serveur : invisibles tant que le JS n'a pas hydraté (LCP retardé). | Le héros est rendu visible d'emblée ; animation d'entrée en CSS seulement. |
| C5 | `forgot-password`, `reset-password` | Aucun h1 tant que le formulaire est affiché ; label « Email » en anglais en FR ; pas de métadonnées. | Refaites sur le modèle de `/login`. |
| C6 | `login/page.tsx`, `auth/callback/route.ts:21` | `?error=auth` (lien expiré) n'est jamais affiché. Les erreurs Supabase non prévues sortent brutes, en anglais (`login:74`, `signup:359`, `forgot:34`, `reset:49`). | Table d'erreurs commune, bilingue. |
| C7 | `mentions-legales:25-61`, `confidentialite:25`, `cgu:86` | 24 blancs entre crochets (12 FR, 12 EN). | **Listés dans le rapport, rien d'inventé.** |

### P2

| # | Fichier | Ce qui ne va pas | Ce que je fais |
|---|---|---|---|
| C8 | 4 pages métiers | Grammaire différente de l'accueil : h1 `font-normal` 56 px contre `font-bold` 76 px ; CTA secondaire en lien 11 px capitales ; `h2` bruts au lieu de `SectionHeader` ; `/influenceurs` hors gabarit avec sur-titre en capitales. | Un seul gabarit : mêmes héros, en-têtes, rythme, CTA. |
| C9 | 19 fichiers | 34 sur-titres en capitales espacées ; pastille verte « en direct » répétée 5 fois ; formule « phrase. *accent italique*. » sur presque tous les h2. | Retirés ou réduits à un usage par page. |
| C10 | FAQ ×4 | « Combien ça coûte ? » a quatre réponses différentes (`faq-home:44`, `hotel-page:203`, `establishment-page:389`, `concierge-page:267`). | **Question pour Yamin** : je n'invente pas le prix. Une seule formulation, reprise de l'accueil, en attendant. |
| C11 | `navbar.tsx:16`, `footer.tsx:13` vs `qr-audiences.tsx:48` | « Concierges / PR » d'un côté, « Concierges / RP » de l'autre en français. | « RP » en FR, « PR » en EN. |
| C12 | `hotel-page.tsx:238`, `establishment-page.tsx:198`, `faq-home.tsx:96`, `footer.tsx:18` | « Parler à notre équipe », « Parlons-en » et « Founding Circle » mènent tous à `/signup`. | Le contact pointe vers `mailto:contact@twocardspro.com` ; lien trompeur retiré. |
| C13 | `qr-system.tsx:30`, `hotel-page.tsx:28` | Le QR de démonstration encode `/?qr=demo`, que rien ne lit. | Il pointe vers le vrai menu de démonstration `/s/a1f3c07b`. |
| C14 | `src/app/layout.tsx:9-70` | Six familles de polices préchargées sur toutes les pages. Manrope et Inter ne servent qu'à `/onboarding`, Nunito qu'au mot-symbole. | Manrope, Inter et Nunito retirées ; `preload` seulement là où la police sert. |
| C15 | `short-audience-page.tsx:98-113, 210` | Vidéos des héros sans `preload`, sans pause hors écran, une seule source ; héros Concierges en `<img>` 461 Ko ; bandes photo en fond CSS. | `next/image` + `sizes`, vidéo chargée quand visible. |
| C16 | `wrap-shader.tsx` | Shader WebGL animé en continu sur 3 pages, ignore `prefers-reduced-motion`. | Chargé à la demande, coupé en mouvement réduit. |
| C17 | toutes | Aucune image de partage, pas de JSON-LD, pas de `canonical`, pas d'OG par page ; titres dans deux ordres ; pages légales `noindex` mais dans le sitemap. | `opengraph-image`, `Organization` + `WebSite`, métadonnées par page, sitemap corrigé. |
| C18 | landing | Aucun `MotionConfig` : les entrées framer-motion ignorent `prefers-reduced-motion`. | `MotionConfig reducedMotion="user"` sur le site public. |
| C19 | `--landing-mute #8d8d8d` et encres à 35-55 % | 3,3:1 et moins sur ivoire : sous AA. | Gris remontés à 4,5:1. |
| C20 | `signup/page.tsx` | Aucun lien vers CGU et confidentialité ; « Hôtel / Riad » proposé comme type de lieu alors que c'est déjà un métier ; cinq images plein cadre montées d'un coup. | Liens légaux, type retiré de la liste affichée, une image à la fois. |
| C21 | `/onboarding` | Maquette statique orpheline, ancienne charte, non protégée, avec un chiffre sans source (« 30 % »). | **Décision à Yamin (suppression d'une page)** : redirigée vers `/signup` en attendant. |

### P3

| # | Fichier | Ce qui ne va pas | Ce que je fais |
|---|---|---|---|
| C22 | `navbar.tsx:197-211` | Bouton du menu sans `aria-expanded` ; libellé figé sur « Ouvrir ». | Corrigé. |
| C23 | `reset-password` | Renvoie à `/dashboard` quel que soit le rôle. | Renvoie à `/login`, qui route par rôle. |
| C24 | `public/` | Fichiers jamais référencés : `dashboard-bg.jpg`, `images/etablissements-hero.jpg`, `videos/events.mp4`, `reservations.mp4`, `commissions.mp4`, `dashboard.mp4`, `reseau-rp.mp4`, `dashboard-preview-v2.png`. `logo-header.png` pèse 292 Ko pour 64 px. | Listés ; `public/videos/` n'est pas touché (consigne). Logo servi par `next/image`. |

### Parcours « Demander un accès » — mesure avant

- Depuis l'accueil : 4 clics (CTA, métier, Continuer, Créer mon compte) ; depuis une page métier : 3.
- Saisies minimum : 5 champs (hôtel, établissement), 4 (influenceur), 3 (concierge).
- Validation : attribut `required` seul, plus un contrôle de 8 caractères.

## Code mort (revérifié : aucun import)

`src/lib/constants.ts` (966 l.), `src/types/index.ts` (importé seulement par `constants.ts`), `src/components/landing/{hero,journey,network-bento,platform,standards,testimonial,venues-carousel,carousel}.tsx`, `src/components/ui/{card-fan-carousel,tabs,liquid-glass}.tsx`, exports `WarpBackground` et `WarpShaderHero` de `wrap-shader.tsx`.
CSS inutilisé : `.hero-gradient`, `.blueprint-grid`, `.liquid-glass*`, `.landing-glass`, `.noise-overlay`, `.fan-*`, `.animate-marquee-*`, `.animate-scroll-*`, `moveBackground`, `--hero-subtitle`.
Dépendances sans import après ménage : `gsap`, `@radix-ui/react-slot` (**à retirer de `package.json` : proposé, non fait**).

## A / B. Espaces connectés (établissement, hôtel, concierge, admin)

État de départ : `tsc` et `eslint` passent sans erreur ni avertissement. 46 pages `"use client"`, données chargées dans des `useEffect`.

### P1

| # | Fichier | Ce qui ne va pas | Ce que je fais |
|---|---|---|---|
| A1 | `concierge/reservations:112-149`, `clients:79-101`, `settings:47-52` | L'espace concierge **simule** : créer une réservation ou un client n'écrit rien en base mais affiche un toast de succès ; « Enregistrer » dans Paramètres est un `setTimeout(600)`. | Plus aucune action simulée. L'espace est rebranché sur les vraies données ; ce qui n'a pas de table derrière est retiré de l'écran et **signalé comme décision à prendre**. |
| A2 | `concierge/*` (`getDemoStats`, `DEMO_RESERVATIONS`, `DEMO_CLIENTS`, `DEMO_COMMISSIONS`, `DEMO_VENUES`, `concierge/ai:66-110`), `concierge/layout:105-110`, `concierge/reservations:27` | Données factices : chiffres (« 124K MAD », « 156 », « 87 % »), 8 clients avec téléphones, 6 lieux réels avec téléphones, réponses chiffrées scriptées de l'assistant. La liste d'établissements codée en dur est proposée **aussi aux comptes réels**. | Tout est supprimé, ainsi que les drapeaux `isDemoVenue` / `isDemoConcierge` (les comptes visés n'existent plus). |
| A3 | `dashboard/reservations:652, 294-327` | Saisir une addition sur un « no-show » le repasse en « confirmée » sans le dire (`{amount_spent, status:"confirmée"}`). « Rétablir » force « confirmée » même si la réservation était « en attente ». | La saisie est bloquée sur annulée et no-show ; l'écran dit que saisir l'addition confirme la réservation. **Aucun changement du calcul de commission** (trigger `qr_apply_commission`). |
| A4 | `use-venue-qr-reservations.ts:58`, `dashboard/commissions`, `network`, `events`, `concierge/page` | Les erreurs de chargement sont ignorées : un échec réseau s'affiche comme une liste vide. | Hooks de données avec état `error` et `reload` ; état d'erreur commun. |
| A5 | `dashboard/network:263`, `use-messaging.ts:182` | « Écrire » à un apporteur ouvre une conversation avec un **hôtel** en tant que `concierge_id` ; l'espace hôtel n'a pas de messagerie : le message n'est lu par personne. | Le bouton n'est proposé que si le destinataire a une messagerie. |
| A6 | `floor-plan:356-373, 399-402` | « Arrivé » depuis le plan de salle n'annule pas l'affichage si l'écriture échoue ; l'erreur du walk-in est ignorée. | Retour arrière et toast d'erreur, comme dans la liste. |
| A7 | 3 layouts + pages | Contraste : `text-white/40` ×192, `/30` ×99, `/25` ×40, `/35` ×23, `/20` ×21 sur verre sombre et photo ; 248 textes sous 12 px. | Thème clair à jetons, tous les couples texte/fond en AA ; plancher à 12 px. |
| A8 | `hotel/commissions:114` | `monthKey(prev.toISOString())` : en UTC+1, le « mois dernier » de l'export CSV tombe sur M-2. | Clé de mois calculée en heure locale. |
| A9 | `events:354-1343`, `floor-plan:804-810`, `settings:85`, modales maison (`reservations:847, 997`, `events:689, 782`, `messenger:301`, `concierge/*`) | Boutons-icônes sans nom, interrupteur sans rôle, modales sans Échap, sans piège de focus, sans `role="dialog"`. Lignes de tableau cliquables inaccessibles au clavier. | Kit unique : `IconButton` (libellé obligatoire), `Switch`, `Modal`/`Drawer` avec piège de focus et restitution. |

### P2

| # | Fichier | Ce qui ne va pas | Ce que je fais |
|---|---|---|---|
| A10 | `dashboard/layout` (365 l.), `hotel/layout` (377), `concierge/layout` (336), `admin/page:593-598` | Trois coques dupliquées, une quatrième dessinée dans la page admin. | `src/components/app/shell/` : une coque, une config de navigation par rôle. |
| A11 | `components/hotel/ui.tsx` (961 l.) vs pages établissement / concierge / admin | Deux kits : `StatusBadge` et `StatusPill`, deux `Avatar`, deux `RatingStars`, deux `SplitBar`, deux `weeklySeries`, 6 toasts différents, `Toggle` local, graphiques recodés dans `analytics`. | `src/components/app/ui/` : un seul kit, utilisé partout. |
| A12 | `ui.tsx:69-70` | `Button` : `{...props}` après `disabled` — un `disabled={false}` de l'appelant réactive le bouton pendant `loading`. | Corrigé dans le nouveau kit. |
| A13 | `dashboard/reservations` | Filtres et recherche en état local : perdus au rechargement, impossibles à partager. Sur téléphone, les actions sont dans un tableau replié. | Filtres dans l'URL ; liste en cartes avec actions sous le pouce. |
| A14 | `dashboard/events:465-500` | Réservations, places et revenu d'un événement sont calculés sur **toutes** les réservations du jour, pas sur l'événement ; « RP mobilisés » n'est jamais calculé ; revenu stocké en texte « 0 MAD ». | Les chiffres sont présentés pour ce qu'ils sont (« ce jour-là ») ; l'indicateur jamais calculé est retiré. |
| A15 | `dashboard/settings` (`notif_prefs`) | Préférences de notification (SMS, rapport hebdo…) enregistrées mais lues par rien. | **Décision à Yamin** : section marquée, non retirée. |
| A16 | `hotel/page:233`, `hotel/reservations:362`, `hotel/commissions:305` | « 10 % » codé en dur dans les textes alors que `commission_rate` existe par réservation. | Le taux affiché vient de la donnée. |
| A17 | `hotel/layout` | Bandeau d'erreur, alerte de nouvelle demande, bandeau d'impersonation et toast sortent à l'impression des cartes de chambre. | Tout ce qui n'est pas la planche est masqué à l'impression. |
| A18 | `hotel/settings:76`, `hotel/reservations:123` | `?onglet=` et `?periode=` castés sans validation : une valeur inconnue donne une page vide. | Valeurs validées, repli sur la valeur par défaut. |
| A19 | `src/types/index.ts` | Types sans rapport avec la base (`'pending'` vs `'en attente'`, `'venue'` vs `'etablissement'`) ; types de lignes redéfinis dans chaque page. | `src/lib/supabase/database.types.ts` + types de domaine partagés. |
| A20 | `dashboard/commissions:41-66` vs `commissions-admin:46-66` | `isDue`, `currentPeriod`, `monthLabel`, `mad` en double ; export CSV en triple. | `src/lib/commissions.ts`, `src/lib/csv.ts`. |
| A21 | `schema.sql:520-531` | Titres et textes des notifications écrits en français par les triggers. | Traduction à l'affichage d'après `kind` (pas de changement SQL). |
| A22 | 8 pages > 700 lignes, 18 pages > 400 | Voir tableau du brief. | Découpe en composants et hooks de données. |

### P3

| # | Fichier | Ce qui ne va pas | Ce que je fais |
|---|---|---|---|
| A23 | `dashboard/layout:229, 299`, `commissions:259`, `notifications:70`, `reservations:584-964`, `hotel/analyses:131-252`, `messenger:104` | Textes en dur (« Venue Manager », « via », « Scans », « Conv. »…). | Passés par `t()`. |
| A24 | `concierge/layout:307` | « Aide » mène aux paramètres. | Retiré. |
| A25 | `hotel/reservations:380` | Composant exporté depuis un `page.tsx`. | Déplacé dans `components/`. |
| A26 | `lib/qr.ts:32` | L'URL blob est révoquée juste après `click()` : le téléchargement du QR peut échouer sur Safari et Firefox. | Révocation différée. |
| A27 | `hotel/charts` (`DualBars`, `Sparkline`), `mini-charts` (`SplitBar`), `StatStripThree`, `Divider` | Exports jamais utilisés. | Supprimés. |

### À ne pas casser (vérifié dans le code)

- Écritures établissement sur `qr_reservations` : seules `amount_spent`, `arrived_at`, `status`, `table_id` sont ouvertes (`schema.sql:1891-1897`). Statuts : `'en attente' | 'confirmée' | 'annulée' | 'no-show'`.
- Commission : trigger `qr_apply_commission` = `round(amount_spent * commission_rate, 2)` ; `qr_lock_pos_amount` refuse la modification si `amount_source = 'pos'`.
- QR : `guestUrl` → `/s/<code>?h=&c=` ; `downloadSvg` / `downloadPng` lisent `#qr-<id> svg`.
- Impression : `?ids=`, `window.print()`, classes `print-hide`, `print-sheet`, `print-card`.
- Messagerie : `use-messaging.ts` (canal `conv-<id>`, `markRead`, `sendMessage`).
- Impersonation admin : `lib/impersonation.ts`.
- Paramètres d'URL existants : `?nouveau=1`, `?tri=`, `?onglet=`, `?periode=`, `?id=`, `?ids=`, `?with=`, `?to=`, `?new=1&venue=`.
- Redirections : `hotel/qr-codes` → `hotel/chambres`, `dashboard/qr-reservations` → `dashboard/reservations`.
