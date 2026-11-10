import type Feather from '@expo/vector-icons/Feather'
import type { ComponentProps } from 'react'

import type { Translate } from '@/lib/i18n'

/* Le site twocards, dont l'app affiche encore certaines pages. Adresse
   canonique : twocardspro.com redirige vers www, autant partir directement
   dessus pour éviter une redirection à chaque chargement. */
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

/* Jeu d'écrans. Un établissement d'activité ou de service (quad, hammam,
   chauffeur…) reste un « etablissement » pour le site, mais son menu montre
   ses prestations à la place du plan de salle. */
export type TabRole = Role | 'activite'

export const getRoleLabels = (t: Translate): Record<Role, string> => ({
  etablissement: t('Établissement', 'Venue'),
  hotel: t('Hôtel', 'Hotel'),
  concierge: 'Concierge',
  admin: t('Administrateur', 'Administrator'),
})

/* Espace privé de chaque rôle — même table que le middleware du site. */
export const roleHome: Record<Role, string> = {
  etablissement: '/dashboard',
  hotel: '/hotel',
  concierge: '/concierge',
  admin: '/admin',
}

/* Compteurs affichés en pastille sur les onglets. */
export type BadgeKind = 'reservations' | 'messages'

/* L'établissement a ses écrans natifs ; les autres rôles affichent le
   site, en clair, dans les mêmes onglets. */
export const isVenueTabRole = (r: TabRole) => r === 'etablissement' || r === 'activite'

/* Trois onglets pour tout le monde : Réservations, Accueil, Menu. Chaque
   rôle indique la page du site derrière les deux premiers ; l'admin n'a
   pas de réservations. */
export const roleTabs: Record<TabRole, { home: string; reservations: string | null; settings: string }> = {
  etablissement: { home: '/dashboard', reservations: '/dashboard/reservations', settings: '/dashboard/settings' },
  activite: { home: '/dashboard', reservations: '/dashboard/reservations', settings: '/dashboard/settings' },
  hotel: { home: '/hotel', reservations: '/hotel/reservations', settings: '/hotel/settings' },
  concierge: { home: '/concierge', reservations: '/concierge/reservations', settings: '/concierge/settings' },
  admin: { home: '/admin', reservations: null, settings: '/admin' },
}

/* Titres des pages du site ouvertes dans l'app. */
export const getWebPages = (t: Translate): Record<string, string> => ({
  '/dashboard': t('Accueil', 'Home'),
  '/dashboard/reservations': t('Réservations', 'Reservations'),
  '/dashboard/messages': 'Messages',
  '/dashboard/commissions': 'Commissions',
  '/dashboard/network': t('Réseau apporteurs', 'Referral network'),
  '/dashboard/analytics': t('Analyses', 'Analytics'),
  '/dashboard/guests': t('Clients', 'Guests'),
  '/dashboard/prestations': t('Prestations', 'Services'),
  '/dashboard/portal': t('Portail de réservation', 'Booking portal'),
  '/dashboard/events': t('Événements', 'Events'),
  '/dashboard/floor-plan': t('Plan de salle', 'Floor plan'),
  '/dashboard/integrations': t('Caisse (POS)', 'Till (POS)'),
  '/dashboard/settings': t('Paramètres', 'Settings'),
  '/dashboard/notifications': 'Notifications',
  '/dashboard/help': t('Aide', 'Help'),
  '/hotel': t('Accueil', 'Home'),
  '/hotel/reservations': t('Réservations', 'Reservations'),
  '/hotel/chambres': t('Chambres & QR codes', 'Rooms & QR codes'),
  '/hotel/adresses': t('Mes adresses', 'My places'),
  '/hotel/clients': t('Clients', 'Guests'),
  '/hotel/commissions': 'Commissions',
  '/hotel/analyses': t('Analyses', 'Analytics'),
  '/hotel/settings': t('Paramètres', 'Settings'),
  '/hotel/aide': t('Aide', 'Help'),
  '/concierge': t('Accueil', 'Home'),
  '/concierge/reservations': t('Calendrier', 'Calendar'),
  '/concierge/clients': t('CRM Clients', 'Guest CRM'),
  '/concierge/commissions': 'Commissions',
  '/concierge/stats': t('Statistiques', 'Stats'),
  '/concierge/messages': 'Messages',
  '/concierge/venues': t('Établissements', 'Venues'),
  '/concierge/ai': t('Assistant IA', 'AI assistant'),
  '/concierge/settings': t('Paramètres', 'Settings'),
  '/admin': t('Administration', 'Admin'),
})

