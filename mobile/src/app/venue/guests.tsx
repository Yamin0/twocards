import { useMemo, useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { Avatar, Card, Empty, Icon, Pill, ScreenSkeleton, StackScreen, inputStyle } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useLocale, useT } from '@/lib/i18n'
import { isOut, mad, shortDate, useVenueReservations } from '@/lib/venue-data'

/* Clients : un numéro de téléphone, une personne. Ses visites, ce qu'elle
   dépense, sa dernière venue, sa note. */

type Guest = {
  key: string
  name: string
  phone: string
  visits: number
  spent: number
  last: string
  rating: number | null
  via: string | null
}

export default function GuestsScreen() {
  const { rows } = useVenueReservations()
  const [query, setQuery] = useState('')
  const t = useT()
  const locale = useLocale()

  const guests = useMemo(() => {
    const map = new Map<string, Guest>()
    for (const r of rows ?? []) {
      const key = r.guest_phone.replace(/\D/g, '') || r.guest_name.toLowerCase()
      const g = map.get(key) ?? {
        key,
        name: r.guest_name,
        phone: r.guest_phone,
        visits: 0,
        spent: 0,
        last: r.reservation_date,
        rating: null,
        via: r.referrer_name,
      }
      if (!isOut(r)) {
        g.visits += 1
        g.spent += r.amount_spent ?? 0
      }
      if (r.reservation_date > g.last) {
        g.last = r.reservation_date
        g.name = r.guest_name
      }
      if (r.rating !== null) g.rating = r.rating
      map.set(key, g)
    }
    const q = query.trim().toLowerCase()
    return [...map.values()]
      .filter((g) => !q || g.name.toLowerCase().includes(q) || g.phone.replace(/\s/g, '').includes(q))
      .sort((a, b) => b.visits - a.visits || b.last.localeCompare(a.last))
  }, [rows, query])

  const loyal = guests.filter((g) => g.visits >= 2).length

  return (
    <StackScreen
      title={t('Clients', 'Guests')}
      subtitle={
        rows
          ? t(
              `${guests.length} client${guests.length > 1 ? 's' : ''} · ${loyal} fidèle${loyal > 1 ? 's' : ''}`,
              `${guests.length} guest${guests.length === 1 ? '' : 's'} · ${loyal} regular${loyal === 1 ? '' : 's'}`
            )
          : undefined
      }>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('Rechercher un nom ou un numéro', 'Search a name or number')}
        placeholderTextColor={Light.faint}
        style={inputStyle}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {rows === null ? (
        <ScreenSkeleton title={false} bare />
      ) : guests.length === 0 ? (
        <Card>
          <Empty
            icon="users"
            title={t('Aucun client', 'No guests')}
            body={t('Chaque réservation reçue crée ou enrichit une fiche client ici.', 'Every reservation received creates or updates a guest profile here.')}
          />
        </Card>
      ) : (
        <Card style={styles.list}>
          {guests.map((g, i) => (
            <Pressable
              key={g.key}
              onPress={() => Linking.openURL(`tel:${g.phone.replace(/\s/g, '')}`)}
              style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && styles.pressed]}>
              <Avatar name={g.name} size={40} />
              <View style={styles.text}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {g.name}
                  </Text>
                  {g.visits >= 3 ? (
                    <Pill label={t('Habitué', 'Regular')} tone="accent" />
                  ) : g.visits === 2 ? (
                    <Pill label={t('Revenu', 'Returning')} tone="success" />
                  ) : null}
                </View>
                <Text style={styles.hint} numberOfLines={1}>
                  {t(
                    `${g.visits} visite${g.visits > 1 ? 's' : ''} · dernière le ${shortDate(g.last, locale)}`,
                    `${g.visits} visit${g.visits === 1 ? '' : 's'} · last on ${shortDate(g.last, locale)}`
                  )}
                  {g.via ? ` · via ${g.via}` : ''}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.spent}>{g.spent > 0 ? mad(g.spent, locale) : '—'}</Text>
                {g.rating !== null && (
                  <View style={styles.rating}>
                    <Icon name="star" size={11} color={Light.warning} />
                    <Text style={styles.ratingText}>{g.rating}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </Card>
      )}
    </StackScreen>
  )
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Light.line,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  hint: {
    fontSize: 12,
    color: Light.muted,
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  spent: {
    fontSize: 14,
    fontWeight: '700',
    color: Light.ink,
    fontVariant: ['tabular-nums'],
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: Light.warning,
  },
})
