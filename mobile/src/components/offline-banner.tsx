import { useNetworkState } from 'expo-network'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@/components/venue/ui'
import { Light } from '@/constants/theme'

/* Bandeau discret quand le téléphone n'a plus de réseau : ce qu'on voit
   reste juste, ce qu'on touche attendra le retour de la connexion. */
export function OfflineBanner() {
  const net = useNetworkState()
  const insets = useSafeAreaInsets()
  const offline = net.isConnected === false || net.isInternetReachable === false
  if (!offline) return null
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
