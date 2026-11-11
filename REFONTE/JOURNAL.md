# Journal de la refonte

## Lot 0 — Audit et fondations (`c427f46`)

- **Changé** : `REFONTE/AUDIT.md` ; jetons sémantiques du back-office dans `globals.css` ; kit `src/components/app/ui/` ; coque `src/components/app/shell/` (non branchés).
- **Pourquoi** : poser le système avant de toucher aux pages.
- **Vérifié** : types.
- **Non vérifié** : rien à l'écran, la coque n'était pas branchée.

## Lot 1 — Code mort (`5e0d…`, voir `git log`)

- **Changé** : suppression de `lib/constants.ts` (966 lignes de données factices), `types/index.ts`, huit composants landing, trois composants `ui/`, les exports de démonstration du shader et 170 lignes de CSS sans usage. 3 116 lignes en moins.
- **Pourquoi** : aucun import (revérifié par recherche avant suppression).
- **Vérifié** : types et lint verts.
- **Non vérifié** : build (fait au lot 2).

## Lot 2 — Coque unique et thème clair

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
