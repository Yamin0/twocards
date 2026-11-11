import type { VenueQrReservation } from "@/hooks/use-venue-qr-reservations";
import { intlLocale, makeT, pick, type Locale, type Translate } from "@/lib/i18n";

/* Analyses de l'établissement : tout est dérivé des réservations réelles
   (table qr_reservations, RLS déjà limitée à l'établissement connecté).
   Fonctions pures, sans état : la page et le hook ne font qu'assembler. */

/* ---------- Périodes ---------- */

export type PeriodKey = "7j" | "30j" | "12m" | "tout";

export const getPeriods = (t: Translate): { value: PeriodKey; label: string }[] => [
  { value: "7j", label: t("7 jours", "7 days") },
  { value: "30j", label: t("30 jours", "30 days") },
  { value: "12m", label: t("12 mois", "12 months") },
  { value: "tout", label: t("Tout", "All time") },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/* Les dates ISO sont interprétées en heure locale : `new Date("2026-08-20")`
   seul serait lu en UTC et pourrait glisser d'un jour. */
const toLocalDate = (iso: string) => new Date(iso + "T00:00:00");

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function periodStart(period: PeriodKey, today: Date): Date | null {
  switch (period) {
    case "7j": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return d;
    }
    case "30j": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return d;
    }
    case "12m":
      return new Date(today.getFullYear(), today.getMonth() - 11, 1);
    case "tout":
      return null;
  }
}

/* ---------- Statuts et canaux ----------
   Valeurs de base, comparées telles quelles (jamais traduites). */

const isCancelled = (r: VenueQrReservation) => r.status === "annulée";
const isNoShow = (r: VenueQrReservation) => (r.status as string) === "no-show";
/* Réservation qui compte dans le CA et les couverts. */
const isCounted = (r: VenueQrReservation) => !isCancelled(r) && !isNoShow(r);

const channelLabel = (source: string, t: Translate) =>
  source === "qr"
    ? t("Réseau QR", "QR network")
    : source === "portal"
      ? t("Portail direct", "Direct portal")
      : t("Établissement", "Venue");

/* Libellé affiché d'un statut (la valeur en base reste en français). */
const statusLabel = (status: string, t: Translate) =>
  status === "confirmée"
    ? t("confirmée", "confirmed")
    : status === "en attente"
      ? t("en attente", "pending")
      : status === "annulée"
        ? t("annulée", "cancelled")
        : status;

/* ---------- Formats ---------- */

export const fmtMAD = (v: number, locale: Locale = "fr") =>
  `${Math.round(v).toLocaleString(intlLocale(locale))} MAD`;

export const fmtMADShort = (v: number, locale: Locale = "fr") =>
  v >= 1000
    ? `${(v / 1000).toLocaleString(intlLocale(locale), { maximumFractionDigits: 1 })}k`
    : String(Math.round(v));

export const fmtCouverts = (v: number, locale: Locale = "fr") =>
  pick(
    locale,
    `${Math.round(v)} couvert${Math.round(v) > 1 ? "s" : ""}`,
    `${Math.round(v)} cover${Math.round(v) === 1 ? "" : "s"}`
  );

/* ---------- Export CSV (même approche que la page Commissions :
   séparateur ";", BOM UTF-8, guillemets échappés) ---------- */