/* Le menu (troisième onglet) : chaque section avec son icône en traits.
   `route` ouvre un écran natif, `path` une page du site. */
export type IconName = ComponentProps<typeof Feather>['name']
export type HubItem = { icon: IconName; label: string; hint: string; route?: string; path?: string }
export type HubGroup = { title: string; items: HubItem[] }

const venueActivity = (t: Translate): HubItem[] => [
  { icon: 'message-circle', label: 'Messages', hint: t('Hôtels et concierges', 'Hotels and concierges'), route: '/venue/messages' },
  { icon: 'dollar-sign', label: 'Commissions', hint: t('À régler ce mois, historique par hôtel', 'Due this month, history by hotel'), route: '/venue/commissions' },
  { icon: 'share-2', label: t('Réseau apporteurs', 'Referral network'), hint: t('Quels hôtels vous envoient des clients', 'Which hotels send you guests'), route: '/venue/network' },
  { icon: 'bar-chart-2', label: t('Analyses', 'Analytics'), hint: t('Volumes, panier moyen, tendances', 'Volumes, average spend, trends'), route: '/venue/analytics' },
  { icon: 'users', label: t('Clients', 'Guests'), hint: t('Historique et fidélité', 'History and loyalty'), route: '/venue/guests' },
]

const venueToolsGroup = (t: Translate): HubGroup => ({
  title: t('Outils', 'Tools'),
  items: [
    { icon: 'grid', label: t('Plus', 'More'), hint: t('Portail, événements, plan de salle, caisse', 'Portal, events, floor plan, till'), route: '/venue/tools' },
  ],
})

const venueAccount = (t: Translate): HubGroup => ({
  title: t('Compte', 'Account'),
  items: [
    { icon: 'settings', label: t('Paramètres', 'Settings'), hint: t('Profil, établissement, sécurité', 'Profile, venue, security'), route: '/venue/settings' },
    { icon: 'bell', label: 'Notifications', hint: t("Tout ce qui s'est passé, dans l'ordre", 'Everything that happened, in order'), route: '/venue/notifications' },
    { icon: 'help-circle', label: t('Aide', 'Help'), hint: t('Guides et contact', 'Guides and contact'), route: '/venue/help' },
  ],
})

