import { useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Icon, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { hourOf, useThread } from '@/lib/venue-data'

/* Un fil : les bulles, les vôtres à droite en bleu, la saisie en bas. */
export default function ThreadScreen() {
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>()
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const conversationId = typeof id === 'string' ? id : null
  const { rows, send } = useThread(conversationId, userId)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (rows && rows.length > 0) {
      const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50)
      return () => clearTimeout(t)
    }
  }, [rows])

  const submit = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    const ok = await send(text)
    setSending(false)
    if (ok) setDraft('')
  }

  const dayOf = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  return (
    <StackScreen title={typeof name === 'string' && name ? name : 'Conversation'} scroll={false}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}>
        {rows === null ? (
          <View style={styles.center}>
            <ActivityIndicator color={Light.accent} />
          </View>
        ) : (
          <ScrollView ref={scrollRef} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {rows.length === 0 && <Text style={styles.empty}>Dites bonjour : votre message part en notification.</Text>}
            {rows.map((m, i) => {
              const day = dayOf(m.created_at)
              const showDay = i === 0 || day !== dayOf(rows[i - 1].created_at)
              const mine = m.sender_id === userId
              return (
                <View key={m.id}>
                  {showDay && <Text style={styles.day}>{day}</Text>}
                  <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.body}</Text>
                      <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>{hourOf(m.created_at)}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        )}
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Votre message"
            placeholderTextColor={Light.faint}
            style={styles.input}
            multiline
            maxLength={4000}
          />
          <Pressable
            onPress={submit}
            disabled={!draft.trim() || sending}
            style={({ pressed }) => [styles.send, (!draft.trim() || sending) && styles.sendOff, pressed && styles.pressed]}
            accessibilityLabel="Envoyer">
            <Icon name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </StackScreen>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    gap: 6,
  },
  empty: {
    textAlign: 'center',
    fontSize: 13,
    color: Light.muted,
    paddingVertical: 24,
  },
  day: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: Light.faint,
    marginVertical: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 3,
  },
  bubbleTheirs: {
    backgroundColor: Light.card,
    borderBottomLeftRadius: 6,
  },
  bubbleMine: {
    backgroundColor: Light.accent,
    borderBottomRightRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    color: Light.ink,
  },
  bubbleTextMine: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    fontSize: 10,
    color: Light.faint,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    paddingBottom: 24,
    backgroundColor: Light.card,
    borderTopWidth: 1,
    borderTopColor: Light.line,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    backgroundColor: Light.bg,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    color: Light.ink,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Light.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
})
