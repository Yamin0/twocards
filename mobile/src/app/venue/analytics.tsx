import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { BarChart } from '@/components/venue/bar-chart'
import { Card, Kpi, ScreenSkeleton, Segmented, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { isOut, lastDays, lastMonths, mad, useVenueReservations, type Reservation } from '@/lib/venue-data'

/* Analyses : les chiffres qui font prendre une décision, pas un rapport.
   Volume, conversion, panier, d'où viennent les clients, quand ils viennent. */

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function share(rows: Reservation[], pick: (r: Reservation) => boolean) {
  const n = rows.filter(pick).length
  return { n, pct: rows.length ? Math.round((n / rows.length) * 100) : 0 }
}

export default function AnalyticsScreen() {
  const { rows } = useVenueReservations()
  const [range, setRange] = useState<'week' | 'month'>('month')

  if (rows === null) {
    return (
      <StackScreen title="Analyses">
        <ScreenSkeleton title={false} bare />
      </StackScreen>
    )
  }

  const active = rows.filter((r) => !isOut(r))
  const confirmed = rows.filter((r) => r.status === 'confirmée')
  const withAmount = active.filter((r) => r.amount_spent !== null)
  const revenue = withAmount.reduce((s, r) => s + (r.amount_spent ?? 0), 0)
  const basket = withAmount.length ? revenue / withAmount.length : 0
  const rated = rows.filter((r) => r.rating !== null)
  const avg = rated.length ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : null
  const decided = rows.filter((r) => r.status !== 'en attente')
  const acceptance = decided.length ? Math.round((confirmed.length / decided.length) * 100) : 0
  const people = active.reduce((s, r) => s + r.party_size, 0)

  const sources = [
    { label: 'QR hôtel', ...share(active, (r) => r.source === 'qr'), color: Light.accent },
    { label: 'Portail direct', ...share(active, (r) => r.source === 'portal'), color: Light.success },
    { label: 'Maison', ...share(active, (r) => r.source === 'venue'), color: Light.muted },
  ]

  const byDay = DAYS.map((label, i) => ({
    key: String(i),
    label: label.slice(0, 1),
    value: active.filter((r) => new Date(`${r.reservation_date}T00:00:00`).getDay() === i).length,
  }))
  /* Semaine française : lundi en tête. */
  const week = [...byDay.slice(1), byDay[0]]

  const hours = new Map<string, number>()
  for (const r of active) if (r.reservation_time) hours.set(r.reservation_time.slice(0, 2), (hours.get(r.reservation_time.slice(0, 2)) ?? 0) + 1)
  const topHours = [...hours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

  const chart = range === 'week' ? lastDays(rows, 7) : lastMonths(rows, 6)

  return (
    <StackScreen title="Analyses" subtitle={`${rows.length} réservations au total`}>
      <View style={styles.kpiRow}>
        <Kpi label="Réservations" value={String(active.length)} hint={`${people} couverts`} />
        <Kpi label="Taux d'acceptation" value={`${acceptance} %`} hint={`${confirmed.length} confirmées`} tone="success" />
      </View>
      <View style={styles.kpiRow}>
        <Kpi label="Panier moyen" value={basket ? mad(basket) : '—'} hint={`${withAmount.length} additions`} tone="accent" />
        <Kpi label="Satisfaction" value={avg !== null ? `${avg.toFixed(1).replace('.', ',')}/5` : '—'} hint={`${rated.length} avis`} tone="warning" />
      </View>

      <Card>
        <View style={styles.head}>
          <Text style={styles.title}>Demandes reçues</Text>
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: 'week', label: '7 jours' },
              { value: 'month', label: '6 mois' },
            ]}
          />
        </View>
        <BarChart data={chart} />
      </Card>

      <Card>
        <Text style={styles.title}>D&apos;où viennent vos clients</Text>
        <View style={styles.sources}>
          {sources.map((s) => (
            <View key={s.label} style={styles.source}>
              <View style={styles.sourceHead}>
                <Text style={styles.sourceLabel}>{s.label}</Text>
                <Text style={styles.sourceValue}>
                  {s.n} · {s.pct} %
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${s.pct}%`, backgroundColor: s.color }]} />
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.note}>Seuls les clients apportés par un QR d&apos;hôtel sont commissionnés.</Text>
      </Card>

      <Card>
        <Text style={styles.title}>Jours de la semaine</Text>
        <Text style={styles.sub}>Réservations par jour, toutes dates confondues</Text>
        <BarChart data={week} height={90} />
      </Card>

      {topHours.length > 0 && (
        <Card>
          <Text style={styles.title}>Heures les plus demandées</Text>
          <View style={styles.hours}>
            {topHours.map(([h, n], i) => (
              <View key={h} style={[styles.hour, i === 0 && styles.hourTop]}>
                <Text style={[styles.hourValue, i === 0 && styles.hourValueTop]}>{h} h</Text>
                <Text style={[styles.hourHint, i === 0 && styles.hourHintTop]}>{n} résa{n > 1 ? 's' : ''}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}
    </StackScreen>
  )
}

const styles = StyleSheet.create({
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  sub: {
    fontSize: 12,
    color: Light.muted,
    marginTop: 2,
    marginBottom: 12,
  },
  sources: {
    gap: 12,
    marginTop: 12,
  },
  source: {
    gap: 6,
  },
  sourceHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sourceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Light.ink,
  },
  sourceValue: {
    fontSize: 13,
    color: Light.muted,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Light.bg,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  note: {
    marginTop: 12,
    fontSize: 11,
    color: Light.faint,
  },
  hours: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  hour: {
    flex: 1,
    backgroundColor: Light.bg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  hourTop: {
    backgroundColor: Light.ink,
  },
  hourValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Light.ink,
  },
  hourValueTop: {
    color: '#FFFFFF',
  },
  hourHint: {
    fontSize: 11,
    color: Light.muted,
  },
  hourHintTop: {
    color: 'rgba(255,255,255,0.6)',
  },
})
