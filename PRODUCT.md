# Product

<!-- uizze:product-schema 1 -->

## Platform

web

## Users

- **Restaurateurs / venue managers** : configurent leur établissement dans le dashboard twocards (réservations, plan de salle, événements, portail de réservation directe). Contexte : gestion quotidienne, souvent pressés, entre deux services.
- **Clients finaux (convives)** : réservent une table via le portail public `/r/[slug]`. Arrivent principalement sur **mobile** depuis la bio Instagram, un QR code ou la fiche Google Business ; secondairement via l'iframe intégrée au site de l'établissement (`?embed=1`).
- **Conciergeries et hôtels** : apporteurs d'affaires du réseau twocards (canal commissionné, distinct du portail direct).

## Product Purpose

twocards est un réseau de réservation pour restaurants et établissements : les réservations arrivent des conciergeries/hôtels partenaires (commissionnées) et du **portail de réservation directe** de l'établissement. Le portail (`/r/[slug]`) est le canal direct **gratuit, sans commission** — modèle SevenRooms. Les demandes atterrissent dans l'onglet Réservations du dashboard, canal « direct ».

## Positioning

Le canal direct est gratuit et sans commission, adossé au même back-office que le réseau de conciergeries — un voisin pur widget (SevenRooms, Zenchef) ne porte pas le réseau d'apporteurs, un pur réseau ne donne pas le portail direct gratuit.

## Operating Context

- Le restaurateur configure le portail dans **Dashboard → Portail** : slug, nom affiché, tagline, couleur d'accent, couleur de fond, photo de couverture, couverts max, amplitude horaire (gère le passage de minuit), intervalle des créneaux, actif/inactif. QR code téléchargeable et code d'intégration iframe fournis.
- Le convive suit un parcours en trois temps : couverts / date / créneau → coordonnées → confirmation. **Sans prépaiement** ; l'établissement confirme par téléphone ou WhatsApp.
- Données via Supabase : RPC `portal_get(slug)` (lecture anonyme) et `portal_create_reservation(...)` (création anonyme).

## Capabilities and Constraints

- Next.js (App Router) + Tailwind + Supabase ; icônes lucide-react.
- Le portail doit fonctionner en deux rendus : page pleine hébergée par twocards et iframe embed (`?embed=1`, sans marges ni carte flottante).
- Les créneaux sont générés depuis l'amplitude configurée — pas encore de disponibilité réelle des tables (fait produit assumé : c'est une **demande** de réservation, confirmée par l'établissement).
- Langue : français uniquement à ce jour.
- Personnalisation par établissement limitée aux champs configurés (accent, fond, photo, textes) ; palette proposée dans le dashboard : 6 accents, 6 fonds (clairs et sombres).

## Brand Commitments

- Marque réseau : **twocards.** (wordmark avec point final, logo `public/logo-header.png`). Le pied « Propulsé par twocards. » est présent sur le portail **y compris en embed** — c'est la marque du réseau, non négociable.
- Back-office : identité typographique Gotham (titres) + Suisse Int'l (texte).
- Portail public : identité propre, distincte du back-office — **Marcellus** (serif display, registre hôtellerie de luxe) pour le nom et les titres, **Figtree** pour l'interface. Chargées uniquement sur le portail.
- Le portail doit ressembler à **l'établissement** (sa photo, ses couleurs), pas à un template twocards ; twocards signe discrètement en pied.

## Evidence on Hand

- Implémentation réelle : `src/app/r/[slug]/page.tsx` + `portal-experience.tsx` (parcours complet fonctionnel).
- Configuration réelle : `src/app/dashboard/portal/page.tsx` ; schéma : `supabase/migrations/20260820100000_portal_appearance.sql`.
- Pas de témoignages, chiffres ou logos clients disponibles pour le portail — ne rien fabriquer.

## Product Principles

1. Le canal direct est un cadeau au restaurateur : zéro friction, zéro commission — le portail doit convertir, pas impressionner.
2. Chaque portail appartient visuellement à son établissement ; twocards signe en pied, sans plus.
3. Une réservation est une promesse humaine : le parcours dit clairement que l'établissement confirme (téléphone/WhatsApp), sans prépaiement.
4. Mobile d'abord : bio Instagram et QR sont les portes d'entrée dominantes.
5. Le back-office et le portail sont deux mondes typographiques distincts et le restent.
