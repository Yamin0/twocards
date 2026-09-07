import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

import { useAuth } from '@/lib/auth-context'
import { openSitePath } from '@/lib/deep-link'
import { registerPush } from '@/lib/push'
import { isVenueTabRole, TAB_HREFS, tabIndexForPath, WEB_PAGES } from '@/lib/site'

/* Fait le lien entre les notifications du système et la navigation.

   À la connexion, ce téléphone s'enregistre auprès du compte. Quand une
   notification est touchée, l'app bascule sur l'onglet qui couvre la page
   visée et la lui transmet. */
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
      if (isVenueTabRole(tabRole)) {
        /* Écrans natifs : réservations et accueil ont leur onglet, le reste
           s'ouvre dans l'app par-dessus. */
        if (url.startsWith('/dashboard/reservations')) router.navigate('/reservations')
        else if (url === '/dashboard') router.navigate('/')
        else router.push({ pathname: '/web', params: { path: url, title: WEB_PAGES[url] ?? '' } })
        return
      }
      openSitePath(url)
      const index = tabIndexForPath(tabRole, url)
      router.navigate(TAB_HREFS[index < 0 ? 0 : index])
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
