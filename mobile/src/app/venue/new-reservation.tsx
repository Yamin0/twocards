import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { Button, Field, Icon, StackScreen, Stepper, inputStyle } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { haptic } from '@/lib/haptics'
import { useToast } from '@/lib/toast'
import { addDaysIso, createReservation, todayIso } from '@/lib/venue-data'

/* Le téléphone sonne, le manager note : nom, numéro, jour, heure,
   couverts. Trois touches pour le jour, une grille pour l'heure, et la
   réservation apparaît dans la liste et sur le plan de salle du site. */

const HOURS = ['12:00', '12:30', '13:00', '13:30', '14:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']
const ACTIVITY_HOURS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function dayChip(iso: string, today: string) {
  if (iso === today) return { top: "Auj.", bottom: String(new Date(`${iso}T00:00:00`).getDate()) }
  if (iso === addDaysIso(1)) return { top: 'Dem.', bottom: String(new Date(`${iso}T00:00:00`).getDate()) }
  const d = new Date(`${iso}T00:00:00`)
  return { top: DAYS[d.getDay()].slice(0, 3), bottom: String(d.getDate()) }
}

function longDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export default function NewReservationScreen() {
  const router = useRouter()
  const toast = useToast()
  const { tabRole } = useAuth()
  const activity = tabRole === 'activite'
  const today = todayIso()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState(today)
  const [time, setTime] = useState<string | null>(null)
  const [customTime, setCustomTime] = useState('')
  const [party, setParty] = useState(2)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const days = Array.from({ length: 14 }, (_, i) => addDaysIso(i))
  const hours = activity ? ACTIVITY_HOURS : HOURS
  const finalTime = customTime.trim() ? normalizeTime(customTime) : time
  const canSave = name.trim().length >= 2 && !saving && (customTime.trim() === '' || finalTime !== null)

  const submit = async () => {
    if (!canSave) return
    setSaving(true)
    setError('')
    haptic.tap()
    const err = await createReservation({
      name,
      phone,
      date,
      time: finalTime,
      party,
      notes: notes.trim() || null,
    })
    setSaving(false)
    if (err) {
      haptic.error()
      setError(/Nom/.test(err) ? 'Le nom est requis.' : /Téléphone/.test(err) ? 'Numéro trop long.' : 'Enregistrement impossible. Vérifiez votre connexion.')
      return
    }
    haptic.success()
    toast.show({ message: `Réservation ajoutée pour ${name.trim()}`, tone: 'success' })
    router.back()
  }

  return (
    <StackScreen
      title="Nouvelle réservation"
      subtitle="Prise par téléphone ou au comptoir"
      right={
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Fermer">
          <Icon name="x" size={22} color={Light.muted} />
        </Pressable>
      }>
      <View style={styles.form}>
        <Field label="Client">
          <TextInput
            value={name}
            onChangeText={setName}
            style={inputStyle}
            placeholder="Nom du client"
            placeholderTextColor={Light.faint}
            autoCapitalize="words"
            autoFocus
            returnKeyType="next"
          />
        </Field>
        <Field label="Téléphone" hint="Facultatif, pour le joindre ou lui écrire depuis la fiche.">
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={inputStyle}
            placeholder="+212 6 …"
            placeholderTextColor={Light.faint}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
          />
        </Field>

        <Field label="Jour" hint={longDate(date)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
            {days.map((d) => {
              const c = dayChip(d, today)
              const active = d === date
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    haptic.select()
                    setDate(d)
                  }}
                  style={[styles.day, active && styles.dayActive]}>
                  <Text style={[styles.dayTop, active && styles.dayTextActive]}>{c.top}</Text>
                  <Text style={[styles.dayBottom, active && styles.dayTextActive]}>{c.bottom}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </Field>

        <Field label="Heure">
          <View style={styles.hours}>
            {hours.map((h) => {
              const active = time === h && !customTime
              return (
                <Pressable
                  key={h}
                  onPress={() => {
                    haptic.select()
                    setCustomTime('')
                    setTime(active ? null : h)
                  }}
                  style={[styles.hour, active && styles.hourActive]}>
                  <Text style={[styles.hourText, active && styles.hourTextActive]}>{h}</Text>
                </Pressable>
              )
            })}
          </View>
          <TextInput
            value={customTime}
            onChangeText={setCustomTime}
            style={[inputStyle, styles.customTime]}
            placeholder="Autre heure, par exemple 20:15"
            placeholderTextColor={Light.faint}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </Field>

        <Field label={activity ? 'Participants' : 'Couverts'}>
          <Stepper value={party} onChange={setParty} min={1} max={60} unit={(n) => (activity ? (n > 1 ? 'participants' : 'participant') : n > 1 ? 'personnes' : 'personne')} />
        </Field>

        <Field label="Note" hint="Allergie, anniversaire, table préférée…">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[inputStyle, styles.textarea]}
            placeholder="Facultatif"
            placeholderTextColor={Light.faint}
            multiline
            maxLength={500}
          />
        </Field>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={saving ? 'Enregistrement…' : 'Ajouter la réservation'} icon="check" onPress={submit} disabled={!canSave} />
        <Text style={styles.note}>Réservation maison : sans commission, visible sur le plan de salle du site.</Text>
      </View>
    </StackScreen>
  )
}

/* « 2015 », « 20h15 », « 20:15 » → « 20:15 », ou null si ce n'est pas une heure. */
function normalizeTime(raw: string): string | null {
  const m = /^(\d{1,2})\s*[h:.]?\s*(\d{2})?$/.exec(raw.trim())
  if (!m) return null
  const h = Number(m[1])
  const mm = m[2] ? Number(m[2]) : 0
  if (h > 23 || mm > 59) return null
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  days: {
    gap: 8,
    paddingVertical: 2,
  },
  day: {
    width: 56,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Light.card,
    borderWidth: 1,
    borderColor: Light.line,
    alignItems: 'center',
    gap: 2,
  },
  dayActive: {
    backgroundColor: Light.ink,
    borderColor: Light.ink,
  },
  dayTop: {
    fontSize: 11,
    fontWeight: '600',
    color: Light.muted,
    textTransform: 'uppercase',
  },
  dayBottom: {
    fontSize: 17,
    fontWeight: '700',
    color: Light.ink,
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  hours: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hour: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Light.card,
    borderWidth: 1,
    borderColor: Light.line,
  },
  hourActive: {
    backgroundColor: Light.accent,
    borderColor: Light.accent,
  },
  hourText: {
    fontSize: 13,
    fontWeight: '600',
    color: Light.ink,
    fontVariant: ['tabular-nums'],
  },
  hourTextActive: {
    color: '#FFFFFF',
  },
  customTime: {
    marginTop: 8,
  },
  textarea: {
    height: 88,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 13,
    color: Light.danger,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: Light.faint,
    textAlign: 'center',
  },
})
