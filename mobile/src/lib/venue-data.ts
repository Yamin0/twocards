import * as ImagePicker from 'expo-image-picker'
import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'

/* Données de l'établissement, lues directement dans Supabase : la RLS ne
   laisse passer que ses réservations, ses prestations, ses fils de
   discussion. Tenues à jour en temps réel, comme sur le site. */

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
  referrer_id: string | null
  referrer_name: string | null
  status: ReservationStatus
  commission: number
  commission_rate: number
  amount_spent: number | null
  amount_source: 'manuel' | 'pos'
  source: 'qr' | 'portal' | 'venue'
  arrived_at: string | null
  rating: number | null
  rating_comment: string | null
  created_at: string
}

const SELECT =
  'id, category, guest_name, guest_phone, reservation_date, reservation_time, ' +
  'party_size, notes, service_name, referrer_id, referrer_name, status, commission, ' +
  'commission_rate, amount_spent, amount_source, source, arrived_at, rating, rating_comment, created_at'

const fetchRows = () =>
  supabase
    .from('qr_reservations')
    .select(SELECT)
    .order('reservation_date', { ascending: false })
    .order('reservation_time', { ascending: false })

/* Plusieurs écrans montent ce hook : le client Supabase refuse deux
   abonnements sur un même nom de canal, chaque instance prend le sien. */
let channelSeq = 0
const channelName = (prefix: string) => `${prefix}-${++channelSeq}-${Date.now()}`

/* Abonnement générique : relance `apply` à chaque changement d'une table. */
function useRealtime(table: string, apply: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const channel = supabase
      .channel(channelName(table))
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => apply())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, apply, enabled])
}

