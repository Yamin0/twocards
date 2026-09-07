import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { Avatar, Card, Empty, Icon, Kpi, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
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

function groupByHotel(rows: Reservation[]): HotelGroup[] {
  const map = new Map<string, HotelGroup>()
  for (const r of rows) {
    const key = r.referrer_id ?? 'inconnu'
    const g = map.get(key) ?? { key, hotelId: r.referrer_id, name: r.referrer_name ?? 'Hôtel partenaire', rows: [], spent: 0, commission: 0 }
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
                  {h.rows.length} sortie{h.rows.length > 1 ? 's' : ''} · {mad(h.spent)} dépensés
                </Text>
              </View>
              <View style={styles.hotelRight}>
                <Text style={styles.hotelAmount}>{mad(h.commission)}</Text>
                <Text style={[styles.hotelStatus, s ? styles.settled : styles.pending]}>
                  {s ? `réglé le ${new Date(s.settled_at).toLocaleDateString('fr-FR')}` : 'à régler'}
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
                      {shortDate(r.reservation_date)} · {mad(r.amount_spent ?? 0)} · {Math.round(r.commission_rate * 100)} %
                      {r.amount_source === 'pos' ? ' · caisse' : ''}
                    </Text>
                  </View>
                  <Text style={styles.lineAmount}>{mad(r.commission)}</Text>
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

  if (rows === null || settlements === null) {
    return (
      <StackScreen title="Commissions">
        <ActivityIndicator color={Light.accent} />
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
      return { period, rows: list, commission: list.reduce((s, r) => s + r.commission, 0), hotels: groupByHotel(list) }
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
    <StackScreen title="Commissions" subtitle="Ce que vous reversez aux hôtels">
      <View style={styles.kpiRow}>
        <Kpi label="À régler ce mois" value={mad(thisMonth ? remainingOf(thisMonth) : 0)} hint={thisMonth ? `${thisMonth.rows.length} sortie${thisMonth.rows.length > 1 ? 's' : ''}` : 'aucune sortie'} tone="warning" />
        <Kpi label="Restant dû" value={mad(toSettle)} hint={toSettle > 0 ? 'tous mois confondus' : 'vous êtes à jour'} />
      </View>
      <View style={styles.kpiRow}>
        <Kpi label="Reversé au total" value={mad(total)} hint={`${due.length} sortie${due.length > 1 ? 's' : ''} commissionnée${due.length > 1 ? 's' : ''}`} tone="accent" />
        <Kpi label="En attente de montant" value={String(awaiting)} hint={awaiting > 0 ? "saisissez l'addition" : 'tout est saisi'} />
      </View>

      <Card>
        <View style={styles.monthHead}>
          <Text style={styles.monthTitle}>{monthLabel(now)}</Text>
          <Text style={styles.monthAmount}>{mad(thisMonth?.commission ?? 0)}</Text>
        </View>
        <Text style={styles.monthHint}>Par hôtel d&apos;origine. Le règlement se fait au mois clôturé, consolidé par twocards.</Text>
        {thisMonth ? (
          hotelList(thisMonth)
        ) : (
          <Text style={styles.empty}>Aucune sortie commissionnée ce mois-ci pour le moment.</Text>
        )}
      </Card>

      <Text style={styles.heading}>Historique</Text>
      {history.length === 0 ? (
        <Card>
          <Empty icon="dollar-sign" title="Pas encore d'historique" body="Les mois passés apparaîtront ici avec, pour chacun, ce qui a été reversé à chaque hôtel." />
        </Card>
      ) : (
        history.map((m) => {
          const isOpen = open.has(m.period)
          const remaining = remainingOf(m)
          return (
            <Card key={m.period} style={styles.monthCard}>
              <Pressable onPress={() => toggle(m.period)} style={styles.monthRow}>
                <View style={styles.monthText}>
                  <Text style={styles.monthTitle}>{monthLabel(m.period)}</Text>
                  <Text style={styles.monthHint}>
                    {m.rows.length} sortie{m.rows.length > 1 ? 's' : ''} · {m.hotels.length} hôtel{m.hotels.length > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.hotelRight}>
                  <Text style={styles.monthAmount}>{mad(m.commission)}</Text>
                  <Text style={[styles.hotelStatus, remaining > 0 ? styles.pending : styles.settled]}>
                    {remaining > 0 ? `${mad(remaining)} à régler` : 'réglé'}
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
        Vous reversez un pourcentage du montant réellement dépensé, 10 % par défaut, uniquement sur les clients
        apportés par un hôtel du réseau. Le même détail, ligne par ligne, est celui que voit l&apos;hôtel.
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
