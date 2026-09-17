import { useNetworkState } from 'expo-network'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { reportError } from '@/lib/report-error'

/* Bandeau discret quand le téléphone n'a vraiment plus de réseau.

   L'état réseau du système n'est qu'un indice : au lancement, sur certains
   iPad ou réseaux IPv6, il peut annoncer « pas de connexion » alors que
   tout fonctionne. Le bandeau ne s'affiche donc qu'après une vraie
   vérification : trois secondes d'attente, puis un appel au serveur qui
   échoue. Tant qu'il est affiché, la vérification est refaite toutes les
   quinze secondes. */

const PROBE_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}/auth/v1/health`
const PROBE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

/* Vrai si le serveur répond, quel que soit le code HTTP. */
async function serverReachable(): Promise<boolean> {
  if (!PROBE_URL.startsWith('http')) return true
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    await fetch(PROBE_URL, { headers: { apikey: PROBE_KEY }, signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export function OfflineBanner() {
  const net = useNetworkState()
  const insets = useSafeAreaInsets()
  const [confirmedOffline, setConfirmedOffline] = useState(false)

  const systemSaysOffline = net.isConnected === false || net.isInternetReachable === false

  useEffect(() => {
    if (!systemSaysOffline) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const check = (delay: number) => {
      timer = setTimeout(async () => {
        const online = await serverReachable()
        if (cancelled) return
        setConfirmedOffline(!online)
        if (!online) reportError('message', 'Hors ligne', `offline-banner:${net.type ?? '?'}`)
        check(15000)
      }, delay)
    }
    check(3000)

    return () => {
      cancelled = true
      clearTimeout(timer)
      /* Le réseau est revenu : la prochaine alerte repartira d'une vraie vérification. */
      setConfirmedOffline(false)
    }
  }, [systemSaysOffline, net.type])

  if (!systemSaysOffline || !confirmedOffline) return null
  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 6 }]}>
      <Animated.View entering={FadeInUp.duration(200)} exiting={FadeOutUp.duration(160)} style={styles.pill}>
        <Icon name="wifi-off" size={13} color="#FFFFFF" />
        <Text style={styles.text}>Hors ligne</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 950,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Light.ink,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
