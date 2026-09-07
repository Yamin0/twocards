import type Feather from '@expo/vector-icons/Feather'
import type { ComponentProps } from 'react'

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
export const WEB_PAGES: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/dashboard/reservations': 'Réservations',
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
  '/hotel': 'Accueil',
  '/hotel/reservations': 'Réservations',
  '/hotel/chambres': 'Chambres & QR codes',
  '/hotel/adresses': 'Mes adresses',
  '/hotel/clients': 'Clients',
  '/hotel/commissions': 'Commissions',
  '/hotel/analyses': 'Analyses',
  '/hotel/settings': 'Paramètres',
  '/hotel/aide': 'Aide',
  '/concierge': 'Accueil',
  '/concierge/reservations': 'Calendrier',
  '/concierge/clients': 'CRM Clients',
  '/concierge/commissions': 'Commissions',
  '/concierge/stats': 'Statistiques',
  '/concierge/messages': 'Messages',
  '/concierge/venues': 'Établissements',
  '/concierge/ai': 'Assistant IA',
  '/concierge/settings': 'Paramètres',
  '/admin': 'Administration',
}

/* Le menu (troisième onglet) : chaque section avec son icône en traits.
   `route` ouvre un écran natif, `path` une page du site. */
export type IconName = ComponentProps<typeof Feather>['name']
export type HubItem = { icon: IconName; label: string; hint: string; route?: string; path?: string }
export type HubGroup = { title: string; items: HubItem[] }

const VENUE_ACTIVITY: HubItem[] = [
  { icon: 'message-circle', label: 'Messages', hint: 'Hôtels et concierges', route: '/venue/messages' },
  { icon: 'dollar-sign', label: 'Commissions', hint: 'À régler ce mois, historique par hôtel', route: '/venue/commissions' },
  { icon: 'share-2', label: 'Réseau apporteurs', hint: 'Quels hôtels vous envoient des clients', route: '/venue/network' },
  { icon: 'bar-chart-2', label: 'Analyses', hint: 'Volumes, panier moyen, tendances', route: '/venue/analytics' },
  { icon: 'users', label: 'Clients', hint: 'Historique et fidélité', route: '/venue/guests' },
]

const VENUE_TOOLS_GROUP: HubGroup = {
  title: 'Outils',
  items: [
    { icon: 'grid', label: 'Plus', hint: 'Portail, événements, plan de salle, caisse', route: '/venue/tools' },
  ],
}

const VENUE_ACCOUNT: HubGroup = {
  title: 'Compte',
  items: [
    { icon: 'settings', label: 'Paramètres', hint: 'Profil, établissement, sécurité', route: '/venue/settings' },
    { icon: 'bell', label: 'Notifications', hint: "Tout ce qui s'est passé, dans l'ordre", route: '/venue/notifications' },
    { icon: 'help-circle', label: 'Aide', hint: 'Guides et contact', route: '/venue/help' },
  ],
}

export const HUB: Record<TabRole, HubGroup[]> = {
  etablissement: [{ title: 'Activité', items: VENUE_ACTIVITY }, VENUE_TOOLS_GROUP, VENUE_ACCOUNT],
  activite: [
    {
      title: 'Activité',
      items: [
        { icon: 'tag', label: 'Prestations', hint: 'Ce que vos clients réservent, visible sur le menu', route: '/venue/prestations' },
        ...VENUE_ACTIVITY,
      ],
    },
    { title: 'Outils', items: [{ icon: 'grid', label: 'Plus', hint: 'Portail de réservation', route: '/venue/tools' }] },
    VENUE_ACCOUNT,
  ],
  hotel: [
    {
      title: 'Activité',
      items: [
        { icon: 'key', label: 'Chambres & QR codes', hint: 'Un QR par chambre, le menu de chacun', path: '/hotel/chambres' },
        { icon: 'map-pin', label: 'Mes adresses', hint: 'Vos adresses maison sur le menu', path: '/hotel/adresses' },
        { icon: 'users', label: 'Clients', hint: 'Qui a réservé quoi', path: '/hotel/clients' },
        { icon: 'dollar-sign', label: 'Commissions', hint: 'Ce que vous recevez, mois par mois', path: '/hotel/commissions' },
        { icon: 'bar-chart-2', label: 'Analyses', hint: 'Scans, conversions, tendances', path: '/hotel/analyses' },
      ],
    },
    {
      title: 'Compte',
      items: [
        { icon: 'settings', label: 'Paramètres', hint: "Profil de l'hôtel, couleurs, menu client", path: '/hotel/settings' },
        { icon: 'help-circle', label: 'Aide', hint: 'Guides et contact', path: '/hotel/aide' },
      ],
    },
  ],
  concierge: [
    {
      title: 'Activité',
      items: [
        { icon: 'users', label: 'CRM Clients', hint: 'Vos clients et leurs habitudes', path: '/concierge/clients' },
        { icon: 'dollar-sign', label: 'Commissions', hint: 'Ce que vous recevez', path: '/concierge/commissions' },
        { icon: 'trending-up', label: 'Statistiques', hint: 'Couverts, commissions, croissance', path: '/concierge/stats' },
        { icon: 'message-circle', label: 'Messages', hint: 'Échanges avec les établissements', path: '/concierge/messages' },
        { icon: 'home', label: 'Établissements', hint: 'Le réseau et ses tables', path: '/concierge/venues' },
        { icon: 'zap', label: 'Assistant IA', hint: 'Une recommandation en quelques mots', path: '/concierge/ai' },
      ],
    },
    {
      title: 'Compte',
      items: [{ icon: 'settings', label: 'Paramètres', hint: 'Profil et sécurité', path: '/concierge/settings' }],
    },
  ],
  admin: [
    {
      title: 'Réseau',
      items: [
        { icon: 'shield', label: 'Console admin', hint: 'Comptes, catalogue, commissions', path: '/admin' },
        { icon: 'coffee', label: 'Espace établissement', hint: 'Tel que le voit un restaurant', path: '/dashboard' },
        { icon: 'briefcase', label: 'Espace hôtel', hint: 'Tel que le voit un hôtel', path: '/hotel' },
        { icon: 'user-check', label: 'Espace concierge', hint: 'Tel que le voit une conciergerie', path: '/concierge' },
      ],
    },
  ],
}

/* Les outils rares, derrière « Plus » : encore des pages du site. */
export const VENUE_TOOLS: Record<'etablissement' | 'activite', HubItem[]> = {
  etablissement: [
    { icon: 'globe', label: 'Portail de réservation', hint: 'Votre page de réservation directe, sans commission', path: '/dashboard/portal' },
    { icon: 'calendar', label: 'Événements', hint: 'Soirées et programmation', path: '/dashboard/events' },
    { icon: 'layout', label: 'Plan de salle', hint: 'Vos tables et leur occupation', path: '/dashboard/floor-plan' },
    { icon: 'credit-card', label: 'Caisse (POS)', hint: 'Rapprochement automatique des tickets', path: '/dashboard/integrations' },
  ],
  activite: [
    { icon: 'globe', label: 'Portail de réservation', hint: 'Votre page de réservation directe, sans commission', path: '/dashboard/portal' },
  ],
}

/* Fond de la coque sombre du site, pour les pages ouvertes par-dessus. */
export const SHELL_BG = '#0d0f12'
