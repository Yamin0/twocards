import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Linking, StyleSheet, Text, View } from 'react-native'

import { AmountSheet } from '@/components/venue/amount-sheet'
import { Avatar, Button, Card, DetailRow, Icon, ScreenSkeleton, StackScreen, StatusPill } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { haptic } from '@/lib/haptics'
import { intlLocale, useLocale, useT } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import {
  dayLabel,
  hourOf,
  isOut,
  mad,
  todayIso,
  useVenueReservations,
  whatsappUrl,
  type Reservation,
} from '@/lib/venue-data'

/* La fiche d'une réservation : tout ce qu'on sait, les moyens de joindre
   le client, et chaque geste possible selon l'état. */
export default function ReservationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const toast = useToast()
  const { rows, setStatus, checkIn, setAmount } = useVenueReservations()
  const [amountOpen, setAmountOpen] = useState(false)
  const t = useT()
  const locale = useLocale()

  const r = rows?.find((x) => x.id === id) ?? null

  if (rows === null) {
    return (
      <StackScreen title={t('Réservation', 'Reservation')} scroll={false}>
        <ScreenSkeleton title={false} />
      </StackScreen>
    )
  }
  if (!r) {
    return (
      <StackScreen title={t('Réservation', 'Reservation')}>
        <Card>
          <Text style={styles.missing}>{t("Cette réservation n'existe plus.", 'This reservation no longer exists.')}</Text>
        </Card>
      </StackScreen>
    )
  }

  const today = todayIso()
  const past = r.reservation_date < today
  const out = isOut(r)
  const phone = r.guest_phone.replace(/\s/g, '')
  const time = r.reservation_time ? r.reservation_time.slice(0, 5) : null

  const change = async (status: Reservation['status'], message: string, undoable = true) => {
    const before = r.status
    haptic.tap()
    const ok = await setStatus(r, status)
    if (!ok) {
      haptic.error()
      toast.show({ message: t('Modification impossible. Vérifiez votre connexion.', "Couldn't update. Check your connection."), tone: 'danger' })
      return
    }
    haptic.success()
    toast.show({
      message,
      tone: status === 'confirmée' ? 'success' : 'default',
      action: undoable ? { label: t('Annuler', 'Undo'), onPress: () => void setStatus({ ...r, status }, before) } : undefined,
    })
  }

  const refuse = () =>
    Alert.alert(
      t('Refuser cette réservation ?', 'Decline this reservation?'),
      t(
        `${r.guest_name} ne sera pas attendu${r.source === 'qr' ? " ; l'hôtel le verra aussi" : ''}.`,
        `${r.guest_name} will no longer be expected${r.source === 'qr' ? '; the hotel will see it too' : ''}.`
      ),
      [
        { text: t('Garder', 'Keep'), style: 'cancel' },
        { text: t('Refuser', 'Decline'), style: 'destructive', onPress: () => void change('annulée', t('Réservation refusée', 'Reservation declined')) },
      ]
    )

  const noShow = () =>
    Alert.alert(
      t('Client absent ?', 'Guest absent?'),
      t('La réservation passe en no-show et ne compte plus dans vos chiffres.', 'The reservation is marked as a no-show and no longer counts in your figures.'),
      [
        { text: t('Annuler', 'Cancel'), style: 'cancel' },
        { text: 'No-show', style: 'destructive', onPress: () => void change('no-show', t('Marquée no-show', 'Marked as no-show')) },
      ]
    )

  const arrive = async () => {
    haptic.tap()
    const ok = await checkIn(r)
    if (ok) {
      haptic.success()
      toast.show({ message: t(`${r.guest_name} est arrivé`, `${r.guest_name} has arrived`), tone: 'success' })
    } else {
      toast.show({ message: t("Impossible d'enregistrer l'arrivée.", "Couldn't record the arrival."), tone: 'danger' })
    }
  }

  const originLabel =
    r.source === 'qr'
      ? r.referrer_name ?? t('Hôtel partenaire', 'Partner hotel')
      : r.source === 'portal'
        ? t('Portail de réservation', 'Booking portal')
        : t('Prise par vous', 'Taken by you')

  return (
    <StackScreen
      title={t('Réservation', 'Reservation')}
      subtitle={time ? `${dayLabel(r.reservation_date, locale)} · ${time}` : dayLabel(r.reservation_date, locale)}>
      <Card style={styles.head}>
        <Avatar name={r.guest_name} size={56} />
        <View style={styles.headText}>
          <Text style={styles.name}>{r.guest_name}</Text>
          <Text style={styles.sub}>
            {t(
              `${r.party_size} ${r.party_size > 1 ? 'personnes' : 'personne'}`,
              `${r.party_size} ${r.party_size === 1 ? 'person' : 'people'}`
            )}
            {r.service_name ? ` · ${r.service_name}` : ''}
          </Text>
          <StatusPill status={r.status} />
        </View>
      </Card>

      <View style={styles.contact}>
        <ContactButton icon="phone" label={t('Appeler', 'Call')} onPress={() => Linking.openURL(`tel:${phone}`)} />
        <ContactButton icon="message-circle" label="WhatsApp" onPress={() => Linking.openURL(whatsappUrl(phone))} />
        <ContactButton icon="message-square" label="SMS" onPress={() => Linking.openURL(`sms:${phone}`)} />
      </View>

      {r.status === 'en attente' && (
        <Card style={styles.actionCard}>
          <Text style={styles.actionTitle}>{t('Demande à traiter', 'Request to handle')}</Text>
          <Text style={styles.actionHint}>
            {t(
              "Confirmez si la table ou le créneau est disponible. Le client et l'hôtel sont prévenus.",
              'Confirm if the table or slot is available. The guest and the hotel are notified.'
            )}
          </Text>
          <View style={styles.actions}>
            <Button label={t('Confirmer', 'Confirm')} tone="success" icon="check" onPress={() => void change('confirmée', t('Réservation confirmée', 'Reservation confirmed'))} style={styles.grow} />
            <Button label={t('Refuser', 'Decline')} tone="danger" icon="x" onPress={refuse} style={styles.grow} />
          </View>
        </Card>
      )}

      {r.status === 'confirmée' && (
        <Card style={styles.actionCard}>
          <View style={styles.actions}>
            {!r.arrived_at && !past && <Button label={t('Client arrivé', 'Guest arrived')} icon="user-check" onPress={arrive} style={styles.grow} />}
            {r.amount_spent === null && (past || r.arrived_at) && (
              <Button label={t("Saisir l'addition", 'Enter the bill')} tone={r.arrived_at ? 'accent' : 'ghost'} icon="edit-3" onPress={() => setAmountOpen(true)} style={styles.grow} />
            )}
            {r.amount_spent !== null && <Button label={t('Modifier le montant', 'Edit the amount')} tone="ghost" icon="edit-3" onPress={() => setAmountOpen(true)} style={styles.grow} />}
          </View>
          {!r.arrived_at && (past || r.reservation_date === today) && (
            <Button label={t('Client absent (no-show)', 'Guest absent (no-show)')} tone="ghost" icon="user-x" onPress={noShow} />
          )}
        </Card>
      )}

      {out && (
        <Card style={styles.actionCard}>
          <Text style={styles.actionHint}>
            {r.status === 'annulée'
              ? t('Refusée ou annulée. Vous pouvez la rétablir si le client revient.', 'Declined or cancelled. You can restore it if the guest comes back.')
              : t('Client absent. Vous pouvez rétablir la réservation si c’était une erreur.', 'Guest absent. You can restore the reservation if this was a mistake.')}
          </Text>
          <Button
            label={t('Rétablir la réservation', 'Restore the reservation')}
            tone="ghost"
            icon="rotate-ccw"
            onPress={() => void change('confirmée', t('Réservation rétablie', 'Reservation restored'), false)}
          />
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>{t('Détails', 'Details')}</Text>
        <DetailRow icon="calendar" label="Date" value={dayLabel(r.reservation_date, locale)} />
        <DetailRow icon="clock" label={t('Heure', 'Time')} value={time ?? t('Non précisée', 'Not specified')} />
        <DetailRow icon="users" label={r.service_name ? t('Participants', 'Participants') : t('Couverts', 'Covers')} value={String(r.party_size)} />
        <DetailRow icon="phone" label={t('Téléphone', 'Phone')} value={r.guest_phone} onPress={() => Linking.openURL(`tel:${phone}`)} />
        <DetailRow icon={r.source === 'qr' ? 'briefcase' : r.source === 'portal' ? 'globe' : 'user'} label={t('Origine', 'Source')} value={originLabel} />
        {r.notes ? (
          <View style={styles.notes}>
            <Icon name="message-square" size={14} color={Light.faint} />
            <Text style={styles.notesText}>{r.notes}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{t('Suivi', 'Timeline')}</Text>
        <Step
          icon="inbox"
          done
          label={t('Demande reçue', 'Request received')}
          value={`${new Date(r.created_at).toLocaleDateString(intlLocale(locale))} · ${hourOf(r.created_at, locale)}`}
        />
        <Step
          icon="check"
          done={r.status !== 'en attente'}
          label={r.status === 'annulée' ? t('Refusée', 'Declined') : r.status === 'no-show' ? 'No-show' : t('Confirmée', 'Confirmed')}
          value={r.status === 'en attente' ? t('En attente de votre réponse', 'Awaiting your reply') : ''}
        />
        <Step icon="user-check" done={!!r.arrived_at} label={t('Client arrivé', 'Guest arrived')} value={r.arrived_at ? hourOf(r.arrived_at, locale) : ''} />
        <Step
          icon="credit-card"
          done={r.amount_spent !== null}
          label={t('Addition', 'Bill')}
          value={r.amount_spent !== null ? `${mad(r.amount_spent, locale)}${r.amount_source === 'pos' ? t(' · caisse', ' · till') : ''}` : ''}
        />
        {r.source === 'qr' && (
          <Step
            icon="dollar-sign"
            done={r.commission > 0}
            label={t(`Commission ${Math.round(r.commission_rate * 100)} %`, `Commission ${Math.round(r.commission_rate * 100)}%`)}
            value={
              r.commission > 0
                ? t(`${mad(r.commission, locale)} à ${r.referrer_name ?? "l'hôtel"}`, `${mad(r.commission, locale)} to ${r.referrer_name ?? 'the hotel'}`)
                : t('Calculée à la saisie de l’addition', 'Calculated when the bill is entered')
            }
            last={r.rating === null}
          />
        )}
        {r.rating !== null && (
          <Step
            icon="star"
            done
            label={t(`Avis ${r.rating}/5`, `Review ${r.rating}/5`)}
            value={r.rating_comment ? t(`« ${r.rating_comment} »`, `“${r.rating_comment}”`) : ''}
            last
          />
        )}
      </Card>

      {!out && r.source === 'qr' && (
        <Text style={styles.note}>
          {t(
            `Client apporté par ${r.referrer_name ?? 'un hôtel partenaire'} : la commission se calcule sur l'addition saisie, et l'hôtel voit l'état de cette réservation en direct.`,
            `Guest referred by ${r.referrer_name ?? 'a partner hotel'}: the commission is calculated on the bill entered, and the hotel sees this reservation's status live.`
          )}
        </Text>
      )}

      {amountOpen && (
        <AmountSheet
          key={r.id}
          reservation={r}
          onClose={() => setAmountOpen(false)}
          onSave={async (n) => {
            const ok = await setAmount(r, n)
            if (ok) {
              haptic.success()
              toast.show({ message: t(`Addition enregistrée : ${mad(n, locale)}`, `Bill saved: ${mad(n, locale)}`), tone: 'success' })
            }
            return ok
          }}
        />
      )}
      <View style={styles.spacer} />
      <Button label={t('Retour à la liste', 'Back to the list')} tone="ghost" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/reservations'))} />
    </StackScreen>
  )
}

function ContactButton({ icon, label, onPress }: { icon: 'phone' | 'message-circle' | 'message-square'; label: string; onPress: () => void }) {
  return (
    <Button
      label={label}
      icon={icon}
      tone="ghost"
      onPress={() => {
        haptic.tap()
        onPress()
      }}
      style={styles.contactButton}
    />
  )
}

function Step({ icon, done, label, value, last }: { icon: 'inbox' | 'check' | 'user-check' | 'credit-card' | 'dollar-sign' | 'star'; done: boolean; label: string; value: string; last?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepRail}>
        <View style={[styles.stepDot, done && styles.stepDotDone]}>
          <Icon name={icon} size={12} color={done ? '#FFFFFF' : Light.faint} />
        </View>
        {!last && <View style={styles.stepLine} />}
      </View>
      <View style={styles.stepText}>
        <Text style={[styles.stepLabel, !done && styles.stepLabelTodo]}>{label}</Text>
        {value ? <Text style={styles.stepValue}>{value}</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  missing: {
    fontSize: 14,
    color: Light.muted,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Light.ink,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 13,
    color: Light.muted,
    marginBottom: 2,
  },
  contact: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    flex: 1,
    backgroundColor: Light.card,
  },
  actionCard: {
    gap: 10,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  actionHint: {
    fontSize: 13,
    lineHeight: 18,
    color: Light.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  grow: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
    marginBottom: 4,
  },
  notes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Light.bg,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Light.ink,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  stepRail: {
    alignItems: 'center',
    width: 24,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Light.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: Light.accent,
  },
  stepLine: {
    flex: 1,
    width: 2,
    minHeight: 14,
    backgroundColor: Light.line,
    marginVertical: 3,
  },
  stepText: {
    flex: 1,
    paddingBottom: 14,
    paddingTop: 3,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Light.ink,
  },
  stepLabelTodo: {
    color: Light.faint,
    fontWeight: '500',
  },
  stepValue: {
    marginTop: 1,
    fontSize: 12,
    color: Light.muted,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: Light.faint,
  },
  spacer: {
    height: 4,
  },
})
