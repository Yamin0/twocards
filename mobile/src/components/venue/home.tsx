import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { AmountSheet } from '@/components/venue/amount-sheet'
import { BarChart } from '@/components/venue/bar-chart'
import { ReservationCard } from '@/components/venue/reservation-card'
import { Avatar, Card, Kpi, Screen, SectionTitle } from '@/components/venue/ui'
import { BottomTabInset, Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { WEB_PAGES } from '@/lib/site'
import {
  isDue,
  isOut,
  lastDays,
  lastMonths,
  mad,
  todayIso,
  useVenueReservations,
  useVenueServices,
  type Reservation,
} from '@/lib/venue-data'

/* Accueil de l'établissement : ce qui attend une réponse, les chiffres du
   mois, le rythme des demandes, et les raccourcis vers le reste. */
export function VenueHome() {
  const { fullName, venueName, tabRole } = useAuth()
  const router = useRouter()
  const activity = tabRole === 'activite'
  const { rows, loading, refreshing, refresh, setStatus, checkIn, setAmount } =
    useVenueReservations()
  const services = useVenueServices(activity)
  const [range, setRange] = useState<'week' | 'month'>('week')
  const [amountFor, setAmountFor] = useState<Reservation | null>(null)

  const openWeb = (path: string) =>
    router.push({ pathname: '/web', params: { path, title: WEB_PAGES[path] ?? '' } })

  if (loading || rows === null) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Light.accent} />
        </View>
      </Screen>
    )
  }

  const month = todayIso().slice(0, 7)
  const active = rows.filter((r) => !isOut(r))
  const thisMonth = active.filter((r) => r.reservation_date.startsWith(month))
  const pending = rows
    .filter((r) => r.status === 'en attente')
    .sort(
      (a, b) =>
        a.reservation_date.localeCompare(b.reservation_date) ||
        (a.reservation_time ?? '').localeCompare(b.reservation_time ?? '')
    )
  const revenue = active.reduce((s, r) => s + (r.amount_spent ?? 0), 0)
  const commissionsMonth = rows
    .filter((r) => isDue(r) && r.reservation_date.startsWith(month))
    .reduce((s, r) => s + r.commission, 0)
  const today = active.filter((r) => r.reservation_date === todayIso())
  const todayPeople = today.reduce((s, r) => s + r.party_size, 0)
  const chart = range === 'week' ? lastDays(rows, 7) : lastMonths(rows, 6)
  const chartTotal = chart.reduce((s, d) => s + d.value, 0)
  const firstName = fullName?.split(' ')[0]
  const visibleServices = (services ?? []).filter((s) => s.active)

  const tiles = activity
    ? [
        { label: 'Prestations', hint: 'Ce que vos clients réservent', path: '/dashboard/prestations' },
        { label: 'Messages', hint: 'Hôtels et concierges', path: '/dashboard/messages' },
        { label: 'Commissions', hint: 'À régler, réglé', path: '/dashboard/commissions' },
        { label: 'Analyses', hint: 'Tendances et panier moyen', path: '/dashboard/analytics' },
      ]
    : [
        { label: 'Messages', hint: 'Hôtels et concierges', path: '/dashboard/messages' },
        { label: 'Commissions', hint: 'À régler, réglé', path: '/dashboard/commissions' },
        { label: 'Réseau', hint: 'Qui vous envoie des clients', path: '/dashboard/network' },
        { label: 'Analyses', hint: 'Tendances et panier moyen', path: '/dashboard/analytics' },
      ]

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Light.accent} />}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Accueil</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {firstName ? `Bonjour ${firstName}` : 'Bonjour'}
              {venueName ? ` · ${venueName}` : ''}
            </Text>
          </View>
          <Pressable onPress={() => router.navigate('/hub')} hitSlop={8}>
            <Avatar name={fullName ?? venueName ?? 'T'} size={40} />
          </Pressable>
        </View>

        {/* Aujourd'hui */}
        <Card style={styles.todayCard}>
          <Text style={styles.todayLabel}>{activity ? "Aujourd'hui" : 'Ce soir'}</Text>
          <Text style={styles.todayValue}>
            {today.length} réservation{today.length > 1 ? 's' : ''}
            <Text style={styles.todayMuted}>
              {' '}· {todayPeople} {activity ? 'participant' : 'couvert'}
              {todayPeople > 1 ? 's' : ''}
            </Text>
          </Text>
        </Card>

        {/* KPI */}
        <View style={styles.kpiRow}>
          <Kpi label="Réservations du mois" value={String(thisMonth.length)} hint={`${rows.length} au total`} />
          <Kpi
            label="En attente"
            value={String(pending.length)}
            hint={pending.length > 0 ? 'à confirmer' : 'rien à traiter'}
            tone={pending.length > 0 ? 'warning' : 'success'}
          />
        </View>
        <View style={styles.kpiRow}>
          <Kpi label="CA apporté" value={mad(revenue)} hint="additions saisies" tone="accent" />
          <Kpi label="Commissions du mois" value={mad(commissionsMonth)} hint="à reverser" />
        </View>

        {/* Rythme */}
        <Card>
          <View style={styles.chartHead}>
            <View>
              <Text style={styles.chartTitle}>Demandes reçues</Text>
              <Text style={styles.chartValue}>
                {chartTotal}
                <Text style={styles.chartUnit}> sur {range === 'week' ? '7 jours' : '6 mois'}</Text>
              </Text>
            </View>
            <View style={styles.segment}>
              {(['week', 'month'] as const).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setRange(k)}
                  style={[styles.segmentItem, range === k && styles.segmentActive]}>
                  <Text style={[styles.segmentText, range === k && styles.segmentTextActive]}>
                    {k === 'week' ? 'Semaine' : 'Mois'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <BarChart data={chart} />
        </Card>

        {/* À traiter */}
        <View>
          <SectionTitle
            title="À traiter"
            action={pending.length > 0 ? 'Tout voir' : undefined}
            onAction={() => router.navigate('/reservations')}
          />
          {pending.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>
                Rien en attente. Chaque nouvelle demande arrive ici, et sur votre téléphone en notification.
              </Text>
            </Card>
          ) : (
            <View style={styles.list}>
              {pending.slice(0, 3).map((r) => (
                <ReservationCard
                  key={r.id}
                  r={r}
                  compact
                  onConfirm={() => setStatus(r, 'confirmée')}
                  onRefuse={() => setStatus(r, 'annulée')}
                  onCheckIn={() => checkIn(r)}
                  onAmount={() => setAmountFor(r)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Prestations */}
        {activity && services !== null && (
          <View>
            <SectionTitle title="Vos prestations" action="Gérer" onAction={() => openWeb('/dashboard/prestations')} />
            <Card>
              {visibleServices.length === 0 ? (
                <Text style={styles.emptyText}>
                  Aucune prestation visible : votre fiche n&apos;affiche que son nom. Ajoutez une balade, un
                  transfert, un massage…
                </Text>
              ) : (
                visibleServices.slice(0, 4).map((s, i) => (
                  <View key={s.id} style={[styles.serviceRow, i > 0 && styles.serviceRowBorder]}>
                    <View style={styles.serviceText}>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {s.name}
                      </Text>
                      {s.duration ? <Text style={styles.serviceHint}>{s.duration}</Text> : null}
                    </View>
                    <Text style={styles.servicePrice}>{s.price || '—'}</Text>
                  </View>
                ))
              )}
            </Card>
          </View>
        )}

        {/* Raccourcis */}
        <View>
          <SectionTitle title="Fonctionnalités" action="Tout le menu" onAction={() => router.navigate('/hub')} />
          <View style={styles.tiles}>
            {tiles.map((t) => (
              <Pressable
                key={t.path}
                onPress={() => openWeb(t.path)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
                <Text style={styles.tileLabel}>{t.label}</Text>
                <Text style={styles.tileHint} numberOfLines={2}>
                  {t.hint}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <AmountSheet
        key={amountFor?.id ?? 'none'}
        reservation={amountFor}
        onClose={() => setAmountFor(null)}
        onSave={(n) => (amountFor ? setAmount(amountFor, n) : Promise.resolve(false))}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: BottomTabInset + 24,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Light.ink,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: Light.muted,
  },
  todayCard: {
    backgroundColor: Light.ink,
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  todayValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  todayMuted: {
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chartHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  chartValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '700',
    color: Light.ink,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  chartUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: Light.muted,
    letterSpacing: 0,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Light.bg,
    borderRadius: 10,
    padding: 3,
  },
  segmentItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: Light.card,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Light.muted,
  },
  segmentTextActive: {
    color: Light.ink,
  },
  list: {
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: Light.muted,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  serviceRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Light.line,
  },
  serviceText: {
    flex: 1,
    minWidth: 0,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: Light.ink,
  },
  serviceHint: {
    fontSize: 12,
    color: Light.muted,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Light.ink,
    fontVariant: ['tabular-nums'],
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: Light.card,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  tileLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  tileHint: {
    fontSize: 12,
    color: Light.muted,
  },
})
