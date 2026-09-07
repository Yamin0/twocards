import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Avatar, Card, Screen } from '@/components/venue/ui'
import { BottomTabInset, Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { pushStatus, registerPush, unregisterPush, type PushStatus } from '@/lib/push'
import { HUB, roleLabels, WEB_PAGES } from '@/lib/site'
import { supabase } from '@/lib/supabase'

/* Troisième onglet, commun à tous les rôles : le compte, les
   notifications, puis chaque section de l'espace, avec son émoticône.
   Chaque section s'ouvre dans l'app. */

const CONTACT_EMAIL = 'contact@twocardspro.com'

const statusLabels: Record<PushStatus, string> = {
  granted: 'Activées',
  denied: 'Refusées, toucher pour ouvrir les réglages',
  undetermined: 'Toucher pour activer',
  unsupported: 'Indisponibles sur cet appareil',
}

export default function HubTab() {
  const { session, role, tabRole, fullName, venueName } = useAuth()
  const router = useRouter()
  const email = session?.user.email ?? '—'
  const userId = session?.user.id ?? null
  const version = Constants.expoConfig?.version ?? '1.0.0'
  const [push, setPush] = useState<PushStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    pushStatus()
      .then((s) => {
        if (!cancelled) setPush(s)
      })
      .catch(() => {
        if (!cancelled) setPush('unsupported')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const togglePush = useCallback(async () => {
    if (!userId || push === 'granted' || push === 'unsupported') return
    if (push === 'denied') {
      Linking.openSettings()
      return
    }
    setPush(await registerPush(userId))
  }, [userId, push])

  const openWeb = (path: string) =>
    router.push({ pathname: '/web', params: { path, title: WEB_PAGES[path] ?? '' } })

  const signOut = async () => {
    await unregisterPush().catch(() => {})
    await supabase.auth.signOut()
  }

  const requestDeletion = () => {
    const subject = encodeURIComponent('Suppression de mon compte twocards')
    const body = encodeURIComponent(
      `Bonjour,\n\nJe demande la suppression de mon compte twocards et des données associées.\n\nCompte : ${email}\n\nMerci.`
    )
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`).catch(() =>
      Alert.alert('Aucune application de messagerie', `Écrivez à ${CONTACT_EMAIL} depuis votre adresse ${email}.`)
    )
  }

  const spaceLabel = tabRole === 'activite' ? 'Activités & services' : roleLabels[role]

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Menu</Text>

        <Card style={styles.profile}>
          <Avatar name={fullName ?? venueName ?? 'T'} size={48} />
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={1}>
              {venueName ?? fullName ?? 'Votre espace'}
            </Text>
            <Text style={styles.profileHint} numberOfLines={1}>
              {fullName ? `${fullName} · ` : ''}
              {spaceLabel}
            </Text>
            <Text style={styles.profileHint} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </Card>

        <Pressable onPress={togglePush} style={({ pressed }) => [pressed && styles.pressed]}>
          <Card style={styles.row}>
            <Text style={styles.emoji}>🔔</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Notifications push</Text>
              <Text style={styles.rowHint}>{push ? statusLabels[push] : 'Vérification…'}</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: push === 'granted' ? Light.success : Light.warning }]} />
          </Card>
        </Pressable>

        {HUB[tabRole].map((g) => (
          <View key={g.title}>
            <Text style={styles.groupTitle}>{g.title}</Text>
            <Card style={styles.group}>
              {g.items.map((i, idx) => (
                <Pressable
                  key={i.path}
                  onPress={() => openWeb(i.path)}
                  style={({ pressed }) => [styles.row, idx > 0 && styles.rowBorder, pressed && styles.pressed]}>
                  <Text style={styles.emoji}>{i.emoji}</Text>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{i.label}</Text>
                    <Text style={styles.rowHint} numberOfLines={1}>
                      {i.hint}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </Card>
          </View>
        ))}

        <Pressable onPress={signOut} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </Pressable>
        <Pressable onPress={requestDeletion} style={({ pressed }) => [styles.quiet, pressed && styles.pressed]}>
          <Text style={styles.quietText}>Demander la suppression de mon compte</Text>
        </Pressable>
        <Text style={styles.version}>twocards · v{version}</Text>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: BottomTabInset + 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Light.ink,
    letterSpacing: -0.6,
    paddingTop: 4,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Light.ink,
  },
  profileHint: {
    fontSize: 12,
    color: Light.muted,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Light.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Light.line,
  },
  emoji: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Light.bg,
    textAlign: 'center',
    lineHeight: 36,
    fontSize: 18,
    overflow: 'hidden',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Light.ink,
  },
  rowHint: {
    fontSize: 12,
    color: Light.muted,
  },
  chevron: {
    fontSize: 22,
    color: Light.faint,
    marginTop: -2,
  },
  pressed: {
    opacity: 0.6,
  },
  signOut: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Light.dangerSoft,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.danger,
  },
  quiet: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  quietText: {
    fontSize: 12,
    color: Light.faint,
    textDecorationLine: 'underline',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Light.faint,
  },
})
