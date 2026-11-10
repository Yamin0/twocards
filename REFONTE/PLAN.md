# Plan de la refonte

Chaque lot se termine par : types, lint, build, navigateur (FR et EN, 390 et 1440 px), captures, commit, entrée dans `JOURNAL.md`.
Les numéros renvoient à `AUDIT.md`.

| Lot | Contenu | Résultat vérifiable |
|---|---|---|
| 0 | Audit, jetons de design, kit UI, coque (non branchés). **Fait** (`c427f46`). | `AUDIT.md`, `src/components/app/` |
| 1 | Code mort : `lib/constants.ts`, `types/index.ts`, 8 composants landing, 3 composants `ui/`, CSS inutilisé, exports morts. | Build vert, ≥ 2 500 lignes en moins, aucune page changée. |
| 2 | Coque unique branchée sur les quatre espaces ; thème clair appliqué à toutes les pages connectées ; `components/hotel/ui.tsx` devient un simple renvoi vers le kit. (A7, A9-A12, A17, A23, A24) | Trois layouts sous 60 lignes, ≥ 800 lignes dupliquées en moins, plus aucune classe `text-white/…` dans les espaces. |
| 3 | Données : types Supabase, hooks (`useVenueReservations`, `useVenueTables`…) avec erreur et rechargement, `lib/commissions.ts`, `lib/csv.ts` ; fin des données factices et des actions simulées du concierge. (A1, A2, A4, A8, A16, A18-A20) | Plus aucun `DEMO_`, plus de `isDemo*` ; état d'erreur visible quand le réseau tombe. |
| 4 | Dashboards : accueil « Aujourd'hui » des quatre espaces ; réservations établissement (actions dans la liste, filtres dans l'URL, vue mobile) ; découpe des pages géantes. (A3, A5, A6, A13, A14, A22) | Aucune page au-delà d'environ 400 lignes ; filtres conservés au rechargement. |
| 5 | Pages clients `/s`, `/r`, `/avis` : bugs P1, champs 16 px, cibles 44 px, erreurs par cause, données côté serveur, images optimisées, découpe. (D1-D5, D7-D22) | Réservation de bout en bout en mode aperçu, FR et EN, sans erreur console. |
| 6 | Site public : gabarit commun des pages métiers, connexion et mot de passe oublié, polices, vidéos, SEO (OG, JSON-LD, sitemap, robots), accessibilité. (C1-C6, C8-C24) | Lighthouse mobile avant / après sur `/` et `/hotels`. |
| 7 | Vérification finale, captures « après », `RAPPORT.md`. | Critères de fin du brief, un par un. |

## Décisions laissées à Yamin (je n'attends pas pour avancer)

1. **Concierge** : la base ne donne au concierge ni QR ni réservations. En attendant, l'espace montre ce qui existe (annuaire des établissements, messagerie) et dit clairement ce qui n'est pas encore branché.
2. **« Combien ça coûte ? »** : une seule formulation, celle de l'accueil, en attendant la bonne.
3. **`/onboarding`** : redirigée vers `/signup`, fichier conservé jusqu'à décision.
4. **`notif_prefs`** (Paramètres établissement) : réglages enregistrés mais lus par rien ; laissés en place.
5. **Dépendances** `gsap` et `@radix-ui/react-slot` : plus aucun import après le lot 1 ; retrait de `package.json` proposé, non fait.
6. **SQL** (RPC publique `qr_create_reservation`, D6) : écrit dans `supabase/migrations/`, non lancé.