export const getHub = (t: Translate): Record<TabRole, HubGroup[]> => ({
  etablissement: [{ title: t('Activité', 'Activity'), items: venueActivity(t) }, venueToolsGroup(t), venueAccount(t)],
  activite: [
    {
      title: t('Activité', 'Activity'),
      items: [
        { icon: 'tag', label: t('Prestations', 'Services'), hint: t('Ce que vos clients réservent, visible sur le menu', 'What your guests book, shown on the menu'), route: '/venue/prestations' },
        ...venueActivity(t),
      ],
    },
    { title: t('Outils', 'Tools'), items: [{ icon: 'grid', label: t('Plus', 'More'), hint: t('Portail de réservation', 'Booking portal'), route: '/venue/tools' }] },
    venueAccount(t),
  ],
  hotel: [
    {
      title: t('Activité', 'Activity'),
      items: [
        { icon: 'key', label: t('Chambres & QR codes', 'Rooms & QR codes'), hint: t('Un QR par chambre, le menu de chacun', 'One QR per room, each with its menu'), path: '/hotel/chambres' },
        { icon: 'map-pin', label: t('Mes adresses', 'My places'), hint: t('Vos adresses maison sur le menu', 'Your own recommendations on the menu'), path: '/hotel/adresses' },
        { icon: 'users', label: t('Clients', 'Guests'), hint: t('Qui a réservé quoi', 'Who booked what'), path: '/hotel/clients' },
        { icon: 'dollar-sign', label: 'Commissions', hint: t('Ce que vous recevez, mois par mois', 'What you earn, month by month'), path: '/hotel/commissions' },
        { icon: 'bar-chart-2', label: t('Analyses', 'Analytics'), hint: t('Scans, conversions, tendances', 'Scans, conversions, trends'), path: '/hotel/analyses' },
      ],
    },
    {
      title: t('Compte', 'Account'),
      items: [
        { icon: 'settings', label: t('Paramètres', 'Settings'), hint: t("Profil de l'hôtel, couleurs, menu client", 'Hotel profile, colours, guest menu'), path: '/hotel/settings' },
        { icon: 'help-circle', label: t('Aide', 'Help'), hint: t('Guides et contact', 'Guides and contact'), path: '/hotel/aide' },
      ],
    },
  ],
  concierge: [
    {
      title: t('Activité', 'Activity'),
      items: [
        { icon: 'users', label: t('CRM Clients', 'Guest CRM'), hint: t('Vos clients et leurs habitudes', 'Your guests and their habits'), path: '/concierge/clients' },
        { icon: 'dollar-sign', label: 'Commissions', hint: t('Ce que vous recevez', 'What you earn'), path: '/concierge/commissions' },
        { icon: 'trending-up', label: t('Statistiques', 'Stats'), hint: t('Couverts, commissions, croissance', 'Covers, commissions, growth'), path: '/concierge/stats' },
        { icon: 'message-circle', label: 'Messages', hint: t('Échanges avec les établissements', 'Conversations with venues'), path: '/concierge/messages' },
        { icon: 'home', label: t('Établissements', 'Venues'), hint: t('Le réseau et ses tables', 'The network and its tables'), path: '/concierge/venues' },
        { icon: 'zap', label: t('Assistant IA', 'AI assistant'), hint: t('Une recommandation en quelques mots', 'A recommendation in a few words'), path: '/concierge/ai' },
      ],
    },
    {
      title: t('Compte', 'Account'),
      items: [{ icon: 'settings', label: t('Paramètres', 'Settings'), hint: t('Profil et sécurité', 'Profile and security'), path: '/concierge/settings' }],
    },
  ],
  admin: [
    {
      title: t('Réseau', 'Network'),
      items: [
        { icon: 'shield', label: t('Console admin', 'Admin console'), hint: t('Comptes, catalogue, commissions', 'Accounts, catalogue, commissions'), path: '/admin' },
        { icon: 'coffee', label: t('Espace établissement', 'Venue workspace'), hint: t('Tel que le voit un restaurant', 'As a restaurant sees it'), path: '/dashboard' },
        { icon: 'briefcase', label: t('Espace hôtel', 'Hotel workspace'), hint: t('Tel que le voit un hôtel', 'As a hotel sees it'), path: '/hotel' },
        { icon: 'user-check', label: t('Espace concierge', 'Concierge workspace'), hint: t('Tel que le voit une conciergerie', 'As a concierge desk sees it'), path: '/concierge' },
      ],
    },
  ],
})

/* Les outils rares, derrière « Plus » : encore des pages du site. */
export const getVenueTools = (t: Translate): Record<'etablissement' | 'activite', HubItem[]> => ({
  etablissement: [
    { icon: 'globe', label: t('Portail de réservation', 'Booking portal'), hint: t('Votre page de réservation directe, sans commission', 'Your direct booking page, commission-free'), path: '/dashboard/portal' },
    { icon: 'calendar', label: t('Événements', 'Events'), hint: t('Soirées et programmation', 'Nights and line-up'), path: '/dashboard/events' },
    { icon: 'layout', label: t('Plan de salle', 'Floor plan'), hint: t('Vos tables et leur occupation', 'Your tables and who is seated'), path: '/dashboard/floor-plan' },
    { icon: 'credit-card', label: t('Caisse (POS)', 'Till (POS)'), hint: t('Rapprochement automatique des tickets', 'Automatic receipt matching'), path: '/dashboard/integrations' },
  ],
  activite: [
    { icon: 'globe', label: t('Portail de réservation', 'Booking portal'), hint: t('Votre page de réservation directe, sans commission', 'Your direct booking page, commission-free'), path: '/dashboard/portal' },
  ],
})

/* Fond de la coque sombre du site, pour les pages ouvertes par-dessus. */
export const SHELL_BG = '#0d0f12'
