import * as Notifications from 'expo-notifications'
import { useEffect, useState } from 'react'

import { useAuth } from '@/lib/auth-context'
import type { BadgeKind } from '@/lib/site'
import { supabase } from '@/lib/supabase'

export type BadgeCounts = Record<BadgeKind, number>

const EMPTY: BadgeCounts = { reservations: 0, messages: 0 }

/* Ce qui attend l'utilisateur : demandes de réservation non traitées et
   messages reçus non lus.

   Aucun filtre sur le compte dans les requêtes : la RLS borne déjà chacune
   à ce que le compte a le droit de voir — ses réservations pour un
   établissement, celles de ses QR pour un hôtel, ses fils de discussion
   pour tout le monde. Un recomptage complet à chaque événement plutôt
   qu'une arithmétique locale : ouvrir un fil marque plusieurs messages lus
   d'un coup, le calcul de différence serait fragile. */
export function useBadgeCounts(): BadgeCounts {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  /* Les compteurs portent le compte auquel ils appartiennent : à la
     déconnexion comme au changement de compte, les anciens chiffres ne
     doivent pas rester affichés le temps d'un recomptage. */
  const [state, setState] = useState<{ user: string | null; counts: BadgeCounts }>(
    { user: null, counts: EMPTY }
  )

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const refresh = async () => {
      const [pending, unread] = await Promise.all([
        supabase
          .from('qr_reservations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'en attente'),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .neq('sender_id', userId)
          .is('read_at', null),
      ])
      if (cancelled) return
      const next: BadgeCounts = {
        reservations: pending.count ?? 0,
        messages: unread.count ?? 0,
      }
      setState({ user: userId, counts: next })
      /* Pastille de l'icône sur l'écran d'accueil : le total de ce qui
         attend, pour que l'app se signale sans être ouverte. */
      Notifications.setBadgeCountAsync(next.reservations + next.messages).catch(
        () => {}
      )
    }

    refresh()

    const channel = supabase
      .channel('twocards-badges')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'qr_reservations' },
        refresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        refresh
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId])

  return state.user === userId ? state.counts : EMPTY
}
