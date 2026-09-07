import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Avatar, Card, Icon, ListRow, Screen } from '@/components/venue/ui'
import { BottomTabInset, Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { pushStatus, registerPush, unregisterPush, type PushStatus } from '@/lib/push'
import { HUB, isVenueTabRole, roleLabels, roleTabs, WEB_PAGES } from '@/lib/site'
import { supabase } from '@/lib/supabase'

/* Troisième onglet, commun à tous les rôles : le compte, les
   notifications, puis chaque section de l'espace. Toucher le compte ouvre
   les paramètres. */

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
  const venue = isVenueTabRole(tabRole)

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

  const openSettings = () =>
    venue ? router.push('/venue/settings') : openWeb(roleTabs[tabRole].settings)

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

        {/* Le compte → paramètres */}
        <Pressable onPress={openSettings} style={({ pressed }) => [pressed && styles.pressed]}>
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
              <Text style={styles.profileLink}>Voir le profil et les paramètres</Text>
            </View>
            <Icon name="chevron-right" size={18} color={Light.faint} />
          </Card>
        </Pressable>

        <Card style={styles.group}>
          <ListRow
            first
            icon="bell"
            label="Notifications push"
            hint={push ? statusLabels[push] : 'Vérification…'}
            onPress={push === 'granted' || push === 'unsupported' ? undefined : togglePush}
            right={
              <View style={[styles.dot, { backgroundColor: push === 'granted' ? Light.success : Light.warning }]} />
            }
          />
        </Card>

        {HUB[tabRole].map((g) => (
          <View key={g.title}>
            <Text style={styles.groupTitle}>{g.title}</Text>
            <Card style={styles.group}>
              {g.items.map((i, idx) => (
                <ListRow
                  key={i.route ?? i.path ?? i.label}
                  first={idx === 0}
                  icon={i.icon}
                  label={i.label}
                  hint={i.hint}
                  onPress={() => (i.route ? router.push(i.route as never) : i.path ? openWeb(i.path) : undefined)}
                />
              ))}
            </Card>
          </View>
        ))}

        <Card style={styles.group}>
          <ListRow first icon="log-out" label="Se déconnecter" tone="danger" onPress={signOut} />
        </Card>
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
  profileLink: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: Light.accent,
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
  pressed: {
    opacity: 0.6,
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
