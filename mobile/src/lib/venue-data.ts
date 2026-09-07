import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'

/* Données de l'établissement, lues directement dans Supabase : la RLS ne
   laisse passer que ses réservations et ses prestations. Tenues à jour en
   temps réel, comme sur le site. */

export type ReservationStatus = 'en attente' | 'confirmée' | 'annulée' | 'no-show'

export type Reservation = {
  id: string
  category: string
  guest_name: string
  guest_phone: string
  reservation_date: string
  reservation_time: string | null
  party_size: number
  notes: string | null
  service_name: string | null
  referrer_name: string | null
  status: ReservationStatus
  commission: number
  commission_rate: number
  amount_spent: number | null
  amount_source: 'manuel' | 'pos'
  source: 'qr' | 'portal' | 'venue'
  arrived_at: string | null
  rating: number | null
  created_at: string
}

const SELECT =
  'id, category, guest_name, guest_phone, reservation_date, reservation_time, ' +
  'party_size, notes, service_name, referrer_name, status, commission, ' +
  'commission_rate, amount_spent, amount_source, source, arrived_at, rating, created_at'

const fetchRows = () =>
  supabase
    .from('qr_reservations')
    .select(SELECT)
    .order('reservation_date', { ascending: false })
    .order('reservation_time', { ascending: false })

export function useVenueReservations() {
  const [rows, setRows] = useState<Reservation[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data } = await fetchRows()
    setRows((data as Reservation[] | null) ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false
    const apply = () =>
      fetchRows().then(({ data }) => {
        if (!cancelled) setRows((data as Reservation[] | null) ?? [])
      })
    apply()
    const channel = supabase
      .channel('venue-reservations-native')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'qr_reservations' },
        () => {
          apply()
        }
      )
      .subscribe()
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  /* Mise à jour optimiste : la liste bouge sous le doigt, la base suit ;
     en cas de refus, le temps réel remet la vérité. */
  const patch = useCallback((id: string, changes: Partial<Reservation>) => {
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, ...changes } : r)) ?? prev)
  }, [])

  const setStatus = useCallback(
    async (r: Reservation, status: ReservationStatus) => {
      patch(r.id, { status })
      const { error } = await supabase.from('qr_reservations').update({ status }).eq('id', r.id)
      if (error) patch(r.id, { status: r.status })
      return !error
    },
    [patch]
  )

  const checkIn = useCallback(
    async (r: Reservation) => {
      const arrived_at = new Date().toISOString()
      patch(r.id, { arrived_at })
      const { error } = await supabase.from('qr_reservations').update({ arrived_at }).eq('id', r.id)
      if (error) patch(r.id, { arrived_at: null })
      return !error
    },
    [patch]
  )

  const setAmount = useCallback(
    async (r: Reservation, amount: number) => {
      patch(r.id, { amount_spent: amount, amount_source: 'manuel' })
      const { error } = await supabase
        .from('qr_reservations')
        .update({ amount_spent: amount, amount_source: 'manuel' })
        .eq('id', r.id)
      if (error) patch(r.id, { amount_spent: r.amount_spent, amount_source: r.amount_source })
      return !error
    },
    [patch]
  )

  return { rows, loading: rows === null, refreshing, refresh, setStatus, checkIn, setAmount }
}

export type Service = {
  id: string
  name: string
  duration: string
  price: string
  active: boolean
}

export function useVenueServices(enabled: boolean) {
  const [rows, setRows] = useState<Service[] | null>(null)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    supabase
      .from('venue_services')
      .select('id, name, duration, price, active')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setRows((data as Service[] | null) ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [enabled])
  return rows
}

/* ── Aides ─────────────────────────────────────────────────────────────── */

export const isOut = (r: Reservation) => r.status === 'annulée' || r.status === 'no-show'

/* Sortie commissionnée : apportée par un QR d'hôtel, addition connue. */
export const isDue = (r: Reservation) => r.source === 'qr' && r.amount_spent !== null && !isOut(r)

export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDaysIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const mad = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} MAD`

export function dayLabel(iso: string) {
  const today = todayIso()
  if (iso === today) return "Aujourd'hui"
  if (iso === addDaysIso(1)) return 'Demain'
  if (iso === addDaysIso(-1)) return 'Hier'
  const label = new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function hourOf(ts: string) {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/* Sept derniers jours, du plus ancien à aujourd'hui, avec le nombre de
   réservations reçues chaque jour (par date de création). */
export function lastDays(rows: Reservation[], days: number) {
  const out: { key: string; label: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const key = addDaysIso(-i)
    const d = new Date(`${key}T00:00:00`)
    out.push({
      key,
      label: d.toLocaleDateString('fr-FR', { weekday: 'narrow' }).toUpperCase(),
      value: rows.filter((r) => r.created_at.slice(0, 10) === key).length,
    })
  }
  return out
}

/* Six derniers mois. */
export function lastMonths(rows: Reservation[], months: number) {
  const out: { key: string; label: string; value: number }[] = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({
      key,
      label: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
      value: rows.filter((r) => r.reservation_date.slice(0, 7) === key && !isOut(r)).length,
    })
  }
  return out
}
