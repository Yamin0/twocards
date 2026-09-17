import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AnimatedSplashOverlay } from '@/components/animated-icon'
import { OfflineBanner } from '@/components/offline-banner'
import { PushBridge } from '@/components/push-bridge'
import { Icon } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { installGlobalErrorReporter, reportError } from '@/lib/report-error'
import { ToastProvider } from '@/lib/toast'
import { WebSessionProvider } from '@/lib/web-session'

SplashScreen.preventAutoHideAsync()
installGlobalErrorReporter()

/* Écrans empilés de l'établissement. Tous doivent être déclarés dans le
   groupe protégé : un écran oublié ici resterait affiché après la
   déconnexion au lieu de laisser place à la connexion. */
const VENUE_SCREENS = [
  'venue/analytics',
  'venue/commissions',
  'venue/guests',
  'venue/help',
  'venue/messages',
  'venue/network',
  'venue/notifications',
  'venue/prestations',
  'venue/reservation',
  'venue/settings',
  'venue/thread',
  'venue/tools',
] as const

/* Thème de navigation clair : le fond gris perle apparaît pendant les
   transitions, jamais un noir qui clignote. */
const AppTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Light.accent,
    background: Light.bg,
    card: Light.card,
    text: Light.ink,
    border: Light.line,
  },
}

function RootNavigator() {
  const { session, loading } = useAuth()

  if (loading) {
    return null
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Light.bg } }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="web" options={{ presentation: 'card' }} />
        <Stack.Screen name="venue/new-reservation" options={{ presentation: 'modal' }} />
        {VENUE_SCREENS.map((name) => (
          <Stack.Screen key={name} name={name} />
        ))}
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={AppTheme}>
        <AuthProvider>
          <WebSessionProvider>
            <ToastProvider>
              <AnimatedSplashOverlay />
              <PushBridge />
              <RootNavigator />
              <OfflineBanner />
            </ToastProvider>
          </WebSessionProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

/* Écran de secours si un écran plante : un mot, un bouton, pas de trace
   rouge. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  useEffect(() => {
    reportError('crash', error.message, 'error-boundary', error.stack)
  }, [error])
  return (
    <View style={styles.error}>
      <View style={styles.errorIcon}>
        <Icon name="alert-triangle" size={24} color={Light.warning} />
      </View>
      <Text style={styles.errorTitle}>Un imprévu est survenu</Text>
      <Text style={styles.errorBody}>
        L&apos;écran n&apos;a pas pu s&apos;afficher. Vos données sont intactes, réessayez.
      </Text>
      <Pressable onPress={retry} style={({ pressed }) => [styles.errorButton, pressed && styles.pressed]}>
        <Text style={styles.errorButtonText}>Réessayer</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
    backgroundColor: Light.bg,
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Light.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Light.ink,
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Light.muted,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 16,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Light.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
})
