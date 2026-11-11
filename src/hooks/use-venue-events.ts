"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* Événements de l'établissement connecté (table venue_events, limitée au
   compte par la RLS) et réservations non annulées, qui servent aux
   chiffres « ce jour-là » de chaque événement. */

/* Valeurs de base, en français : jamais traduites avant envoi ni
   comparaison (contrainte venue_events_status_check). */
export const EVENT_STATUSES = ["Brouillon", "Ouvert", "Bientôt complet", "Fermé"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Mois de 0 à 11, comme `Date`. */
export type EventDate = { day: number; month: number; year: number };

export type VenueEvent = {
  id: number;
  title: string;
  venue: string;
  dateObj?: EventDate;
  /** Plage horaire libre, « 21:00 - 03:00 ». */
  time: string;
  status: EventStatus;
  genre: string[];
  gradient: string;
  iconIdx: number;
  coverImage: string | null;
  spots: number;
  totalSpots: number;
  reservations: number;
  revenue: string;
  /** Colonne conservée telle quelle ; jamais calculée, donc jamais affichée. */
  rpCount: number;
  closed: boolean;
  description: string;
};

export type EventDraft = Omit<VenueEvent, "id">;

/** Réservation non annulée, réduite à ce que les compteurs utilisent. */
export type DayReservation = {
  reservation_date: string;
  party_size: number;
  amount_spent: number | null;
  status: string;
};

type EventRow = {
  id: number;
  title: string;
  venue: string;
  event_day: number | null;
  event_month: number | null;
  event_year: number | null;
  time_range: string;
  status: EventStatus;
  genres: string[];
  gradient: string;
  icon_idx: number;
  cover_image: string | null;
  total_spots: number;
  spots: number;
  reservations: number;
  revenue: string;
  rp_count: number;
  closed: boolean;
  description: string;
};

/* Dégradé (classes Tailwind) des lignes anciennes qui n'en ont pas. */
export const DEFAULT_EVENT_GRADIENT = "from-purple-600 to-indigo-900";

const EVENT_SELECT =
  "id, title, venue, event_day, event_month, event_year, time_range, " +
  "status, genres, gradient, icon_idx, cover_image, total_spots, spots, " +
  "reservations, revenue, rp_count, closed, description";

function rowToEvent(r: EventRow): VenueEvent {
  return {
    id: r.id,
    title: r.title,
    venue: r.venue,
    dateObj:
      r.event_day != null && r.event_month != null && r.event_year != null
        ? { day: r.event_day, month: r.event_month, year: r.event_year }
        : undefined,
    time: r.time_range,
    status: r.status,
    genre: r.genres,
    gradient: r.gradient || DEFAULT_EVENT_GRADIENT,
    iconIdx: r.icon_idx,
    coverImage: r.cover_image,
    spots: r.spots,
    totalSpots: r.total_spots,
    reservations: r.reservations,
    revenue: r.revenue,
    rpCount: r.rp_count,
    closed: r.closed,
    description: r.description,
  };
}

function eventToRow(e: EventDraft): Omit<EventRow, "id"> {
  return {
    title: e.title,
    venue: e.venue,
    event_day: e.dateObj?.day ?? null,
    event_month: e.dateObj?.month ?? null,
    event_year: e.dateObj?.year ?? null,
    time_range: e.time,
    status: e.status,
    genres: e.genre,
    gradient: e.gradient,
    icon_idx: e.iconIdx,
    cover_image: e.coverImage,
    total_spots: e.totalSpots,
    spots: e.spots,
    reservations: e.reservations,
    revenue: e.revenue,
    rp_count: e.rpCount,
    closed: e.closed,
    description: e.description,
  };
}

export function useVenueEvents() {
  const [events, setEvents] = useState<VenueEvent[] | null>(null);
  const [error, setError] = useState(false);
  const [dayReservations, setDayReservations] = useState<DayReservation[]>([]);
  const [countsError, setCountsError] = useState(false);
  const [tick, setTick] = useState(0);

  /* Instantané courant, pour le retour arrière d'une suppression. */
  const eventsRef = useRef<VenueEvent[] | null>(null);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("venue_events")
      .select(EVENT_SELECT)
      .order("event_year", { ascending: true })
      .order("event_month", { ascending: true })
      .order("event_day", { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(true);
          return;
        }
        setError(false);
        setEvents(((data as unknown as EventRow[] | null) ?? []).map(rowToEvent));
      });

    supabase
      .from("qr_reservations")
      .select("reservation_date, party_size, amount_spent, status")
      .neq("status", "annulée")
      .then(({ data, error: err }) => {
        if (cancelled) return;
        setCountsError(Boolean(err));
        if (!err) setDayReservations((data as DayReservation[] | null) ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const reload = useCallback(() => {
    setError(false);
    setTick((n) => n + 1);
  }, []);

  /** Insère l'événement ; null si l'écriture échoue. */
  const create = useCallback(async (draft: EventDraft): Promise<VenueEvent | null> => {
    const { data, error: err } = await createClient()
      .from("venue_events")
      .insert(eventToRow(draft))
      .select(EVENT_SELECT)
      .single();
    if (err || !data) return null;
    const created = rowToEvent(data as unknown as EventRow);
    setEvents((prev) => [...(prev ?? []), created]);
    return created;
  }, []);

  const update = useCallback(async (event: VenueEvent): Promise<boolean> => {
    const { id, ...draft } = event;
    const { error: err } = await createClient()
      .from("venue_events")
      .update(eventToRow(draft))
      .eq("id", id);
    if (err) return false;
    setEvents((prev) => (prev ?? []).map((e) => (e.id === id ? event : e)));
    return true;
  }, []);

  /** Retire l'événement tout de suite ; le remet si la suppression échoue. */
  const remove = useCallback(async (id: number): Promise<boolean> => {
    const before = eventsRef.current;
    setEvents((prev) => (prev ?? []).filter((e) => e.id !== id));
    const { error: err } = await createClient().from("venue_events").delete().eq("id", id);
    if (err) {
      if (before) setEvents(before);
      return false;
    }
    return true;
  }, []);

  return {
    events: events ?? [],
    dayReservations,
    isLoading: events === null && !error,
    error: error && events === null,
    /** Les événements sont là, mais pas les réservations qui servent aux compteurs. */
    countsError,
    reload,
    create,
    update,
    remove,
  };
}
