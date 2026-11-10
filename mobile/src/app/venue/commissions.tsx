import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Avatar, Card, Empty, Icon, Kpi, ScreenSkeleton, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { intlLocale, useLocale, useT, type Translate } from '@/lib/i18n'
import {
  currentPeriod,
  isDue,
  mad,
  monthLabel,
  shortDate,
  useSettlements,
  useVenueReservations,
  type Reservation,
  type Settlement,
} from '@/lib/venue-data'

/* Commissions : ce que l'établissement reverse à chaque hôtel, mois par
   mois. Une ligne = une sortie apportée par un QR d'hôtel dont l'addition
   est connue. Un règlement, noté par twocards, vaut pour un mois et un
   hôtel : c'est ce qui sépare « à régler » de « réglé ». */

type HotelGroup = { key: string; hotelId: string | null; name: string; rows: Reservation[]; spent: number; commission: number }
type MonthGroup = { period: string; rows: Reservation[]; commission: number; hotels: HotelGroup[] }

function groupByHotel(rows: Reservation[], t: Translate): HotelGroup[] {
  const map = new Map<string, HotelGroup>()
  for (const r of rows) {
    const key = r.referrer_id ?? 'inconnu'
    const g = map.get(key) ?? { key, hotelId: r.referrer_id, name: r.referrer_name ?? t('Hôtel partenaire', 'Partner hotel'), rows: [], spent: 0, commission: 0 }
    g.rows.push(r)
    g.spent += r.amount_spent ?? 0
    g.commission += r.commission
    map.set(key, g)
  }
  return [...map.values()].sort((a, b) => b.commission - a.commission)
}

/* Les hôtels d'un mois, chacun dépliable sur ses sorties. */
function HotelList({
  month,
  open,
  toggle,
  settled,
}: {
  month: MonthGroup
  open: Set<string>
  toggle: (key: string) => void
  settled: (period: string, hotelId: string | null) => Settlement | null
}) {
  const t = useT()
  const locale = useLocale()
  return (
    <View style={styles.hotels}>
      {month.hotels.map((h) => {
        const key = `${month.period}|${h.key}`
        const isOpen = open.has(key)
        const s = settled(month.period, h.hotelId)
        return (
          <View key={key} style={styles.hotel}>
            <Pressable onPress={() => toggle(key)} style={styles.hotelHead}>
              <Avatar name={h.name} size={36} />
              <View style={styles.hotelText}>
                <Text style={styles.hotelName} numberOfLines={1}>
                  {h.name}
                </Text>
                <Text style={styles.hotelHint}>
                  {t(
                    `${h.rows.length} sortie${h.rows.length > 1 ? 's' : ''} · ${mad(h.spent, locale)} dépensés`,
                    `${h.rows.length} outing${h.rows.length === 1 ? '' : 's'} · ${mad(h.spent, locale)} spent`
                  )}
                </Text>
              </View>
              <View style={styles.hotelRight}>
                <Text style={styles.hotelAmount}>{mad(h.commission, locale)}</Text>
                <Text style={[styles.hotelStatus, s ? styles.settled : styles.pending]}>
                  {s
                    ? t(
                        `réglé le ${new Date(s.settled_at).toLocaleDateString(intlLocale(locale))}`,
                        `settled on ${new Date(s.settled_at).toLocaleDateString(intlLocale(locale))}`
                      )
                    : t('à régler', 'due')}
                </Text>
              </View>
              <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Light.faint} />
            </Pressable>
            {isOpen &&
              h.rows.map((r) => (
                <View key={r.id} style={styles.line}>
                  <View style={styles.lineText}>
                    <Text style={styles.lineName} numberOfLines={1}>
                      {r.guest_name}
                      {r.service_name ? ` · ${r.service_name}` : ''}
                    </Text>
                    <Text style={styles.lineHint}>
                      {shortDate(r.reservation_date, locale)} · {mad(r.amount_spent ?? 0, locale)} ·{' '}
                      {t(`${Math.round(r.commission_rate * 100)} %`, `${Math.round(r.commission_rate * 100)}%`)}
                      {r.amount_source === 'pos' ? t(' · caisse', ' · till') : ''}
                    </Text>
                  </View>
                  <Text style={styles.lineAmount}>{mad(r.commission, locale)}</Text>
                </View>
              ))}
          </View>
        )
      })}
    </View>
  )
}

