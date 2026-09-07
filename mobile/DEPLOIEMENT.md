# twocards mobile — de zéro à l'App Store

L'app est une **coque native** (connexion, onglets, profil) autour des
dashboards du site `twocardspro.com`, affichés dans des WebViews. Elle se
construit **dans le cloud avec EAS** : aucun Mac ni Xcode nécessaire depuis
Windows.

## Comment ça marche

1. Connexion native (email / mot de passe Supabase) → rôle lu dans les
   métadonnées (`etablissement`, `hotel`, `concierge`, `admin`).
2. L'app demande à la fonction Supabase `mobile-session` un jeton de
   connexion à usage unique, puis la première WebView charge
   `https://twocardspro.com/auth/mobile?token_hash=…&next=/dashboard`.
3. Le site pose ses cookies de session (indépendants de la session native,
   donc pas de conflit de rafraîchissement) et redirige vers la page.
4. Les autres onglets chargent leur page directement : les cookies sont
   partagés entre les WebViews.

Onglets par rôle (fichier `src/lib/site.ts`) :

| Rôle | Onglets |
| --- | --- |
| Établissement | Accueil · Réservations · Événements · Messages · Profil |
| Hôtel | Accueil · Réservations · Chambres · Adresses · Profil |
| Concierge | Accueil · Calendrier · Lieux · Messages · Profil |
| Admin | Admin · Établissement · Hôtel · Concierge · Profil |

Le reste des sections reste accessible par le menu ☰ du site, dans la
WebView. Se déconnecter depuis ce menu déconnecte aussi l'app.

## Prérequis (une seule fois)

- Compte **Expo** gratuit : https://expo.dev/signup
- Compte **Apple Developer** (payé) : https://developer.apple.com/account
- App **Expo Go** sur votre iPhone (App Store) pour tester sans build.

```bash
npm install -g eas-cli
```

## 1. Déployer la partie site (déjà codée, à mettre en ligne)

- `src/app/auth/mobile/route.ts` : nouvelle route, à déployer avec le site
  (commit + push comme d'habitude).
- La fonction Supabase `mobile-session` est **déjà déployée** sur le projet
  (`supabase/functions/mobile-session/index.ts` en garde la source).

## 2. Tester sur votre iPhone, tout de suite

Dans `mobile/` :

```bash
npx expo start --tunnel
```

Scannez le QR code avec l'appareil photo de l'iPhone : l'app s'ouvre dans
Expo Go. Connectez-vous avec un compte twocards (les comptes de démo
fonctionnent).

## 3. Lier le projet à EAS (une seule fois)

```bash
eas login
```

```bash
eas init
```

`eas init` ajoute `extra.eas.projectId` dans `app.json` : gardez-le.

## 4. Premier build iOS + TestFlight

```bash
eas build --platform ios --profile production
```

À la première exécution, EAS demande :

- de se connecter à votre **compte Apple Developer** (identifiant Apple) ;
- de le laisser **créer les certificats et le profil de provisioning** —
  répondez oui, tout est géré et stocké chez EAS ;
- de créer l'identifiant d'app `com.twocards.app` sur le portail Apple —
  oui.

Le build dure 10 à 20 minutes dans le cloud. Ensuite :

```bash
eas submit --platform ios --latest
```

EAS crée la fiche dans **App Store Connect** si elle n'existe pas et envoie
le binaire sur **TestFlight**. Sur l'iPhone, installez l'app TestFlight,
acceptez l'invitation (vous êtes testeur interne par défaut) et installez
twocards.

Pour les builds suivants, les deux mêmes commandes suffisent ; le numéro de
build s'incrémente tout seul (`autoIncrement`).

## 5. Publication sur l'App Store

Dans App Store Connect (https://appstoreconnect.apple.com) → votre app :

1. **Captures d'écran** iPhone 6,7" (1290 × 2796) : au moins 3, faites
   depuis TestFlight (capture native de l'iPhone).
2. **Description**, mots-clés, catégorie *Business*.
3. **URL de confidentialité** : `https://twocardspro.com/legal/confidentialite`.
4. **Confidentialité des données** : déclarer *Coordonnées (email)* et
   *Identifiants*, liés à l'utilisateur, non utilisés pour le suivi.
5. **Informations de connexion pour la revue** : un compte de démo
   (email + mot de passe) — indispensable, l'app ne s'utilise que connecté.
6. **Notes pour la revue** (à coller) :

   > Application réservée aux professionnels partenaires du réseau twocards
   > (restaurants, hôtels, conciergeries). Les comptes sont créés par
   > twocards, il n'y a pas d'inscription dans l'app. Compte de test fourni.

7. Sélectionner le build TestFlight → *Soumettre pour examen*.

Délai Apple habituel : 24 à 48 h.

### Point d'attention : règle 4.2 « fonctionnalités minimales »

Apple refuse parfois les apps qui ne font qu'afficher un site. La coque
native (connexion, onglets, profil) aide, mais pour sécuriser la validation
et rendre l'app vraiment utile, la prochaine étape naturelle est
**les notifications push** (nouvelle réservation, nouveau message) via
`expo-notifications` — c'est aussi le premier argument pour installer l'app
plutôt qu'ouvrir le site.

## Mises à jour sans repasser par Apple

Les changements côté site (dashboards) sont visibles immédiatement dans
l'app, sans nouveau build. Seuls les changements du code natif (`mobile/`)
demandent un `eas build` + `eas submit`.

## Vérifications locales

```bash
npx tsc --noEmit
```

```bash
npx expo export --platform ios --output-dir dist
```
