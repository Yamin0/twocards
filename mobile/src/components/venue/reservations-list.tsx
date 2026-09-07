import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Alert,
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
import { Chip, Empty, Icon, IconButton, LargeTitle, Screen, ScreenSkeleton } from '@/components/venue/ui'
import { BottomTabInset, Light } from '@/constants/theme'
import { haptic } from '@/lib/haptics'
import { useToast } from '@/lib/toast'
import {
  dayLabel,
  isOut,
  mad,
  todayIso,
  useVenueReservations,
  type Reservation,
} from '@/lib/venue-data'

/* Réservations de l'établissement : accepter une demande doit prendre deux
   gestes. En attente d'abord, puis le jour, puis le reste. Chaque décision
   se confirme en bas d'écran et se défait d'un toucher. */

export type Filter = 'pending' | 'today' | 'upcoming' | 'past' | 'all'

export function ReservationsList({
  requested,
  requestKey,
}: {
  /* Filtre demandé par un autre écran (accueil, notification). */
  requested: Filter | null
  /* Change à chaque demande, pour qu'une même valeur redemandée s'applique. */
  requestKey: string
}) {
  const router = useRouter()
  const toast = useToast()
  const { rows, loading, refreshing, refresh, setStatus, checkIn, setAmount } =
    useVenueReservations()
  const [filter, setFilter] = useState<Filter>(requested ?? 'pending')
  const [applied, setApplied] = useState(requestKey)
  const [query, setQuery] = useState('')
  const [amountFor, setAmountFor] = useState<Reservation | null>(null)

  /* Ajustement pendant le rendu : une nouvelle demande de filtre remplace
     le choix courant, une seule fois. */
  if (requested && requestKey !== applied) {
    setApplied(requestKey)
    setFilter(requested)
  }

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
    return [...map.entries()].map(([date, data]) => {
      const live = data.filter((r) => !isOut(r))
      const people = live.reduce((s, r) => s + r.party_size, 0)
      const spent = live.reduce((s, r) => s + (r.amount_spent ?? 0), 0)
      return { title: dayLabel(date), date, data, people, live: live.length, spent }
    })
  }, [rows, filter, query, today])

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
    Alert.alert('Refuser cette réservation ?', `${r.guest_name}, ${r.party_size} pers.${r.source === 'qr' ? " L'hôtel le verra aussi." : ''}`, [
      { text: 'Garder', style: 'cancel' },
      { text: 'Refuser', style: 'destructive', onPress: () => void decide(r, 'annulée') },
    ])

  const arrive = async (r: Reservation) => {
    haptic.tap()
    const ok = await checkIn(r)
    if (ok) {
      haptic.success()
      toast.show({ message: `${r.guest_name} est arrivé`, tone: 'success' })
    } else {
      toast.show({ message: "Impossible d'enregistrer l'arrivée.", tone: 'danger' })
    }
  }

  if (loading) {
    return (
      <Screen>
        <ScreenSkeleton />
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
  const searching = query.trim().length > 0

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(r) => r.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Light.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <LargeTitle
              title="Réservations"
              subtitle={
                counts.pending > 0
                  ? `${counts.pending} demande${counts.pending > 1 ? 's' : ''} à confirmer`
                  : `${counts.today} aujourd'hui · ${counts.upcoming} à venir`
              }
              right={<IconButton icon="plus" label="Nouvelle réservation" onPress={() => router.push('/venue/new-reservation')} />}
            />
            <View style={styles.search}>
              <Icon name="search" size={16} color={Light.faint} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Nom ou numéro"
                placeholderTextColor={Light.faint}
                autoCorrect={false}
                clearButtonMode="while-editing"
                style={styles.searchInput}
              />
            </View>
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
          <View style={styles.dayRow}>
            <Text style={[styles.day, section.date === today && styles.dayToday]}>{section.title}</Text>
            <Text style={styles.dayMeta}>
              {section.live > 0 ? `${section.live} · ${section.people} pers.` : `${section.data.length}`}
              {section.spent > 0 ? ` · ${mad(section.spent)}` : ''}
            </Text>
          </View>
        )}
        renderItem={({ item: r }) => (
          <View style={styles.item}>
            <ReservationCard
              r={r}
              onConfirm={() => void decide(r, 'confirmée')}
              onRefuse={() => refuse(r)}
              onCheckIn={() => void arrive(r)}
              onAmount={() => setAmountFor(r)}
            />
          </View>
        )}
        ListEmptyComponent={
          searching ? (
            <Empty icon="search" title="Aucun résultat" body={`Aucune réservation ne correspond à « ${query.trim()} » dans ce filtre.`} />
          ) : (
            <Empty icon={filter === 'pending' ? 'inbox' : 'calendar'} title={emptyCopy[filter][0]} body={emptyCopy[filter][1]} />
          )
        }
      />
      <AmountSheet
        key={amountFor?.id ?? 'none'}
        reservation={amountFor}
        onClose={() => setAmountFor(null)}
        onSave={async (n) => {
          if (!amountFor) return false
          const ok = await setAmount(amountFor, n)
          if (ok) {
            haptic.success()
            toast.show({ message: `Addition enregistrée : ${mad(n)}`, tone: 'success' })
          }
          return ok
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: BottomTabInset + 24,
  },
  header: {
    gap: 12,
    marginBottom: 6,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    backgroundColor: Light.card,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: Light.ink,
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  day: {
    fontSize: 13,
    fontWeight: '700',
    color: Light.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayToday: {
    color: Light.accent,
  },
  dayMeta: {
    fontSize: 12,
    color: Light.faint,
    fontVariant: ['tabular-nums'],
  },
  item: {
    marginBottom: 10,
  },
})
