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
export const roleTabs: Record<TabRole, { home: string; reservations: string | null }> = {
  etablissement: { home: '/dashboard', reservations: '/dashboard/reservations' },
  activite: { home: '/dashboard', reservations: '/dashboard/reservations' },
  hotel: { home: '/hotel', reservations: '/hotel/reservations' },
  concierge: { home: '/concierge', reservations: '/concierge/reservations' },
  admin: { home: '/admin', reservations: null },
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
  '/dashboard/plus': 'Plus',
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

/* Le menu (troisième onglet) : chaque section, avec son émoticône. */
export type HubItem = { emoji: string; label: string; hint: string; path: string }
export type HubGroup = { title: string; items: HubItem[] }

const VENUE_ACTIVITY: HubGroup = {
  title: 'Activité',
  items: [
    { emoji: '💬', label: 'Messages', hint: 'Hôtels et concierges', path: '/dashboard/messages' },
    { emoji: '💰', label: 'Commissions', hint: 'À régler ce mois, historique par hôtel', path: '/dashboard/commissions' },
    { emoji: '🏨', label: 'Réseau apporteurs', hint: 'Quels hôtels vous envoient des clients', path: '/dashboard/network' },
    { emoji: '📊', label: 'Analyses', hint: 'Volumes, panier moyen, tendances', path: '/dashboard/analytics' },
    { emoji: '👥', label: 'Clients', hint: 'Historique et fidélité', path: '/dashboard/guests' },
  ],
}

const VENUE_ACCOUNT: HubGroup = {
  title: 'Compte',
  items: [
    { emoji: '⚙️', label: 'Paramètres', hint: 'Profil, établissement, sécurité', path: '/dashboard/settings' },
    { emoji: '🔔', label: 'Notifications', hint: "Tout ce qui s'est passé, dans l'ordre", path: '/dashboard/notifications' },
    { emoji: '❓', label: 'Aide', hint: 'Guides et contact', path: '/dashboard/help' },
  ],
}

export const HUB: Record<TabRole, HubGroup[]> = {
  etablissement: [
    VENUE_ACTIVITY,
    {
      title: 'Outils',
      items: [
        { emoji: '🌐', label: 'Portail de réservation', hint: 'Votre page de réservation directe, sans commission', path: '/dashboard/portal' },
        { emoji: '🎉', label: 'Événements', hint: 'Soirées et programmation', path: '/dashboard/events' },
        { emoji: '🪑', label: 'Plan de salle', hint: 'Vos tables et leur occupation', path: '/dashboard/floor-plan' },
        { emoji: '💳', label: 'Caisse (POS)', hint: 'Rapprochement automatique des tickets', path: '/dashboard/integrations' },
      ],
    },
    VENUE_ACCOUNT,
  ],
  activite: [
    {
      title: 'Activité',
      items: [
        { emoji: '🏷️', label: 'Prestations', hint: 'Ce que vos clients réservent, visible sur le menu', path: '/dashboard/prestations' },
        ...VENUE_ACTIVITY.items,
      ],
    },
    {
      title: 'Outils',
      items: [
        { emoji: '🌐', label: 'Portail de réservation', hint: 'Votre page de réservation directe, sans commission', path: '/dashboard/portal' },
      ],
    },
    VENUE_ACCOUNT,
  ],
  hotel: [
    {
      title: 'Activité',
      items: [
        { emoji: '🛏️', label: 'Chambres & QR codes', hint: 'Un QR par chambre, le menu de chacun', path: '/hotel/chambres' },
        { emoji: '📍', label: 'Mes adresses', hint: 'Vos adresses maison sur le menu', path: '/hotel/adresses' },
        { emoji: '👥', label: 'Clients', hint: 'Qui a réservé quoi', path: '/hotel/clients' },
        { emoji: '💰', label: 'Commissions', hint: 'Ce que vous recevez, mois par mois', path: '/hotel/commissions' },
        { emoji: '📊', label: 'Analyses', hint: 'Scans, conversions, tendances', path: '/hotel/analyses' },
      ],
    },
    {
      title: 'Compte',
      items: [
        { emoji: '⚙️', label: 'Paramètres', hint: "Profil de l'hôtel, couleurs, menu client", path: '/hotel/settings' },
        { emoji: '❓', label: 'Aide', hint: 'Guides et contact', path: '/hotel/aide' },
      ],
    },
  ],
  concierge: [
    {
      title: 'Activité',
      items: [
        { emoji: '👥', label: 'CRM Clients', hint: 'Vos clients et leurs habitudes', path: '/concierge/clients' },
        { emoji: '💰', label: 'Commissions', hint: 'Ce que vous recevez', path: '/concierge/commissions' },
        { emoji: '📈', label: 'Statistiques', hint: 'Couverts, commissions, croissance', path: '/concierge/stats' },
        { emoji: '💬', label: 'Messages', hint: 'Échanges avec les établissements', path: '/concierge/messages' },
        { emoji: '🏛️', label: 'Établissements', hint: 'Le réseau et ses tables', path: '/concierge/venues' },
        { emoji: '🤖', label: 'Assistant IA', hint: 'Une recommandation en quelques mots', path: '/concierge/ai' },
      ],
    },
    {
      title: 'Compte',
      items: [
        { emoji: '⚙️', label: 'Paramètres', hint: 'Profil et sécurité', path: '/concierge/settings' },
      ],
    },
  ],
  admin: [
    {
      title: 'Réseau',
      items: [
        { emoji: '🛡️', label: 'Console admin', hint: 'Comptes, catalogue, commissions', path: '/admin' },
        { emoji: '🍽️', label: 'Espace établissement', hint: 'Tel que le voit un restaurant', path: '/dashboard' },
        { emoji: '🏨', label: 'Espace hôtel', hint: "Tel que le voit un hôtel", path: '/hotel' },
        { emoji: '🤝', label: 'Espace concierge', hint: 'Tel que le voit une conciergerie', path: '/concierge' },
      ],
    },
  ],
}

/* Fond de la coque sombre du site, pour les pages ouvertes par-dessus. */
export const SHELL_BG = '#0d0f12'
