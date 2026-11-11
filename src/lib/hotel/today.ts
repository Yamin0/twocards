"use client";

import { useMemo } from "react";
import {
  commissionRates,
  hasCommission,
  isLive,
  previousMonthStart,
  qrPerformance,
  type QrPerformance,
} from "@/lib/hotel/analytics";
import { addDays, isoDay, sameMonth } from "@/lib/hotel/format";
import { useHotelSpace, type HotelQrCode, type HotelReservation } from "@/lib/hotel/store";

/* Ce qu'il faut savoir en arrivant : les demandes en attente, les sorties
   du jour et à venir, les commissions du mois, le QR qui rapporte le plus.
   Tout est calculé à partir des réservations déjà en cache. */

/* Ordre d'agenda : à venir d'abord (la plus proche en tête), puis le passé
   (la plus récente en tête) ; à date égale, par heure. */
export function agendaOrder(today: string) {
  return (a: HotelReservation, b: HotelReservation) => {
    const af = a.reservation_date >= today;
    const bf = b.reservation_date >= today;
    if (af !== bf) return af ? -1 : 1;
    if (a.reservation_date !== b.reservation_date)
      return af
        ? a.reservation_date.localeCompare(b.reservation_date)
        : b.reservation_date.localeCompare(a.reservation_date);
    return (a.reservation_time ?? "99").localeCompare(b.reservation_time ?? "99");
  };
}

export type TodaySummary = {
  today: string;
  pending: HotelReservation[];
  todays: HotelReservation[];
  upcoming: HotelReservation[];
  upcomingWeek: number;
  commissionMonth: number;
  commissionPrev: number;
  /* Sorties du mois dont le montant est connu. */
  paidOutingsMonth: number;
  /* Sorties passées dont l'établissement n'a pas encore saisi le montant. */
  awaitingAmount: number;
  /* Classement des QR : par commission, puis par réservations. */
  topQr: QrPerformance[];
  /* false tant qu'aucune commission n'est acquise : le classement se lit
     alors en réservations. */
  rankedByCommission: boolean;
  rates: { min: number; max: number } | null;
};

export function todaySummary(
  qrCodes: HotelQrCode[],
  reservations: HotelReservation[],
  now = new Date()
): TodaySummary {
  const today = isoDay(now);
  const inAWeek = isoDay(addDays(now, 7));
  const live = reservations.filter(isLive);
  const byTime = (a: HotelReservation, b: HotelReservation) =>
    a.reservation_date.localeCompare(b.reservation_date) ||
    (a.reservation_time ?? "99").localeCompare(b.reservation_time ?? "99");

  const upcoming = live.filter((r) => r.reservation_date > today).sort(byTime);
  const month = live.filter((r) => sameMonth(r.reservation_date, now));
  const prev = previousMonthStart(now);
  const perf = qrPerformance(qrCodes, reservations).filter(
    (q) => q.commission > 0 || q.liveReservations > 0
  );
  const rankedByCommission = perf.some((q) => q.commission > 0);

  return {
    today,
    pending: reservations.filter((r) => r.status === "en attente").sort(agendaOrder(today)),
    todays: live.filter((r) => r.reservation_date === today).sort(byTime),
    upcoming,
    upcomingWeek: upcoming.filter((r) => r.reservation_date <= inAWeek).length,
    commissionMonth: month.reduce((s, r) => s + r.commission, 0),
    commissionPrev: live
      .filter((r) => sameMonth(r.reservation_date, prev))
      .reduce((s, r) => s + r.commission, 0),
    paidOutingsMonth: month.filter(hasCommission).length,
    awaitingAmount: live.filter((r) => r.amount_spent === null && r.reservation_date < today).length,
    topQr: perf
      .sort(
        (a, b) =>
          b.commission - a.commission ||
          b.liveReservations - a.liveReservations ||
          b.scans - a.scans
      )
      .slice(0, 5),
    rankedByCommission,
    rates: commissionRates(reservations),
  };
}

export function useHotelToday() {
  const space = useHotelSpace();
  const { qrCodes, reservations } = space;
  const summary = useMemo(() => todaySummary(qrCodes, reservations), [qrCodes, reservations]);
  return { ...space, summary };
}
