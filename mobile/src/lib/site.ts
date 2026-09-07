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

/* Jeu d'onglets. Un établissement d'activité ou de service (quad, hammam,
   chauffeur…) reste un « etablissement » pour le site, mais ses onglets
   montrent ses prestations à la place du reste. */
export type TabRole = Role | 'activite'

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

/* Compteur affiché en pastille sur l'onglet, quand il y en a un. */
export type BadgeKind = 'reservations' | 'messages'

export type TabSpec = {
  label: string
  path: string
  sf: SfIcon
  md: MdIcon
  badge?: BadgeKind
}

/* Quatre onglets par rôle, puis le profil natif. Le reste des sections reste
   accessible par le menu du site, à l'intérieur de la WebView. */
export const roleTabs: Record<TabRole, [TabSpec, TabSpec, TabSpec, TabSpec]> = {
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
      badge: 'reservations',
    },
    {
      label: 'Messages',
      path: '/dashboard/messages',
      sf: { default: 'bubble.left', selected: 'bubble.left.fill' },
      md: 'chat',
      badge: 'messages',
    },
    {
      label: 'Plus',
      path: '/dashboard/plus',
      sf: { default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' },
      md: 'more_horiz',
    },
  ],
  activite: [
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
      badge: 'reservations',
    },
    {
      label: 'Prestations',
      path: '/dashboard/prestations',
      sf: { default: 'tag', selected: 'tag.fill' },
      md: 'sell',
    },
    {
      label: 'Messages',
      path: '/dashboard/messages',
      sf: { default: 'bubble.left', selected: 'bubble.left.fill' },
      md: 'chat',
      badge: 'messages',
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
      badge: 'reservations',
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
      badge: 'messages',
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

/* L'établissement a ses écrans natifs ; les pages secondaires du site
   s'ouvrent depuis le menu, sous ces titres. */
export const isVenueTabRole = (r: TabRole) => r === 'etablissement' || r === 'activite'

export const WEB_PAGES: Record<string, string> = {
  '/dashboard/messages': 'Messages',
  '/dashboard/commissions': 'Commissions',
  '/dashboard/network': 'Réseau apporteurs',
  '/dashboard/analytics': 'Analyses',
  '/dashboard/guests': 'Clients',
  '/dashboard/prestations': 'Prestations',
  '/dashboard/portal': 'Portail de réservation',
  '/dashboard/events': 'Événements',
  '/dashboard/floor-plan': 'Plan de salle',
  '/dashboard/integrations': 'Caisse (POS)',
  '/dashboard/settings': 'Paramètres',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/help': 'Aide',
  '/dashboard/plus': 'Plus',
  '/dashboard/reservations': 'Réservations',
  '/dashboard': 'Accueil',
}

/* Adresses des quatre premiers onglets, dans l'ordre de roleTabs. */
export const TAB_HREFS = ['/', '/slot-2', '/slot-3', '/slot-4'] as const

/* Onglet auquel appartient une page du site — le préfixe le plus long
   gagne, sans quoi « /dashboard/reservations » tomberait sur l'accueil.
   Renvoie -1 quand aucun onglet ne couvre la page. */
export function tabIndexForPath(role: TabRole, path: string): number {
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
