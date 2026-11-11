"use client";

import { useMemo, useState } from "react";
import { Coins, Download, HelpCircle, Hourglass, Percent, TrendingUp, Wallet } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  InfoNote,
  KpiGrid,
  PageHeader,
  PageSkeleton,
  Segmented,
  Select,
} from "@/components/app/ui";
import { Bars, RankedBars, SplitBar } from "@/components/hotel/charts";
import { CommissionDetailTable, StatementTable } from "@/components/hotel/commission-tables";
import { HotelLoadError, commissionRule, loadFailed } from "@/components/hotel/states";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  commissionRates,
  hasCommission,
  isLive,
  localMonthKey,
  monthlySeries,
  previousMonthStart,
  reservationCategoryLabel,
  sumBy,
  topN,
} from "@/lib/hotel/analytics";
import { exportCommissionsCsv } from "@/lib/hotel/exports";
import {
  formatMad,
  formatNumber,
  monthKey,
  monthLabel,
  plural,
  sameMonth,
  todayIso,
} from "@/lib/hotel/format";
import { useHotelSpace } from "@/lib/hotel/store";
import { useLocale, useT } from "@/lib/i18n/client";

type Scope = "mois" | "precedent" | "tout";

export default function HotelCommissionsPage() {
  const { isLoading: authLoading } = useAuthUser();
  const { reservations, qrCodes, isLoading, failed, reload } = useHotelSpace();
  const [scope, setScope] = useState<Scope>("mois");
  const [month, setMonth] = useState<string>("tous");
  const t = useT();
  const locale = useLocale();

  const earning = useMemo(() => reservations.filter(hasCommission), [reservations]);
  const months = useMemo(
    () => [...new Set(earning.map((r) => monthKey(r.reservation_date)))].sort().reverse(),
    [earning]
  );

  if (authLoading || isLoading) return <PageSkeleton kpis={4} rows={8} />;

  const today = todayIso();
  /* Mois précédent en heure locale : passer par toISOString() le ramenait
     en UTC, donc au mois d'avant pour un hôtel à l'est de Greenwich. */
  const prev = previousMonthStart();
  const thisKey = monthKey(today);
  const prevKey = localMonthKey(prev);
  const sum = (rows: typeof earning) => rows.reduce((s, r) => s + r.commission, 0);

  const total = sum(earning);
  const thisMonth = sum(earning.filter((r) => sameMonth(r.reservation_date)));
  const prevMonth = sum(earning.filter((r) => sameMonth(r.reservation_date, prev)));
  const pendingAmount = reservations.filter((r) => isLive(r) && r.amount_spent === null);
  const awaiting = pendingAmount.filter((r) => r.reservation_date < today);
  const upcoming = pendingAmount.filter((r) => r.reservation_date >= today);
  const avgTicket = earning.length > 0 ? earning.reduce((s, r) => s + (r.amount_spent ?? 0), 0) / earning.length : 0;
  const avgCommission = earning.length > 0 ? total / earning.length : 0;

  const series = monthlySeries(earning, 6, (r) => r.commission, undefined, locale);
  const byCategory = CATEGORIES.map((label) => ({
    label: reservationCategoryLabel(label, locale),
    value: sum(earning.filter((r) => r.category === label)),
    color: CATEGORY_COLORS[label],
  }));
  const byRoom = topN(sumBy(earning, (r) => r.qr_label ?? t("QR supprimé", "Deleted QR"), (r) => r.commission), 5);
  const byVenue = topN(sumBy(earning, (r) => r.venue_name, (r) => r.commission), 5);

  /* Relevé mensuel : le mois courant est « en cours », les autres « clôturés ». */
  const statement = months.map((key) => {
    const rows = earning.filter((r) => monthKey(r.reservation_date) === key);
    return {
      key,
      rows,
      spent: rows.reduce((s, r) => s + (r.amount_spent ?? 0), 0),
      commission: sum(rows),
      current: key === thisKey,
    };
  });

  const detail = earning
    .filter((r) => {
      if (scope === "mois") return sameMonth(r.reservation_date);
      if (scope === "precedent") return sameMonth(r.reservation_date, prev);
      return month === "tous" || monthKey(r.reservation_date) === month;
    })
    .sort((a, b) => b.reservation_date.localeCompare(a.reservation_date));
  const detailTotal = sum(detail);
  const suffix = scope === "mois" ? thisKey : scope === "precedent" ? prevKey : month;

  const header = (
    <PageHeader
      title={t("Commissions", "Commissions")}
      description={t(
        "Chaque sortie réservée depuis un de vos QR codes vous rapporte un pourcentage du montant réellement dépensé. Tout est tracé : par mois, par emplacement, par adresse.",
        "Every outing booked from one of your QR codes earns you a percentage of what the guest actually spends. Everything is tracked: by month, by location, by place."
      )}
      actions={
        <Button
          icon={Download}
          onClick={() => exportCommissionsCsv(detail, suffix, t, locale)}
          disabled={detail.length === 0}
        >
          {t("Exporter le relevé", "Export statement")}
        </Button>
      }
    />
  );

  if (loadFailed(failed, reservations, qrCodes))
    return (
      <>
        {header}
        <HotelLoadError onRetry={reload} />
      </>
    );

  return (
    <>
      {header}

      <KpiGrid
        items={[
          {
            label: t("Ce mois-ci", "This month"),
            value: formatMad(thisMonth, true, locale),
            delta: prevMonth > 0 ? (thisMonth - prevMonth) / prevMonth : null,
            deltaLabel: t("pas de mois précédent", "no previous month"),
            hint:
              prevMonth > 0
                ? t(`vs ${formatMad(prevMonth, true)} le mois dernier`, `vs ${formatMad(prevMonth, true, "en")} last month`)
                : undefined,
            icon: Wallet,
            tone: "emerald",
          },
          {
            label: t("Cumulées", "All-time"),
            value: formatMad(total, true, locale),
            hint: t(
              `${earning.length} ${plural(earning.length, "sortie commissionnée", "sorties commissionnées")}`,
              `${earning.length} ${plural(earning.length, "commissioned outing", undefined, "en")}`
            ),
            icon: Coins,
            tone: "sky",
          },
          {
            label: t("Commission moyenne", "Average commission"),
            value: formatMad(avgCommission, false, locale),
            hint: t(
              `sur un panier moyen de ${formatMad(avgTicket)}`,
              `on an average spend of ${formatMad(avgTicket, false, "en")}`
            ),
            icon: TrendingUp,
            tone: "violet",
          },
          {
            label: t("En attente de montant", "Awaiting amount"),
            value: formatNumber(awaiting.length, locale),
            hint: t(
              `${upcoming.length} ${plural(upcoming.length, "sortie")} à venir`,
              `${upcoming.length} upcoming ${plural(upcoming.length, "outing", undefined, "en")}`
            ),
            icon: Hourglass,
            tone: "amber",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card
          title={t("Commissions par mois", "Commissions per month")}
          description={t("6 derniers mois, sorties commissionnées", "Last 6 months, commissioned outings")}
          className="xl:col-span-2"
        >
          <Bars data={series} color="bg-ok" height={160} format={(n) => formatMad(n, true, locale)} />
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-2 text-[13px] font-bold text-ink-2">{t("Par catégorie", "By category")}</h3>
            <SplitBar segments={byCategory} format={(n) => formatMad(n, false, locale)} />
          </div>
        </Card>
        <div className="space-y-4">
          <Card title={t("Emplacements les plus rentables", "Top-earning locations")}>
            <RankedBars
              items={byRoom}
              format={(n) => formatMad(n, true, locale)}
              color="bg-ok"
              empty={t("Aucune commission pour le moment.", "No commissions yet.")}
            />
          </Card>
          <Card title={t("Adresses les plus rentables", "Top-earning places")}>
            <RankedBars
              items={byVenue}
              format={(n) => formatMad(n, true, locale)}
              color="bg-link"
              empty={t("Aucune commission pour le moment.", "No commissions yet.")}
            />
          </Card>
        </div>
      </div>

      {statement.length > 0 && (
        <Card
          title={t("Relevé mensuel", "Monthly statement")}
          description={t(
            "Un mois clôturé est versé le mois suivant. Pour toute question sur un montant, contactez votre référent twocards.",
            "A closed month is paid out the following month. For any question about an amount, contact your twocards representative."
          )}
          padded={false}
        >
          <StatementTable months={statement} onExport={(m) => exportCommissionsCsv(m.rows, m.key, t, locale)} />
        </Card>
      )}

      <Card
        title={t("Détail des commissions", "Commission details")}
        description={t(
          `${detail.length} ${plural(detail.length, "ligne")} · ${formatMad(detailTotal)}`,
          `${detail.length} ${plural(detail.length, "line", undefined, "en")} · ${formatMad(detailTotal, false, "en")}`
        )}
        actions={
          <>
            <Segmented<Scope>
              size="sm"
              label={t("Période", "Period")}
              value={scope}
              onChange={setScope}
              options={[
                { value: "mois", label: t("Ce mois", "This month") },
                { value: "precedent", label: t("Mois dernier", "Last month") },
                { value: "tout", label: t("Par mois", "By month") },
              ]}
            />
            {scope === "tout" && (
              <Select
                label={t("Mois", "Month")}
                value={month}
                onChange={setMonth}
                className="w-48"
                options={[
                  { value: "tous", label: t("Tous les mois", "All months") },
                  ...months.map((k) => ({ value: k, label: monthLabel(k, true, locale) })),
                ]}
              />
            )}
          </>
        }
        padded={false}
      >
        {detail.length === 0 ? (
          <EmptyState
            compact
            icon={Coins}
            title={t("Aucune commission sur cette période", "No commissions for this period")}
            description={
              awaiting.length > 0
                ? t(
                    `${awaiting.length} ${plural(awaiting.length, "sortie passée attend", "sorties passées attendent")} encore un montant : la commission apparaît dès que l'établissement l'a saisi.`,
                    `${awaiting.length} past ${plural(awaiting.length, "outing is", "outings are", "en")} still awaiting an amount: the commission appears as soon as the venue enters it.`
                  )
                : t(
                    "Chaque sortie réservée via vos QR codes vous rapporte un pourcentage du montant dépensé. Tout apparaîtra ici, exportable en CSV.",
                    "Every outing booked through your QR codes earns you a percentage of the amount spent. It will all appear here, exportable to CSV."
                  )
            }
            action={
              scope !== "tout" && earning.length > 0 ? (
                <Button onClick={() => setScope("tout")}>{t("Voir tous les mois", "View all months")}</Button>
              ) : undefined
            }
          />
        ) : (
          <CommissionDetailTable rows={detail} />
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoNote icon={Percent}>
          {t("Votre commission : ", "Your commission: ")}
          {commissionRule(commissionRates(reservations), locale)}.{" "}
          {t(
            "Le taux de chaque sortie figure dans le détail ci-dessus. Le calcul est automatique dès que le montant est saisi par l'établissement ou remonté par sa caisse.",
            "Each outing's rate is shown in the details above. It's calculated automatically as soon as the venue enters the amount or its till reports it."
          )}
        </InfoNote>
        <InfoNote icon={HelpCircle}>
          {t(
            "Les commissions d'un mois clôturé sont versées le mois suivant. Le relevé CSV reprend chaque ligne avec son taux : c'est votre justificatif comptable.",
            "Commissions for a closed month are paid out the following month. The CSV statement lists every line with its rate: it's your accounting record."
          )}
        </InfoNote>
      </div>
    </>
  );
}
