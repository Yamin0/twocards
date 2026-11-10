import { StyleSheet, Text, View } from 'react-native'

import { Avatar, Card, Empty, Icon, ScreenSkeleton, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useLocale, useT } from '@/lib/i18n'
import { mad, shortDate, useReferrers } from '@/lib/venue-data'

/* Le cœur de twocards vu de l'établissement : quel hôtel lui envoie qui,
   pour combien, et ce que ça lui coûte. */
export default function NetworkScreen() {
  const rows = useReferrers()
  const t = useT()
  const locale = useLocale()
  const total = (rows ?? []).reduce((s, r) => s + Number(r.reservations), 0)

  return (
    <StackScreen
      title={t('Réseau apporteurs', 'Referral network')}
      subtitle={
        rows
          ? t(
              `${rows.length} hôtel${rows.length > 1 ? 's' : ''} · ${total} sortie${total > 1 ? 's' : ''}`,
              `${rows.length} hotel${rows.length === 1 ? '' : 's'} · ${total} outing${total === 1 ? '' : 's'}`
            )
          : undefined
      }>
      {rows === null ? (
        <ScreenSkeleton title={false} bare />
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            icon="share-2"
            title={t('Aucun apporteur pour le moment', 'No referrers yet')}
            body={t(
              "Dès qu'un hôtel partenaire vous envoie un client par son QR code, il apparaît ici avec ses chiffres.",
              'As soon as a partner hotel sends you a guest through its QR code, it appears here with its figures.'
            )}
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
                  {t(
                    `${r.reservations} sortie${Number(r.reservations) > 1 ? 's' : ''} · ${r.covers} couverts`,
                    `${r.reservations} outing${Number(r.reservations) === 1 ? '' : 's'} · ${r.covers} cover${Number(r.covers) === 1 ? '' : 's'}`
                  )}
                  {r.last_reservation
                    ? t(` · dernière le ${shortDate(r.last_reservation, locale)}`, ` · last on ${shortDate(r.last_reservation, locale)}`)
                    : ''}
                </Text>
              </View>
              {r.avg_rating !== null && (
                <View style={styles.rating}>
                  <Icon name="star" size={12} color={Light.warning} />
                  <Text style={styles.ratingText}>{t(Number(r.avg_rating).toFixed(1).replace('.', ','), Number(r.avg_rating).toFixed(1))}</Text>
                </View>
              )}
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t('CA apporté', 'Revenue brought')}</Text>
                <Text style={styles.statValue}>{mad(Number(r.revenue), locale)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Commissions</Text>
                <Text style={[styles.statValue, styles.amber]}>{mad(Number(r.commissions), locale)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t('Panier moyen', 'Average spend')}</Text>
                <Text style={styles.statValue}>
                  {Number(r.reservations) > 0 ? mad(Number(r.revenue) / Number(r.reservations), locale) : '—'}
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
