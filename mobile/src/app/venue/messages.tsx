import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Avatar, Card, Empty, Icon, IconButton, ScreenSkeleton, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { useLocale, useT } from '@/lib/i18n'
import { profileName, timeAgo, useContacts, useConversations } from '@/lib/venue-data'

/* Messagerie : un fil par concierge. Le dernier message en aperçu, le
   nombre de non-lus, et un bouton pour écrire à un nouveau contact. */
export default function MessagesScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const router = useRouter()
  const { rows, open } = useConversations(userId)
  const contacts = useContacts('concierge')
  const [picker, setPicker] = useState(false)
  const [opening, setOpening] = useState<string | null>(null)
  const t = useT()
  const locale = useLocale()

  const start = async (contactId: string, name: string) => {
    setOpening(contactId)
    const id = await open(contactId, 'venue')
    setOpening(null)
    setPicker(false)
    if (id) router.push({ pathname: '/venue/thread', params: { id, name } })
  }

  return (
    <StackScreen
      title="Messages"
      subtitle={t('Concierges et hôtels', 'Concierges and hotels')}
      right={
        <IconButton icon="edit-3" label={t('Nouveau message', 'New message')} onPress={() => setPicker(true)} />
      }>
      {rows === null ? (
        <ScreenSkeleton title={false} bare />
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            icon="message-circle"
            title={t('Aucune conversation', 'No conversations')}
            body={t(
              'Écrivez à une conciergerie du réseau : une table à bloquer, un client à préparer, une question.',
              'Write to a concierge desk in the network: a table to hold, a guest to prepare for, a question.'
            )}
          />
        </Card>
      ) : (
        <Card style={styles.list}>
          {rows.map((c, i) => (
            <Pressable
              key={c.id}
              onPress={() => router.push({ pathname: '/venue/thread', params: { id: c.id, name: profileName(c.counterpart) } })}
              style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && styles.pressed]}>
              <Avatar name={profileName(c.counterpart)} size={44} />
              <View style={styles.text}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, c.unread > 0 && styles.nameUnread]} numberOfLines={1}>
                    {profileName(c.counterpart)}
                  </Text>
                  {c.last && <Text style={styles.time}>{timeAgo(c.last.created_at, locale)}</Text>}
                </View>
                <Text style={[styles.preview, c.unread > 0 && styles.previewUnread]} numberOfLines={1}>
                  {c.last
                    ? `${c.last.sender_id === userId ? t('Vous : ', 'You: ') : ''}${c.last.body}`
                    : t('Nouvelle conversation', 'New conversation')}
                </Text>
              </View>
              {c.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{c.unread}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </Card>
      )}

      <Modal visible={picker} transparent animationType="slide" onRequestClose={() => setPicker(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPicker(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{t('Écrire à', 'Write to')}</Text>
            <Pressable onPress={() => setPicker(false)} hitSlop={8} accessibilityLabel={t('Fermer', 'Close')}>
              <Icon name="x" size={20} color={Light.muted} />
            </Pressable>
          </View>
          <ScrollView style={styles.sheetList}>
            {contacts === null ? (
              <ActivityIndicator color={Light.accent} />
            ) : contacts.length === 0 ? (
              <Text style={styles.sheetEmpty}>{t('Aucune conciergerie inscrite pour le moment.', 'No concierge desks have signed up yet.')}</Text>
            ) : (
              contacts.map((p, i) => (
                <Pressable
                  key={p.id}
                  onPress={() => start(p.id, profileName(p))}
                  disabled={opening !== null}
                  style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && styles.pressed]}>
                  <Avatar name={profileName(p)} size={40} />
                  <View style={styles.text}>
                    <Text style={styles.name} numberOfLines={1}>
                      {profileName(p)}
                    </Text>
                    <Text style={styles.preview} numberOfLines={1}>
                      {[p.full_name, p.city].filter(Boolean).join(' · ') || t('Conciergerie', 'Concierge desk')}
                    </Text>
                  </View>
                  {opening === p.id ? <ActivityIndicator color={Light.accent} /> : <Icon name="chevron-right" size={18} color={Light.faint} />}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </StackScreen>
  )
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Light.line,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Light.ink,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    color: Light.faint,
  },
  preview: {
    fontSize: 13,
    color: Light.muted,
  },
  previewUnread: {
    color: Light.ink,
    fontWeight: '500',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: Light.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '70%',
    backgroundColor: Light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Light.ink,
  },
  sheetList: {
    maxHeight: 420,
  },
  sheetEmpty: {
    paddingVertical: 20,
    fontSize: 13,
    color: Light.muted,
  },
})
