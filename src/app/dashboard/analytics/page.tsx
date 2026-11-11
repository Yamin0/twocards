"use client";

import { BarChart3, CalendarRange, Download, Globe, QrCode, Star, Store } from "lucide-react";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  KpiGrid,
  PageHeader,
  PageSkeleton,
  Segmented,
  cardClass,
  type Kpi,
} from "@/components/app/ui";
import { Bars, ChannelDonut, type ChannelSegment } from "@/components/venue/analytics/charts";
import {
  fmtCouverts,
  fmtMAD,
  fmtMADShort,
  getPeriods,
} from "@/components/venue/analytics/analytics-lib";
import { useVenueAnalytics } from "@/components/venue/analytics/use-venue-analytics";

/* Analyses de l'établissement — tout est dérivé des réservations réelles.
   Aucune donnée de démonstration : la page montre ce qui s'est vraiment
   passé, ou explique pourquoi elle n'a rien à montrer. */

export default function AnalyticsPage() {
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  const a = useVenueAnalytics();

  if (a.isLoading) return <PageSkeleton kpis={3} />;

  const periods = getPeriods(t);
  const periodLabel = periods.find((p) => p.value === a.period)?.label ?? a.period;
  const one = (v: number) => v.toLocaleString(intl, { maximumFractionDigits: 1 });
  const { stats, buckets, channels, weekdays, filtered, totalCount } = a;

  const header = (
    <PageHeader
      title={t("Analyses", "Analytics")}
      description={t(
        "Vos résultats, calculés sur vos réservations et tenus à jour en direct.",
        "Your results, calculated from your reservations and kept up to date live."
      )}
      actions={
        !a.error && (
          <>
            <Segmented
              label={t("Période", "Period")}
              options={periods}
              value={a.period}
              onChange={a.setPeriod}
            />
            {filtered.length > 0 && (
              <Button icon={Download} onClick={a.exportPeriod}>
                {t("Exporter en CSV", "Export as CSV")}
              </Button>
            )}
          </>
        )
      }
    />
  );

  if (a.error) {
    return (
      <div className="space-y-6">
        {header}
        <div className={cardClass}>
          <ErrorState onRetry={a.reload} />
        </div>
      </div>
    );
  }

  /* Aucune réservation, toutes périodes confondues : on explique d'où
     viendront les chiffres au lieu d'aligner des zéros. */
  if (totalCount === 0) {
    return (
      <div className="space-y-6">
        {header}
        <div className={cardClass}>
          <EmptyState
            icon={BarChart3}
            title={t("Pas encore de données à analyser", "No data to analyse yet")}
            description={t(
              "Dès vos premières réservations, via le réseau QR des hôtels ou votre portail direct, cette page calculera votre chiffre d'affaires, vos couverts, votre note moyenne et vos meilleurs jours. Rien à configurer.",
              "From your very first reservations, via the hotels' QR network or your direct portal, this page will calculate your revenue, covers, average rating and best days. Nothing to set up."
            )}
          />
        </div>
      </div>
    );
  }

  /* Des réservations existent, mais pas sur la période choisie. */
  if (filtered.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <div className={cardClass}>
          <EmptyState
            icon={CalendarRange}
            title={t(
              `Aucune réservation sur « ${periodLabel} »`,
              `No reservations in “${periodLabel}”`
            )}
            description={t(
              `Votre historique contient ${totalCount} réservation${totalCount > 1 ? "s" : ""}, mais aucune sur cette période.`,
              `Your history has ${totalCount} reservation${totalCount === 1 ? "" : "s"}, but none in this period.`
            )}
            action={
              <Button onClick={() => a.setPeriod("tout")}>
                {t("Voir tout l'historique", "Show full history")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const kpis: Kpi[] = [
    {
      label: t("Chiffre d'affaires", "Revenue"),
      value: fmtMAD(stats.ca, locale),
      hint:
        stats.awaiting > 0
          ? t(
              `${stats.awaiting} sortie${stats.awaiting > 1 ? "s" : ""} sans montant saisi`,
              `${stats.awaiting} outing${stats.awaiting === 1 ? "" : "s"} with no amount entered`
            )
          : undefined,
    },
    {
      label: t("Couverts", "Covers"),
      value: stats.couverts.toLocaleString(intl),
      hint: t("hors annulations et no-shows", "excluding cancellations and no-shows"),
    },
    {
      label: t("Panier moyen / couvert", "Average spend / cover"),
      value: stats.panier !== null ? fmtMAD(stats.panier, locale) : "—",
      hint:
        stats.panier === null
          ? t("aucun montant saisi sur la période", "no amounts entered in this period")
          : t("sur les sorties au montant connu", "based on outings with a known amount"),
    },
    {
      label: t("Réservations", "Reservations"),
      value: filtered.length.toLocaleString(intl),
      hint:
        stats.cancelled > 0
          ? t(
              `dont ${stats.cancelled} annulée${stats.cancelled > 1 ? "s" : ""}`,
              `incl. ${stats.cancelled} cancelled`
            )
          : undefined,
    },
    {
      label: t("Note moyenne", "Average rating"),
      value: stats.avgRating !== null ? `${one(stats.avgRating)} / 5` : "—",
      hint:
        stats.avgRating !== null
          ? t(
              `${stats.ratedCount} avis client${stats.ratedCount > 1 ? "s" : ""}`,
              `${stats.ratedCount} guest review${stats.ratedCount === 1 ? "" : "s"}`
            )
          : t("aucun avis sur la période", "no reviews in this period"),
    },
    stats.noShows > 0
      ? {
          label: t("Taux de no-show", "No-show rate"),
          value: `${one(stats.noShowRate)}${t(" %", "%")}`,
          hint: t(
            `${stats.noShows} no-show${stats.noShows > 1 ? "s" : ""} sur la période`,
            `${stats.noShows} no-show${stats.noShows === 1 ? "" : "s"} in this period`
          ),
        }
      : {
          label: t("No-shows", "No-shows"),
          value: "0",
          hint: t("aucun no-show sur la période", "no no-shows in this period"),
        },
  ];

  /* Mêmes jetons pour le trait de l'anneau et la pastille de légende. */
  const segments: ChannelSegment[] = [
    {
      label: t("Réseau QR", "QR network"),
      value: channels.qr,
      stroke: "var(--app-link)",
      dot: "bg-link",
      icon: QrCode,
    },
    {
      label: t("Portail direct", "Direct portal"),
      value: channels.portal,
      stroke: "var(--app-ok)",
      dot: "bg-ok",
      icon: Globe,
    },
    {
      label: t("Établissement", "Venue"),
      value: channels.venue,
      stroke: "var(--app-ink-4)",
      dot: "bg-ink-4",
      icon: Store,
    },
  ];

  const coversTitle = buckets.daily
    ? t("Couverts par jour", "Covers per day")
    : t("Couverts par mois", "Covers per month");
  const revenueTitle = buckets.daily
    ? t("Chiffre d'affaires par jour", "Revenue per day")
    : t("Chiffre d'affaires par mois", "Revenue per month");
  const weekdaysTitle = t("Meilleurs jours de la semaine", "Best days of the week");
  const channelsTitle = t("Répartition par canal", "Breakdown by channel");
  const best = weekdays.best >= 0 ? weekdays.data[weekdays.best] : null;

  return (
    <div className="space-y-6">
      {header}

      <KpiGrid items={kpis} columns={3} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card
          title={coversTitle}
          description={t("hors annulations et no-shows", "excluding cancellations and no-shows")}
        >
          <Bars
            label={`${coversTitle} (${periodLabel})`}
            data={buckets.list.map((b) => ({ label: b.label, full: b.full, value: b.couverts }))}
            format={(v) => fmtCouverts(v, locale)}
            short={(v) => String(Math.round(v))}
          />
        </Card>

        <Card
          title={revenueTitle}
          description={t(
            "montants saisis ou remontés par la caisse",
            "amounts entered manually or synced from the POS"
          )}
        >
          <Bars
            label={`${revenueTitle} (${periodLabel})`}
            data={buckets.list.map((b) => ({ label: b.label, full: b.full, value: b.ca }))}
            format={(v) => fmtMAD(v, locale)}
            short={(v) => fmtMADShort(v, locale)}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title={channelsTitle}>
          <ChannelDonut
            label={`${channelsTitle} (${periodLabel})`}
            segments={segments}
            total={channels.total}
          />
        </Card>

        <Card
          title={weekdaysTitle}
          description={t("couverts moyens par jour d'activité", "average covers per trading day")}
        >
          <Bars
            label={`${weekdaysTitle} (${periodLabel})`}
            data={weekdays.data}
            format={(v) =>
              t(`${one(v)} couverts en moyenne`, `${one(v)} covers on average`)
            }
            short={one}
          />
          {best && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-2">
              <Star size={14} strokeWidth={1.75} className="shrink-0 text-warn" aria-hidden />
              {t(
                `Votre meilleur jour : ${best.full} (${one(best.value)} couverts en moyenne)`,
                `Your best day: ${best.full} (${one(best.value)} covers on average)`
              )}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
