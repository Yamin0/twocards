import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
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
import { Avatar, Card, Icon, IconButton, Kpi, Screen, ScreenSkeleton, SectionTitle, type IconName } from '@/components/venue/ui'
import { BottomTabInset, Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { haptic } from '@/lib/haptics'
import { useToast } from '@/lib/toast'
import {
  addDaysIso,
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
  const { fullName, venueName, tabRole, avatarUrl } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const activity = tabRole === 'activite'
  const { rows, loading, refreshing, refresh, setStatus, checkIn, setAmount } =
    useVenueReservations()
  const { rows: services } = useVenueServices(activity)
  const [range, setRange] = useState<'week' | 'month'>('week')
  const [amountFor, setAmountFor] = useState<Reservation | null>(null)

  /* Chaque chiffre mène à la liste qu'il résume, filtrée. */
  const openReservations = (filter: 'pending' | 'today' | 'upcoming' | 'past' | 'all') =>
    router.navigate({ pathname: '/reservations', params: { filter, t: String(Date.now()) } })

  if (loading || rows === null) {
    return (
      <Screen>
        <ScreenSkeleton />
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
  const hour = new Date().getHours()
  const greeting = hour < 5 || hour >= 18 ? 'Bonsoir' : 'Bonjour'
  const dateLine = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const nowHm = `${String(hour).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
  const next = today
    .filter((r) => r.status === 'confirmée' && !r.arrived_at && (r.reservation_time ?? '') >= nowHm)
    .sort((a, b) => (a.reservation_time ?? '').localeCompare(b.reservation_time ?? ''))[0]
  /* Tendance : les 7 derniers jours contre les 7 précédents. */
  const since = (d: number) => addDaysIso(-d)
  const thisWeek = rows.filter((r) => r.created_at.slice(0, 10) > since(7)).length
  const lastWeek = rows.filter((r) => r.created_at.slice(0, 10) > since(14) && r.created_at.slice(0, 10) <= since(7)).length
  const trend = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0

  /* Chaque geste confirme en bas d'écran et se défait d'un toucher. */
  const decide = async (r: Reservation, status: 'confirmée' | 'annulée') => {
    haptic.tap()
    const ok = await setStatus(r, status)
    if (!ok) {
      haptic.error()
      toast.show({ message: 'Modification impossible. Vérifiez votre connexion.', tone: 'danger' })
      return
    }
    haptic.success()
    toast.show({
      message: status === 'confirmée' ? `${r.guest_name} confirmé` : `${r.guest_name} refusé`,
      tone: status === 'confirmée' ? 'success' : 'default',
      action: { label: 'Annuler', onPress: () => void setStatus({ ...r, status }, 'en attente') },
    })
  }
  const refuse = (r: Reservation) =>
    Alert.alert('Refuser cette réservation ?', `${r.guest_name}, ${r.party_size} pers.`, [
      { text: 'Garder', style: 'cancel' },
      { text: 'Refuser', style: 'destructive', onPress: () => void decide(r, 'annulée') },
    ])
  const visibleServices = (services ?? []).filter((s) => s.active)

  const tiles = activity
    ? [
        { icon: 'tag' as IconName, label: 'Prestations', hint: 'Ce que vos clients réservent', path: '/venue/prestations' },
        { icon: 'message-circle' as IconName, label: 'Messages', hint: 'Hôtels et concierges', path: '/venue/messages' },
        { icon: 'dollar-sign' as IconName, label: 'Commissions', hint: 'À régler, réglé', path: '/venue/commissions' },
        { icon: 'bar-chart-2' as IconName, label: 'Analyses', hint: 'Tendances et panier moyen', path: '/venue/analytics' },
      ]
    : [
        { icon: 'message-circle' as IconName, label: 'Messages', hint: 'Hôtels et concierges', path: '/venue/messages' },
        { icon: 'dollar-sign' as IconName, label: 'Commissions', hint: 'À régler, réglé', path: '/venue/commissions' },
        { icon: 'share-2' as IconName, label: 'Réseau', hint: 'Qui vous envoie des clients', path: '/venue/network' },
        { icon: 'bar-chart-2' as IconName, label: 'Analyses', hint: 'Tendances et panier moyen', path: '/venue/analytics' },
      ]

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Light.accent} />}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{firstName ? `${greeting} ${firstName}` : greeting}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {dateLine.charAt(0).toUpperCase() + dateLine.slice(1)}
              {venueName ? ` · ${venueName}` : ''}
            </Text>
          </View>
          <IconButton icon="plus" label="Nouvelle réservation" onPress={() => router.push('/venue/new-reservation')} />
          <Pressable onPress={() => router.navigate('/hub')} hitSlop={8} accessibilityLabel="Menu">
            <Avatar name={fullName ?? venueName ?? 'T'} size={40} uri={avatarUrl} />
          </Pressable>
        </View>

        {/* Aujourd'hui → la liste du jour */}
        <Pressable onPress={() => openReservations('today')} style={({ pressed }) => [pressed && styles.pressed]}>
          <Card style={styles.todayCard}>
            <View style={styles.todayRow}>
              <View style={styles.todayText}>
                <Text style={styles.todayLabel}>{activity ? "Aujourd'hui" : 'Ce soir'}</Text>
                <Text style={styles.todayValue}>
                  {today.length} réservation{today.length > 1 ? 's' : ''}
                  <Text style={styles.todayMuted}>
                    {' '}· {todayPeople} {activity ? 'participant' : 'couvert'}
                    {todayPeople > 1 ? 's' : ''}
                  </Text>
                </Text>
                <Text style={styles.todayNext} numberOfLines={1}>
                  {next
                    ? `Prochaine à ${(next.reservation_time ?? '').slice(0, 5)} · ${next.guest_name}, ${next.party_size} pers.`
                    : today.length > 0
                      ? 'Tout le monde est passé ou attendu sans heure'
                      : 'Rien de prévu pour le moment'}
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color="rgba(255,255,255,0.6)" />
            </View>
          </Card>
        </Pressable>

        {/* KPI, chacun cliquable */}
        <View style={styles.kpiRow}>
          <Kpi
            label="Réservations du mois"
            value={String(thisMonth.length)}
            hint={`${rows.length} au total`}
            onPress={() => openReservations('all')}
          />
          <Kpi
            label="En attente"
            value={String(pending.length)}
            hint={pending.length > 0 ? 'à confirmer' : 'rien à traiter'}
            tone={pending.length > 0 ? 'warning' : 'success'}
            onPress={() => openReservations('pending')}
          />
        </View>
        <View style={styles.kpiRow}>
          <Kpi label="CA apporté" value={mad(revenue)} hint="additions saisies" tone="accent" onPress={() => router.push('/venue/analytics')} />
          <Kpi label="Commissions du mois" value={mad(commissionsMonth)} hint="à reverser" onPress={() => router.push('/venue/commissions')} />
        </View>

        {/* Rythme → toutes les réservations */}
        <Card>
          <View style={styles.chartHead}>
            <Pressable onPress={() => openReservations('all')} hitSlop={8}>
              <Text style={styles.chartTitle}>Demandes reçues</Text>
              <Text style={styles.chartValue}>
                {chartTotal}
                <Text style={styles.chartUnit}> sur {range === 'week' ? '7 jours' : '6 mois'}</Text>
              </Text>
              {range === 'week' && (thisWeek > 0 || lastWeek > 0) && (
                <View style={[styles.trend, trend < 0 && styles.trendDown]}>
                  <Icon name={trend >= 0 ? 'trending-up' : 'trending-down'} size={12} color={trend >= 0 ? Light.success : Light.danger} />
                  <Text style={[styles.trendText, trend < 0 && styles.trendTextDown]}>
                    {trend > 0 ? '+' : ''}{trend} % vs semaine passée
                  </Text>
                </View>
              )}
            </Pressable>
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
            onAction={() => openReservations('pending')}
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
                  onConfirm={() => void decide(r, 'confirmée')}
                  onRefuse={() => refuse(r)}
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
            <SectionTitle title="Vos prestations" action="Gérer" onAction={() => router.push('/venue/prestations')} />
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
                onPress={() => router.push(t.path as never)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
                <View style={styles.tileIcon}>
                  <Icon name={t.icon} size={18} color={Light.accent} />
                </View>
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
    gap: 10,
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
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayText: {
    flex: 1,
    minWidth: 0,
  },
  todayChevron: {
    fontSize: 26,
    color: 'rgba(255,255,255,0.5)',
    marginTop: -2,
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
  todayNext: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Light.successSoft,
  },
  trendDown: {
    backgroundColor: Light.dangerSoft,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: Light.success,
  },
  trendTextDown: {
    color: Light.danger,
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
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Light.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
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
