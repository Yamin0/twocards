"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/hotel/analytics";
import { addDays, isWithinDays, isoDay, todayIso } from "@/lib/hotel/format";
import { oneOf } from "@/lib/hotel/params";
import type { HotelReservation, ReservationStatus } from "@/lib/hotel/store";
import { agendaOrder } from "@/lib/hotel/today";

export type StatusFilter = "toutes" | ReservationStatus;
export type Period = "aujourdhui" | "avenir" | "7j" | "30j" | "tout";
export type CategoryFilter = "toutes" | (typeof CATEGORIES)[number];

export const PERIODS: readonly Period[] = ["aujourdhui", "avenir", "7j", "30j", "tout"];

/* ?statut= : une clé courte dans l'URL, la valeur de la base (française,
   jamais traduite) dans le filtre. */
const STATUS_PARAM = {
  attente: "en attente",
  confirmee: "confirmée",
  annulee: "annulée",
  "no-show": "no-show",
} as const satisfies Record<string, ReservationStatus>;
type StatusKey = keyof typeof STATUS_PARAM;
const STATUS_KEYS = Object.keys(STATUS_PARAM) as StatusKey[];

/* Filtres, recherche et fiche ouverte de la page Réservations.
   ?periode= et ?statut= fixent le filtre de départ (valeur inconnue :
   repli sur « tout » / « toutes ») ; ?id= ouvre une fiche. */
export function useReservationFilters(reservations: HotelReservation[]) {
  const router = useRouter();
  const params = useSearchParams();

  const [status, setStatus] = useState<StatusFilter>(() => {
    const key = oneOf<StatusKey | "">(params.get("statut"), STATUS_KEYS, "");
    return key ? STATUS_PARAM[key] : "toutes";
  });
  const [period, setPeriod] = useState<Period>(() => oneOf(params.get("periode"), PERIODS, "tout"));
  const [category, setCategory] = useState<CategoryFilter>("toutes");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  /* Lien profond ?id=… (depuis l'accueil ou une chambre) : on ouvre la fiche
     — ajustement d'état pendant le rendu — puis on nettoie l'URL pour que
     Retour ne la rouvre pas. */
  const deepId = params.get("id");
  const [seenId, setSeenId] = useState<string | null>(null);
  if (deepId !== seenId) {
    setSeenId(deepId);
    if (deepId) setOpenId(deepId);
  }
  useEffect(() => {
    if (deepId) router.replace("/hotel/reservations");
  }, [deepId, router]);

  const today = todayIso();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\s/g, "");
    const within = (r: HotelReservation, days: number) =>
      isWithinDays(r.reservation_date, days) ||
      (r.reservation_date > today && r.reservation_date <= isoDay(addDays(new Date(), days)));
    return reservations
      .filter((r) => {
        if (status !== "toutes" && r.status !== status) return false;
        if (category !== "toutes" && r.category !== category) return false;
        if (period === "aujourdhui" && r.reservation_date !== today) return false;
        if (period === "avenir" && r.reservation_date < today) return false;
        if (period === "7j" && !within(r, 7)) return false;
        if (period === "30j" && !within(r, 30)) return false;
        if (
          q &&
          !r.guest_name.toLowerCase().includes(q) &&
          !r.venue_name.toLowerCase().includes(q) &&
          !(r.qr_label ?? "").toLowerCase().includes(q) &&
          !r.guest_phone.replace(/\s/g, "").includes(digits)
        )
          return false;
        return true;
      })
      .sort(agendaOrder(today));
  }, [reservations, status, category, period, search, today]);

  /* Groupes par jour, dans l'ordre déjà trié. */
  const groups = useMemo(() => {
    const out: { date: string; rows: HotelReservation[] }[] = [];
    for (const r of filtered) {
      const last = out[out.length - 1];
      if (last && last.date === r.reservation_date) last.rows.push(r);
      else out.push({ date: r.reservation_date, rows: [r] });
    }
    return out;
  }, [filtered]);

  const reset = () => {
    setStatus("toutes");
    setPeriod("tout");
    setCategory("toutes");
    setSearch("");
  };

  return {
    today,
    status,
    setStatus,
    period,
    setPeriod,
    category,
    setCategory,
    search,
    setSearch,
    filtered,
    groups,
    reset,
    open: openId ? (reservations.find((r) => r.id === openId) ?? null) : null,
    setOpenId,
  };
}
