import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PushBridge } from '@/components/push-bridge';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { WebSessionProvider } from '@/lib/web-session';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="web" options={{ presentation: 'card' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
        <WebSessionProvider>
          <AnimatedSplashOverlay />
          <PushBridge />
          <RootNavigator />
        </WebSessionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