export function useVenueReservations() {
  const [rows, setRows] = useState<Reservation[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data } = await fetchRows()
    setRows((data as Reservation[] | null) ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchRows().then(({ data }) => {
      if (!cancelled) setRows((data as Reservation[] | null) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [])
  useRealtime('qr_reservations', load)

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

/* ── Règlements de commissions (notés par twocards) ─────────────────── */

export type Settlement = { period: string; hotel_id: string; amount: number; settled_at: string }

export function useSettlements() {
  const [rows, setRows] = useState<Settlement[] | null>(null)
  const load = useCallback(async () => {
    const { data } = await supabase
      .from('commission_settlements')
      .select('period, hotel_id, amount, settled_at')
    setRows((data as Settlement[] | null) ?? [])
  }, [])
  useEffect(() => {
    let cancelled = false
    supabase
      .from('commission_settlements')
      .select('period, hotel_id, amount, settled_at')
      .then(({ data }) => {
        if (!cancelled) setRows((data as Settlement[] | null) ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [])
  useRealtime('commission_settlements', load)
  return rows
}

/* ── Prestations ───────────────────────────────────────────────────────── */

export type Service = {
  id: string
  name: string
  description: string
  duration: string
  price: string
  image_url: string | null
  active: boolean
  sort_order: number
}

export type ServiceDraft = Omit<Service, 'id' | 'sort_order'>

const SERVICE_SELECT = 'id, name, description, duration, price, image_url, active, sort_order'

export function useVenueServices(enabled = true) {
  const [rows, setRows] = useState<Service[] | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('venue_services')
      .select(SERVICE_SELECT)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    setRows((data as Service[] | null) ?? [])
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    supabase
      .from('venue_services')
      .select(SERVICE_SELECT)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setRows((data as Service[] | null) ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  const save = useCallback(
    async (userId: string, id: string | null, draft: ServiceDraft) => {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        duration: draft.duration.trim(),
        price: draft.price.trim(),
        image_url: draft.image_url,
        active: draft.active,
      }
      const { error } = id
        ? await supabase.from('venue_services').update(payload).eq('id', id)
        : await supabase.from('venue_services').insert({
            ...payload,
            owner_id: userId,
            sort_order: ((rows ?? []).at(-1)?.sort_order ?? 0) + 10,
          })
      if (!error) await load()
      return !error
    },
    [rows, load]
  )

  const toggle = useCallback(
    async (s: Service) => {
      setRows((prev) => prev?.map((x) => (x.id === s.id ? { ...x, active: !s.active } : x)) ?? prev)
      const { error } = await supabase.from('venue_services').update({ active: !s.active }).eq('id', s.id)
      if (error) await load()
      return !error
    },
    [load]
  )

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('venue_services').delete().eq('id', id)
      if (!error) await load()
      return !error
    },
    [load]
  )

  /* Monter ou descendre : on échange les rangs des deux voisines. */
  const move = useCallback(
    async (s: Service, dir: -1 | 1) => {
      const list = rows ?? []
      const i = list.findIndex((x) => x.id === s.id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return false
      const a = list[i]
      const b = list[j]
      const ra = a.sort_order === b.sort_order ? b.sort_order + dir * 10 : b.sort_order
      const rb = a.sort_order
      const next = [...list]
      next[i] = { ...b, sort_order: rb }
      next[j] = { ...a, sort_order: ra }
      setRows(next)
      const [r1, r2] = await Promise.all([
        supabase.from('venue_services').update({ sort_order: ra }).eq('id', a.id),
        supabase.from('venue_services').update({ sort_order: rb }).eq('id', b.id),
      ])
      if (r1.error || r2.error) await load()
      return !(r1.error || r2.error)
    },
    [rows, load]
  )

  return { rows, save, toggle, remove, move, reload: load }
}

/* Photo d'une prestation : choisie dans la pellicule, envoyée dans le
   même bucket que le site, sous le dossier du compte. */
export async function pickAndUploadImage(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) return null
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.75,
  })
  if (res.canceled || !res.assets[0]) return null
  const asset = res.assets[0]
  const response = await fetch(asset.uri)
  const buffer = await response.arrayBuffer()
  const path = `${userId}/service-${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, buffer, { contentType: asset.mimeType ?? 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

/* ── Notifications (la cloche du site) ─────────────────────────────────── */

export type Notification = {
  id: number
  kind: 'reservation' | 'rating' | 'pos'
  title: string
  body: string
  href: string
  read: boolean
  created_at: string
}

const NOTIF_SELECT = 'id, kind, title, body, href, read, created_at'

export function useNotifications() {
  const [rows, setRows] = useState<Notification[] | null>(null)
  const load = useCallback(async () => {
    const { data } = await supabase
      .from('venue_notifications')
      .select(NOTIF_SELECT)
      .order('created_at', { ascending: false })
      .limit(100)
    setRows((data as Notification[] | null) ?? [])
  }, [])
  useEffect(() => {
    let cancelled = false
    supabase
      .from('venue_notifications')
      .select(NOTIF_SELECT)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!cancelled) setRows((data as Notification[] | null) ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [])
  useRealtime('venue_notifications', load)

  const markRead = useCallback(async (id: number) => {
    setRows((prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? prev)
    await supabase.from('venue_notifications').update({ read: true }).eq('id', id)
  }, [])
  const markAllRead = useCallback(async () => {
    setRows((prev) => prev?.map((n) => ({ ...n, read: true })) ?? prev)
    await supabase.from('venue_notifications').update({ read: true }).eq('read', false)
  }, [])
  const clearAll = useCallback(async () => {
    setRows([])
    await supabase.from('venue_notifications').delete().gte('id', 0)
  }, [])

  return { rows, markRead, markAllRead, clearAll }
}

/* ── Messagerie (établissement ↔ concierge) ────────────────────────────── */

export type Profile = { id: string; full_name: string | null; venue_name: string | null; role: string; city: string | null }

export type Message = {
  id: number
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

export type Conversation = {
  id: string
  counterpart: Profile
  last: Message | null
  unread: number
}

export const profileName = (p: Profile | null | undefined) =>
  p?.venue_name || p?.full_name || 'Contact'

export function useConversations(userId: string | null) {
  const [rows, setRows] = useState<Conversation[] | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, venue_id, concierge_id, created_at')
    const list = (convs ?? []) as { id: string; venue_id: string; concierge_id: string }[]
    if (list.length === 0) {
      setRows([])
      return
    }
    const otherIds = [...new Set(list.map((c) => (c.venue_id === userId ? c.concierge_id : c.venue_id)))]
    const [{ data: profiles }, { data: msgs }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, venue_name, role, city').in('id', otherIds),
      supabase
        .from('messages')
        .select('id, conversation_id, sender_id, body, created_at, read_at')
        .in('conversation_id', list.map((c) => c.id))
        .order('created_at', { ascending: true }),
    ])
    const byId = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]))
    const out: Conversation[] = list.map((c) => {
      const mine = ((msgs ?? []) as Message[]).filter((m) => m.conversation_id === c.id)
      const otherId = c.venue_id === userId ? c.concierge_id : c.venue_id
      return {
        id: c.id,
        counterpart: byId.get(otherId) ?? { id: otherId, full_name: null, venue_name: null, role: '', city: null },
        last: mine.at(-1) ?? null,
        unread: mine.filter((m) => m.sender_id !== userId && !m.read_at).length,
      }
    })
    out.sort((a, b) => (b.last?.created_at ?? '').localeCompare(a.last?.created_at ?? ''))
    setRows(out)
  }, [userId])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) load()
    })
    return () => {
      cancelled = true
    }
  }, [load])
  useRealtime('messages', load)
  useRealtime('conversations', load)

  /* Ouvre ou retrouve le fil avec un interlocuteur. */
  const open = useCallback(
    async (counterpartId: string, myRole: 'venue' | 'concierge') => {
      if (!userId) return null
      const venue_id = myRole === 'venue' ? userId : counterpartId
      const concierge_id = myRole === 'venue' ? counterpartId : userId
      const { data } = await supabase
        .from('conversations')
        .insert({ venue_id, concierge_id })
        .select('id')
        .single()
      if (data) return data.id as string
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('venue_id', venue_id)
        .eq('concierge_id', concierge_id)
        .maybeSingle()
      return (existing?.id as string) ?? null
    },
    [userId]
  )

  return { rows, open, reload: load }
}

export function useContacts(role: string) {
  const [rows, setRows] = useState<Profile[] | null>(null)
  useEffect(() => {
    let cancelled = false
    supabase
      .from('profiles')
      .select('id, full_name, venue_name, role, city')
      .eq('role', role)
      .order('venue_name', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setRows((data as Profile[] | null) ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [role])
  return rows
}

export function useThread(conversationId: string | null, userId: string | null) {
  const [rows, setRows] = useState<Message[] | null>(null)

  const load = useCallback(async () => {
    if (!conversationId) return
    const { data } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at, read_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setRows((data as Message[] | null) ?? [])
    /* Ce qui vient de l'autre est lu dès qu'on l'a sous les yeux. */
    if (userId) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null)
    }
  }, [conversationId, userId])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) load()
    })
    return () => {
      cancelled = true
    }
  }, [load])
  useRealtime('messages', load, conversationId !== null)

  const send = useCallback(
    async (body: string) => {
      if (!conversationId || !userId) return false
      const text = body.trim()
      if (!text) return false
      const { error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: userId, body: text })
      if (!error) await load()
      return !error
    },
    [conversationId, userId, load]
  )

  return { rows, send }
}

/* ── Réseau apporteurs ─────────────────────────────────────────────────── */

export type Referrer = {
  referrer_id: string
  referrer_name: string
  reservations: number
  covers: number
  revenue: number
  commissions: number
  last_reservation: string | null
  avg_rating: number | null
}

export function useReferrers() {
  const [rows, setRows] = useState<Referrer[] | null>(null)
  useEffect(() => {
    let cancelled = false
    supabase.rpc('venue_referrers').then(({ data }) => {
      if (!cancelled) setRows((data as Referrer[] | null) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [])
  return rows
}

/* ── Profil ────────────────────────────────────────────────────────────── */

export async function updateProfile(
  userId: string,
  fields: { full_name: string; venue_name: string; city: string; phone: string }
) {
  const { error } = await supabase.auth.updateUser({ data: fields })
  if (error) return false
  await supabase
    .from('profiles')
    .update({ full_name: fields.full_name || null, venue_name: fields.venue_name || null, city: fields.city || null })
    .eq('id', userId)
  return true
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

export const currentPeriod = () => todayIso().slice(0, 7)

export const mad = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} MAD`

export function monthLabel(period: string) {
  const label = new Date(`${period}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

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

/* « il y a 5 min », « hier », « 12 août ». */
export function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'hier'
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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
