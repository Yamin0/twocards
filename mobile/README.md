# twocards mobile

Application iOS / Android (Expo SDK 57, expo-router) : coque native autour
des dashboards du site twocards. Voir **DEPLOIEMENT.md** pour la marche à
suivre complète (test sur iPhone, build EAS, TestFlight, App Store).

```bash
npm install
```

```bash
npx expo start --tunnel
```

Structure :

- `src/app/login.tsx` — connexion native (Supabase).
- `src/app/(tabs)/` — onglets ; `index`, `slot-2`, `slot-3`, `slot-4` sont
  des fentes remplies selon le rôle, `profile` est natif.
- `src/lib/site.ts` — URL du site, onglets par rôle, couleurs de la coque.
- `src/lib/web-session.tsx` — transfert de la session native vers les
  cookies du site (fonction Supabase `mobile-session` + `/auth/mobile`).
- `src/components/site-webview.tsx` — la WebView d'une page du site.
