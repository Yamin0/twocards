import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { pushStatus, registerPush, unregisterPush, type PushStatus } from '@/lib/push';
import { roleLabels, SHELL_BG, SITE_URL } from '@/lib/site';
import { supabase } from '@/lib/supabase';

const CONTACT_EMAIL = 'contact@twocardspro.com';

const statusLabels: Record<PushStatus, string> = {
  granted: 'Activées',
  denied: 'Refusées',
  undetermined: 'Pas encore autorisées',
  unsupported: 'Indisponibles sur cet appareil',
};

export default function ProfileScreen() {
  const { session, role, home, fullName, venueName } = useAuth();
  const email = session?.user.email ?? '—';
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const userId = session?.user.id ?? null;

  const [push, setPush] = useState<PushStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    pushStatus()
      .then((s) => {
        if (!cancelled) setPush(s);
      })
      .catch(() => {
        if (!cancelled) setPush('unsupported');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enablePush = useCallback(async () => {
    if (!userId) return;
    /* Une autorisation refusée ne peut plus être redemandée par l'app :
       seuls les réglages du téléphone la rouvrent. */
    if (push === 'denied') {
      Linking.openSettings();
      return;
    }
    setPush(await registerPush(userId));
  }, [userId, push]);

  const signOut = useCallback(async () => {
    await unregisterPush().catch(() => {});
    await supabase.auth.signOut();
  }, []);

  const requestDeletion = useCallback(() => {
    const subject = encodeURIComponent('Suppression de mon compte twocards');
    const body = encodeURIComponent(
      `Bonjour,\n\nJe demande la suppression de mon compte twocards et des données associées.\n\nCompte : ${email}\n\nMerci.`
    );
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`).catch(
      () =>
        Alert.alert(
          'Aucune application de messagerie',
          `Écrivez à ${CONTACT_EMAIL} depuis votre adresse ${email}.`
        )
    );
  }, [email]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
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

        <View style={styles.card}>
          <Text style={styles.label}>NOTIFICATIONS</Text>
          <Text style={styles.value}>
            {push ? statusLabels[push] : 'Vérification…'}
          </Text>
          <Text style={styles.hint}>
            Nouvelle réservation, avis client et nouveau message, même
            téléphone verrouillé.
          </Text>
          {push === 'granted' || push === 'unsupported' ? null : (
            <Pressable
              onPress={enablePush}
              style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}>
              <Text style={styles.inlineButtonText}>
                {push === 'denied'
                  ? 'Ouvrir les réglages'
                  : 'Activer les notifications'}
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => Linking.openURL(`${SITE_URL}${home}`)}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Ouvrir dans le navigateur</Text>
        </Pressable>

        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </Pressable>

        <Pressable
          onPress={requestDeletion}
          style={({ pressed }) => [styles.quiet, pressed && styles.pressed]}>
          <Text style={styles.quietText}>Demander la suppression de mon compte</Text>
        </Pressable>

        <Text style={styles.version}>twocards · v{version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SHELL_BG,
  },
  content: {
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
  hint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.45)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: Spacing.three,
  },
  inlineButton: {
    marginTop: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
  },
  inlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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
  quiet: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  quietText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'underline',
  },
  version: {
    marginTop: Spacing.three,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
});
