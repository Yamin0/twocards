"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* Données du plan de salle : les tables du compte (venue_tables) et les
   réservations assignées à ces tables pour une date (qr_reservations).
   Mêmes tables, colonnes, RPC et canaux temps réel qu'avant la découpe ;
   sur qr_reservations, l'établissement n'écrit que arrived_at et table_id
   ici. Chaque chargement expose un état d'erreur et un `reload`. */

/* ─── Tables ────────────────────────────────────────────────────────────── */

/* Ligne venue_tables. Les valeurs `shape` et `status` sont celles de la
   base : jamais traduites avant envoi ou comparaison. */
export type VenueTable = {
  id: number;
  label: string;
  x: number;
  y: number;
  shape: "round" | "rect";
  status: "available" | "occupied" | "blocked";
  vip: boolean;
  capacity: number;
};

export type VenueTablePatch = Partial<Omit<VenueTable, "id">>;

const TABLE_SELECT = "id, label, x, y, shape, status, vip, capacity";

const fetchTables = () =>
  createClient()
    .from("venue_tables")
    .select(TABLE_SELECT)
    .order("id", { ascending: true });

export function useVenueTables() {
  const [tables, setTables] = useState<VenueTable[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  /* Pendant un déplacement local, on n'écrase pas la position en cours
     avec un rechargement temps réel. */
  const pausedRef = useRef(false);

  /* La RLS limite le plan au compte. Temps réel : une table créée ou
     déplacée sur un autre poste apparaît ici sans recharger. */
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const load = () => {
      fetchTables().then(({ data, error: err }) => {
        if (cancelled || pausedRef.current) return;
        if (err) {
          setError(true);
          return;
        }
        setError(false);
        setTables((data as VenueTable[] | null) ?? []);
      });
    };
    load();
    const channel = supabase
      .channel("floor-plan-tables")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "venue_tables" },
        load
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setError(false);
    setAttempt((n) => n + 1);
  }, []);

  /* Relit l'état réel après une écriture refusée, plutôt que de mentir. */
  const resync = useCallback(async () => {
    const { data, error: err } = await fetchTables();
    if (!err) setTables((data as VenueTable[] | null) ?? []);
  }, []);

  const pauseSync = useCallback((paused: boolean) => {
    pausedRef.current = paused;
  }, []);

  /** Déplacement à l'écran seulement (glisser) ; `patchTable` persiste. */
  const moveLocal = useCallback((id: number, x: number, y: number) => {
    setTables((prev) =>
      (prev ?? []).map((tb) => (tb.id === id ? { ...tb, x, y } : tb))
    );
  }, []);

  /** Écriture partielle : optimiste en local, puis persistée. */
  const patchTable = useCallback(
    async (id: number, patch: VenueTablePatch) => {
      setTables((prev) =>
        (prev ?? []).map((tb) => (tb.id === id ? { ...tb, ...patch } : tb))
      );
      const { error: err } = await createClient()
        .from("venue_tables")
        .update(patch)
        .eq("id", id);
      if (err) {
        await resync();
        return false;
      }
      return true;
    },
    [resync]
  );

  /** Nouvelle table : l'identifiant vient de la base. */
  const addTable = useCallback(async (label: string, x: number, y: number) => {
    const { data, error: err } = await createClient()
      .from("venue_tables")
      .insert({ label, x: Math.round(x), y: Math.round(y) })
      .select(TABLE_SELECT)
      .single();
    if (err || !data) return null;
    const row = data as VenueTable;
    setTables((prev) => [...(prev ?? []), row]);
    return row;
  }, []);

  const removeTable = useCallback(
    async (id: number) => {
      setTables((prev) => (prev ?? []).filter((tb) => tb.id !== id));
      const { error: err } = await createClient()
        .from("venue_tables")
        .delete()
        .eq("id", id);
      if (err) {
        await resync();
        return false;
      }
      return true;
    },
    [resync]
  );

  return {
    tables,
    isLoading: tables === null && !error,
    error,
    reload,
    pauseSync,
    moveLocal,
    patchTable,
    addTable,
    removeTable,
  };
}

/* ─── Réservations assignées aux tables ─────────────────────────────────── */

export type TableReservation = {
  resId: string;
  client: string;
  initials: string;
  partySize: number;
  time: string | null;
  source: "qr" | "portal" | "venue";
  arrivedAt: string | null;
  notes: string;
};

export type ReservationsByTable = Record<number, TableReservation[]>;

