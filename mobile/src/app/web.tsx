import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { SiteWebView } from '@/components/site-webview'
import { Icon, IconButton } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { SITE_URL, WEB_PAGES } from '@/lib/site'

/* Une page du site ouverte depuis le menu : barre de titre native, retour,
   fil de chargement, et le site en dessous. Le bouton de droite recharge la
   page ; un appui long l'ouvre dans Safari. */
export default function WebScreen() {
  const { path, title } = useLocalSearchParams<{ path?: string; title?: string }>()
  const router = useRouter()
  const target = typeof path === 'string' && path.startsWith('/') ? path : '/dashboard'
  const heading = (typeof title === 'string' && title) || WEB_PAGES[target] || 'twocards'
  const [progress, setProgress] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.bar}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.navigate('/hub'))} hitSlop={10} style={styles.back} accessibilityLabel="Retour">
          <Icon name="chevron-left" size={26} color={Light.ink} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {heading}
        </Text>
        <Pressable
          onLongPress={() => Linking.openURL(`${SITE_URL}${target}`)}
          style={styles.right}
          accessibilityLabel="Recharger. Appui long : ouvrir dans Safari">
          <IconButton icon="rotate-cw" tone="plain" size={36} label="Recharger" onPress={() => setReloadKey((k) => k + 1)} />
        </Pressable>
      </View>
      <View style={styles.track}>
        {progress > 0 && progress < 1 && <View style={[styles.fill, { width: `${Math.max(8, progress * 100)}%` }]} />}
      </View>
      <SiteWebView path={target} inset={false} onProgress={setProgress} reloadKey={reloadKey} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Light.card,
  },
  bar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    backgroundColor: Light.card,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Light.ink,
    letterSpacing: -0.2,
  },
  track: {
    height: 2,
    backgroundColor: Light.line,
  },
  fill: {
    height: 2,
    backgroundColor: Light.accent,
  },
})
