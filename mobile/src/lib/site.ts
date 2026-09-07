import type { NativeTabs } from 'expo-router/unstable-native-tabs'
import type { ComponentProps } from 'react'

/* Le site twocards, dont l'app affiche les dashboards. Adresse canonique :
   twocardspro.com redirige vers www, autant partir directement dessus pour
   éviter une redirection à chaque chargement. */
export const SITE_URL = (
  process.env.EXPO_PUBLIC_SITE_URL ?? 'https://www.twocardspro.com'
).replace(/\/$/, '')

const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')

/* Les deux écritures du domaine mènent au même site : un lien vers la forme
   nue doit rester dans l'app, pas partir dans le navigateur. */
const SITE_HOSTS = new Set([
  SITE_HOST,
  SITE_HOST.startsWith('www.') ? SITE_HOST.slice(4) : `www.${SITE_HOST}`,
])

/* Appelée à chaque navigation de WebView : l'expression vit hors de la
   fonction pour n'être compilée qu'une fois. */
const URL_PARTS = /^https?:\/\/([^/?#]+)([^?#]*)/

/* Chemin de l'URL si elle appartient au site, sinon null. */
export function sitePath(url: string): string | null {
  const m = URL_PARTS.exec(url)
  if (!m || !SITE_HOSTS.has(m[1].toLowerCase())) return null
  return m[2] || '/'
}

export type Role = 'etablissement' | 'hotel' | 'concierge' | 'admin'

export const roleLabels: Record<Role, string> = {
  etablissement: 'Établissement',
  hotel: 'Hôtel',
  concierge: 'Concierge',
  admin: 'Administrateur',
}

/* Espace privé de chaque rôle — même table que le middleware du site. */
export const roleHome: Record<Role, string> = {
  etablissement: '/dashboard',
  hotel: '/hotel',
  concierge: '/concierge',
  admin: '/admin',
}

/* Les props de l'icône sont une union d'intersections ; on en extrait les
   variantes SF Symbols (iOS) et Material (Android), noms vérifiés par les
   types. */
type IconProps = ComponentProps<typeof NativeTabs.Trigger.Icon>
type SfIcon = NonNullable<Extract<IconProps, { sf?: unknown }>['sf']>
type MdIcon = NonNullable<Extract<IconProps, { md?: unknown }>['md']>

export type TabSpec = {
  label: string
  path: string
  sf: SfIcon
  md: MdIcon
}

/* Quatre onglets par rôle, puis le profil natif. Le reste des sections reste
   accessible par le menu du site, à l'intérieur de la WebView. */
export const roleTabs: Record<Role, [TabSpec, TabSpec, TabSpec, TabSpec]> = {
  etablissement: [
    {
      label: 'Accueil',
      path: '/dashboard',
      sf: { default: 'house', selected: 'house.fill' },
      md: 'home',
    },
    {
      label: 'Réservations',
      path: '/dashboard/reservations',
      sf: { default: 'calendar', selected: 'calendar' },
      md: 'event',
    },
    {
      label: 'Événements',
      path: '/dashboard/events',
      sf: { default: 'sparkles', selected: 'sparkles' },
      md: 'celebration',
    },
    {
      label: 'Messages',
      path: '/dashboard/messages',
      sf: { default: 'bubble.left', selected: 'bubble.left.fill' },
      md: 'chat',
    },
  ],
  hotel: [
    {
      label: 'Accueil',
      path: '/hotel',
      sf: { default: 'house', selected: 'house.fill' },
      md: 'home',
    },
    {
      label: 'Réservations',
      path: '/hotel/reservations',
      sf: { default: 'calendar', selected: 'calendar' },
      md: 'event',
    },
    {
      label: 'Chambres',
      path: '/hotel/chambres',
      sf: { default: 'qrcode', selected: 'qrcode' },
      md: 'qr_code',
    },
    {
      label: 'Adresses',
      path: '/hotel/adresses',
      sf: { default: 'mappin.and.ellipse', selected: 'mappin.and.ellipse' },
      md: 'place',
    },
  ],
  concierge: [
    {
      label: 'Accueil',
      path: '/concierge',
      sf: { default: 'house', selected: 'house.fill' },
      md: 'home',
    },
    {
      label: 'Calendrier',
      path: '/concierge/reservations',
      sf: { default: 'calendar', selected: 'calendar' },
      md: 'event',
    },
    {
      label: 'Lieux',
      path: '/concierge/venues',
      sf: { default: 'building.2', selected: 'building.2.fill' },
      md: 'apartment',
    },
    {
      label: 'Messages',
      path: '/concierge/messages',
      sf: { default: 'bubble.left', selected: 'bubble.left.fill' },
      md: 'chat',
    },
  ],
  admin: [
    {
      label: 'Admin',
      path: '/admin',
      sf: { default: 'shield', selected: 'shield.fill' },
      md: 'shield',
    },
    {
      label: 'Établissement',
      path: '/dashboard',
      sf: { default: 'fork.knife', selected: 'fork.knife' },
      md: 'restaurant',
    },
    {
      label: 'Hôtel',
      path: '/hotel',
      sf: { default: 'bed.double', selected: 'bed.double.fill' },
      md: 'hotel',
    },
    {
      label: 'Concierge',
      path: '/concierge',
      sf: { default: 'person.2', selected: 'person.2.fill' },
      md: 'groups',
    },
  ],
}

/* Adresses des quatre premiers onglets, dans l'ordre de roleTabs. */
export const TAB_HREFS = ['/', '/slot-2', '/slot-3', '/slot-4'] as const

/* Onglet auquel appartient une page du site — le préfixe le plus long
   gagne, sans quoi « /dashboard/reservations » tomberait sur l'accueil.
   Renvoie -1 quand aucun onglet ne couvre la page. */
export function tabIndexForPath(role: Role, path: string): number {
  let best = -1
  let bestLength = 0
  roleTabs[role].forEach((tab, i) => {
    const matches = path === tab.path || path.startsWith(`${tab.path}/`)
    if (matches && tab.path.length > bestLength) {
      best = i
      bestLength = tab.path.length
    }
  })
  return best
}

/* Fond des dashboards du site (coque sombre, photo océan voilée). La zone
   de la barre d'état reprend cette couleur pour se fondre dans la page. */
export const SHELL_BG = '#0d0f12'
