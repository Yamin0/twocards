import type { RealtimeChannel } from '@supabase/supabase-js'

import { reportError } from '@/lib/report-error'
import { supabase } from '@/lib/supabase'

/* Abonnements temps réel, sans risque de plantage.

   Le client Supabase refuse d'ajouter des écoutes à un canal déjà abonné
   portant le même nom, et lève une exception. Nommer un canal d'après
   l'heure ne suffit pas : deux écrans montés dans la même milliseconde (la
   barre d'onglets et l'onglet Menu, au premier lancement sur iPad)
   obtenaient le même nom, et l'app affichait l'écran d'erreur. Chaque canal
   reçoit donc un numéro unique, et un échec d'abonnement est consigné sans
   jamais interrompre l'écran : les données restent affichées, seules les
   mises à jour en direct manquent. */

let seq = 0

type Listener = { table: string; onChange: () => void }

export function subscribe(prefix: string, listeners: Listener[]): () => void {
  let channel: RealtimeChannel | null = null
  try {
    seq += 1
    let c = supabase.channel(`${prefix}-${seq}-${Date.now()}`)
    for (const l of listeners) {
      c = c.on('postgres_changes', { event: '*', schema: 'public', table: l.table }, () => l.onChange())
    }
    channel = c.subscribe()
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    reportError('unhandled', err.message, `realtime:${prefix}`, err.stack)
  }
  return () => {
    if (channel) void supabase.removeChannel(channel)
  }
}
