"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useVenueQrReservations,
  type VenueQrReservation,
} from "@/hooks/use-venue-qr-reservations";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useLocale, useT } from "@/lib/i18n/client";
import { intlLocale, makeT, type Locale, type Translate } from "@/lib/i18n";
import { StatStrip } from "@/components/shared/stat-strip";
import {
  Check,
  ChevronDown,
  Clock,
  Coins,
  Download,
  Hotel,
  Percent,
} from "lucide-react";

/* Commissions de l'établissement — ce qu'il reverse aux hôtels qui lui
   envoient des clients, mois par mois et hôtel par hôtel.

   Une ligne = une sortie apportée par un QR d'hôtel dont l'addition est
   connue ; la commission est dérivée en base (montant × taux), la page ne
   fait qu'agréger. Le canal direct (portail) et les réservations maison sont
   à 0 % par construction. Un règlement, noté par twocards, vaut pour un
   mois et un hôtel : c'est ce qui sépare « à régler » de « réglé ». */

type Settlement = {
  period: string;
  hotel_id: string;
  amount: number;
  settled_at: string;
  note: string;
};

const isDue = (r: VenueQrReservation) =>
  r.source === "qr" &&
  r.amount_spent !== null &&
  r.status !== "annulée" &&
  r.status !== "no-show";

