"use client";

import { useMemo, useState } from "react";
import { Coins, Download, Hourglass, Percent, TrendingUp, Wallet } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  InfoNote,
  KpiGrid,
  PageHeader,
  PageSkeleton,
  Select,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import { ConciergeLoadError } from "@/components/concierge/states";
import { Bars } from "@/components/hotel/charts";
import { CommissionDetailTable, StatementTable } from "@/components/hotel/commission-tables";
import { commissionRule, loadFailed } from "@/components/hotel/states";
import { useConciergeSpace } from "@/lib/concierge/space";
import {
  commissionRates,
  hasCommission,
  isLive,
  monthlySeries,
  previousMonthStart,
} from "@/lib/hotel/analytics";
import { exportCommissionsCsv } from "@/lib/hotel/exports";
import { formatMad, formatNumber, monthKey, monthLabel, plural, sameMonth, todayIso } from "@/lib/hotel/format";
import type { HotelReservation } from "@/lib/hotel/store";
import { downloadCsv } from "@/lib/csv";
import { useLocale, useT } from "@/lib/i18n/client";

const ALL = "tous";
const sum = (rows: HotelReservation[]) => rows.reduce((s, r) => s + r.commission, 0);
const spent = (rows: HotelReservation[]) => rows.reduce((s, r) => s + (r.amount_spent ?? 0), 0);

/* Commissions du concierge : par mois, par établissement, puis ligne par
   ligne. Ne comptent que les sorties dont l'établissement a saisi
   l'addition ; le montant est celui que porte la réservation en base. */
