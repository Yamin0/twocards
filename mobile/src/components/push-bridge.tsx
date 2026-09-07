import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

import { useAuth } from '@/lib/auth-context'
import { openSitePath } from '@/lib/deep-link'
import { registerPush } from '@/lib/push'
import { TAB_HREFS, tabIndexForPath } from '@/lib/site'

/* Fait le lien entre les notifications du système et la navigation.

   À la connexion, ce téléphone s'enregistre auprès du compte. Quand une
   notification est touchée, l'app bascule sur l'onglet qui couvre la page
   visée et la lui transmet. */
export function PushBridge() {
  const { session, role } = useAuth()
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
      openSitePath(url)
      const index = tabIndexForPath(role, url)
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
  }, [userId, role, router])

  return null
}
