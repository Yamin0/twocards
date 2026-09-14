import { unregisterPush } from '@/lib/push'
import { supabase } from '@/lib/supabase'

/* Déconnexion qui aboutit toujours.

   Le téléphone se retire d'abord des notifications du compte, mais sans
   jamais bloquer : réseau lent ou service push indisponible, on n'attend
   pas plus de deux secondes et demie. Puis la session est fermée ; si le
   serveur ne répond pas, elle est au moins effacée sur le téléphone, ce
   qui suffit à renvoyer vers l'écran de connexion. */
export async function signOut(): Promise<void> {
  await Promise.race([
    unregisterPush().catch(() => {}),
    new Promise<void>((resolve) => setTimeout(resolve, 2500)),
  ])
  try {
    const { error } = await supabase.auth.signOut()
    if (error) await supabase.auth.signOut({ scope: 'local' })
  } catch {
    await supabase.auth.signOut({ scope: 'local' })
  }
}
