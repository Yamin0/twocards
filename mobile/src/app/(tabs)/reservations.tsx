import { useLocalSearchParams } from 'expo-router'

import { SiteWebView } from '@/components/site-webview'
import { ReservationsList, type Filter } from '@/components/venue/reservations-list'
import { useAuth } from '@/lib/auth-context'
import { isVenueTabRole, roleTabs } from '@/lib/site'

const FILTERS: Filter[] = ['pending', 'today', 'upcoming', 'past', 'all']

/* Réservations : natif pour l'établissement, la page du site pour les
   autres. L'accueil et les notifications peuvent demander un filtre. */
export default function ReservationsTab() {
  const { tabRole } = useAuth()
  const { filter, t } = useLocalSearchParams<{ filter?: string; t?: string }>()

  if (!isVenueTabRole(tabRole)) {
    return <SiteWebView path={roleTabs[tabRole].reservations ?? roleTabs[tabRole].home} />
  }

  const requested = FILTERS.includes(filter as Filter) ? (filter as Filter) : null
  return <ReservationsList requested={requested} requestKey={typeof t === 'string' ? t : ''} />
}