export function exportCsv(rows: VenueQrReservation[], periodKey: PeriodKey, locale: Locale = "fr") {
  const t = makeT(locale);
  const header = [
    t("Date", "Date"),
    t("Heure", "Time"),
    t("Client", "Guest"),
    t("Téléphone", "Phone"),
    t("Couverts", "Covers"),
    t("Statut", "Status"),
    t("Canal", "Channel"),
    t("Montant (MAD)", "Amount (MAD)"),
    t("Origine montant", "Amount source"),
    t("Commission (MAD)", "Commission (MAD)"),
    t("Note", "Rating"),
  ];
  const lines = rows.map((r) =>
    [
      r.reservation_date,
      r.reservation_time ?? "",
      r.guest_name,
      r.guest_phone,
      r.party_size,
      statusLabel(r.status, t),
      channelLabel(r.source, t),
      r.amount_spent ?? "",
      r.amount_spent === null
        ? ""
        : r.amount_source === "pos"
          ? t("caisse", "POS")
          : t("saisie manuelle", "manual entry"),
      r.commission,
      r.rating ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";")
  );
  const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${periodKey}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Dérivations ---------- */

/* Réservations de la période. Les périodes bornées (« 7/30 jours »,
   « 12 mois ») regardent le passé jusqu'à aujourd'hui inclus ; « Tout »
   prend tout, réservations à venir comprises. */
export function filterByPeriod(reservations: VenueQrReservation[], period: PeriodKey) {
  const today = startOfDay(new Date());
  const start = periodStart(period, today);
  if (!start) return reservations;
  return reservations.filter((r) => {
    const d = toLocalDate(r.reservation_date);
    return d >= start && d <= today;
  });
}

export const countedOnly = (rows: VenueQrReservation[]) => rows.filter(isCounted);

export type AnalyticsStats = {
  ca: number;
  couverts: number;
  /* Sorties comptées dont le montant n'est pas encore saisi. */
  awaiting: number;
  panier: number | null;
  avgRating: number | null;
  ratedCount: number;
  noShows: number;
  noShowRate: number;
  cancelled: number;
};

export function computeStats(filtered: VenueQrReservation[], counted: VenueQrReservation[]): AnalyticsStats {
  const ca = counted.reduce((s, r) => s + (r.amount_spent ?? 0), 0);
  const couverts = counted.reduce((s, r) => s + r.party_size, 0);
  const withAmount = counted.filter((r) => r.amount_spent !== null);
  const couvertsAvecMontant = withAmount.reduce((s, r) => s + r.party_size, 0);
  const rated = filtered.filter((r) => r.rating !== null);
  const noShows = filtered.filter(isNoShow).length;
  const cancelled = filtered.filter(isCancelled).length;
  const nonCancelled = filtered.length - cancelled;
  return {
    ca,
    couverts,
    awaiting: counted.length - withAmount.length,
    panier: couvertsAvecMontant > 0 ? ca / couvertsAvecMontant : null,
    avgRating: rated.length > 0 ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : null,
    ratedCount: rated.length,
    noShows,
    noShowRate: nonCancelled > 0 ? (noShows / nonCancelled) * 100 : 0,
    cancelled,
  };
}

export type Bucket = { key: string; label: string; full: string; couverts: number; ca: number };

/* Buckets des histogrammes : par jour pour les périodes courtes, par mois
   pour « 12 mois » et « Tout ». */
export function computeBuckets(
  counted: VenueQrReservation[],
  period: PeriodKey,
  intl: string
): { list: Bucket[]; daily: boolean } {
  const today = startOfDay(new Date());
  const out: Bucket[] = [];
  const byKey = new Map<string, Bucket>();
  const push = (key: string, label: string, full: string) => {
    const b = { key, label, full, couverts: 0, ca: 0 };
    out.push(b);
    byKey.set(key, b);
  };

  let daily = false;
  if (period === "7j" || period === "30j") {
    daily = true;
    const n = period === "7j" ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      push(
        dayKey(d),
        period === "7j"
          ? d.toLocaleDateString(intl, { weekday: "short" })
          : d.toLocaleDateString(intl, { day: "numeric", month: "numeric" }),
        d.toLocaleDateString(intl, { weekday: "long", day: "numeric", month: "long" })
      );
    }
  } else {
    let from: Date;
    let to = new Date(today.getFullYear(), today.getMonth(), 1);
    if (period === "12m") {
      from = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    } else {
      if (counted.length === 0) return { list: out, daily };
      let min = counted[0].reservation_date;
      let max = counted[0].reservation_date;
      for (const r of counted) {
        if (r.reservation_date < min) min = r.reservation_date;
        if (r.reservation_date > max) max = r.reservation_date;
      }
      const minD = toLocalDate(min);
      const maxD = toLocalDate(max);
      from = new Date(minD.getFullYear(), minD.getMonth(), 1);
      if (maxD > to) to = new Date(maxD.getFullYear(), maxD.getMonth(), 1);
    }
    for (let d = new Date(from); d <= to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      push(
        monthKey(d),
        d.toLocaleDateString(intl, { month: "short" }),
        d.toLocaleDateString(intl, { month: "long", year: "numeric" })
      );
    }
  }

  for (const r of counted) {
    const d = toLocalDate(r.reservation_date);
    const b = byKey.get(daily ? dayKey(d) : monthKey(d));
    if (!b) continue;
    b.couverts += r.party_size;
    b.ca += r.amount_spent ?? 0;
  }
  return { list: out, daily };
}

/* Répartition par canal : tout canal autre que « qr » et « portal » est
   rattaché à l'établissement (saisie sur place). */
export type ChannelCounts = { qr: number; portal: number; venue: number; total: number };

export function computeChannels(filtered: VenueQrReservation[]): ChannelCounts {
  const qr = filtered.filter((r) => (r.source as string) === "qr").length;
  const portal = filtered.filter((r) => (r.source as string) === "portal").length;
  return { qr, portal, venue: filtered.length - qr - portal, total: filtered.length };
}

const WEEKDAYS = {
  fr: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};
const WEEKDAYS_FULL = {
  fr: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

/* Meilleurs jours de la semaine : couverts moyens par jour ACTIF (une date
   sans réservation ne dilue pas la moyenne). */
export function computeWeekdays(counted: VenueQrReservation[], locale: Locale) {
  const totals = Array(7).fill(0) as number[];
  const dates: Set<string>[] = Array.from({ length: 7 }, () => new Set());
  for (const r of counted) {
    const idx = (toLocalDate(r.reservation_date).getDay() + 6) % 7;
    totals[idx] += r.party_size;
    dates[idx].add(r.reservation_date);
  }
  const data = pick(locale, WEEKDAYS.fr, WEEKDAYS.en).map((label, i) => ({
    label,
    full: pick(locale, WEEKDAYS_FULL.fr, WEEKDAYS_FULL.en)[i],
    value: dates[i].size > 0 ? totals[i] / dates[i].size : 0,
  }));
  let best = -1;
  for (let i = 0; i < 7; i++) {
    if (data[i].value > 0 && (best === -1 || data[i].value > data[best].value)) best = i;
  }
  return { data, best };
}
