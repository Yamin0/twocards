"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GuestCategoryKey, OfferRow } from "@/lib/guest-catalog";

/* Données de l'espace hôtel, partagées par toutes les pages.

   Chaque table est chargée UNE fois, gardée en cache de module et tenue à
   jour en temps réel : naviguer d'une page à l'autre ne relance aucune
   requête et n'affiche aucun squelette. Les mutations (créer, renommer,
   activer, supprimer un QR…) mettent le cache à jour immédiatement.

   undefined = pas encore chargé, [] ou objet = chargé. */

/* ─── Types ────────────────────────────────────────────────────────────────── */

export type HotelQrCode = {
  id: string;
  label: string;
  code: string;
  active: boolean;
  scans: number;
  hidden_offers: string[];
  created_at: string;
};

export type ReservationStatus =
  | "en attente"
  | "confirmée"
  | "annulée"
  | "no-show";

export type HotelReservation = {
  id: string;
  qr_code_id: string | null;
  /* Libellé du QR scanné (« Chambre 101 »). Null si le QR a été supprimé. */
  qr_label: string | null;
  category: string;
  venue_name: string;
  venue_slug: string | null;
  guest_name: string;
  guest_phone: string;
  reservation_date: string;
  reservation_time: string | null;
  party_size: number;
  notes: string | null;
  status: ReservationStatus;
  commission: number;
  commission_rate: number;
  amount_spent: number | null;
  amount_source: "manuel" | "pos";
  arrived_at: string | null;
  rating: number | null;
  rating_comment: string | null;
  rated_at: string | null;
  source: string;
  created_at: string;
};

export type HotelProfile = {
  hotel_name: string | null;
  city: string | null;
  accent_color: string;
  background_color: string;
  cover_url: string | null;
  welcome_message: string | null;
  reception_phone: string | null;
  show_prices: boolean;
  /* Adresses du catalogue réseau retirées pour tout l'hôtel (slugs). */
  hidden_offers: string[];
};

export const DEFAULT_PROFILE: HotelProfile = {
  hotel_name: null,
  city: null,
  accent_color: "#13305c",
  background_color: "#f4f3ef",
  cover_url: null,
  welcome_message: null,
  reception_phone: null,
  show_prices: true,
  hidden_offers: [],
};

/* Offre du catalogue réseau (lecture seule côté hôtel). */
export type CatalogOffer = OfferRow & {
  slug: string;
  category: GuestCategoryKey;
  city: string | null;
  tag: string;
  description: string;
  price: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

/* Adresse maison ajoutée par l'hôtel, visible sur ses seuls QR codes. */
export type HotelOffer = {
  id: string;
  slug: string;
  category: GuestCategoryKey;
  name: string;
  tag: string;
  description: string;
  price: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type HotelOfferInput = Omit<HotelOffer, "id" | "slug" | "created_at" | "sort_order">;

/* ─── Mini store générique ─────────────────────────────────────────────────── */

type Store<T> = {
  get: () => T | undefined;
  set: (next: T) => void;
  subscribe: (l: () => void) => () => void;
  reload: () => Promise<void>;
  failed: () => boolean;
};

function createStore<T>(
  load: () => Promise<T>,
  empty: T,
  realtime?: (reload: () => void) => () => void
): Store<T> {
  let snapshot: T | undefined = undefined;
  let failed = false;
  let started = false;
  let stopRealtime: (() => void) | null = null;
  let stopTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const l of listeners) l();
  };

  const reload = async () => {
    try {
      snapshot = await load();
      failed = false;
    } catch {
      /* Requête en échec (réseau, session expirée) : on sort de l'état de
         chargement avec une valeur vide et un drapeau, plutôt que de laisser
         un squelette tourner indéfiniment. */
      failed = true;
      if (snapshot === undefined) snapshot = empty;
    }
    notify();
  };

  const start = () => {
    if (started) return;
    started = true;
    void reload();
    if (realtime) stopRealtime = realtime(() => void reload());
  };

  const stop = () => {
    started = false;
    stopRealtime?.();
    stopRealtime = null;
  };

  return {
    get: () => snapshot,
    set: (next) => {
      snapshot = next;
      notify();
    },
    failed: () => failed,
    reload,
    subscribe: (l) => {
      listeners.add(l);
      if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
      }
      start();
      return () => {
        listeners.delete(l);
        /* Le dernier abonné parti (changement d'espace, déconnexion), on
           coupe le temps réel après un délai : une navigation interne
           ré-abonne bien avant. Le cache, lui, reste. */
        if (listeners.size === 0) {
          stopTimer = setTimeout(stop, 30_000);
        }
      };
    },
  };
}

const serverSnapshot = () => undefined;

