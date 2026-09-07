"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useVenueQrReservations,
  type VenueQrReservation,
} from "@/hooks/use-venue-qr-reservations";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
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

const monthLabel = (period: string) => {
  const label = new Date(`${period}-01T00:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const mad = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} MAD`;

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
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

function groupByHotel(rows: VenueQrReservation[]): HotelGroup[] {
  const map = new Map<string, HotelGroup>();
  for (const r of rows) {
    const key = r.referrer_id ?? "inconnu";
    const g = map.get(key) ?? {
      key,
      hotelId: r.referrer_id,
      name: r.referrer_name ?? "Hôtel partenaire",
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

function exportCsv(rows: VenueQrReservation[]) {
  const header = [
    "Mois",
    "Date sortie",
    "Client",
    "Hôtel d'origine",
    "Prestation",
    "Montant dépensé (MAD)",
    "Taux",
    "Commission reversée (MAD)",
    "Origine du montant",
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
      r.amount_source === "pos" ? "caisse" : "saisie manuelle",
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
  const { isLoading } = useAuthUser();
  const { reservations, isLoading: loadingData } = useVenueQrReservations();
  const [settlements, setSettlements] = useState<Settlement[] | null>(null);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("commission_settlements")
      .select("period, hotel_id, amount, settled_at, note")
      .then(({ data }) => {
        if (!cancelled) setSettlements((data as Settlement[] | null) ?? []);
      });
    return () => {
      cancelled = true;
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
        hotels: groupByHotel(rows),
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
      label: "À régler ce mois",
      value: mad(thisMonthToSettle),
      hint: thisMonth ? `${thisMonth.rows.length} sortie${thisMonth.rows.length > 1 ? "s" : ""} commissionnée${thisMonth.rows.length > 1 ? "s" : ""}` : "aucune sortie ce mois",
    },
    {
      label: "Restant dû",
      value: mad(toSettle),
      hint: toSettle > 0 ? "tous mois confondus" : "vous êtes à jour",
    },
    { label: "Réglé", value: mad(settledTotal), hint: `${mad(total)} reversés au total` },
    {
      label: "En attente de montant",
      value: awaiting,
      hint: awaiting > 0 ? "saisissez l'addition pour solder" : undefined,
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
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-white">Commissions</h1>
          <p className="font-ui text-sm text-white/60 mt-1.5">
            Ce que vous reversez à chaque hôtel qui vous envoie des clients, mois par mois.
          </p>
        </div>
        {due.length > 0 && (
          <button
            onClick={() => exportCsv(due)}
            className="font-ui flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <Download size={16} strokeWidth={1.5} />
            Exporter en CSV
          </button>
        )}
      </div>

      <StatStrip stats={stats} />

      {/* Ce mois-ci */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-normal text-white">{monthLabel(now)}</h2>
          <span className="font-display text-lg text-amber-300 tabular-nums">
            {mad(thisMonth?.commission ?? 0)}
          </span>
        </div>
        <p className="font-ui text-xs text-white/40 mb-4">
          Par hôtel d&apos;origine. Le règlement se fait au mois clôturé, consolidé par twocards.
        </p>
        {thisMonth ? (
          <HotelList
            month={thisMonth}
            settled={settled}
            open={open}
            toggle={toggle}
          />
        ) : (
          <p className="font-ui text-sm text-white/40 leading-relaxed">
            Aucune sortie commissionnée ce mois-ci pour le moment.
            {awaiting > 0 && ` ${awaiting} sortie${awaiting > 1 ? "s" : ""} du réseau attend${awaiting > 1 ? "ent" : ""} encore un montant.`}
          </p>
        )}
      </div>

      {/* Historique */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <h2 className="font-display text-lg font-normal text-white mb-1">Historique</h2>
        <p className="font-ui text-xs text-white/40 mb-4">
          Un mois, puis chaque hôtel, puis chaque sortie. Touchez pour déplier.
        </p>
        {history.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center mx-auto mb-4">
              <Coins size={22} strokeWidth={1.5} className="text-amber-400" />
            </div>
            <p className="font-ui text-sm text-white/45 max-w-md mx-auto">
              Les mois passés apparaîtront ici avec, pour chacun, ce qui a été reversé à chaque hôtel.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
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
                      className={`shrink-0 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-ui text-sm font-semibold text-white">{monthLabel(m.period)}</p>
                      <p className="font-ui text-xs text-white/45">
                        {m.rows.length} sortie{m.rows.length > 1 ? "s" : ""} · {m.hotels.length} hôtel{m.hotels.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-base text-white tabular-nums">{mad(m.commission)}</p>
                      <p className={`font-ui text-[11px] ${remaining > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                        {remaining > 0 ? `${mad(remaining)} à régler` : "réglé"}
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

      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/15 bg-amber-500/[0.07] backdrop-blur-xl p-4">
        <Percent size={16} strokeWidth={1.5} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="font-ui text-xs leading-relaxed text-white/60 max-w-2xl">
          Vous reversez un pourcentage du montant réellement dépensé, 10 % par défaut, uniquement sur les
          clients apportés par un hôtel du réseau. La commission se calcule dès que l&apos;addition est saisie
          ou remontée par votre caisse. Les réservations de votre portail direct et celles prises par vous-même
          ne sont jamais commissionnées. Le même détail, ligne par ligne, est celui que voit l&apos;hôtel.
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
  return (
    <ul className="space-y-2">
      {month.hotels.map((h) => {
        const key = `${month.period}|${h.key}`;
        const isOpen = open.has(key);
        const s = settled(month.period, h.hotelId);
        return (
          <li key={key} className="rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Hotel size={15} strokeWidth={1.75} className="text-white/80" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-ui text-sm font-semibold text-white truncate">{h.name}</p>
                <p className="font-ui text-xs text-white/45">
                  {h.rows.length} sortie{h.rows.length > 1 ? "s" : ""} · {mad(h.spent)} dépensés
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-base text-amber-300 tabular-nums">{mad(h.commission)}</p>
                {s ? (
                  <p className="font-ui inline-flex items-center gap-1 text-[11px] text-emerald-300">
                    <Check size={11} strokeWidth={2.5} />
                    réglé le {new Date(s.settled_at).toLocaleDateString("fr-FR")}
                  </p>
                ) : (
                  <p className="font-ui inline-flex items-center gap-1 text-[11px] text-amber-300/90">
                    <Clock size={11} strokeWidth={2} />
                    à régler
                  </p>
                )}
              </div>
              <ChevronDown
                size={15}
                strokeWidth={1.75}
                className={`shrink-0 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <ul className="divide-y divide-white/[0.05] border-t border-white/[0.08] px-4">
                {h.rows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-ui text-sm text-white truncate">
                        {r.guest_name}
                        {r.service_name && <span className="text-blue-300/80"> · {r.service_name}</span>}
                      </p>
                      <p className="font-ui text-xs text-white/45">
                        {fmtDate(r.reservation_date)} · {mad(r.amount_spent ?? 0)} dépensés · {Math.round(r.commission_rate * 100)} %
                        {r.amount_source === "pos" ? " · caisse" : ""}
                      </p>
                    </div>
                    <span className="font-display shrink-0 text-sm text-amber-300 tabular-nums">{mad(r.commission)}</span>
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
