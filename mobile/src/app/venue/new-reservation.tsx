import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { Button, Field, Icon, StackScreen, Stepper, inputStyle } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { haptic } from '@/lib/haptics'
import { useLocale, useT, type Locale } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { addDaysIso, createReservation, todayIso } from '@/lib/venue-data'

/* Le téléphone sonne, le manager note : nom, numéro, jour, heure,
   couverts. Trois touches pour le jour, une grille pour l'heure, et la
   réservation apparaît dans la liste et sur le plan de salle du site. */

const HOURS = ['12:00', '12:30', '13:00', '13:30', '14:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']
const ACTIVITY_HOURS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function dayChip(iso: string, today: string, locale: Locale) {
  const en = locale === 'en'
  if (iso === today) return { top: en ? 'Today' : 'Auj.', bottom: String(new Date(`${iso}T00:00:00`).getDate()) }
  if (iso === addDaysIso(1)) return { top: en ? 'Tmrw' : 'Dem.', bottom: String(new Date(`${iso}T00:00:00`).getDate()) }
  const d = new Date(`${iso}T00:00:00`)
  return { top: (en ? DAYS_EN : DAYS)[d.getDay()].slice(0, 3), bottom: String(d.getDate()) }
}

function longDate(iso: string, locale: Locale) {
  const d = new Date(`${iso}T00:00:00`)
  if (locale === 'en') return `${DAYS_EN[d.getDay()]} ${d.getDate()} ${MONTHS_EN[d.getMonth()]}`
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export default function NewReservationScreen() {
  const router = useRouter()
  const toast = useToast()
  const t = useT()
  const locale = useLocale()
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
      setError(
        /Nom/.test(err)
          ? t('Le nom est requis.', 'The name is required.')
          : /Téléphone/.test(err)
            ? t('Numéro trop long.', 'Number too long.')
            : t('Enregistrement impossible. Vérifiez votre connexion.', "Couldn't save. Check your connection.")
      )
      return
    }
    haptic.success()
    toast.show({ message: t(`Réservation ajoutée pour ${name.trim()}`, `Reservation added for ${name.trim()}`), tone: 'success' })
    router.back()
  }

  return (
    <StackScreen
      title={t('Nouvelle réservation', 'New reservation')}
      subtitle={t('Prise par téléphone ou au comptoir', 'Taken by phone or at the desk')}
      right={
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('Fermer', 'Close')}>
          <Icon name="x" size={22} color={Light.muted} />
        </Pressable>
      }>
      <View style={styles.form}>
        <Field label={t('Client', 'Guest')}>
          <TextInput
            value={name}
            onChangeText={setName}
            style={inputStyle}
            placeholder={t('Nom du client', 'Guest name')}
            placeholderTextColor={Light.faint}
            autoCapitalize="words"
            autoFocus
            returnKeyType="next"
          />
        </Field>
        <Field label={t('Téléphone', 'Phone')} hint={t('Facultatif, pour le joindre ou lui écrire depuis la fiche.', 'Optional, to call or message them from the reservation.')}>
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

        <Field label={t('Jour', 'Day')} hint={longDate(date, locale)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
            {days.map((d) => {
              const c = dayChip(d, today, locale)
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

        <Field label={t('Heure', 'Time')}>
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
            placeholder={t('Autre heure, par exemple 20:15', 'Other time, e.g. 20:15')}
            placeholderTextColor={Light.faint}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </Field>

        <Field label={activity ? t('Participants', 'Participants') : t('Couverts', 'Covers')}>
          <Stepper
            value={party}
            onChange={setParty}
            min={1}
            max={60}
            unit={(n) =>
              activity
                ? t(n > 1 ? 'participants' : 'participant', n === 1 ? 'participant' : 'participants')
                : t(n > 1 ? 'personnes' : 'personne', n === 1 ? 'person' : 'people')
            }
          />
        </Field>

        <Field label="Note" hint={t('Allergie, anniversaire, table préférée…', 'Allergy, birthday, favourite table…')}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[inputStyle, styles.textarea]}
            placeholder={t('Facultatif', 'Optional')}
            placeholderTextColor={Light.faint}
            multiline
            maxLength={500}
          />
        </Field>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={saving ? t('Enregistrement…', 'Saving…') : t('Ajouter la réservation', 'Add the reservation')} icon="check" onPress={submit} disabled={!canSave} />
        <Text style={styles.note}>
          {t(
            'Réservation maison : sans commission, visible sur le plan de salle du site.',
            'In-house reservation: no commission, shown on the floor plan on the website.'
          )}
        </Text>
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
