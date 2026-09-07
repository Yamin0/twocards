import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Linking, StyleSheet, Text, View } from 'react-native'

import { AmountSheet } from '@/components/venue/amount-sheet'
import { Avatar, Button, Card, DetailRow, Icon, ScreenSkeleton, StackScreen, StatusPill } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { haptic } from '@/lib/haptics'
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

  const r = rows?.find((x) => x.id === id) ?? null

  if (rows === null) {
    return (
      <StackScreen title="Réservation" scroll={false}>
        <ScreenSkeleton title={false} />
      </StackScreen>
    )
  }
  if (!r) {
    return (
      <StackScreen title="Réservation">
        <Card>
          <Text style={styles.missing}>Cette réservation n&apos;existe plus.</Text>
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
      toast.show({ message: 'Modification impossible. Vérifiez votre connexion.', tone: 'danger' })
      return
    }
    haptic.success()
    toast.show({
      message,
      tone: status === 'confirmée' ? 'success' : 'default',
      action: undoable ? { label: 'Annuler', onPress: () => void setStatus({ ...r, status }, before) } : undefined,
    })
  }

  const refuse = () =>
    Alert.alert('Refuser cette réservation ?', `${r.guest_name} ne sera pas attendu${r.source === 'qr' ? " ; l'hôtel le verra aussi" : ''}.`, [
      { text: 'Garder', style: 'cancel' },
      { text: 'Refuser', style: 'destructive', onPress: () => void change('annulée', 'Réservation refusée') },
    ])

  const noShow = () =>
    Alert.alert('Client absent ?', 'La réservation passe en no-show et ne compte plus dans vos chiffres.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'No-show', style: 'destructive', onPress: () => void change('no-show', 'Marquée no-show') },
    ])

  const arrive = async () => {
    haptic.tap()
    const ok = await checkIn(r)
    if (ok) {
      haptic.success()
      toast.show({ message: `${r.guest_name} est arrivé`, tone: 'success' })
    } else {
      toast.show({ message: "Impossible d'enregistrer l'arrivée.", tone: 'danger' })
    }
  }

  const originLabel =
    r.source === 'qr' ? r.referrer_name ?? 'Hôtel partenaire' : r.source === 'portal' ? 'Portail de réservation' : 'Prise par vous'

  return (
    <StackScreen title="Réservation" subtitle={time ? `${dayLabel(r.reservation_date)} · ${time}` : dayLabel(r.reservation_date)}>
      <Card style={styles.head}>
        <Avatar name={r.guest_name} size={56} />
        <View style={styles.headText}>
          <Text style={styles.name}>{r.guest_name}</Text>
          <Text style={styles.sub}>
            {r.party_size} {r.party_size > 1 ? 'personnes' : 'personne'}
            {r.service_name ? ` · ${r.service_name}` : ''}
          </Text>
          <StatusPill status={r.status} />
        </View>
      </Card>

      <View style={styles.contact}>
        <ContactButton icon="phone" label="Appeler" onPress={() => Linking.openURL(`tel:${phone}`)} />
        <ContactButton icon="message-circle" label="WhatsApp" onPress={() => Linking.openURL(whatsappUrl(phone))} />
        <ContactButton icon="message-square" label="SMS" onPress={() => Linking.openURL(`sms:${phone}`)} />
      </View>

      {r.status === 'en attente' && (
        <Card style={styles.actionCard}>
          <Text style={styles.actionTitle}>Demande à traiter</Text>
          <Text style={styles.actionHint}>Confirmez si la table ou le créneau est disponible. Le client et l&apos;hôtel sont prévenus.</Text>
          <View style={styles.actions}>
            <Button label="Confirmer" tone="success" icon="check" onPress={() => void change('confirmée', 'Réservation confirmée')} style={styles.grow} />
            <Button label="Refuser" tone="danger" icon="x" onPress={refuse} style={styles.grow} />
          </View>
        </Card>
      )}

      {r.status === 'confirmée' && (
        <Card style={styles.actionCard}>
          <View style={styles.actions}>
            {!r.arrived_at && !past && <Button label="Client arrivé" icon="user-check" onPress={arrive} style={styles.grow} />}
            {r.amount_spent === null && (past || r.arrived_at) && (
              <Button label="Saisir l'addition" tone={r.arrived_at ? 'accent' : 'ghost'} icon="edit-3" onPress={() => setAmountOpen(true)} style={styles.grow} />
            )}
            {r.amount_spent !== null && <Button label="Modifier le montant" tone="ghost" icon="edit-3" onPress={() => setAmountOpen(true)} style={styles.grow} />}
          </View>
          {!r.arrived_at && (past || r.reservation_date === today) && (
            <Button label="Client absent (no-show)" tone="ghost" icon="user-x" onPress={noShow} />
          )}
        </Card>
      )}

      {out && (
        <Card style={styles.actionCard}>
          <Text style={styles.actionHint}>
            {r.status === 'annulée' ? 'Refusée ou annulée. Vous pouvez la rétablir si le client revient.' : 'Client absent. Vous pouvez rétablir la réservation si c’était une erreur.'}
          </Text>
          <Button label="Rétablir la réservation" tone="ghost" icon="rotate-ccw" onPress={() => void change('confirmée', 'Réservation rétablie', false)} />
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Détails</Text>
        <DetailRow icon="calendar" label="Date" value={dayLabel(r.reservation_date)} />
        <DetailRow icon="clock" label="Heure" value={time ?? 'Non précisée'} />
        <DetailRow icon="users" label={r.service_name ? 'Participants' : 'Couverts'} value={String(r.party_size)} />
        <DetailRow icon="phone" label="Téléphone" value={r.guest_phone} onPress={() => Linking.openURL(`tel:${phone}`)} />
        <DetailRow icon={r.source === 'qr' ? 'briefcase' : r.source === 'portal' ? 'globe' : 'user'} label="Origine" value={originLabel} />
        {r.notes ? (
          <View style={styles.notes}>
            <Icon name="message-square" size={14} color={Light.faint} />
            <Text style={styles.notesText}>{r.notes}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Suivi</Text>
        <Step icon="inbox" done label="Demande reçue" value={`${new Date(r.created_at).toLocaleDateString('fr-FR')} · ${hourOf(r.created_at)}`} />
        <Step icon="check" done={r.status !== 'en attente'} label={r.status === 'annulée' ? 'Refusée' : r.status === 'no-show' ? 'No-show' : 'Confirmée'} value={r.status === 'en attente' ? 'En attente de votre réponse' : ''} />
        <Step icon="user-check" done={!!r.arrived_at} label="Client arrivé" value={r.arrived_at ? hourOf(r.arrived_at) : ''} />
        <Step
          icon="credit-card"
          done={r.amount_spent !== null}
          label="Addition"
          value={r.amount_spent !== null ? `${mad(r.amount_spent)}${r.amount_source === 'pos' ? ' · caisse' : ''}` : ''}
        />
        {r.source === 'qr' && (
          <Step
            icon="dollar-sign"
            done={r.commission > 0}
            label={`Commission ${Math.round(r.commission_rate * 100)} %`}
            value={r.commission > 0 ? `${mad(r.commission)} à ${r.referrer_name ?? "l'hôtel"}` : 'Calculée à la saisie de l’addition'}
            last={r.rating === null}
          />
        )}
        {r.rating !== null && (
          <Step icon="star" done label={`Avis ${r.rating}/5`} value={r.rating_comment ? `« ${r.rating_comment} »` : ''} last />
        )}
      </Card>

      {!out && r.source === 'qr' && (
        <Text style={styles.note}>
          Client apporté par {r.referrer_name ?? 'un hôtel partenaire'} : la commission se calcule sur l&apos;addition saisie, et l&apos;hôtel voit l&apos;état de cette réservation en direct.
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
              toast.show({ message: `Addition enregistrée : ${mad(n)}`, tone: 'success' })
            }
            return ok
          }}
        />
      )}
      <View style={styles.spacer} />
      <Button label="Retour à la liste" tone="ghost" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/reservations'))} />
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
