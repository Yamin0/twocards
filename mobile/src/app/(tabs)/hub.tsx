import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Avatar, Card, Screen } from '@/components/venue/ui'
import { BottomTabInset, Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { pushStatus, registerPush, unregisterPush, type PushStatus } from '@/lib/push'
import { roleLabels, WEB_PAGES } from '@/lib/site'
import { supabase } from '@/lib/supabase'

/* Troisième onglet : tout le reste. Les sections du site, le compte, les
   notifications, la déconnexion. Chaque section s'ouvre dans l'app. */

const CONTACT_EMAIL = 'contact@twocardspro.com'

type Item = { label: string; hint: string; path: string; activityOnly?: boolean; restaurantOnly?: boolean }

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Activité',
    items: [
      { label: 'Prestations', hint: 'Ce que vos clients réservent, visible sur le menu', path: '/dashboard/prestations', activityOnly: true },
      { label: 'Messages', hint: 'Hôtels et concierges', path: '/dashboard/messages' },
      { label: 'Commissions', hint: 'À régler ce mois, historique par hôtel', path: '/dashboard/commissions' },
      { label: 'Réseau apporteurs', hint: 'Quels hôtels vous envoient des clients', path: '/dashboard/network' },
      { label: 'Analyses', hint: 'Volumes, panier moyen, tendances', path: '/dashboard/analytics' },
      { label: 'Clients', hint: 'Historique et fidélité', path: '/dashboard/guests' },
    ],
  },
  {
    title: 'Outils',
    items: [
      { label: 'Portail de réservation', hint: 'Votre page de réservation directe, sans commission', path: '/dashboard/portal' },
      { label: 'Événements', hint: 'Soirées et programmation', path: '/dashboard/events', restaurantOnly: true },
      { label: 'Plan de salle', hint: 'Vos tables et leur occupation', path: '/dashboard/floor-plan', restaurantOnly: true },
      { label: 'Caisse (POS)', hint: 'Rapprochement automatique des tickets', path: '/dashboard/integrations', restaurantOnly: true },
    ],
  },
  {
    title: 'Compte',
    items: [
      { label: 'Paramètres', hint: 'Profil, établissement, sécurité', path: '/dashboard/settings' },
      { label: 'Notifications', hint: "Tout ce qui s'est passé, dans l'ordre", path: '/dashboard/notifications' },
      { label: 'Aide', hint: 'Guides et contact', path: '/dashboard/help' },
    ],
  },
]

const statusLabels: Record<PushStatus, string> = {
  granted: 'Activées',
  denied: 'Refusées, ouvrir les réglages',
  undetermined: 'Toucher pour activer',
  unsupported: 'Indisponibles sur cet appareil',
}

export default function HubTab() {
  const { session, role, tabRole, fullName, venueName } = useAuth()
  const router = useRouter()
  const email = session?.user.email ?? '—'
  const userId = session?.user.id ?? null
  const activity = tabRole === 'activite'
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Menu</Text>

        {/* Compte */}
        <Card style={styles.profile}>
          <Avatar name={fullName ?? venueName ?? 'T'} size={48} />
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={1}>
              {venueName ?? fullName ?? 'Votre établissement'}
            </Text>
            <Text style={styles.profileHint} numberOfLines={1}>
              {fullName ? `${fullName} · ` : ''}
              {activity ? 'Activités & services' : roleLabels[role]}
            </Text>
            <Text style={styles.profileHint} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </Card>

        {/* Notifications */}
        <Pressable onPress={togglePush} style={({ pressed }) => [pressed && styles.pressed]}>
          <Card style={styles.pushRow}>
            <View style={styles.pushText}>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Text style={styles.rowHint}>{push ? statusLabels[push] : 'Vérification…'}</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: push === 'granted' ? Light.success : Light.warning }]} />
          </Card>
        </Pressable>

        {GROUPS.map((g) => {
          const items = g.items.filter(
            (i) => !(i.activityOnly && !activity) && !(i.restaurantOnly && activity)
          )
          return (
            <View key={g.title}>
              <Text style={styles.groupTitle}>{g.title}</Text>
              <Card style={styles.group}>
                {items.map((i, idx) => (
                  <Pressable
                    key={i.path}
                    onPress={() => openWeb(i.path)}
                    style={({ pressed }) => [styles.row, idx > 0 && styles.rowBorder, pressed && styles.pressed]}>
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
          )
        })}

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
  pushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  pushText: {
    flex: 1,
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
    padding: 0,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Light.line,
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
