import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Light } from '@/constants/theme'
import { haptic } from '@/lib/haptics'
import { isOut, todayIso, type Reservation } from '@/lib/venue-data'

import { Button, Icon, StatusPill } from './ui'

/* Une réservation dans une liste : l'heure d'abord, puisque c'est elle
   qu'on cherche en salle, puis qui, combien, d'où. Les gestes qui comptent
   restent sous le pouce ; le reste est dans la fiche, au toucher. */
export function ReservationCard({
  r,
  onConfirm,
  onRefuse,
  onCheckIn,
  onAmount,
  compact,
  showDate,
}: {
  r: Reservation
  onConfirm: () => void
  onRefuse: () => void
  onCheckIn: () => void
  onAmount: () => void
  compact?: boolean
  /* Dans une liste sans en-tête de jour, la date accompagne l'heure. */
  showDate?: boolean
}) {
  const router = useRouter()
  const today = todayIso()
  const past = r.reservation_date < today
  const out = isOut(r)
  const time = r.reservation_time ? r.reservation_time.slice(0, 5) : '—'
  const people = `${r.party_size} pers.`
  const origin =
    r.source === 'qr' ? r.referrer_name ?? 'Hôtel partenaire' : r.source === 'portal' ? 'Portail direct' : 'Maison'
  const originIcon = r.source === 'qr' ? 'briefcase' : r.source === 'portal' ? 'globe' : 'user'

  return (
    <Pressable
      onPress={() => {
        haptic.select()
        router.push({ pathname: '/venue/reservation', params: { id: r.id } })
      }}
      style={({ pressed }) => [styles.card, out && styles.cardOut, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Réservation de ${r.guest_name} à ${time}`}>
      <View style={styles.row}>
        <View style={styles.time}>
          <Text style={[styles.timeText, out && styles.timeOut]}>{time}</Text>
          {showDate && <Text style={styles.dateText}>{shortDay(r.reservation_date)}</Text>}
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, out && styles.nameOut]} numberOfLines={1}>
              {r.guest_name}
            </Text>
            <StatusPill status={r.status} />
          </View>
          <Text style={styles.details} numberOfLines={1}>
            {people}
            {r.service_name ? ` · ${r.service_name}` : ''}
            {r.arrived_at ? ' · arrivé' : ''}
            {r.amount_spent !== null ? ` · ${r.amount_spent.toLocaleString('fr-FR')} MAD` : ''}
          </Text>
          <View style={styles.originRow}>
            <Icon name={originIcon} size={12} color={r.source === 'qr' ? Light.accent : Light.faint} />
            <Text style={[styles.origin, r.source === 'qr' && styles.originQr]} numberOfLines={1}>
              {origin}
            </Text>
            {r.notes && !compact ? (
              <>
                <Icon name="message-square" size={12} color={Light.faint} />
                <Text style={styles.notes} numberOfLines={1}>
                  {r.notes}
                </Text>
              </>
            ) : null}
          </View>
        </View>
        <Icon name="chevron-right" size={16} color={Light.faint} />
      </View>

      {r.status === 'en attente' ? (
        <View style={styles.actions}>
          <Button label="Confirmer" tone="success" small icon="check" onPress={onConfirm} style={styles.grow} />
          <Button label="Refuser" tone="danger" small icon="x" onPress={onRefuse} style={styles.grow} />
        </View>
      ) : !out && !compact ? (
        <View style={styles.actions}>
          {!r.arrived_at && !past && (
            <Button label="Client arrivé" tone="accent" small icon="user-check" onPress={onCheckIn} style={styles.grow} />
          )}
          {(past || r.arrived_at) && r.amount_spent === null && (
            <Button label="Saisir l'addition" tone={r.arrived_at ? 'accent' : 'ghost'} small icon="edit-3" onPress={onAmount} style={styles.grow} />
          )}
        </View>
      ) : null}
    </Pressable>
  )
}

const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
function shortDay(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return `${DAYS[d.getDay()]} ${d.getDate()}`
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Light.card,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  cardOut: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  time: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Light.bg,
    alignSelf: 'stretch',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  timeOut: {
    color: Light.muted,
  },
  dateText: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    color: Light.muted,
    textTransform: 'uppercase',
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
    letterSpacing: -0.2,
  },
  nameOut: {
    color: Light.muted,
    textDecorationLine: 'line-through',
  },
  details: {
    fontSize: 13,
    color: Light.muted,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  origin: {
    fontSize: 12,
    fontWeight: '500',
    color: Light.faint,
    marginRight: 6,
  },
  originQr: {
    color: Light.accent,
    fontWeight: '600',
  },
  notes: {
    flex: 1,
    fontSize: 12,
    color: Light.faint,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  grow: {
    flex: 1,
  },
})
