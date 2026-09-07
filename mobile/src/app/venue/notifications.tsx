import { useRouter } from 'expo-router'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { Card, Empty, Icon, StackScreen, type IconName } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { timeAgo, useNotifications, type Notification } from '@/lib/venue-data'

/* La cloche du site, en natif : ce qui s'est passé, dans l'ordre. Toucher
   une ligne la marque lue et ouvre ce qu'elle annonce. */

const KIND: Record<Notification['kind'], { icon: IconName; color: string }> = {
  reservation: { icon: 'calendar', color: Light.accent },
  rating: { icon: 'star', color: Light.warning },
  pos: { icon: 'credit-card', color: Light.muted },
}

/* Un paramètre qui change à chaque ouverture, pour que l'onglet
   Réservations réapplique le filtre même s'il montre déjà la liste. */
const requestKey = () => String(Date.now())

export default function NotificationsScreen() {
  const { rows, markRead, markAllRead, clearAll } = useNotifications()
  const router = useRouter()
  const unread = (rows ?? []).filter((n) => !n.read).length

  const open = (n: Notification) => {
    markRead(n.id)
    if (n.href.startsWith('/dashboard/reservations')) {
      router.navigate({ pathname: '/reservations', params: { filter: 'all', t: requestKey() } })
    } else if (n.href) {
      router.push({ pathname: '/web', params: { path: n.href } })
    }
  }

  return (
    <StackScreen
      title="Notifications"
      subtitle={unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : undefined}
      right={
        rows && rows.length > 0 ? (
          <Pressable onPress={unread > 0 ? markAllRead : clearAll} hitSlop={8}>
            <Text style={styles.action}>{unread > 0 ? 'Tout lu' : 'Vider'}</Text>
          </Pressable>
        ) : null
      }>
      {rows === null ? (
        <ActivityIndicator color={Light.accent} />
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            icon="bell"
            title="Rien pour le moment"
            body="Nouvelle réservation, avis client, ticket de caisse à rapprocher : tout arrive ici, et sur votre téléphone."
          />
        </Card>
      ) : (
        <Card style={styles.list}>
          {rows.map((n, i) => {
            const k = KIND[n.kind] ?? KIND.reservation
            return (
              <Pressable
                key={n.id}
                onPress={() => open(n)}
                style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && styles.pressed]}>
                <View style={[styles.icon, { backgroundColor: n.read ? Light.bg : Light.accentSoft }]}>
                  <Icon name={k.icon} size={16} color={n.read ? Light.faint : k.color} />
                </View>
                <View style={styles.text}>
                  <Text style={[styles.title, n.read && styles.read]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={styles.body} numberOfLines={2}>
                    {n.body}
                  </Text>
                  <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
                </View>
                {!n.read && <View style={styles.dot} />}
              </Pressable>
            )
          })}
        </Card>
      )}
    </StackScreen>
  )
}

const styles = StyleSheet.create({
  action: {
    fontSize: 14,
    fontWeight: '600',
    color: Light.accent,
  },
  list: {
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 13,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Light.line,
  },
  pressed: {
    opacity: 0.6,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Light.ink,
  },
  read: {
    fontWeight: '600',
    color: Light.muted,
  },
  body: {
    fontSize: 13,
    color: Light.muted,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: Light.faint,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Light.accent,
    marginTop: 6,
  },
})
