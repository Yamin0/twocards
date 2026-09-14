# Réponse à l'App Review — Guideline 2.1, Information Needed

Soumission 9837cb95-2d57-436a-8357-b69cd085bdc2, version 1.0. Apple demande
une vidéo et cinq réponses. Tout est à coller tel quel, en anglais, dans
App Store Connect → version 1.0 → « Messages de l'App Review » (répondre
au message), **et** dans le champ « Remarques » de la section Informations
utiles à la vérification, comme demandé.

## 1. La vidéo (à faire sur l'iPhone, 2 à 3 minutes)

Réglages → Centre de contrôle → ajouter « Enregistrement de l'écran ».
Puis : fermer complètement l'app, ouvrir le Centre de contrôle, lancer
l'enregistrement, attendre le décompte, et dérouler ce parcours sans se
presser :

1. Ouvrir twocards depuis l'écran d'accueil (l'enregistrement doit
   commencer avant le lancement).
2. Écran de connexion : se connecter avec tablemarche@venue.com.
3. Accueil : faire défiler jusqu'en bas, toucher la carte « Ce soir ».
4. Réservations : toucher **Confirmer** sur une demande, puis **Annuler**
   dans le message en bas ; toucher **Refuser** sur une autre, confirmer
   dans l'alerte, puis **Annuler** dans le message.
5. Toucher une carte pour ouvrir la fiche, faire défiler jusqu'au suivi.
6. Bouton **+** : créer une réservation (nom, jour, heure, couverts),
   Ajouter.
7. Menu : ouvrir **Commissions**, revenir ; ouvrir **Messages**, ouvrir
   un fil, envoyer « Bonjour », revenir.
8. Menu → **Paramètres** : faire défiler jusqu'à « Demander la
   suppression de mon compte », le toucher (l'e-mail s'ouvre), revenir.
9. Paramètres → **Se déconnecter** → confirmer. L'écran de connexion
   réapparaît : arrêter l'enregistrement.

La vidéo est dans Photos. L'envoyer sur le PC (iCloud Photos, e-mail ou
WhatsApp Web en qualité originale), puis la joindre à la réponse dans App
Store Connect (bouton trombone ou « Choisir un fichier »). Si le fichier
dépasse la limite d'envoi, le déposer sur iCloud Drive ou Google Drive en
lien public et coller le lien dans la réponse.

## 2 à 6. Le texte à coller

```
Thank you for reviewing twocards Pro. Please find the requested information below. A screen recording made on a physical iPhone (iOS, latest version) is attached: it starts with the app launch and shows login, the main reservation flow, commissions, messaging, the account deletion request and logout.

1. SCREEN RECORDING
Attached to this reply. The app has no in-app account registration (accounts are created by twocards when a partner joins the network), no user-generated public content, and no paid content or in-app purchases. Account deletion can be requested from Menu > Paramètres > "Demander la suppression de mon compte", which is shown in the recording.

2. PURPOSE AND TARGET AUDIENCE
twocards is a B2B network connecting hotels and concierge services with local partner venues (restaurants, activities, services) in a city, starting with Marrakech, Morocco. Hotel guests scan a QR code in their room, browse a curated menu of partner addresses and request a reservation. The venue receives the request, confirms it, welcomes the guest and later enters the bill; a referral commission is computed for the hotel that brought the guest.

twocards Pro is the mobile workspace for these professional partners:
- Venue managers (restaurants, activities, services): receive and confirm reservation requests, mark guests as arrived, enter bills, add their own reservations, track commissions owed to each hotel, view analytics, message concierge services, and manage their offers.
- Hotels and concierge services: follow their guests' reservations, their QR codes and their commissions.

Problem solved: today these reservations are handled by phone calls and WhatsApp messages between hotel staff and venues, with no shared record and no reliable way to track referral commissions. The app gives both sides a single, real-time view and push notifications for every new request.

The audience is exclusively professionals who are partners of the twocards network. Partners are independent businesses (any restaurant, activity provider, hotel or concierge service can join the network), not employees of a single organization, which is why the app is distributed publicly on the App Store rather than through Apple Business Manager.

3. SETUP AND ACCESS INSTRUCTIONS
No setup is needed. Launch the app and sign in with the demo account provided in App Review Information:
- Username: tablemarche@venue.com
- Password: Twocards2026!
This is a restaurant manager account ("Restaurant Hivernage") with sample data: pending reservation requests, confirmed reservations for today and the coming days, past reservations with bills, commissions, messages and notifications.

Main features and where to find them:
- Réservations tab (left): pending requests with Confirmer / Refuser buttons; filters En attente, Aujourd'hui, À venir, Passées; search; "+" button to add a reservation taken by phone. Tap any card to open the full record (call, WhatsApp, SMS, arrival, bill, timeline).
- Accueil tab (center): tonight's figures, monthly KPIs, request trend, pending requests, shortcuts.
- Menu tab (right): Messages, Commissions, Réseau apporteurs (referring hotels), Analyses, Clients, Plus (web tools: booking portal, events, floor plan, POS), Paramètres (profile, photo, password, notifications, legal links, logout, account deletion request), Notifications, Aide.
Every action in the demo account is reversible; feel free to confirm, refuse or undo any reservation.

4. EXTERNAL SERVICES
- Supabase (supabase.com): authentication (email/password), PostgreSQL database with row-level security, file storage for photos, realtime updates, and serverless functions. All app data lives there.
- Expo Application Services (expo.dev): build tooling and the Expo push notification service, which relays notifications to Apple Push Notification service (APNs).
- Our own website, twocardspro.com (hosted on Vercel): a few secondary tools (booking portal, events, floor plan, POS integration) and the hotel/concierge workspaces are displayed inside the app as web content, using the same account session.
No payment processor, no advertising SDK, no analytics SDK, no AI service, no third-party data provider.

5. REGIONAL DIFFERENCES
None. The app functions identically in every country and region. The interface is in French, amounts are shown in Moroccan dirhams (MAD) because the network currently operates in Morocco, and the first partners are in Marrakech and France.

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
Not applicable. The app does not operate in a regulated industry (no payments are processed in the app, no financial, medical, gambling or alcohol sales features) and contains no protected third-party material. All content (venue names, photos, offers) is provided by the partner businesses themselves about their own establishments.

Thank you, we are available for any further question.
```

## Si Apple répond encore (Guideline 3.2, distribution privée)

Réponse courte à envoyer :

```
The app is not intended for a single business or its employees. It serves independent restaurants, activity providers, hotels and concierge services that join an open partner network; any qualifying business in a city can join. Public App Store distribution lets these small, unrelated businesses find and install the app, exactly like other B2B marketplace apps. Enterprise or custom-app distribution would require each of them to run Apple Business Manager, which is not realistic for independent restaurants.
```
