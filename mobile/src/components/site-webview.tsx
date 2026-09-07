import { StatusBar } from 'expo-status-bar'
import { useEffect, useId, useRef, useState } from 'react'
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

import { useAuth } from '@/lib/auth-context'
import { clearSitePath, usePendingSitePath } from '@/lib/deep-link'
import { SHELL_BG, SITE_URL, sitePath, tabIndexForPath } from '@/lib/site'
import { useWebSession } from '@/lib/web-session'

/* Une page du site, dans la coque native. `path` est le chemin de départ ;
   la navigation interne du site (menu, liens) reste libre à l'intérieur. */
export function SiteWebView({
  path,
  tabIndex,
}: {
  path: string
  tabIndex: number
}) {
  const ws = useWebSession()
  const { register, unregister } = ws
  const { role } = useAuth()
  const key = useId()

  const [uri, setUri] = useState<string | null>(null)
  const webRef = useRef<WebView>(null)
  /* Page réellement affichée, pour ne pas recharger une page déjà ouverte. */
  const shownRef = useRef<string | null>(null)

  /* Candidature au rôle de propriétaire du jeton : la première WebView
     affichée l'obtient et passe par la passerelle, les autres attendent. */
  useEffect(() => {
    register(key)
    return () => unregister(key)
  }, [register, unregister, key])

  const isOwner = ws.owner === key

  /* Page de départ de l'onglet, figée dès qu'elle est connue : la
     propriétaire passe par la passerelle, les autres attendent que la
     session web soit posée. Changer cette adresse plus tard ferait
     recharger la WebView sous les doigts de l'utilisateur. */
  const first = isOwner
    ? ws.bridgeUrl(path)
    : ws.ready
      ? `${SITE_URL}${path}`
      : null
  if (uri === null && first !== null) {
    setUri(first)
  }

  /* Notification touchée : la cible revient à l'onglet qui la couvre. */
  const pending = usePendingSitePath()
  const mine =
    pending !== null && Math.max(0, tabIndexForPath(role, pending)) === tabIndex

  /* On attend que la session web soit établie : déplacer la WebView
     pendant que la passerelle pose les cookies annulerait celle-ci. */
  useEffect(() => {
    if (!mine || pending === null || !ws.ready) return
    if (shownRef.current !== pending) {
      webRef.current?.injectJavaScript(
        `window.location.href = ${JSON.stringify(SITE_URL + pending)}; true;`
      )
    }
    clearSitePath()
  }, [mine, pending, ws.ready])

  const onNavigationStateChange = (nav: WebViewNavigation) => {
    const pathname = sitePath(nav.url)
    if (!pathname) return
    shownRef.current = pathname

    if (pathname === '/login') {
      if (isOwner && !ws.ready) {
        /* Le jeton n'a pas été accepté : on en demande un autre. */
        ws.retry()
      } else {
        /* Déconnexion depuis le menu du site : l'app suit. */
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
      <Shell>
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
      <Shell>
        <View style={styles.center}>
          <ActivityIndicator color="#ffffff" />
        </View>
      </Shell>
    )
  }

  return (
    <Shell>
      <WebView
        ref={webRef}
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
            <ActivityIndicator color="#ffffff" />
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SHELL_BG,
  },
  web: {
    flex: 1,
    backgroundColor: SHELL_BG,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: SHELL_BG,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retry: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
})