type AssignedRow = {
  id: string;
  guest_name: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string | null;
  notes: string | null;
  source: "qr" | "portal" | "venue";
  arrived_at: string | null;
  table_id: number;
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/* Change l'heure d'arrivée d'une réservation, seulement si elle vaut encore
   `from` : un retour arrière n'écrase pas une valeur venue du temps réel. */
function withArrival(
  prev: ReservationsByTable,
  resId: string,
  from: string | null,
  to: string | null
): ReservationsByTable {
  const next: ReservationsByTable = {};
  for (const [k, list] of Object.entries(prev))
    next[Number(k)] = list.map((x) =>
      x.resId === resId && x.arrivedAt === from ? { ...x, arrivedAt: to } : x
    );
  return next;
}

export type WalkInResult = "ok" | "arrival-failed" | "failed";

/* Toutes les réservations assignées à une table pour la date choisie,
   triées par heure, hors annulées et no-show. */
export function useTableReservations(date: string) {
  const [byTable, setByTable] = useState<ReservationsByTable>({});
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const load = () => {
      supabase
        .from("qr_reservations")
        .select(
          "id, guest_name, party_size, reservation_date, reservation_time, notes, source, arrived_at, table_id"
        )
        .not("table_id", "is", null)
        .not("status", "in", '("annulée","no-show")')
        .eq("reservation_date", date)
        .order("reservation_time", { ascending: true, nullsFirst: false })
        .then(({ data, error: err }) => {
          if (cancelled) return;
          if (err) {
            setError(true);
            return;
          }
          const map: ReservationsByTable = {};
          for (const r of (data as AssignedRow[] | null) ?? []) {
            (map[r.table_id] ??= []).push({
              resId: r.id,
              client: r.guest_name,
              initials: initialsOf(r.guest_name),
              partySize: r.party_size,
              time: r.reservation_time,
              source: r.source,
              arrivedAt: r.arrived_at,
              notes: r.notes ?? "",
            });
          }
          setError(false);
          setByTable(map);
        });
    };
    load();
    /* L'écran de salle reflète l'instant : toute réservation assignée,
       déplacée ou annulée depuis un autre poste arrive ici en direct. */
    const channel = supabase
      .channel("floor-plan-reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "qr_reservations" },
        load
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [date, attempt]);

  const reload = useCallback(() => {
    setError(false);
    setAttempt((n) => n + 1);
  }, []);

  /** Arrivée : affichée tout de suite, annulée à l'écran si l'écriture échoue. */
  const checkIn = useCallback(async (resId: string) => {
    const arrivedAt = new Date().toISOString();
    setByTable((prev) => withArrival(prev, resId, null, arrivedAt));
    const { error: err } = await createClient()
      .from("qr_reservations")
      .update({ arrived_at: arrivedAt })
      .eq("id", resId);
    if (err) {
      setByTable((prev) => withArrival(prev, resId, arrivedAt, null));
      return false;
    }
    return true;
  }, []);

  /** Retire l'assignation de toutes les réservations du jour sur la table. */
  const freeTable = useCallback(
    async (tableId: number) => {
      const ids = (byTable[tableId] ?? []).map((r) => r.resId);
      if (ids.length > 0) {
        const { error: err } = await createClient()
          .from("qr_reservations")
          .update({ table_id: null })
          .in("id", ids);
        if (err) return false;
      }
      setByTable((prev) => {
        const next = { ...prev };
        delete next[tableId];
        return next;
      });
      return true;
    },
    [byTable]
  );

  /* Walk-in : réservation « maison » créée à l'instant sur la table, puis
     arrivée enregistrée. Le nom « Walk-in » est une valeur de base. */
  const seatWalkIn = useCallback(
    async (tableId: number, partySize: number): Promise<WalkInResult> => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
      const supabase = createClient();
      const { data, error: err } = await supabase.rpc("venue_create_reservation", {
        p_guest_name: "Walk-in",
        p_guest_phone: null,
        p_date: date,
        p_time: time,
        p_party_size: partySize,
        p_notes: null,
        p_table_id: tableId,
      });
      if (err || !data) return "failed";
      const { error: arrivalErr } = await supabase
        .from("qr_reservations")
        .update({ arrived_at: now.toISOString() })
        .eq("id", data as string);
      return arrivalErr ? "arrival-failed" : "ok";
    },
    [date]
  );

  return { byTable, error, reload, checkIn, freeTable, seatWalkIn };
}

/* ─── Dates locales ─────────────────────────────────────────────────────── */

/* Date locale AAAA-MM-JJ, pas d'UTC : sinon le plan bascule au mauvais
   jour après minuit heure locale. */
export const localISODate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export const shiftISODate = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return localISODate(d);
};