function useStore<T>(store: Store<T>) {
  return useSyncExternalStore(store.subscribe, store.get, serverSnapshot);
}

function realtimeOn(table: string, channel: string) {
  return (reload: () => void) => {
    const supabase = createClient();
    const ch = supabase
      .channel(channel)
      .on("postgres_changes", { event: "*", schema: "public", table }, reload)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  };
}

/* ─── QR codes ─────────────────────────────────────────────────────────────── */

const QR_SELECT = "id, label, code, active, scans, hidden_offers, created_at";

const qrStore = createStore<HotelQrCode[]>(async () => {
  const { data, error } = await createClient()
    .from("hotel_qr_codes")
    .select(QR_SELECT)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HotelQrCode[];
}, [], realtimeOn("hotel_qr_codes", "hotel-qr-codes"));

const newCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 8);

export function useHotelQrCodes() {
  const snapshot = useStore(qrStore);

  const create = useCallback(async (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return null;
    const { data, error } = await createClient()
      .from("hotel_qr_codes")
      .insert({ label: trimmed, code: newCode() })
      .select(QR_SELECT)
      .single();
    if (error || !data) return null;
    const row = data as HotelQrCode;
    qrStore.set([...(qrStore.get() ?? []), row]);
    return row;
  }, []);

  const createMany = useCallback(async (labels: string[]) => {
    const rows = labels
      .map((l) => l.trim())
      .filter(Boolean)
      .map((label) => ({ label, code: newCode() }));
    if (rows.length === 0) return [];
    const { data, error } = await createClient()
      .from("hotel_qr_codes")
      .insert(rows)
      .select(QR_SELECT);
    if (error || !data) return null;
    const created = data as HotelQrCode[];
    qrStore.set([...(qrStore.get() ?? []), ...created]);
    return created;
  }, []);

  const update = useCallback(
    async (id: string, patch: Partial<Pick<HotelQrCode, "label" | "active" | "hidden_offers">>) => {
      const { error } = await createClient()
        .from("hotel_qr_codes")
        .update(patch)
        .eq("id", id);
      if (error) return false;
      qrStore.set(
        (qrStore.get() ?? []).map((q) => (q.id === id ? { ...q, ...patch } : q))
      );
      return true;
    },
    []
  );

  const updateMany = useCallback(
    async (ids: string[], patch: Partial<Pick<HotelQrCode, "active">>) => {
      if (ids.length === 0) return true;
      const { error } = await createClient()
        .from("hotel_qr_codes")
        .update(patch)
        .in("id", ids);
      if (error) return false;
      const set = new Set(ids);
      qrStore.set(
        (qrStore.get() ?? []).map((q) => (set.has(q.id) ? { ...q, ...patch } : q))
      );
      return true;
    },
    []
  );

  const remove = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return true;
    const { error } = await createClient()
      .from("hotel_qr_codes")
      .delete()
      .in("id", ids);
    if (error) return false;
    const set = new Set(ids);
    qrStore.set((qrStore.get() ?? []).filter((q) => !set.has(q.id)));
    /* Les réservations rattachées disparaissent en cascade côté base. */
    void reservationStore.reload();
    return true;
  }, []);

  return {
    qrCodes: snapshot ?? [],
    isLoading: snapshot === undefined,
    failed: qrStore.failed(),
    create,
    createMany,
    update,
    updateMany,
    remove,
    refresh: qrStore.reload,
  };
}

/* ─── Réservations ─────────────────────────────────────────────────────────── */

const RES_SELECT =
  "id, qr_code_id, category, venue_name, venue_slug, guest_name, guest_phone, " +
  "reservation_date, reservation_time, party_size, notes, status, commission, " +
  "commission_rate, amount_spent, amount_source, arrived_at, rating, " +
  "rating_comment, rated_at, source, created_at, hotel_qr_codes(label)";

type ResRow = Omit<HotelReservation, "qr_label" | "commission" | "commission_rate" | "amount_spent"> & {
  commission: number | string | null;
  commission_rate: number | string | null;
  amount_spent: number | string | null;
  hotel_qr_codes: { label: string } | { label: string }[] | null;
};

const num = (v: number | string | null) =>
  v === null || v === undefined ? null : typeof v === "number" ? v : Number(v);

const toReservation = ({ hotel_qr_codes, ...r }: ResRow): HotelReservation => ({
  ...r,
  qr_label: Array.isArray(hotel_qr_codes)
    ? (hotel_qr_codes[0]?.label ?? null)
    : (hotel_qr_codes?.label ?? null),
  commission: num(r.commission) ?? 0,
  commission_rate: num(r.commission_rate) ?? 0.1,
  amount_spent: num(r.amount_spent),
  party_size: r.party_size ?? 0,
  amount_source: r.amount_source ?? "manuel",
  source: r.source ?? "qr",
});