const periodOf = (r: VenueQrReservation) => r.reservation_date.slice(0, 7);

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (period: string, locale: Locale = "fr") => {
  const label = new Date(`${period}-01T00:00:00`).toLocaleDateString(intlLocale(locale), {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const mad = (n: number, locale: Locale = "fr") => `${Math.round(n).toLocaleString(intlLocale(locale))} MAD`;

const fmtDate = (iso: string, locale: Locale = "fr") =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "short",
  });

type HotelGroup = {
  key: string;
  hotelId: string | null;
  name: string;
  rows: VenueQrReservation[];
  spent: number;
  commission: number;
};

type MonthGroup = {
  period: string;
  rows: VenueQrReservation[];
  commission: number;
  hotels: HotelGroup[];
};

function groupByHotel(rows: VenueQrReservation[], t: Translate): HotelGroup[] {
  const map = new Map<string, HotelGroup>();
  for (const r of rows) {
    const key = r.referrer_id ?? "inconnu";
    const g = map.get(key) ?? {
      key,
      hotelId: r.referrer_id,
      name: r.referrer_name ?? t("Hôtel partenaire", "Partner hotel"),
      rows: [],
      spent: 0,
      commission: 0,
    };
    g.rows.push(r);
    g.spent += r.amount_spent ?? 0;
    g.commission += r.commission;
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => b.commission - a.commission);
}

function exportCsv(rows: VenueQrReservation[], locale: Locale = "fr") {
  const t = makeT(locale);
  const header = [
    t("Mois", "Month"),
    t("Date sortie", "Outing date"),
    t("Client", "Guest"),
    t("Hôtel d'origine", "Referring hotel"),
    t("Prestation", "Service"),
    t("Montant dépensé (MAD)", "Amount spent (MAD)"),
    t("Taux", "Rate"),
    t("Commission reversée (MAD)", "Commission paid (MAD)"),
    t("Origine du montant", "Amount source"),
  ];
  const lines = rows.map((r) =>
    [
      periodOf(r),
      r.reservation_date,
      r.guest_name,
      r.referrer_name ?? "",
      r.service_name ?? "",
      r.amount_spent ?? "",
      `${Math.round(r.commission_rate * 100)}%`,
      r.commission,
      r.amount_source === "pos" ? t("caisse", "POS") : t("saisie manuelle", "manual entry"),
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
  a.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VenueCommissionsPage() {
  const t = useT();
  const locale = useLocale();
  const { isLoading } = useAuthUser();
  const { reservations, isLoading: loadingData } = useVenueQrReservations();
  const [settlements, setSettlements] = useState<Settlement[] | null>(null);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  /* Les règlements sont notés par twocards ; on les suit en direct pour que
     « à régler » passe à « réglé » sans recharger. */
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const load = () => {
      supabase
        .from("commission_settlements")
        .select("period, hotel_id, amount, settled_at, note")
        .then(({ data }) => {
          if (!cancelled) setSettlements((data as Settlement[] | null) ?? []);
        });
    };
    load();
    const channel = supabase
      .channel("venue-settlements")
      .on("postgres_changes", { event: "*", schema: "public", table: "commission_settlements" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading || loadingData || reservations === null || settlements === null)
    return <TableSkeleton />;

  const due = reservations
    .filter(isDue)
    .sort((a, b) => (a.reservation_date < b.reservation_date ? 1 : -1));
  const settled = (period: string, hotelId: string | null) =>
    hotelId ? settlements.find((s) => s.period === period && s.hotel_id === hotelId) ?? null : null;

  const months: MonthGroup[] = [...new Set(due.map(periodOf))]
    .sort()
    .reverse()
    .map((period) => {
      const rows = due.filter((r) => periodOf(r) === period);
      return {
        period,
        rows,
        commission: rows.reduce((s, r) => s + r.commission, 0),
        hotels: groupByHotel(rows, t),
      };
    });

  const now = currentPeriod();
  const thisMonth = months.find((m) => m.period === now) ?? null;
  const history = months.filter((m) => m.period !== now);

  const toSettle = months.reduce(
    (s, m) => s + m.hotels.filter((h) => !settled(m.period, h.hotelId)).reduce((x, h) => x + h.commission, 0),
    0
  );
  const settledTotal = months.reduce(
    (s, m) => s + m.hotels.filter((h) => settled(m.period, h.hotelId)).reduce((x, h) => x + h.commission, 0),
    0
  );
  const total = due.reduce((s, r) => s + r.commission, 0);
  const awaiting = reservations.filter(
    (r) => r.source === "qr" && r.amount_spent === null && r.status !== "annulée" && r.status !== "no-show"
  ).length;
  const thisMonthToSettle = thisMonth
    ? thisMonth.hotels.filter((h) => !settled(thisMonth.period, h.hotelId)).reduce((s, h) => s + h.commission, 0)
    : 0;

  const stats = [
    {
      label: t("À régler ce mois", "Due this month"),
      value: mad(thisMonthToSettle, locale),
      hint: thisMonth
        ? t(
            `${thisMonth.rows.length} sortie${thisMonth.rows.length > 1 ? "s" : ""} commissionnée${thisMonth.rows.length > 1 ? "s" : ""}`,
            `${thisMonth.rows.length} commissionable outing${thisMonth.rows.length === 1 ? "" : "s"}`
          )
        : t("aucune sortie ce mois", "no outings this month"),
    },
    {
      label: t("Restant dû", "Outstanding"),
      value: mad(toSettle, locale),
      hint: toSettle > 0 ? t("tous mois confondus", "across all months") : t("vous êtes à jour", "you're all settled"),
    },
    {
      label: t("Réglé", "Settled"),
      value: mad(settledTotal, locale),
      hint: t(`${mad(total, locale)} reversés au total`, `${mad(total, locale)} paid out in total`),
    },
    {
      label: t("En attente de montant", "Awaiting amount"),
      value: awaiting,
      hint: awaiting > 0 ? t("saisissez l'addition pour solder", "enter the bill to settle") : undefined,
    },
  ];

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="space-y-6">
      <div className=" bg-panel border border-line rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-ink">Commissions</h1>
          <p className="font-ui text-sm text-ink-2 mt-1.5">
            {t(
              "Ce que vous reversez à chaque hôtel qui vous envoie des clients, mois par mois.",
              "What you pay each hotel that sends you guests, month by month."
            )}
          </p>
        </div>
        {due.length > 0 && (
          <button
            onClick={() => exportCsv(due, locale)}
            className="font-ui flex items-center gap-2 bg-fill-2 hover:bg-fill-3 text-ink text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <Download size={16} strokeWidth={1.5} />
            {t("Exporter en CSV", "Export as CSV")}
          </button>
        )}
      </div>

      <StatStrip stats={stats} />

      {/* Ce mois-ci */}
      <div className=" bg-panel border border-line rounded-3xl p-6">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-normal text-ink">{monthLabel(now, locale)}</h2>
          <span className="font-display text-lg text-warn tabular-nums">
            {mad(thisMonth?.commission ?? 0, locale)}
          </span>
        </div>
        <p className="font-ui text-xs text-ink-3 mb-4">
          {t(
            "Par hôtel d'origine. Le règlement se fait au mois clôturé, consolidé par twocards.",
            "By referring hotel. Settlement happens once the month closes, consolidated by twocards."
          )}
        </p>
        {thisMonth ? (
          <HotelList
            month={thisMonth}
            settled={settled}
            open={open}
            toggle={toggle}
          />
        ) : (
          <p className="font-ui text-sm text-ink-3 leading-relaxed">
            {t(
              "Aucune sortie commissionnée ce mois-ci pour le moment.",
              "No commissionable outings this month yet."
            )}
            {awaiting > 0 &&
              t(
                ` ${awaiting} sortie${awaiting > 1 ? "s" : ""} du réseau attend${awaiting > 1 ? "ent" : ""} encore un montant.`,
                ` ${awaiting} network outing${awaiting === 1 ? " is" : "s are"} still awaiting an amount.`
              )}
          </p>
        )}
      </div>

      {/* Historique */}
      <div className=" bg-panel border border-line rounded-3xl p-6">
        <h2 className="font-display text-lg font-normal text-ink mb-1">{t("Historique", "History")}</h2>
        <p className="font-ui text-xs text-ink-3 mb-4">
          {t(
            "Un mois, puis chaque hôtel, puis chaque sortie. Touchez pour déplier.",
            "Each month, then each hotel, then each outing. Tap to expand."
          )}
        </p>
        {history.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-warn-soft border border-warn/25 flex items-center justify-center mx-auto mb-4">
              <Coins size={22} strokeWidth={1.5} className="text-warn" />
            </div>
            <p className="font-ui text-sm text-ink-3 max-w-md mx-auto">
              {t(
                "Les mois passés apparaîtront ici avec, pour chacun, ce qui a été reversé à chaque hôtel.",
                "Past months will appear here, each showing what was paid to every hotel."
              )}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((m) => {
              const isOpen = open.has(m.period);
              const remaining = m.hotels.filter((h) => !settled(m.period, h.hotelId)).reduce((s, h) => s + h.commission, 0);
              return (
                <li key={m.period}>
                  <button
                    type="button"
                    onClick={() => toggle(m.period)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 py-3.5 text-left"
                  >
                    <ChevronDown
                      size={16}
                      strokeWidth={1.75}
                      className={`shrink-0 text-ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-ui text-sm font-semibold text-ink">{monthLabel(m.period, locale)}</p>
                      <p className="font-ui text-xs text-ink-3">
                        {t(
                          `${m.rows.length} sortie${m.rows.length > 1 ? "s" : ""} · ${m.hotels.length} hôtel${m.hotels.length > 1 ? "s" : ""}`,
                          `${m.rows.length} outing${m.rows.length === 1 ? "" : "s"} · ${m.hotels.length} hotel${m.hotels.length === 1 ? "" : "s"}`
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-base text-ink tabular-nums">{mad(m.commission, locale)}</p>
                      <p className={`font-ui text-xs ${remaining > 0 ? "text-warn" : "text-ok"}`}>
                        {remaining > 0
                          ? t(`${mad(remaining, locale)} à régler`, `${mad(remaining, locale)} due`)
                          : t("réglé", "settled")}
                      </p>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="pb-4 pl-7">
                      <HotelList month={m} settled={settled} open={open} toggle={toggle} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-warn/25 bg-warn-soft p-4">
        <Percent size={16} strokeWidth={1.5} className="text-warn shrink-0 mt-0.5" />
        <p className="font-ui text-xs leading-relaxed text-ink-2 max-w-2xl">
          {t(
            "Vous reversez un pourcentage du montant réellement dépensé, 10 % par défaut, uniquement sur les clients apportés par un hôtel du réseau. La commission se calcule dès que l'addition est saisie ou remontée par votre caisse. Les réservations de votre portail direct et celles prises par vous-même ne sont jamais commissionnées. Le même détail, ligne par ligne, est celui que voit l'hôtel.",
            "You pay a percentage of the amount actually spent, 10% by default, only on guests sent by a hotel in the network. Commission is calculated as soon as the bill is entered or synced from your POS. Reservations from your direct portal and those you take yourself are never commissioned. The hotel sees exactly the same line-by-line breakdown."
          )}
        </p>
      </div>
    </div>
  );
}

function HotelList({
  month,
  settled,
  open,
  toggle,
}: {
  month: MonthGroup;
  settled: (period: string, hotelId: string | null) => Settlement | null;
  open: Set<string>;
  toggle: (key: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  return (
    <ul className="space-y-2">
      {month.hotels.map((h) => {
        const key = `${month.period}|${h.key}`;
        const isOpen = open.has(key);
        const s = settled(month.period, h.hotelId);
        return (
          <li key={key} className="rounded-xl border border-line bg-fill">
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fill-2">
                <Hotel size={15} strokeWidth={1.75} className="text-ink" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-ui text-sm font-semibold text-ink truncate">{h.name}</p>
                <p className="font-ui text-xs text-ink-3">
                  {t(
                    `${h.rows.length} sortie${h.rows.length > 1 ? "s" : ""} · ${mad(h.spent, locale)} dépensés`,
                    `${h.rows.length} outing${h.rows.length === 1 ? "" : "s"} · ${mad(h.spent, locale)} spent`
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-base text-warn tabular-nums">{mad(h.commission, locale)}</p>
                {s ? (
                  <p className="font-ui inline-flex items-center gap-1 text-xs text-ok">
                    <Check size={11} strokeWidth={2.5} />
                    {t("réglé le", "settled on")} {new Date(s.settled_at).toLocaleDateString(intlLocale(locale))}
                  </p>
                ) : (
                  <p className="font-ui inline-flex items-center gap-1 text-xs text-warn">
                    <Clock size={11} strokeWidth={2} />
                    {t("à régler", "due")}
                  </p>
                )}
              </div>
              <ChevronDown
                size={15}
                strokeWidth={1.75}
                className={`shrink-0 text-ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <ul className="divide-y divide-line border-t border-line px-4">
                {h.rows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-ui text-sm text-ink truncate">
                        {r.guest_name}
                        {r.service_name && <span className="text-info"> · {r.service_name}</span>}
                      </p>
                      <p className="font-ui text-xs text-ink-3">
                        {fmtDate(r.reservation_date, locale)} · {mad(r.amount_spent ?? 0, locale)} {t("dépensés", "spent")} · {Math.round(r.commission_rate * 100)}{t(" %", "%")}
                        {r.amount_source === "pos" ? t(" · caisse", " · POS") : ""}
                      </p>
                    </div>
                    <span className="font-display shrink-0 text-sm text-warn tabular-nums">{mad(r.commission, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
