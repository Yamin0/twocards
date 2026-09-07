import { Image } from 'expo-image'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Button, Card, Empty, Field, Icon, Pill, StackScreen, inputStyle } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { pickAndUploadImage, useVenueServices, type Service, type ServiceDraft } from '@/lib/venue-data'

/* Prestations d'une activité ou d'un service : une balade en quad d'une
   heure, un transfert, un massage. Chaque prestation visible apparaît
   aussitôt sous la fiche de l'établissement dans le menu des hôtels. */

const EMPTY: ServiceDraft = { name: '', description: '', duration: '', price: '', image_url: null, active: true }

export default function PrestationsScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const { rows, save, toggle, remove, move } = useVenueServices()
  const [editor, setEditor] = useState<{ id: string | null; draft: ServiceDraft } | null>(null)
  const visible = (rows ?? []).filter((s) => s.active).length

  const confirmRemove = (s: Service) =>
    Alert.alert('Supprimer cette prestation ?', `« ${s.name} » disparaît du menu immédiatement.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => remove(s.id) },
    ])

  return (
    <StackScreen
      title="Prestations"
      subtitle={rows ? `${visible} visible${visible > 1 ? 's' : ''} sur le menu` : undefined}
      right={
        <Pressable onPress={() => setEditor({ id: null, draft: EMPTY })} hitSlop={8} style={styles.addButton} accessibilityLabel="Nouvelle prestation">
          <Icon name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      }>
      {rows === null ? (
        <ActivityIndicator color={Light.accent} />
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            icon="tag"
            title="Aucune prestation"
            body="Par exemple « Balade en quad, 1 h, 450 MAD ». Dès qu'elle est enregistrée, les clients des hôtels partenaires peuvent la réserver."
          />
          <Button label="Ajouter ma première prestation" icon="plus" onPress={() => setEditor({ id: null, draft: EMPTY })} />
        </Card>
      ) : (
        rows.map((s, i) => (
          <Card key={s.id} style={[styles.card, !s.active && styles.cardOff]}>
            <View style={styles.head}>
              <View style={styles.thumb}>
                {s.image_url ? (
                  <Image source={{ uri: s.image_url }} style={styles.thumbImage} contentFit="cover" alt="" />
                ) : (
                  <Icon name="image" size={20} color={Light.faint} />
                )}
              </View>
              <View style={styles.text}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {s.name}
                  </Text>
                  {!s.active && <Pill label="Masquée" />}
                </View>
                <Text style={styles.hint}>{[s.duration, s.price].filter(Boolean).join(' · ') || 'Durée et prix à préciser'}</Text>
                {s.description ? (
                  <Text style={styles.desc} numberOfLines={2}>
                    {s.description}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.actions}>
              <Button label="Modifier" tone="ghost" small icon="edit-2" onPress={() => setEditor({ id: s.id, draft: { ...s } })} />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{s.active ? 'Visible' : 'Masquée'}</Text>
                <Switch value={s.active} onValueChange={() => {
                    void toggle(s)
                  }} trackColor={{ true: Light.accent, false: Light.line }} />
              </View>
              <View style={styles.order}>
                <Pressable onPress={() => move(s, -1)} disabled={i === 0} style={[styles.orderButton, i === 0 && styles.off]} accessibilityLabel="Monter">
                  <Icon name="arrow-up" size={15} color={Light.muted} />
                </Pressable>
                <Pressable onPress={() => move(s, 1)} disabled={i === rows.length - 1} style={[styles.orderButton, i === rows.length - 1 && styles.off]} accessibilityLabel="Descendre">
                  <Icon name="arrow-down" size={15} color={Light.muted} />
                </Pressable>
                <Pressable onPress={() => confirmRemove(s)} style={styles.orderButton} accessibilityLabel="Supprimer">
                  <Icon name="trash-2" size={15} color={Light.danger} />
                </Pressable>
              </View>
            </View>
          </Card>
        ))
      )}

      {editor && userId && (
        <Editor
          key={editor.id ?? 'new'}
          initial={editor.draft}
          isNew={editor.id === null}
          userId={userId}
          onClose={() => setEditor(null)}
          onSave={async (d) => {
            const ok = await save(userId, editor.id, d)
            if (ok) setEditor(null)
            return ok
          }}
        />
      )}
    </StackScreen>
  )
}

function Editor({
  initial,
  isNew,
  userId,
  onClose,
  onSave,
}: {
  initial: ServiceDraft
  isNew: boolean
  userId: string
  onClose: () => void
  onSave: (d: ServiceDraft) => Promise<boolean>
}) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const pick = async () => {
    setUploading(true)
    try {
      const url = await pickAndUploadImage(userId)
      if (url) setDraft({ ...draft, image_url: url })
    } catch {
      setError('Envoi de la photo impossible. Réessayez.')
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!draft.name.trim()) {
      setError('Donnez un nom à la prestation.')
      return
    }
    setSaving(true)
    setError('')
    const ok = await onSave(draft)
    setSaving(false)
    if (!ok) setError('Enregistrement impossible. Vérifiez votre connexion.')
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{isNew ? 'Nouvelle prestation' : 'Modifier la prestation'}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="x" size={20} color={Light.muted} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Field label="Nom">
              <TextInput value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} style={inputStyle} placeholder="Balade en quad" placeholderTextColor={Light.faint} maxLength={80} autoFocus />
            </Field>
            <View style={styles.twoCols}>
              <View style={styles.col}>
                <Field label="Durée">
                  <TextInput value={draft.duration} onChangeText={(v) => setDraft({ ...draft, duration: v })} style={inputStyle} placeholder="1 h" placeholderTextColor={Light.faint} maxLength={40} />
                </Field>
              </View>
              <View style={styles.col}>
                <Field label="Prix">
                  <TextInput value={draft.price} onChangeText={(v) => setDraft({ ...draft, price: v })} style={inputStyle} placeholder="450 MAD" placeholderTextColor={Light.faint} maxLength={40} />
                </Field>
              </View>
            </View>
            <Field label="Description" hint="Facultatif, 300 caractères.">
              <TextInput
                value={draft.description}
                onChangeText={(v) => setDraft({ ...draft, description: v })}
                style={[inputStyle, styles.textarea]}
                placeholder="Départ de la Palmeraie, casque et lunettes fournis, guide francophone."
                placeholderTextColor={Light.faint}
                maxLength={300}
                multiline
              />
            </Field>
            <Field label="Photo" hint="Facultative. Sans photo, celle de votre fiche est utilisée.">
              <View style={styles.photoRow}>
                <View style={styles.thumb}>
                  {draft.image_url ? <Image source={{ uri: draft.image_url }} style={styles.thumbImage} contentFit="cover" alt="" /> : <Icon name="image" size={20} color={Light.faint} />}
                </View>
                <Button label={uploading ? 'Envoi…' : draft.image_url ? 'Changer' : 'Choisir une photo'} tone="ghost" small icon="camera" onPress={pick} disabled={uploading} />
                {draft.image_url && (
                  <Pressable onPress={() => setDraft({ ...draft, image_url: null })} hitSlop={8} accessibilityLabel="Retirer la photo">
                    <Icon name="x-circle" size={18} color={Light.muted} />
                  </Pressable>
                )}
              </View>
            </Field>
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Visible sur le menu des hôtels</Text>
              <Switch value={draft.active} onValueChange={(v) => setDraft({ ...draft, active: v })} trackColor={{ true: Light.accent, false: Light.line }} />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.sheetActions}>
              <Button label="Annuler" tone="ghost" onPress={onClose} style={styles.grow} />
              <Button label={saving ? 'Enregistrement…' : isNew ? 'Ajouter au menu' : 'Enregistrer'} onPress={submit} disabled={saving} style={styles.grow} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Light.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    gap: 12,
  },
  cardOff: {
    opacity: 0.7,
  },
  head: {
    flexDirection: 'row',
    gap: 12,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: Light.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  hint: {
    fontSize: 13,
    color: Light.muted,
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
    color: Light.faint,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Light.muted,
  },
  order: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: 2,
  },
  orderButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: {
    opacity: 0.3,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: Light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Light.ink,
  },
  form: {
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  twoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  textarea: {
    height: 96,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Light.ink,
  },
  error: {
    fontSize: 13,
    color: Light.danger,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  grow: {
    flex: 1,
  },
})
