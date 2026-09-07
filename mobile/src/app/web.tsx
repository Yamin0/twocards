import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { SiteWebView } from '@/components/site-webview'
import { Light } from '@/constants/theme'
import { WEB_PAGES } from '@/lib/site'

/* Une page du site ouverte depuis le menu : barre de titre native, retour,
   et le site en dessous. */
export default function WebScreen() {
  const { path, title } = useLocalSearchParams<{ path?: string; title?: string }>()
  const router = useRouter()
  const target = typeof path === 'string' && path.startsWith('/') ? path : '/dashboard'
  const heading = (typeof title === 'string' && title) || WEB_PAGES[target] || 'twocards'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {heading}
        </Text>
        <View style={styles.back} />
      </View>
      <SiteWebView path={target} inset={false} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Light.card,
  },
  bar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Light.line,
    backgroundColor: Light.card,
  },
  back: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 30,
    lineHeight: 32,
    color: Light.accent,
    marginTop: -4,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Light.ink,
  },
})
