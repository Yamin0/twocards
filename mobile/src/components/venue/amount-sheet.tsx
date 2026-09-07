import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Light } from '@/constants/theme'
import type { Reservation } from '@/lib/venue-data'

import { Button } from './ui'

/* Saisie de l'addition : c'est elle qui déclenche la commission. Un seul
   champ, clavier numérique, validation au bouton ou à la touche Entrée. */
export function AmountSheet({
  reservation,
  onClose,
  onSave,
}: {
  reservation: Reservation | null
  onClose: () => void
  onSave: (amount: number) => Promise<boolean>
}) {
  /* Le parent remonte la feuille avec une clé par réservation : l'état
     part donc du montant déjà connu, sans effet de synchronisation. */
  const [value, setValue] = useState(() =>
    reservation && reservation.amount_spent !== null ? String(reservation.amount_spent) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!reservation) return null

  const submit = async () => {
    const n = Number(value.replace(',', '.').replace(/\s/g, ''))
    if (!Number.isFinite(n) || n < 0) {
      setError('Indiquez un montant en dirhams, par exemple 1450.')
      return
    }
    setSaving(true)
    const ok = await onSave(n)
    setSaving(false)
    if (!ok) {
      setError("Enregistrement impossible. Vérifiez votre connexion.")
      return
    }
    onClose()
  }

  const rate = Math.round(reservation.commission_rate * 100)
  const preview = Number(value.replace(',', '.')) || 0

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}
        pointerEvents="box-none">
        <View style={styles.sheet}>
          <Text style={styles.eyebrow}>Addition</Text>
          <Text style={styles.title}>{reservation.guest_name}</Text>
          <Text style={styles.sub}>
            {reservation.party_size} pers.
            {reservation.service_name ? ` · ${reservation.service_name}` : ''}
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="0"
              placeholderTextColor={Light.faint}
              keyboardType="decimal-pad"
              inputMode="decimal"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submit}
              style={styles.input}
            />
            <Text style={styles.unit}>MAD</Text>
          </View>
          {reservation.source === 'qr' ? (
            <Text style={styles.hint}>
              Commission reversée à {rate} % :{' '}
              <Text style={styles.hintStrong}>
                {Math.round((preview * rate) / 100).toLocaleString('fr-FR')} MAD
              </Text>
            </Text>
          ) : (
            <Text style={styles.hint}>Canal direct ou maison : sans commission.</Text>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button label="Annuler" tone="ghost" onPress={onClose} style={styles.grow} />
            <Button label={saving ? 'Enregistrement…' : 'Enregistrer'} onPress={submit} style={styles.grow} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  wrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Light.muted,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Light.ink,
  },
  sub: {
    fontSize: 13,
    color: Light.muted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Light.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: Light.bg,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 28,
    fontWeight: '700',
    color: Light.ink,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 15,
    fontWeight: '600',
    color: Light.muted,
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    color: Light.muted,
  },
  hintStrong: {
    fontWeight: '700',
    color: Light.ink,
  },
  error: {
    marginTop: 4,
    fontSize: 13,
    color: Light.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  grow: {
    flex: 1,
  },
})
