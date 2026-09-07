import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { supabase } from '@/lib/supabase'

/* Bannière et son même quand l'application est ouverte : un manager en
   salle doit voir passer une demande sans quitter son écran. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export type PushStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported'

/* Android exige un canal déclaré avant toute demande de jeton. */
async function ensureChannel() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Réservations et messages',
    importance: Notifications.AndroidImportance.MAX,
    lightColor: '#ffffff',
  })
}

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined
}

/* Un simulateur n'a pas de jeton : inutile de demander l'autorisation. */
export async function pushStatus(): Promise<PushStatus> {
  if (!Device.isDevice) return 'unsupported'
  const { status } = await Notifications.getPermissionsAsync()
  if (status === 'granted') return 'granted'
  return status === 'denied' ? 'denied' : 'undetermined'
}

async function deviceToken(): Promise<string | null> {
  const id = projectId()
  try {
    const { data } = await Notifications.getExpoPushTokenAsync(
      id ? { projectId: id } : undefined
    )
    return data
  } catch {
    /* Expo Go ne délivre plus de jeton distant : l'app reste utilisable,
       les notifications n'arriveront qu'en version compilée. */
    return null
  }
}

/* Demande l'autorisation si elle n'a pas déjà été donnée, puis rattache ce
   téléphone au compte connecté. Sans réseau, l'enregistrement est simplement
   retenté au prochain lancement. */
export async function registerPush(userId: string): Promise<PushStatus> {
  if (!Device.isDevice) return 'unsupported'
  await ensureChannel()

  let { status } = await Notifications.getPermissionsAsync()
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status
  }
  if (status !== 'granted') {
    return status === 'denied' ? 'denied' : 'undetermined'
  }

  const token = await deviceToken()
  if (!token) return 'unsupported'

  await supabase.from('push_tokens').upsert(
    {
      token,
      user_id: userId,
      platform: Platform.OS === 'android' ? 'android' : 'ios',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' }
  )
  return 'granted'
}

/* À la déconnexion : ce téléphone ne doit plus recevoir les notifications
   du compte qui le quitte. */
export async function unregisterPush(): Promise<void> {
  if (!Device.isDevice) return
  const token = await deviceToken()
  if (!token) return
  await supabase.from('push_tokens').delete().eq('token', token)
}
