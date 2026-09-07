import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { roleLabels, SHELL_BG, SITE_URL } from '@/lib/site';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { session, role, home, fullName, venueName } = useAuth();
  const email = session?.user.email ?? '—';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Profil</Text>

        <View style={styles.card}>
          {venueName ? (
            <>
              <Text style={styles.label}>ÉTABLISSEMENT</Text>
              <Text style={styles.value}>{venueName}</Text>
              <View style={styles.divider} />
            </>
          ) : null}

          {fullName ? (
            <>
              <Text style={styles.label}>NOM</Text>
              <Text style={styles.value}>{fullName}</Text>
              <View style={styles.divider} />
            </>
          ) : null}

          <Text style={styles.label}>EMAIL</Text>
          <Text style={styles.value}>{email}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>ESPACE</Text>
          <Text style={styles.value}>{roleLabels[role]}</Text>
        </View>

        <Pressable
          onPress={() => Linking.openURL(`${SITE_URL}${home}`)}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Ouvrir dans le navigateur</Text>
        </Pressable>

        <Pressable
          onPress={() => supabase.auth.signOut()}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </Pressable>

        <Text style={styles.version}>twocards · v{version}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SHELL_BG,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: Spacing.two,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: Spacing.three,
  },
  secondary: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  signOut: {
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87171',
  },
  version: {
    marginTop: 'auto',
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
});
