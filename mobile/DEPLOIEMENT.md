# twocards mobile — de zéro à l'App Store

L'app iOS (Expo SDK 57) se construit **dans le cloud avec EAS** : aucun Mac
ni Xcode nécessaire depuis Windows. Toutes les commandes se tapent dans le
dossier `mobile/`.

## Comment ça marche

- **Établissements** (restaurants, activités, services) : écrans natifs.
  Trois onglets, Réservations · Accueil · Menu, plus les écrans
  commissions, messages, analyses, réseau, clients, prestations,
  notifications, paramètres. Données lues directement dans Supabase
  (RLS), à jour en temps réel.
- **Hôtels, conciergeries, admin** : les pages du site, affichées dans
  l'app en style clair (le site reconnaît l'app à son agent utilisateur).
  La session passe par la fonction Supabase `mobile-session` et la route
  `/auth/mobile` du site.
- **Notifications push** : table `push_tokens`, fonction `push_to_user`
  côté base, déclenchée sur nouvelle réservation, message et notification.

## Prérequis (déjà faits)

- Compte Expo `yaminba`, projet `@yaminba/twocards`, `eas-cli` installé,
  `eas login` effectué.
- Compte Apple Developer actif, équipe `US5RZ88Z64` (dans `eas.json`).
- Site déployé avec `/auth/mobile`, fonction `mobile-session` déployée.

## 1. Tester sur l'iPhone sans build

```bash
npx expo start --tunnel
```

Ouvrez le lien `exp://…exp.direct` sur l'iPhone (Safari ou Expo Go →
« Enter URL manually »). Si l'erreur `ERR_NGROK_108` apparaît, le service
tunnel d'Expo est saturé : réessayez une minute plus tard.

## 2. Build de production et TestFlight

```bash
eas build --platform ios --profile production
```

À la première exécution, EAS pose des questions. Réponses :

| Question | Réponse |
| --- | --- |
| Log in to your Apple Developer account? | **Oui**, identifiant Apple + mot de passe (+ code à deux facteurs) |
| Generate a new Apple Distribution Certificate? | **Oui** |
| Generate a new Apple Provisioning Profile? | **Oui** |
| Set up Push Notifications key? / Generate a new Apple Push Key? | **Oui** (indispensable pour les notifications) |
| Register bundle identifier com.twocards.app? | **Oui** |

Le build dure 10 à 20 minutes. Le lien de suivi s'affiche dans le
terminal (aussi sur https://expo.dev). Puis :

```bash
eas submit --platform ios --latest
```

Réponses : connexion Apple si demandée ; « Create a new app in App Store
Connect? » → **Oui** (nom : twocards, langue : French). EAS envoie le
binaire sur TestFlight. Apple le traite en 5 à 15 minutes, puis :

1. Sur l'iPhone, installez **TestFlight** (App Store).
2. Sur https://appstoreconnect.apple.com → twocards → TestFlight →
   testeurs internes → ajoutez-vous.
3. Acceptez l'invitation reçue par e-mail : l'app s'installe via TestFlight.

Pour les builds suivants, les deux mêmes commandes suffisent ; le numéro de
build s'incrémente tout seul.

## 3. Publication sur l'App Store

Tous les textes à coller sont dans `APP_STORE.md`. Dans App Store Connect →
twocards → onglet **App Store** :

1. **Captures d'écran** : 3 à 5, prises dans TestFlight avec le compte
   Table du Marché.
2. **Description**, texte promotionnel, mots-clés, URL d'assistance et de
   confidentialité, catégorie.
3. **Confidentialité de l'app** : questionnaire (tableau dans
   `APP_STORE.md`).
4. **Informations de revue** : compte de démo + notes.
5. **Version** : sélectionner le build TestFlight → *Ajouter pour examen*
   → *Soumettre*.

Délai Apple habituel : 24 à 48 h. En cas de refus, le message d'Apple
s'affiche dans App Store Connect ; le plus courant est une question sur le
compte de démo ou sur la suppression de compte (réponse : Paramètres →
« Demander la suppression de mon compte »).

## Mises à jour

- Pages web (hôtel, concierge, admin, outils) : visibles immédiatement,
  sans nouveau build.
- Écrans natifs (dossier `mobile/`) : `eas build` puis `eas submit`, et
  une nouvelle version dans App Store Connect (« + » à côté de la version,
  1.0.1, etc.). Pensez à monter `version` dans `app.json`.

## Vérifications locales avant un build

```bash
npx tsc --noEmit
```

```bash
npx expo lint
```

```bash
npx expo export --platform ios --output-dir dist
```
