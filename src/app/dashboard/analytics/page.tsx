"use client";

import { useCallback, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarRange,
  Download,
  Globe,
  QrCode,
  Star,
  Store,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useVenueQrReservations,
  type VenueQrReservation,
} from "@/hooks/use-venue-qr-reservations";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useLocale, useT } from "@/lib/i18n/client";
import { intlLocale, makeT, pick, type Locale, type Translate } from "@/lib/i18n";

/* Analyses de l'établissement — tout est dérivé des réservations réelles
   (table qr_reservations, RLS déjà limitée à l'établissement connecté).
   Aucune donnée de démonstration : la page montre ce qui s'est vraiment
   passé, ou explique pourquoi elle n'a rien à montrer. */

/* ---------- Périodes ---------- */

type PeriodKey = "7j" | "30j" | "12m" | "tout";

const getPeriods = (t: Translate): { key: PeriodKey; label: string }[] => [
  { key: "7j", label: t("7 jours", "7 days") },
  { key: "30j", label: t("30 jours", "30 days") },
  { key: "12m", label: t("12 mois", "12 months") },
  { key: "tout", label: t("Tout", "All time") },
];

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/* Les dates ISO sont interprétées en heure locale : `new Date("2026-08-20")`
   seul serait lu en UTC et pourrait glisser d'un jour. */
const toLocalDate = (iso: string) => new Date(iso + "T00:00:00");

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

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
   Les valeurs "no-show" (statut) et "venue" (canal) arrivent bientôt en
   base : on compare en texte pour les accepter dès leur apparition. */

const isCancelled = (r: VenueQrReservation) => r.status === "annulée";
const isNoShow = (r: VenueQrReservation) =>
  (r.status as string) === "no-show";
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

const fmtMAD = (v: number, locale: Locale = "fr") =>
  `${Math.round(v).toLocaleString(intlLocale(locale))} MAD`;
const fmtMADShort = (v: number, locale: Locale = "fr") =>
  v >= 1000
    ? `${(v / 1000).toLocaleString(intlLocale(locale), { maximumFractionDigits: 1 })}k`
    : String(Math.round(v));
const fmtCouverts = (v: number, locale: Locale = "fr") =>
  pick(
    locale,
    `${Math.round(v)} couvert${Math.round(v) > 1 ? "s" : ""}`,
    `${Math.round(v)} cover${Math.round(v) === 1 ? "" : "s"}`
  );

/* ---------- Export CSV (même approche que la page Commissions :
   séparateur ";", BOM UTF-8, guillemets échappés) ---------- */

