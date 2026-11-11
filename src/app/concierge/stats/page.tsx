"use client";

import { BarChart3, CalendarCheck, Coins, Info, Link2, Percent, ScanLine } from "lucide-react";
import {
  Card,
  EmptyState,
  InfoNote,
  KpiGrid,
  LinkButton,
  PageHeader,
  PageSkeleton,
  StatusPill,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import { ConciergeLoadError } from "@/components/concierge/states";
import { Bars, RankedBars, SplitBar } from "@/components/hotel/charts";
import { loadFailed } from "@/components/hotel/states";
import { useConciergeLinks } from "@/lib/concierge/use-links";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  countBy,
  isLive,
  monthlySeries,
  reservationCategoryLabel,
  topN,
  weekdayDistribution,
} from "@/lib/hotel/analytics";
import { formatMad, formatNumber, formatPercent, plural } from "@/lib/hotel/format";
import { useLocale, useT } from "@/lib/i18n/client";

/* Statistiques du concierge : uniquement ce qui se calcule à partir de la
   base — les ouvertures de chaque lien (compteur scans), les réservations
   qui en sortent, le taux de conversion, et leur répartition. Pas
   d'audience, pas de portée : ces chiffres n'existent pas en base. */
export default function ConciergeStatsPage() {
  const t = useT();
  const locale = useLocale();
  const { rows, qrCodes, reservations, isLoading, failed, reload } = useConciergeLinks();

  if (isLoading) return <PageSkeleton kpis={4} rows={6} />;

  const header = (
    <PageHeader
      title={t("Statistiques", "Statistics")}
      description={t(
        "Combien de fois vos liens sont ouverts, combien de réservations en sortent, et lesquels fonctionnent le mieux.",
        "How often your links are opened, how many reservations come out of them, and which ones work best."
      )}
    />
  );

  if (loadFailed(failed, qrCodes, reservations))
    return (
      <>
        {header}
        <ConciergeLoadError onRetry={reload} />
      </>
    );

  if (qrCodes.length === 0 && reservations.length === 0)
    return (
      <>
        {header}
        <Card padded={false}>
          <EmptyState
            icon={BarChart3}
            title={t("Pas encore de statistiques", "No statistics yet")}
            description={t(
              "Les chiffres apparaissent dès que votre lien est ouvert pour la première fois.",
              "Figures appear as soon as your link is opened for the first time."
            )}
            action={
              <LinkButton href="/concierge" variant="primary" icon={Link2}>
                {t("Créer mon lien", "Create my link")}
              </LinkButton>
            }
          />
        </Card>
      </>
    );

  const live = reservations.filter(isLive);
  const scans = qrCodes.reduce((s, q) => s + q.scans, 0);
  /* Réservations rattachées à un lien encore existant : c'est le seul
     numérateur comparable au compteur de scans. */
  const linked = rows.reduce((s, q) => s + q.liveReservations, 0);
  const commission = live.reduce((s, r) => s + r.commission, 0);
  const ranked = [...rows].sort(
    (a, b) => b.liveReservations - a.liveReservations || b.scans - a.scans || a.label.localeCompare(b.label, locale)
  );
  const byCategory = CATEGORIES.map((c) => ({
    label: reservationCategoryLabel(c, locale),
    value: live.filter((r) => r.category === c).length,
    color: CATEGORY_COLORS[c],
  }));
  const count = (n: number) =>
    `${formatNumber(n, locale)} ${t(plural(n, "réservation"), plural(n, "reservation", undefined, "en"))}`;

  return (
    <>
      {header}

      <KpiGrid
        items={[
          {
            label: t("Ouvertures", "Opens"),
            value: formatNumber(scans, locale),
            hint: t("liens ouverts et QR scannés", "links opened and QR codes scanned"),
            icon: ScanLine,
            tone: "violet",
          },
          {
            label: t("Réservations", "Reservations"),
            value: formatNumber(live.length, locale),
            hint: t("hors annulées et no-show", "excluding cancelled and no-show"),
            icon: CalendarCheck,
            tone: "sky",
          },
          {
            label: t("Taux de conversion", "Conversion rate"),
            value: scans > 0 ? formatPercent(linked / scans, 1, locale) : "—",
            hint:
              scans > 0
                ? t("réservations pour 100 ouvertures", "reservations per 100 opens")
                : t("aucune ouverture pour l'instant", "no opens yet"),
            icon: Percent,
            tone: "amber",
          },
          {
            label: t("Commissions", "Commissions"),
            value: formatMad(commission, true, locale),
            hint: t("cumulées", "all-time"),
            icon: Coins,
            tone: "emerald",
            href: "/concierge/commissions",
          },
        ]}
      />

      <Card
        title={t("Par lien", "By link")}
        description={t(
          "Un lien par canal permet de voir d'où viennent vos réservations.",
          "One link per channel shows where your reservations come from."
        )}
        actions={
          <LinkButton href="/concierge/liens" size="sm" variant="ghost">
            {t("Gérer mes liens", "Manage my links")}
          </LinkButton>
        }
        padded={false}
      >
        <Table stack>
          <thead>
            <tr>
              <Th>{t("Lien", "Link")}</Th>
              <Th>{t("Statut", "Status")}</Th>
              <Th align="right">{t("Ouvertures", "Opens")}</Th>
              <Th align="right">{t("Réservations", "Reservations")}</Th>
              <Th align="right">{t("Conversion", "Conversion")}</Th>
              <Th align="right">{t("Montant dépensé", "Amount spent")}</Th>
              <Th align="right">{t("Commission", "Commission")}</Th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((q) => (
              <Tr key={q.id}>
                <Td head className="font-bold">
                  {q.label}
                </Td>
                <Td label={t("Statut", "Status")}>
                  <StatusPill status={q.active ? "actif" : "inactif"} />
                </Td>
                <Td label={t("Ouvertures", "Opens")} align="right" className="num">
                  {formatNumber(q.scans, locale)}
                </Td>
                <Td label={t("Réservations", "Reservations")} align="right" className="num">
                  {formatNumber(q.liveReservations, locale)}
                </Td>
                <Td label={t("Conversion", "Conversion")} align="right" className="num" muted>
                  {q.scans > 0 ? formatPercent(q.conversion, 1, locale) : "—"}
                </Td>
                <Td label={t("Montant dépensé", "Amount spent")} align="right" className="num whitespace-nowrap" muted>
                  {q.spent > 0 ? formatMad(q.spent, false, locale) : "—"}
                </Td>
                <Td label={t("Commission", "Commission")} align="right" className="num whitespace-nowrap font-bold">
                  {q.commission > 0 ? formatMad(q.commission, false, locale) : "—"}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {live.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card
            title={t("Réservations par mois", "Reservations per month")}
            description={t("6 derniers mois, par date de sortie", "Last 6 months, by outing date")}
            className="xl:col-span-2"
          >
            <Bars data={monthlySeries(live, 6, undefined, undefined, locale)} color="bg-link" height={160} />
            <div className="mt-5 border-t border-line pt-4">
              <h3 className="mb-2 text-[13px] font-bold text-ink-2">{t("Par catégorie", "By category")}</h3>
              <SplitBar segments={byCategory} format={count} />
            </div>
          </Card>
          <div className="space-y-4">
            <Card title={t("Établissements les plus réservés", "Most-booked venues")}>
              <RankedBars items={topN(countBy(live, (r) => r.venue_name), 5)} format={count} color="bg-link" />
            </Card>
            <Card title={t("Jours de sortie", "Outing days")}>
              <Bars data={weekdayDistribution(live, locale)} color="bg-ok" height={110} />
            </Card>
          </div>
        </div>
      )}

      <InfoNote icon={Info}>
        {t(
          "Une ouverture est comptée chaque fois que le menu s'ouvre depuis un lien ou un QR, une fois par session de navigateur ; l'aperçu depuis votre espace n'est pas compté. Le taux de conversion rapporte les réservations de vos liens existants à ces ouvertures.",
          "An open is counted each time the menu opens from a link or a QR code, once per browser session; the preview from your workspace isn't counted. The conversion rate compares the reservations from your existing links with these opens."
        )}
      </InfoNote>
    </>
  );
}