export default function CommissionsScreen() {
  const { rows } = useVenueReservations()
  const settlements = useSettlements()
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const t = useT()
  const locale = useLocale()

  if (rows === null || settlements === null) {
    return (
      <StackScreen title="Commissions">
        <ScreenSkeleton title={false} bare />
      </StackScreen>
    )
  }

  const due = rows.filter(isDue)
  const periodOf = (r: Reservation) => r.reservation_date.slice(0, 7)
  const settled = (period: string, hotelId: string | null): Settlement | null =>
    hotelId ? settlements.find((s) => s.period === period && s.hotel_id === hotelId) ?? null : null

  const months: MonthGroup[] = [...new Set(due.map(periodOf))]
    .sort()
    .reverse()
    .map((period) => {
      const list = due.filter((r) => periodOf(r) === period)
      return { period, rows: list, commission: list.reduce((s, r) => s + r.commission, 0), hotels: groupByHotel(list, t) }
    })

  const now = currentPeriod()
  const thisMonth = months.find((m) => m.period === now) ?? null
  const history = months.filter((m) => m.period !== now)
  const remainingOf = (m: MonthGroup) => m.hotels.filter((h) => !settled(m.period, h.hotelId)).reduce((s, h) => s + h.commission, 0)
  const toSettle = months.reduce((s, m) => s + remainingOf(m), 0)
  const total = due.reduce((s, r) => s + r.commission, 0)
  const awaiting = rows.filter((r) => r.source === 'qr' && r.amount_spent === null && r.status !== 'annulée' && r.status !== 'no-show').length

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const hotelList = (month: MonthGroup) => (
    <HotelList month={month} open={open} toggle={toggle} settled={settled} />
  )

  return (
    <StackScreen title="Commissions" subtitle={t('Ce que vous reversez aux hôtels', 'What you pay out to hotels')}>
      <View style={styles.kpiRow}>
        <Kpi
          label={t('À régler ce mois', 'Due this month')}
          value={mad(thisMonth ? remainingOf(thisMonth) : 0, locale)}
          hint={
            thisMonth
              ? t(
                  `${thisMonth.rows.length} sortie${thisMonth.rows.length > 1 ? 's' : ''}`,
                  `${thisMonth.rows.length} outing${thisMonth.rows.length === 1 ? '' : 's'}`
                )
              : t('aucune sortie', 'no outings')
          }
          tone="warning"
        />
        <Kpi
          label={t('Restant dû', 'Outstanding')}
          value={mad(toSettle, locale)}
          hint={toSettle > 0 ? t('tous mois confondus', 'across all months') : t('vous êtes à jour', "you're up to date")}
        />
      </View>
      <View style={styles.kpiRow}>
        <Kpi
          label={t('Reversé au total', 'Paid out in total')}
          value={mad(total, locale)}
          hint={t(
            `${due.length} sortie${due.length > 1 ? 's' : ''} commissionnée${due.length > 1 ? 's' : ''}`,
            `${due.length} commissioned outing${due.length === 1 ? '' : 's'}`
          )}
          tone="accent"
        />
        <Kpi
          label={t('En attente de montant', 'Awaiting amount')}
          value={String(awaiting)}
          hint={awaiting > 0 ? t("saisissez l'addition", 'enter the bill') : t('tout est saisi', 'all entered')}
        />
      </View>

      <Card>
        <View style={styles.monthHead}>
          <Text style={styles.monthTitle}>{monthLabel(now, locale)}</Text>
          <Text style={styles.monthAmount}>{mad(thisMonth?.commission ?? 0, locale)}</Text>
        </View>
        <Text style={styles.monthHint}>
          {t(
            "Par hôtel d'origine. Le règlement se fait au mois clôturé, consolidé par twocards.",
            'By referring hotel. Settlement happens once the month is closed, consolidated by twocards.'
          )}
        </Text>
        {thisMonth ? (
          hotelList(thisMonth)
        ) : (
          <Text style={styles.empty}>{t('Aucune sortie commissionnée ce mois-ci pour le moment.', 'No commissioned outings this month yet.')}</Text>
        )}
      </Card>

      <Text style={styles.heading}>{t('Historique', 'History')}</Text>
      {history.length === 0 ? (
        <Card>
          <Empty
            icon="dollar-sign"
            title={t("Pas encore d'historique", 'No history yet')}
            body={t(
              'Les mois passés apparaîtront ici avec, pour chacun, ce qui a été reversé à chaque hôtel.',
              'Past months will appear here, each showing what was paid out to each hotel.'
            )}
          />
        </Card>
      ) : (
        history.map((m) => {
          const isOpen = open.has(m.period)
          const remaining = remainingOf(m)
          return (
            <Card key={m.period} style={styles.monthCard}>
              <Pressable onPress={() => toggle(m.period)} style={styles.monthRow}>
                <View style={styles.monthText}>
                  <Text style={styles.monthTitle}>{monthLabel(m.period, locale)}</Text>
                  <Text style={styles.monthHint}>
                    {t(
                      `${m.rows.length} sortie${m.rows.length > 1 ? 's' : ''} · ${m.hotels.length} hôtel${m.hotels.length > 1 ? 's' : ''}`,
                      `${m.rows.length} outing${m.rows.length === 1 ? '' : 's'} · ${m.hotels.length} hotel${m.hotels.length === 1 ? '' : 's'}`
                    )}
                  </Text>
                </View>
                <View style={styles.hotelRight}>
                  <Text style={styles.monthAmount}>{mad(m.commission, locale)}</Text>
                  <Text style={[styles.hotelStatus, remaining > 0 ? styles.pending : styles.settled]}>
                    {remaining > 0 ? t(`${mad(remaining, locale)} à régler`, `${mad(remaining, locale)} due`) : t('réglé', 'settled')}
                  </Text>
                </View>
                <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Light.faint} />
              </Pressable>
              {isOpen && hotelList(m)}
            </Card>
          )
        })
      )}

      <Text style={styles.note}>
        {t(
          "Vous reversez un pourcentage du montant réellement dépensé, 10 % par défaut, uniquement sur les clients apportés par un hôtel du réseau. Le même détail, ligne par ligne, est celui que voit l'hôtel.",
          'You pay out a percentage of the amount actually spent, 10% by default, only on guests referred by a hotel in the network. The hotel sees the same line-by-line detail.'
        )}
      </Text>
    </StackScreen>
  )
}

