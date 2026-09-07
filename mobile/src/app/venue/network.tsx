import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { Avatar, Card, Empty, Icon, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { mad, shortDate, useReferrers } from '@/lib/venue-data'

/* Le cœur de twocards vu de l'établissement : quel hôtel lui envoie qui,
   pour combien, et ce que ça lui coûte. */
export default function NetworkScreen() {
  const rows = useReferrers()
  const total = (rows ?? []).reduce((s, r) => s + Number(r.reservations), 0)

  return (
    <StackScreen
      title="Réseau apporteurs"
      subtitle={rows ? `${rows.length} hôtel${rows.length > 1 ? 's' : ''} · ${total} sortie${total > 1 ? 's' : ''}` : undefined}>
      {rows === null ? (
        <ActivityIndicator color={Light.accent} />
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            icon="share-2"
            title="Aucun apporteur pour le moment"
            body="Dès qu'un hôtel partenaire vous envoie un client par son QR code, il apparaît ici avec ses chiffres."
          />
        </Card>
      ) : (
        rows.map((r) => (
          <Card key={r.referrer_id} style={styles.card}>
            <View style={styles.head}>
              <Avatar name={r.referrer_name} size={42} />
              <View style={styles.headText}>
                <Text style={styles.name} numberOfLines={1}>
                  {r.referrer_name}
                </Text>
                <Text style={styles.hint}>
                  {r.reservations} sortie{Number(r.reservations) > 1 ? 's' : ''} · {r.covers} couverts
                  {r.last_reservation ? ` · dernière le ${shortDate(r.last_reservation)}` : ''}
                </Text>
              </View>
              {r.avg_rating !== null && (
                <View style={styles.rating}>
                  <Icon name="star" size={12} color={Light.warning} />
                  <Text style={styles.ratingText}>{Number(r.avg_rating).toFixed(1).replace('.', ',')}</Text>
                </View>
              )}
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>CA apporté</Text>
                <Text style={styles.statValue}>{mad(Number(r.revenue))}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Commissions</Text>
                <Text style={[styles.statValue, styles.amber]}>{mad(Number(r.commissions))}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Panier moyen</Text>
                <Text style={styles.statValue}>
                  {Number(r.reservations) > 0 ? mad(Number(r.revenue) / Number(r.reservations)) : '—'}
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </StackScreen>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  hint: {
    fontSize: 12,
    color: Light.muted,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Light.warningSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Light.warning,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: Light.bg,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Light.muted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Light.ink,
    fontVariant: ['tabular-nums'],
  },
  amber: {
    color: Light.warning,
  },
})