function exportCsv(rows: VenueQrReservation[], periodKey: PeriodKey, locale: Locale = "fr") {
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
  a.download = `analytics-${periodKey}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Histogramme maison, style MiniBars ----------
   L'échelle se déduit du maximum : les hauteurs ne peuvent pas contredire
   les chiffres. Au-delà de 14 barres, les valeurs passent en infobulle et
   les libellés s'espacent pour rester lisibles. */

function Bars({
  data,
  format,
  short,
}: {
  data: { label: string; full: string; value: number }[];
  format: (v: number) => string;
  short?: (v: number) => string;
}) {
  const t = useT();
  const max = Math.max(...data.map((d) => d.value), 1);
  const showValues = data.length <= 14;
  const labelEvery = data.length <= 14 ? 1 : Math.ceil(data.length / 10);
  return (
    <div className="flex items-end gap-1 h-36">
      {data.map((d, i) => (
        <div
          key={`${d.label}-${i}`}
          title={t(`${d.full} : ${format(d.value)}`, `${d.full}: ${format(d.value)}`)}
          className="group flex-1 flex flex-col items-center gap-1 min-w-0"
        >
          {showValues && (
            <span className="font-ui text-[9px] text-white/50 tabular-nums">
              {d.value > 0 ? (short ?? format)(d.value) : ""}
            </span>
          )}
          <div
            className={`w-full rounded-t-md transition-colors ${
              d.value > 0
                ? "bg-blue-400/80 group-hover:bg-blue-300"
                : "bg-white/[0.06]"
            }`}
            style={{ height: `${Math.max((d.value / max) * 96, 3)}px` }}
          />
          <span className="font-ui text-[9px] text-white/40 truncate max-w-full">
            {i % labelEvery === 0 ? d.label : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Donut par canal ----------
   Les arcs sont calculés (strokeDasharray dynamique sur la circonférence
   réelle) : légende et anneau décrivent forcément les mêmes proportions. */

const DONUT_RADIUS = 14;
const DONUT_CIRC = 2 * Math.PI * DONUT_RADIUS;

type ChannelSegment = {
  label: string;
  value: number;
  stroke: string;
  dot: string;
  icon: typeof QrCode;
};

function ChannelDonut({
  segments,
  total,
}: {
  segments: ChannelSegment[];
  total: number;
}) {
  const t = useT();
  /* Arcs et décalages précalculés : chaque segment démarre là où le
     précédent s'arrête, sur la circonférence réelle de l'anneau. */
  const arcs: { segment: ChannelSegment; arc: number; offset: number }[] = [];
  for (const s of segments) {
    if (s.value <= 0) continue;
    const prev = arcs[arcs.length - 1];
    arcs.push({
      segment: s,
      arc: (s.value / total) * DONUT_CIRC,
      offset: prev ? prev.offset + prev.arc : 0,
    });
  }
  return (
    <div className="flex items-center gap-8">
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r={DONUT_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
          />
          {arcs.map(({ segment, arc, offset }) => (
            <circle
              key={segment.label}
              cx="18"
              cy="18"
              r={DONUT_RADIUS}
              fill="none"
              stroke={segment.stroke}
              strokeWidth="4"
              strokeDasharray={`${arc} ${DONUT_CIRC}`}
              strokeDashoffset={-offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-light text-white tabular-nums">
            {total}
          </span>
          <span className="font-ui text-[9px] text-white/40">
            {t(`réservation${total > 1 ? "s" : ""}`, `reservation${total === 1 ? "" : "s"}`)}
          </span>
        </div>
      </div>

      <div className="space-y-3 min-w-0">
        {segments.map((s) => {
          const Icon = s.icon;
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div key={s.label} className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} />
              <div className="min-w-0">
                <p className="font-ui text-sm text-white font-medium flex items-center gap-1.5">
                  <Icon
                    size={13}
                    strokeWidth={1.5}
                    className="text-white/40 flex-shrink-0"
                  />
                  {s.label}
                </p>
                <p className="font-ui text-xs text-white/40 tabular-nums">
                  {s.value} · {pct}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- KPI ---------- */

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-5">
      <p className="font-ui text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="font-display mt-2 text-3xl font-light text-white tabular-nums">
        {value}
      </p>
      {hint && <p className="font-ui mt-1 text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}

/* ---------- Page ---------- */

const WEEKDAYS = {
  fr: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};
const WEEKDAYS_FULL = {
  fr: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

export default function AnalyticsPage() {
  const t = useT();
  const locale = useLocale();
  const intl = intlLocale(locale);
  const { isLoading: authLoading } = useAuthUser();
  const { reservations, isLoading: loadingData } = useVenueQrReservations();
  const [period, setPeriod] = useState<PeriodKey>("30j");

  /* Réservations de la période. Les périodes bornées (« 7/30 jours »,
     « 12 mois ») regardent le passé jusqu'à aujourd'hui inclus ; « Tout »
     prend tout, réservations à venir comprises. */
  const filtered = useMemo(() => {
    if (!reservations) return [];
    const today = startOfDay(new Date());
    const start = periodStart(period, today);
    if (!start) return reservations;
    return reservations.filter((r) => {
      const d = toLocalDate(r.reservation_date);
      return d >= start && d <= today;
    });
  }, [reservations, period]);

  const counted = useMemo(() => filtered.filter(isCounted), [filtered]);

  /* KPI */
  const stats = useMemo(() => {
    const ca = counted.reduce((s, r) => s + (r.amount_spent ?? 0), 0);
    const couverts = counted.reduce((s, r) => s + r.party_size, 0);
    const withAmount = counted.filter((r) => r.amount_spent !== null);
    const couvertsAvecMontant = withAmount.reduce(
      (s, r) => s + r.party_size,
      0
    );
    const panier = couvertsAvecMontant > 0 ? ca / couvertsAvecMontant : null;
    const rated = filtered.filter((r) => r.rating !== null);
    const avgRating =
      rated.length > 0
        ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
        : null;
    const noShows = filtered.filter(isNoShow).length;
    const cancelled = filtered.filter(isCancelled).length;
    const nonCancelled = filtered.length - cancelled;
    return {
      ca,
      couverts,
      awaiting: counted.length - withAmount.length,
      panier,
      avgRating,
      ratedCount: rated.length,
      noShows,
      noShowRate: nonCancelled > 0 ? (noShows / nonCancelled) * 100 : 0,
      cancelled,
    };
  }, [filtered, counted]);

  /* Buckets des histogrammes : par jour pour les périodes courtes, par
     mois pour « 12 mois » et « Tout ». */
  const buckets = useMemo(() => {
    const today = startOfDay(new Date());
    const out: {
      key: string;
      label: string;
      full: string;
      couverts: number;
      ca: number;
    }[] = [];
    const byKey = new Map<string, (typeof out)[number]>();
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
            : d.toLocaleDateString(intl, {
                day: "numeric",
                month: "numeric",
              }),
          d.toLocaleDateString(intl, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
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
      for (
        let d = new Date(from);
        d <= to;
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      ) {
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
  }, [counted, period, intl]);

  /* Répartition par canal — « venue » (saisie sur place) à venir : tout
     canal inconnu y est rattaché. */
  const channels = useMemo(() => {
    const qr = filtered.filter((r) => (r.source as string) === "qr").length;
    const portal = filtered.filter(
      (r) => (r.source as string) === "portal"
    ).length;
    const venue = filtered.length - qr - portal;
    const segments: ChannelSegment[] = [
      {
        label: t("Réseau QR", "QR network"),
        value: qr,
        stroke: "#60a5fa",
        dot: "bg-blue-400",
        icon: QrCode,
      },
      {
        label: t("Portail direct", "Direct portal"),
        value: portal,
        stroke: "#34d399",
        dot: "bg-emerald-400",
        icon: Globe,
      },
      {
        label: t("Établissement", "Venue"),
        value: venue,
        stroke: "rgba(255,255,255,0.35)",
        dot: "bg-white/35",
        icon: Store,
      },
    ];
    return { segments, total: filtered.length };
  }, [filtered, t]);

  /* Meilleurs jours de la semaine : couverts moyens par jour ACTIF (une
     date sans réservation ne dilue pas la moyenne). */
  const weekdays = useMemo(() => {
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
      if (data[i].value > 0 && (best === -1 || data[i].value > data[best].value))
        best = i;
    }
    return { data, best };
  }, [counted, locale]);

  const handleExport = useCallback(() => {
    const rows = [...filtered].sort((a, b) =>
      a.reservation_date < b.reservation_date ? 1 : -1
    );
    exportCsv(rows, period, locale);
  }, [filtered, period, locale]);

  if (authLoading || loadingData || reservations === null)
    return <DashboardSkeleton />;

  const periods = getPeriods(t);
  const periodLabel =
    periods.find((p) => p.key === period)?.label ?? period;

  return (
    <div className="space-y-6">
      {/* En-tête + sélecteur de période */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-light text-white">
              {t("Analyses", "Analytics")}
            </h1>
            <p className="font-ui text-sm text-white/60 mt-1.5">
              {t(
                "Les performances réelles de votre établissement, calculées sur vos réservations, mises à jour en temps réel.",
                "Your venue's real performance, calculated from your reservations and updated in real time."
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-white/[0.07] border border-white/[0.12] rounded-2xl p-1">
              {periods.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`font-ui px-4 py-2 text-xs font-medium rounded-xl transition-all ${
                    period === p.key
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {filtered.length > 0 && (
              <button
                onClick={handleExport}
                className="font-ui flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                <Download size={16} strokeWidth={1.5} />
                {t("Exporter en CSV", "Export as CSV")}
              </button>
            )}
          </div>
        </div>
      </div>

      {reservations.length === 0 ? (
        /* Aucune réservation, toutes périodes confondues : on explique
           d'où viendront les chiffres au lieu d'aligner des zéros. */
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mx-auto mb-5">
            <BarChart3 size={26} strokeWidth={1.5} className="text-blue-400" />
          </div>
          <h2 className="font-display text-xl font-normal text-white mb-2">
            {t("Pas encore de données à analyser", "No data to analyse yet")}
          </h2>
          <p className="font-ui text-sm text-white/50 max-w-md mx-auto">
            {t(
              "Dès vos premières réservations, via le réseau QR des hôtels ou votre portail direct, cette page calculera automatiquement votre chiffre d'affaires, vos couverts, votre note moyenne et vos meilleurs jours. Rien à configurer.",
              "From your very first reservations, via the hotels' QR network or your direct portal, this page will automatically calculate your revenue, covers, average rating and best days. Nothing to set up."
            )}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        /* Des réservations existent, mais pas sur la période choisie. */
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.07] border border-white/[0.12] flex items-center justify-center mx-auto mb-5">
            <CalendarRange
              size={26}
              strokeWidth={1.5}
              className="text-white/60"
            />
          </div>
          <h2 className="font-display text-xl font-normal text-white mb-2">
            {t(`Aucune réservation sur « ${periodLabel} »`, `No reservations in “${periodLabel}”`)}
          </h2>
          <p className="font-ui text-sm text-white/50 max-w-md mx-auto">
            {t(
              `Votre historique contient ${reservations.length} réservation${reservations.length > 1 ? "s" : ""}, mais aucune sur cette période. Élargissez la période : « Tout » affiche l'ensemble de votre historique.`,
              `Your history has ${reservations.length} reservation${reservations.length === 1 ? "" : "s"}, but none in this period. Widen the period: “All time” shows your full history.`
            )}
          </p>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Kpi
              label={t("Chiffre d'affaires", "Revenue")}
              value={fmtMAD(stats.ca, locale)}
              hint={
                stats.awaiting > 0
                  ? t(
                      `${stats.awaiting} sortie${stats.awaiting > 1 ? "s" : ""} sans montant saisi`,
                      `${stats.awaiting} outing${stats.awaiting === 1 ? "" : "s"} with no amount entered`
                    )
                  : undefined
              }
            />
            <Kpi
              label={t("Couverts", "Covers")}
              value={stats.couverts.toLocaleString(intl)}
              hint={t("hors annulations et no-shows", "excluding cancellations and no-shows")}
            />
            <Kpi
              label={t("Panier moyen / couvert", "Average spend / cover")}
              value={stats.panier !== null ? fmtMAD(stats.panier, locale) : "—"}
              hint={
                stats.panier === null
                  ? t("aucun montant saisi sur la période", "no amounts entered in this period")
                  : t("sur les sorties au montant connu", "based on outings with a known amount")
              }
            />
            <Kpi
              label={t("Réservations", "Reservations")}
              value={filtered.length.toLocaleString(intl)}
              hint={
                stats.cancelled > 0
                  ? t(
                      `dont ${stats.cancelled} annulée${stats.cancelled > 1 ? "s" : ""}`,
                      `incl. ${stats.cancelled} cancelled`
                    )
                  : undefined
              }
            />
            <Kpi
              label={t("Note moyenne", "Average rating")}
              value={
                stats.avgRating !== null
                  ? `${stats.avgRating.toLocaleString(intl, {
                      maximumFractionDigits: 1,
                    })} / 5`
                  : "—"
              }
              hint={
                stats.avgRating !== null
                  ? t(
                      `${stats.ratedCount} avis client${stats.ratedCount > 1 ? "s" : ""}`,
                      `${stats.ratedCount} guest review${stats.ratedCount === 1 ? "" : "s"}`
                    )
                  : t("aucun avis sur la période", "no reviews in this period")
              }
            />
            {stats.noShows > 0 ? (
              <Kpi
                label={t("Taux de no-show", "No-show rate")}
                value={`${stats.noShowRate.toLocaleString(intl, {
                  maximumFractionDigits: 1,
                })}${t(" %", "%")}`}
                hint={t(
                  `${stats.noShows} no-show${stats.noShows > 1 ? "s" : ""} sur la période`,
                  `${stats.noShows} no-show${stats.noShows === 1 ? "" : "s"} in this period`
                )}
              />
            ) : (
              <Kpi
                label={t("No-shows", "No-shows")}
                value="0"
                hint={t("aucun no-show sur la période", "no no-shows in this period")}
              />
            )}
          </div>

          {/* Histogrammes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
              <h3 className="font-ui text-white font-bold text-sm mb-1">
                {buckets.daily
                  ? t("Couverts par jour", "Covers per day")
                  : t("Couverts par mois", "Covers per month")}
              </h3>
              <p className="font-ui text-[11px] text-white/40 mb-5">
                {t("hors annulations et no-shows", "excluding cancellations and no-shows")}
              </p>
              <Bars
                data={buckets.list.map((b) => ({
                  label: b.label,
                  full: b.full,
                  value: b.couverts,
                }))}
                format={(v) => fmtCouverts(v, locale)}
                short={(v) => String(Math.round(v))}
              />
            </div>

            <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
              <h3 className="font-ui text-white font-bold text-sm mb-1">
                {buckets.daily
                  ? t("Chiffre d'affaires par jour", "Revenue per day")
                  : t("Chiffre d'affaires par mois", "Revenue per month")}
              </h3>
              <p className="font-ui text-[11px] text-white/40 mb-5">
                {t("montants saisis ou remontés par la caisse", "amounts entered manually or synced from the POS")}
              </p>
              <Bars
                data={buckets.list.map((b) => ({
                  label: b.label,
                  full: b.full,
                  value: b.ca,
                }))}
                format={(v) => fmtMAD(v, locale)}
                short={(v) => fmtMADShort(v, locale)}
              />
            </div>
          </div>

          {/* Canaux + meilleurs jours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
              <h3 className="font-ui text-white font-bold text-sm mb-5">
                {t("Répartition par canal", "Breakdown by channel")}
              </h3>
              <ChannelDonut
                segments={channels.segments}
                total={channels.total}
              />
            </div>

            <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
              <h3 className="font-ui text-white font-bold text-sm mb-1">
                {t("Meilleurs jours de la semaine", "Best days of the week")}
              </h3>
              <p className="font-ui text-[11px] text-white/40 mb-5">
                {t("couverts moyens par jour d'activité", "average covers per trading day")}
              </p>
              <Bars
                data={weekdays.data}
                format={(v) =>
                  t(
                    `${v.toLocaleString(intl, { maximumFractionDigits: 1 })} couverts en moyenne`,
                    `${v.toLocaleString(intl, { maximumFractionDigits: 1 })} covers on average`
                  )
                }
                short={(v) =>
                  v.toLocaleString(intl, { maximumFractionDigits: 1 })
                }
              />
              {weekdays.best >= 0 && (
                <p className="font-ui mt-4 flex items-center gap-1.5 text-xs text-white/50">
                  <Star
                    size={13}
                    strokeWidth={1.5}
                    className="text-amber-400"
                  />
                  {t(
                    `Votre meilleur jour : ${weekdays.data[weekdays.best].full} (${weekdays.data[weekdays.best].value.toLocaleString(intl, { maximumFractionDigits: 1 })} couverts en moyenne)`,
                    `Your best day: ${weekdays.data[weekdays.best].full} (${weekdays.data[weekdays.best].value.toLocaleString(intl, { maximumFractionDigits: 1 })} covers on average)`
                  )}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