const styles = StyleSheet.create({
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  monthHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Light.ink,
  },
  monthAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Light.warning,
    fontVariant: ['tabular-nums'],
  },
  monthHint: {
    marginTop: 2,
    fontSize: 12,
    color: Light.muted,
  },
  monthCard: {
    paddingVertical: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthText: {
    flex: 1,
    minWidth: 0,
  },
  empty: {
    marginTop: 12,
    fontSize: 13,
    color: Light.muted,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    color: Light.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  hotels: {
    marginTop: 12,
    gap: 8,
  },
  hotel: {
    backgroundColor: Light.bg,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  hotelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hotelText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  hotelName: {
    fontSize: 14,
    fontWeight: '700',
    color: Light.ink,
  },
  hotelHint: {
    fontSize: 11,
    color: Light.muted,
  },
  hotelRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  hotelAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Light.warning,
    fontVariant: ['tabular-nums'],
  },
  hotelStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  settled: {
    color: Light.success,
  },
  pending: {
    color: Light.warning,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Light.line,
    paddingTop: 8,
  },
  lineText: {
    flex: 1,
    minWidth: 0,
  },
  lineName: {
    fontSize: 13,
    fontWeight: '600',
    color: Light.ink,
  },
  lineHint: {
    fontSize: 11,
    color: Light.muted,
  },
  lineAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Light.ink,
    fontVariant: ['tabular-nums'],
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: Light.faint,
  },
})