export default function ConciergeCommissionsPage() {
  const t = useT();
  const locale = useLocale();
  const { reservations, qrCodes, isLoading, failed, reload } = useConciergeSpace();
  const [month, setMonth] = useState<string>(ALL);

  const earning = useMemo(() => reservations.filter(hasCommission), [reservations]);
  const months = useMemo(
    () => [...new Set(earning.map((r) => monthKey(r.reservation_date)))].sort().reverse(),
    [earning]
  );

  if (isLoading) return <PageSkeleton kpis={4} rows={8} />;

  const today = todayIso();
  const thisKey = monthKey(today);
  const prev = previousMonthStart();
  const linkLabel = t("Lien", "Link");
  const scope = month !== ALL && months.includes(month) ? month : ALL;
  const detail = earning
    .filter((r) => scope === ALL || monthKey(r.reservation_date) === scope)
    .sort((a, b) => b.reservation_date.localeCompare(a.reservation_date));

  const header = (
    <PageHeader
      title={t("Commissions", "Commissions")}
      description={t(
        "Ce que vous rapportent les réservations passées par vos liens, une fois l'addition saisie par l'établissement. Par mois, par établissement, ligne par ligne.",
        "What reservations made through your links earn you, once the venue has entered the bill. By month, by venue, line by line."
      )}
      actions={
        <Button
          icon={Download}
          onClick={() => exportCommissionsCsv(detail, scope === ALL ? "tout" : scope, t, locale, linkLabel)}
          disabled={detail.length === 0}
        >
          {t("Exporter en CSV", "Export as CSV")}
        </Button>
      }
    />
  );

  if (loadFailed(failed, reservations, qrCodes))
    return (
      <>
        {header}
        <ConciergeLoadError onRetry={reload} />
      </>
    );

  const total = sum(earning);
  const thisMonth = sum(earning.filter((r) => sameMonth(r.reservation_date)));
  const prevMonth = sum(earning.filter((r) => sameMonth(r.reservation_date, prev)));
  const pendingAmount = reservations.filter((r) => isLive(r) && r.amount_spent === null);
  const awaiting = pendingAmount.filter((r) => r.reservation_date < today);
  const upcoming = pendingAmount.filter((r) => r.reservation_date >= today);

  const statement = months.map((key) => {
    const rows = earning.filter((r) => monthKey(r.reservation_date) === key);
    return { key, rows, spent: spent(rows), commission: sum(rows), current: key === thisKey };
  });

  /* Par établissement, sur la période choisie. */
  const byVenue = [...new Set(detail.map((r) => r.venue_name))]
    .map((name) => {
      const rows = detail.filter((r) => r.venue_name === name);
      return { name, count: rows.length, spent: spent(rows), commission: sum(rows) };
    })
    .sort((a, b) => b.commission - a.commission);

  const exportVenues = () =>
    downloadCsv(
      `commissions-${t("etablissements", "venues")}-${scope === ALL ? "tout" : scope}-${today}`,
      [
        t("Établissement", "Venue"),
        t("Sorties", "Outings"),
        t("Montant dépensé (MAD)", "Amount spent (MAD)"),
        t("Commission (MAD)", "Commission (MAD)"),
      ],
      byVenue.map((v) => [v.name, v.count, v.spent, v.commission]),
      ["TOTAL", detail.length, spent(detail), sum(detail)]
    );

  const periodSelect = months.length > 0 && (
    <Select
      label={t("Période", "Period")}
      value={scope}
      onChange={setMonth}
      className="w-48"
      options={[
        { value: ALL, label: t("Tous les mois", "All months") },
        ...months.map((k) => ({ value: k, label: monthLabel(k, true, locale) })),
      ]}
    />
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
            value: earning.length > 0 ? formatMad(total / earning.length, false, locale) : "—",
            hint:
              earning.length > 0
                ? t(
                    `sur une addition moyenne de ${formatMad(spent(earning) / earning.length)}`,
                    `on an average bill of ${formatMad(spent(earning) / earning.length, false, "en")}`
                  )
                : t("aucune addition saisie", "no bill entered yet"),
            icon: TrendingUp,
            tone: "violet",
          },
          {
            label: t("Addition attendue", "Bill awaited"),
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

      {earning.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={Coins}
            title={t("Aucune commission pour le moment", "No commissions yet")}
            description={
              awaiting.length > 0
                ? t(
                    `${awaiting.length} ${plural(awaiting.length, "sortie passée attend", "sorties passées attendent")} encore son addition : la commission apparaît dès que l'établissement l'a saisie.`,
                    `${awaiting.length} past ${plural(awaiting.length, "outing is", "outings are", "en")} still awaiting a bill: the commission appears as soon as the venue enters it.`
                  )
                : t(
                    "Une commission apparaît ici dès qu'un établissement saisit l'addition d'une réservation passée par l'un de vos liens.",
                    "A commission appears here as soon as a venue enters the bill for a reservation made through one of your links."
                  )
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <Card
              title={t("Commissions par mois", "Commissions per month")}
              description={t("6 derniers mois", "Last 6 months")}
            >
              <Bars
                data={monthlySeries(earning, 6, (r) => r.commission, undefined, locale)}
                color="bg-ok"
                height={160}
                format={(n) => formatMad(n, true, locale)}
              />
            </Card>
            <Card title={t("Par mois", "By month")} padded={false} className="xl:col-span-2">
              <StatementTable
                months={statement}
                onExport={(m) => exportCommissionsCsv(m.rows, m.key, t, locale, linkLabel)}
              />
            </Card>
          </div>

          <Card
            title={t("Par établissement", "By venue")}
            description={scope === ALL ? t("Tous les mois", "All months") : monthLabel(scope, true, locale)}
            actions={
              <>
                {periodSelect}
                <Button size="sm" icon={Download} onClick={exportVenues} disabled={byVenue.length === 0}>
                  CSV
                </Button>
              </>
            }
            padded={false}
          >
            <Table stack>
              <thead>
                <tr>
                  <Th>{t("Établissement", "Venue")}</Th>
                  <Th align="right">{t("Sorties", "Outings")}</Th>
                  <Th align="right">{t("Montant dépensé", "Amount spent")}</Th>
                  <Th align="right">{t("Commission", "Commission")}</Th>
                </tr>
              </thead>
              <tbody>
                {byVenue.map((v) => (
                  <Tr key={v.name}>
                    <Td head className="font-bold">
                      {v.name}
                    </Td>
                    <Td label={t("Sorties", "Outings")} align="right" className="num" muted>
                      {formatNumber(v.count, locale)}
                    </Td>
                    <Td label={t("Montant dépensé", "Amount spent")} align="right" className="num whitespace-nowrap" muted>
                      {formatMad(v.spent, false, locale)}
                    </Td>
                    <Td label={t("Commission", "Commission")} align="right" className="num whitespace-nowrap font-bold">
                      {formatMad(v.commission, false, locale)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <Card
            title={t("Détail des commissions", "Commission details")}
            description={t(
              `${detail.length} ${plural(detail.length, "ligne")} · ${formatMad(sum(detail))}`,
              `${detail.length} ${plural(detail.length, "line", undefined, "en")} · ${formatMad(sum(detail), false, "en")}`
            )}
            padded={false}
          >
            <CommissionDetailTable
              rows={detail}
              reservationHref={(id) => `/concierge/reservations?id=${id}`}
              locationLabel={linkLabel}
            />
          </Card>
        </>
      )}

      <InfoNote icon={Percent}>
        {t("Votre commission : ", "Your commission: ")}
        {commissionRule(commissionRates(reservations), locale)}.{" "}
        {t(
          "Le taux de chaque sortie figure dans le détail. Le calcul est automatique dès que l'addition est saisie par l'établissement ou remontée par sa caisse.",
          "Each outing's rate is shown in the details. It's calculated automatically as soon as the venue enters the bill or its till reports it."
        )}
      </InfoNote>
    </>
  );
}
