import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'

import { Light } from '@/constants/theme'
import { hourOf, isOut, mad, todayIso, type Reservation } from '@/lib/venue-data'

import { Avatar, Button, StatusPill } from './ui'

/* Une réservation, avec les gestes qui comptent en salle : confirmer,
   refuser, dire que le client est là, saisir l'addition. */
export function ReservationCard({
  r,
  onConfirm,
  onRefuse,
  onCheckIn,
  onAmount,
  compact,
}: {
  r: Reservation
  onConfirm: () => void
  onRefuse: () => void
  onCheckIn: () => void
  onAmount: () => void
  compact?: boolean
}) {
  const today = todayIso()
  const past = r.reservation_date < today
  const via =
    r.source === 'qr' && r.referrer_name
      ? `via ${r.referrer_name}`
      : r.source === 'portal'
        ? 'portail direct'
        : r.source === 'venue'
          ? 'réservation maison'
          : null
  const details = [
    r.reservation_time ?? null,
    `${r.party_size} pers.`,
    r.service_name ?? null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Avatar name={r.guest_name} size={42} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {r.guest_name}
            </Text>
            <StatusPill status={r.status} />
          </View>
          <Text style={styles.details} numberOfLines={1}>
            {details}
          </Text>
          {via && (
            <Text style={styles.via} numberOfLines={1}>
              {via}
            </Text>
          )}
          {r.notes && !compact && (
            <Text style={styles.notes} numberOfLines={2}>
              « {r.notes} »
            </Text>
          )}
        </View>
      </View>

      {!compact && (
        <View style={styles.meta}>
          <Pressable
            onPress={() => Linking.openURL(`tel:${r.guest_phone.replace(/\s/g, '')}`)}
            hitSlop={6}>
            <Text style={styles.phone}>{r.guest_phone}</Text>
          </Pressable>
          {r.arrived_at && (
            <Text style={styles.arrived}>Arrivé {hourOf(r.arrived_at)}</Text>
          )}
          {r.amount_spent !== null && (
            <Text style={styles.amount}>{mad(r.amount_spent)}</Text>
          )}
        </View>
      )}

      {r.status === 'en attente' ? (
        <View style={styles.actions}>
          <Button label="Confirmer" tone="success" small onPress={onConfirm} style={styles.grow} />
          <Button label="Refuser" tone="danger" small onPress={onRefuse} style={styles.grow} />
        </View>
      ) : !isOut(r) && !compact ? (
        <View style={styles.actions}>
          {!r.arrived_at && (
            <Button label="Client arrivé" tone="accent" small onPress={onCheckIn} style={styles.grow} />
          )}
          {(past || r.arrived_at) && r.amount_spent === null && (
            <Button label="Saisir l'addition" tone="ghost" small onPress={onAmount} style={styles.grow} />
          )}
          {r.amount_spent !== null && (
            <Button label="Modifier le montant" tone="ghost" small onPress={onAmount} style={styles.grow} />
          )}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Light.card,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  details: {
    fontSize: 13,
    color: Light.muted,
  },
  via: {
    fontSize: 12,
    color: Light.accent,
    fontWeight: '500',
  },
  notes: {
    fontSize: 12,
    color: Light.muted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  phone: {
    fontSize: 13,
    fontWeight: '600',
    color: Light.ink,
    textDecorationLine: 'underline',
  },
  arrived: {
    fontSize: 12,
    fontWeight: '700',
    color: Light.success,
  },
  amount: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '700',
    color: Light.ink,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  grow: {
    flex: 1,
  },
})
