import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

import { useAuth } from '@/lib/auth-context'
import { registerPush } from '@/lib/push'
import { isVenueTabRole, roleTabs, WEB_PAGES } from '@/lib/site'

/* Pages du site qui ont leur écran natif chez l'établissement. */
const NATIVE: Record<string, string> = {
  '/dashboard/messages': '/venue/messages',
  '/dashboard/commissions': '/venue/commissions',
  '/dashboard/notifications': '/venue/notifications',
  '/dashboard/network': '/venue/network',
  '/dashboard/analytics': '/venue/analytics',
  '/dashboard/guests': '/venue/guests',
  '/dashboard/prestations': '/venue/prestations',
  '/dashboard/settings': '/venue/settings',
}

/* Fait le lien entre les notifications du système et la navigation.

   À la connexion, ce téléphone s'enregistre auprès du compte. Quand une
   notification est touchée, l'app ouvre l'onglet Réservations ou Accueil
   si la page visée est la leur, l'écran natif correspondant, ou à défaut
   la page du site par-dessus. */
export function PushBridge() {
  const { session, tabRole } = useAuth()
  const router = useRouter()
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (!userId) return
    registerPush(userId).catch(() => {
      /* Hors ligne ou autorisation refusée : nouvelle tentative au
         prochain lancement, l'app reste utilisable. */
    })
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const handle = (response: Notifications.NotificationResponse) => {
      const url = response.notification.request.content.data?.url
      if (typeof url !== 'string' || !url.startsWith('/')) return
      const tabs = roleTabs[tabRole]
      if (tabs.reservations && url.startsWith(tabs.reservations)) {
        router.navigate({ pathname: '/reservations', params: { filter: 'pending', t: String(Date.now()) } })
      } else if (url === tabs.home) {
        router.navigate('/')
      } else if (isVenueTabRole(tabRole) && NATIVE[url]) {
        router.push(NATIVE[url] as never)
      } else {
        router.push({ pathname: '/web', params: { path: url, title: WEB_PAGES[url] ?? '' } })
      }
    }

    /* Notification qui a réveillé l'app : elle attend d'être relevée, et
       ne doit pas être rejouée au prochain lancement. */
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return
        handle(response)
        return Notifications.clearLastNotificationResponseAsync()
      })
      .catch(() => {})

    const sub = Notifications.addNotificationResponseReceivedListener(handle)
    return () => sub.remove()
  }, [userId, tabRole, router])

  return null
}