const reservationStore = createStore<HotelReservation[]>(async () => {
  const { data, error } = await createClient()
    .from("qr_reservations")
    .select(RES_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as unknown as ResRow[] | null) ?? []).map(toReservation);
}, [], realtimeOn("qr_reservations", "hotel-qr-reservations"));

export function useHotelReservations() {
  const snapshot = useStore(reservationStore);
  return {
    reservations: snapshot ?? [],
    isLoading: snapshot === undefined,
    failed: reservationStore.failed(),
    refresh: reservationStore.reload,
  };
}

/* ─── Profil public de l'hôtel ─────────────────────────────────────────────── */

const profileStore = createStore<HotelProfile>(async () => {
  const { data, error } = await createClient()
    .from("hotel_profiles")
    .select(
      "hotel_name, city, accent_color, background_color, cover_url, welcome_message, reception_phone, show_prices, hidden_offers"
    )
    .maybeSingle();
  if (error) throw error;
  return data ? { ...DEFAULT_PROFILE, ...(data as Partial<HotelProfile>) } : DEFAULT_PROFILE;
}, DEFAULT_PROFILE);

export function useHotelProfile() {
  const snapshot = useStore(profileStore);

  const save = useCallback(async (patch: Partial<HotelProfile>) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const next = { ...(profileStore.get() ?? DEFAULT_PROFILE), ...patch };
    const { error } = await supabase.from("hotel_profiles").upsert(
      {
        user_id: user.id,
        ...next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) return false;
    profileStore.set(next);
    return true;
  }, []);

  return {
    profile: snapshot ?? DEFAULT_PROFILE,
    isLoading: snapshot === undefined,
    save,
  };
}

/* ─── Catalogue réseau (lecture) ───────────────────────────────────────────── */

const CATALOG_SELECT =
  "slug, category, name, city, tag, description, price, image_url, active, sort_order";

const catalogStore = createStore<CatalogOffer[]>(async () => {
  const { data, error } = await createClient()
    .from("catalog_offers")
    .select(CATALOG_SELECT)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CatalogOffer[];
}, []);

export function useCatalog() {
  const snapshot = useStore(catalogStore);
  return {
    catalog: snapshot ?? [],
    isLoading: snapshot === undefined,
    failed: catalogStore.failed(),
    refresh: catalogStore.reload,
  };
}

/* ─── Adresses maison de l'hôtel ───────────────────────────────────────────── */

const OFFER_SELECT =
  "id, slug, category, name, tag, description, price, image_url, active, sort_order, created_at";

const offersStore = createStore<HotelOffer[]>(async () => {
  const { data, error } = await createClient()
    .from("hotel_offers")
    .select(OFFER_SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HotelOffer[];
}, []);

export function useHotelOffers() {
  const snapshot = useStore(offersStore);

  const create = useCallback(async (input: HotelOfferInput) => {
    const current = offersStore.get() ?? [];
    const sort_order = current.reduce((m, o) => Math.max(m, o.sort_order), 0) + 10;
    const { data, error } = await createClient()
      .from("hotel_offers")
      .insert({ ...input, sort_order })
      .select(OFFER_SELECT)
      .single();
    if (error || !data) return null;
    const row = data as HotelOffer;
    offersStore.set([...current, row]);
    return row;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<HotelOfferInput & { sort_order: number }>) => {
    const { error } = await createClient()
      .from("hotel_offers")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return false;
    offersStore.set(
      (offersStore.get() ?? []).map((o) => (o.id === id ? { ...o, ...patch } : o))
    );
    return true;
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await createClient().from("hotel_offers").delete().eq("id", id);
    if (error) return false;
    offersStore.set((offersStore.get() ?? []).filter((o) => o.id !== id));
    return true;
  }, []);

  return {
    offers: snapshot ?? [],
    isLoading: snapshot === undefined,
    failed: offersStore.failed(),
    create,
    update,
    remove,
    refresh: offersStore.reload,
  };
}

/* Tout l'espace en une fois : la plupart des pages ont besoin des trois. */
export function useHotelSpace() {
  const qr = useHotelQrCodes();
  const res = useHotelReservations();
  const profile = useHotelProfile();
  const catalog = useCatalog();
  const offers = useHotelOffers();
  return {
    ...qr,
    reservations: res.reservations,
    profile: profile.profile,
    saveProfile: profile.save,
    catalog: catalog.catalog,
    hotelOffers: offers.offers,
    isLoading:
      qr.isLoading || res.isLoading || profile.isLoading || catalog.isLoading || offers.isLoading,
    failed: qr.failed || res.failed,
  };
}
