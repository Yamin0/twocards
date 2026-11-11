"use client";

import { currentPeriod, isDue, mad, monthLabel } from "@/lib/commissions";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, ErrorState, KpiGrid, PageHeader, PageSkeleton } from "@/components/app/ui";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useVenueQrReservations,
} from "@/hooks/use-venue-qr-reservations";
import { useLocale, useT } from "@/lib/i18n/client";
import { HotelList } from "@/components/venue/commissions/hotel-list";
import {
  exportCsv,
  groupByHotel,
  periodOf,
  type MonthGroup,
  type Settlement,
} from "@/components/venue/commissions/commissions-lib";
import {
  ChevronDown,
  Coins,
  Download,
  Percent,
} from "lucide-react";

/* Commissions de l'établissement — ce qu'il reverse aux hôtels qui lui
   envoient des clients, mois par mois et hôtel par hôtel.

   Une ligne = une sortie apportée par un QR d'hôtel dont l'addition est
   connue ; la commission est dérivée en base (montant × taux), la page ne
   fait qu'agréger. Le canal direct (portail) et les réservations maison sont
   à 0 % par construction. Un règlement, noté par twocards, vaut pour un
   mois et un hôtel : c'est ce qui sépare « à régler » de « réglé ». */

export default function VenueCommissionsPage() {
  const t = useT();
  const locale = useLocale();
  const { isLoading } = useAuthUser();
  const { reservations, isLoading: loadingData, error, reload } = useVenueQrReservations();
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

  if (error)
    return (
      <Card padded={false}>
        <ErrorState onRetry={reload} />
      </Card>
    );
  if (isLoading || loadingData || reservations === null || settlements === null)
    return <PageSkeleton kpis={4} rows={5} />;

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
    <>
      <PageHeader
        title={t("Commissions", "Commissions")}
        description={t(
          "Ce que vous reversez à chaque hôtel qui vous envoie des clients, mois par mois.",
          "What you pay each hotel that sends you guests, month by month."
        )}
        actions={
          due.length > 0 && (
            <Button icon={Download} onClick={() => exportCsv(due, locale)}>
              {t("Exporter en CSV", "Export as CSV")}
            </Button>
          )
        }
      />

      <KpiGrid items={stats} />

      {/* Ce mois-ci */}
      <div className="rounded-2xl border border-line bg-panel p-5 shadow-card sm:p-6">
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
      <div className="rounded-2xl border border-line bg-panel p-5 shadow-card sm:p-6">
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
    </>
  );
}

