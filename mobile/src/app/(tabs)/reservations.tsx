import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { AmountSheet } from '@/components/venue/amount-sheet'
import { ReservationCard } from '@/components/venue/reservation-card'
import { Chip, Empty, Screen } from '@/components/venue/ui'
import { BottomTabInset, Light } from '@/constants/theme'
import {
  dayLabel,
  isOut,
  todayIso,
  useVenueReservations,
  type Reservation,
} from '@/lib/venue-data'

/* Réservations, premier onglet : accepter une demande doit prendre deux
   gestes. En attente d'abord, puis le jour, puis le reste. */

type Filter = 'pending' | 'today' | 'upcoming' | 'past' | 'all'

export default function ReservationsTab() {
  const { rows, loading, refreshing, refresh, setStatus, checkIn, setAmount } =
    useVenueReservations()
  const [filter, setFilter] = useState<Filter>('pending')
  const [query, setQuery] = useState('')
  const [amountFor, setAmountFor] = useState<Reservation | null>(null)

  const today = todayIso()
  const counts = useMemo(() => {
    const r = rows ?? []
    return {
      pending: r.filter((x) => x.status === 'en attente').length,
      today: r.filter((x) => x.reservation_date === today && !isOut(x)).length,
      upcoming: r.filter((x) => x.reservation_date > today && !isOut(x)).length,
      past: r.filter((x) => x.reservation_date < today).length,
      all: r.length,
    }
  }, [rows, today])

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = (rows ?? []).filter((r) => {
      if (filter === 'pending' && r.status !== 'en attente') return false
      if (filter === 'today' && (r.reservation_date !== today || isOut(r))) return false
      if (filter === 'upcoming' && (r.reservation_date <= today || isOut(r))) return false
      if (filter === 'past' && r.reservation_date >= today) return false
      if (q && !r.guest_name.toLowerCase().includes(q) && !r.guest_phone.replace(/\s/g, '').includes(q))
        return false
      return true
    })
    /* À venir en ordre chronologique, passé du plus récent au plus ancien. */
    const asc = filter === 'pending' || filter === 'upcoming' || filter === 'today'
    list.sort(
      (a, b) =>
        (asc ? 1 : -1) *
        (a.reservation_date.localeCompare(b.reservation_date) ||
          (a.reservation_time ?? '').localeCompare(b.reservation_time ?? ''))
    )
    const map = new Map<string, Reservation[]>()
    for (const r of list) {
      const arr = map.get(r.reservation_date) ?? []
      arr.push(r)
      map.set(r.reservation_date, arr)
    }
    return [...map.entries()].map(([date, data]) => ({ title: dayLabel(date), date, data }))
  }, [rows, filter, query, today])

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Light.accent} />
        </View>
      </Screen>
    )
  }

  const emptyCopy: Record<Filter, [string, string]> = {
    pending: ['Rien en attente', 'Chaque nouvelle demande apparaît ici et vous est notifiée.'],
    today: ["Rien aujourd'hui", "Aucune réservation confirmée pour aujourd'hui."],
    upcoming: ['Rien à venir', 'Les prochaines réservations confirmées apparaîtront ici.'],
    past: ['Aucun historique', 'Les réservations passées apparaîtront ici.'],
    all: ['Aucune réservation', "Dès qu'un client réserve chez vous, il apparaît ici."],
  }

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(r) => r.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Light.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Réservations</Text>
            <Text style={styles.subtitle}>
              {counts.pending > 0
                ? `${counts.pending} demande${counts.pending > 1 ? 's' : ''} à confirmer`
                : `${counts.today} aujourd'hui · ${counts.upcoming} à venir`}
            </Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher un client ou un numéro"
              placeholderTextColor={Light.faint}
              autoCorrect={false}
              clearButtonMode="while-editing"
              style={styles.search}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="En attente" count={counts.pending} active={filter === 'pending'} onPress={() => setFilter('pending')} />
              <Chip label="Aujourd'hui" count={counts.today} active={filter === 'today'} onPress={() => setFilter('today')} />
              <Chip label="À venir" count={counts.upcoming} active={filter === 'upcoming'} onPress={() => setFilter('upcoming')} />
              <Chip label="Passées" active={filter === 'past'} onPress={() => setFilter('past')} />
              <Chip label="Toutes" active={filter === 'all'} onPress={() => setFilter('all')} />
            </ScrollView>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.day, section.date === today && styles.dayToday]}>{section.title}</Text>
        )}
        renderItem={({ item: r }) => (
          <View style={styles.item}>
            <ReservationCard
              r={r}
              onConfirm={() => setStatus(r, 'confirmée')}
              onRefuse={() => setStatus(r, 'annulée')}
              onCheckIn={() => checkIn(r)}
              onAmount={() => setAmountFor(r)}
            />
          </View>
        )}
        ListEmptyComponent={<Empty title={emptyCopy[filter][0]} body={emptyCopy[filter][1]} />}
      />
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
  },
  header: {
    gap: 12,
    marginBottom: 6,
    paddingTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Light.ink,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: -8,
    fontSize: 13,
    color: Light.muted,
  },
  search: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Light.card,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Light.ink,
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  day: {
    fontSize: 13,
    fontWeight: '700',
    color: Light.muted,
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayToday: {
    color: Light.accent,
  },
  item: {
    marginBottom: 10,
  },
})
