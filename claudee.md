# CLAUDE.md — Projet Site Web Circle Conciergerie

## Vue d'ensemble du projet

**Nom du projet :** Circle — Site vitrine de conciergerie de luxe  
**Framework :** [Astro](https://astro.build/)  
**Type :** Site vitrine (pas d'e-commerce, pas d'espace client dans un premier temps)  
**Langue principale :** Français (avec possible version anglaise à prévoir)

---

## Stack technique

```
astro/          → Framework principal (SSG/SSR)
src/
  components/   → Composants Astro réutilisables
  layouts/      → Layouts de page
  pages/        → Pages du site
  styles/       → CSS global, variables, utilitaires
  assets/       → Images, icônes (hors logo/charte fournis)
  content/      → Collections de contenu (services, témoignages…)
public/
  logo/         → Logo fourni par le client (ne pas modifier)
  fonts/        → Polices de la charte graphique
  images/       → Images statiques
```

---

## Identité & Charte graphique

> ⚠️ Le logo et la charte graphique seront fournis par le client.  
> **Ne jamais modifier** les fichiers dans `public/logo/`.  
> **Toujours respecter** les couleurs, typographies et espacements définis dans la charte.

Une fois la charte reçue, créer les variables CSS dans `src/styles/tokens.css` :

```css
:root {
  /* Couleurs — à remplir selon la charte */
  --color-primary: ;
  --color-secondary: ;
  --color-accent: ;
  --color-bg: ;
  --color-text: ;
  --color-text-muted: ;

  /* Typographie — à remplir selon la charte */
  --font-heading: ;
  --font-body: ;

  /* Espacements */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 2rem;
  --spacing-lg: 4rem;
  --spacing-xl: 8rem;
}
```

---

## Pages du site

### Pages principales à créer

| Page | Route | Description |
|---|---|---|
| Accueil | `/` | Hero, accroche, aperçu services, CTA |
| Services | `/services` | Détail complet des prestations |
| À propos | `/a-propos` | Histoire, valeurs, équipe |
| Contact | `/contact` | Formulaire de contact + coordonnées |
| Mentions légales | `/mentions-legales` | Obligatoire |

### Pages optionnelles (phase 2)

| Page | Route | Description |
|---|---|---|
| Réalisations / Références | `/realisations` | Portfolio de missions |
| Blog / Actualités | `/blog` | Articles et conseils |
| FAQ | `/faq` | Questions fréquentes |

---

## Fonctionnalités clés

### Must-have (MVP)
- [ ] Navigation responsive (desktop + mobile)
- [ ] Page d'accueil avec section hero impactante
- [ ] Présentation des services (cartes ou sections)
- [ ] Formulaire de contact fonctionnel
- [ ] SEO de base (meta title, description, Open Graph)
- [ ] Accessibilité de base (ARIA, contrastes)
- [ ] Performance (Lighthouse ≥ 90)

### Nice-to-have (phase 2)
- [ ] Animations au scroll (Intersection Observer ou AOS)
- [ ] Galerie photo
- [ ] Témoignages clients (carrousel)
- [ ] Intégration Google Maps
- [ ] Version anglaise (i18n Astro)

---

## Composants à développer

```
Header.astro          → Logo + navigation + burger menu mobile
Footer.astro          → Liens, coordonnées, réseaux sociaux
Hero.astro            → Section pleine page avec accroche et CTA
ServiceCard.astro     → Carte individuelle de prestation
ContactForm.astro     → Formulaire de contact (avec validation)
Button.astro          → Bouton réutilisable (variantes: primary, ghost)
Section.astro         → Wrapper de section avec espacement cohérent
TestimonialCard.astro → Carte témoignage client
```

---

## Conventions de code

### Général
- **Langue du code :** anglais (variables, fonctions, composants)
- **Langue du contenu :** français
- **Indentation :** 2 espaces
- **Guillemets :** doubles `"`

### Astro
- Préférer les composants `.astro` aux frameworks JS (React/Vue) sauf nécessité
- Utiliser les [Content Collections](https://docs.astro.build/en/guides/content-collections/) pour services et témoignages
- Images : utiliser le composant `<Image />` d'Astro pour l'optimisation automatique
- Pas de JavaScript côté client sauf pour les interactions réellement nécessaires

### CSS
- Utiliser les variables CSS définies dans `tokens.css`
- CSS scoped dans les composants `.astro` en priorité
- Pas de framework CSS externe (Tailwind optionnel si demandé)
- Mobile-first

### SEO
- Chaque page doit avoir un `<title>` unique et une `<meta description>`
- Utiliser le layout `BaseLayout.astro` qui centralise les balises meta
- Alt text obligatoire sur toutes les images

---

## Commandes utiles

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Vérifier les types
npm run astro check
```

---

## Points d'attention Circle

- **Positionnement premium / luxe** : le site doit inspirer confiance et exclusivité. Privilégier l'élégance à l'accumulation d'éléments.
- **Clarté de l'offre** : les visiteurs doivent comprendre en quelques secondes ce que Circle propose et à qui.
- **Call to action fort** : chaque page doit mener vers une prise de contact.
- **Pas de contenu générique** : éviter les banques d'images trop génériques (type stock photo corporate). Préférer les visuels fournis par le client ou des illustrations personnalisées.

---

## Ressources fournies par le client

- [ ] Logo (formats SVG + PNG recommandés)
- [ ] Charte graphique (couleurs, typographies, règles d'usage)
- [ ] Textes et contenus des pages
- [ ] Photos / visuels

> Placer les ressources dans `public/` une fois reçues et mettre à jour les variables dans `tokens.css`.

---

## Contact projet

> *À compléter : nom du client, email, Slack/WhatsApp, etc.*
