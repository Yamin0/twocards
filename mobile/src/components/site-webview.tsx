import { StatusBar } from 'expo-status-bar'
import { useEffect, useId, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView, type WebViewNavigation } from 'react-native-webview'

import { Light } from '@/constants/theme'
import { SITE_URL, sitePath } from '@/lib/site'
import { useWebSession } from '@/lib/web-session'

/* Une page du site, dans la coque native. Le site reconnaît l'app à son
   agent utilisateur et s'affiche en clair, sans sa propre navigation :
   c'est l'app qui la porte. */
export function SiteWebView({
  path,
  inset = true,
}: {
  path: string
  /* Faux quand l'écran parent gère déjà la zone de la barre d'état. */
  inset?: boolean
}) {
  const ws = useWebSession()
  const { register, unregister } = ws
  const key = useId()
  const [uri, setUri] = useState<string | null>(null)

  /* Candidature au rôle de propriétaire du jeton : la première WebView
     affichée l'obtient et passe par la passerelle, les autres attendent. */
  useEffect(() => {
    register(key)
    return () => unregister(key)
  }, [register, unregister, key])

  const isOwner = ws.owner === key

  /* Page de départ, figée dès qu'elle est connue : la propriétaire passe
     par la passerelle, les autres attendent que la session web soit posée.
     Changer cette adresse plus tard ferait recharger la WebView sous les
     doigts de l'utilisateur. */
  const first = isOwner
    ? ws.bridgeUrl(path)
    : ws.ready
      ? `${SITE_URL}${path}`
      : null
  if (uri === null && first !== null) {
    setUri(first)
  }

  const onNavigationStateChange = (nav: WebViewNavigation) => {
    const pathname = sitePath(nav.url)
    if (!pathname) return

    if (pathname === '/login') {
      if (isOwner && !ws.ready) {
        /* Le jeton n'a pas été accepté : on en demande un autre. */
        ws.retry()
      } else {
        /* Déconnexion depuis le site : l'app suit. */
        ws.loggedOut()
      }
      return
    }

    if (isOwner && !ws.ready && !pathname.startsWith('/auth/')) {
      ws.markReady()
    }
  }

  if (ws.error) {
    return (
      <Shell inset={inset}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{ws.error}</Text>
          <Pressable onPress={ws.retry} style={styles.retry}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      </Shell>
    )
  }

  if (!uri) {
    return (
      <Shell inset={inset}>
        <View style={styles.center}>
          <ActivityIndicator color={Light.accent} />
        </View>
      </Shell>
    )
  }

  return (
    <Shell inset={inset}>
      <WebView
        source={{ uri }}
        style={styles.web}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={(req) => {
          /* Le site reste dans l'app ; tout lien externe (WhatsApp, Google
             Business, PDF…) s'ouvre dans le navigateur ou l'app dédiée. */
          if (sitePath(req.url) !== null || req.url.startsWith('about:')) {
            return true
          }
          Linking.openURL(req.url).catch(() => {})
          return false
        }}
        sharedCookiesEnabled
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        contentInsetAdjustmentBehavior="never"
        applicationNameForUserAgent="TwocardsApp/1.0"
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.center, StyleSheet.absoluteFill]}>
            <ActivityIndicator color={Light.accent} />
          </View>
        )}
        renderError={() => (
          <View style={[styles.center, StyleSheet.absoluteFill]}>
            <Text style={styles.errorText}>
              {"La page n'a pas pu être chargée. Vérifiez votre connexion."}
            </Text>
          </View>
        )}
      />
    </Shell>
  )
}

function Shell({ children, inset }: { children: React.ReactNode; inset: boolean }) {
  return (
    <SafeAreaView style={styles.safe} edges={inset ? ['top'] : []}>
      {inset && <StatusBar style="dark" />}
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Light.bg,
  },
  web: {
    flex: 1,
    backgroundColor: Light.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: Light.bg,
  },
  errorText: {
    color: Light.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retry: {
    borderWidth: 1,
    borderColor: Light.line,
    backgroundColor: Light.card,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: Light.ink,
    fontSize: 14,
    fontWeight: '600',
  },
})
