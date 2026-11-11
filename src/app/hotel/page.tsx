"use client";

import Link from "next/link";
import { CalendarDays, Clock, Coins, Inbox, Printer } from "lucide-react";
import { InfoNote, KpiGrid, LinkButton, PageHeader, PageSkeleton, type Kpi } from "@/components/app/ui";
import { HotelLoadError, loadFailed } from "@/components/hotel/states";
import { MonthCard, TopQrCard } from "@/components/hotel/today/earnings";
import { FirstSteps } from "@/components/hotel/today/first-steps";
import { OutingsCard } from "@/components/hotel/today/outings-card";
import { PendingRequests } from "@/components/hotel/today/pending-requests";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatMad, formatNumber, plural } from "@/lib/hotel/format";
import { useHotelToday } from "@/lib/hotel/today";
import type { Translate } from "@/lib/i18n";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";

const greeting = (t: Translate) => {
  const h = new Date().getHours();
  return h < 5
    ? t("Bonne nuit", "Good night")
    : h < 12
      ? t("Bonjour", "Good morning")
      : h < 18
        ? t("Bon après-midi", "Good afternoon")
        : t("Bonsoir", "Good evening");
};

/* Accueil de l'espace hôtel : « Aujourd'hui ». Dans l'ordre de ce qui
   presse — les demandes en attente, les sorties du jour et à venir, les
   commissions du mois, le QR qui rapporte le plus. Les tendances longues
   sont dans Analyses. */
export default function HotelHomePage() {
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  const { fullName, isLoading: authLoading } = useAuthUser();
  const { qrCodes, reservations, profile, isLoading, failed, reload, summary } = useHotelToday();

  if (authLoading || isLoading) return <PageSkeleton kpis={4} rows={5} />;

  const { pending, todays, upcoming, today } = summary;
  const firstName = fullName?.split(" ")[0];
  const nextToday = todays.find((r) => r.reservation_time);

  const kpis: Kpi[] = [
    {
      label: t("En attente", "Pending"),
      value: formatNumber(pending.length, locale),
      hint:
        pending.length > 0
          ? t("à confirmer par l'établissement", "to be confirmed by the venue")
          : t("rien à suivre", "nothing to follow up"),
      icon: Inbox,
      tone: pending.length > 0 ? "amber" : "default",
      href: "/hotel/reservations?statut=attente",
    },
    {
      label: t("Sorties aujourd'hui", "Outings today"),
      value: formatNumber(todays.length, locale),
      hint: nextToday
        ? t(`première à ${nextToday.reservation_time}`, `first at ${nextToday.reservation_time}`)
        : todays.length > 0
          ? t("heure non précisée", "no time given")
          : t("aucune prévue", "none planned"),
      icon: Clock,
      tone: "sky",
      href: "/hotel/reservations?periode=aujourdhui",
    },
    {
      label: t("À venir", "Upcoming"),
      value: formatNumber(upcoming.length, locale),
      hint: t(`dont ${summary.upcomingWeek} sous 7 jours`, `${summary.upcomingWeek} within 7 days`),
      icon: CalendarDays,
      tone: "violet",
      href: "/hotel/reservations?periode=avenir",
    },
    {
      label: t("Commissions du mois", "Commissions this month"),
      value: formatMad(summary.commissionMonth, true, locale),
      delta:
        summary.commissionPrev > 0
          ? (summary.commissionMonth - summary.commissionPrev) / summary.commissionPrev
          : null,
      deltaLabel: t("pas de mois précédent", "no previous month"),
      hint: summary.commissionPrev > 0 ? t("vs mois précédent", "vs last month") : undefined,
      icon: Coins,
      tone: "emerald",
      href: "/hotel/commissions",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(intl, { weekday: "long", day: "numeric", month: "long" })}
        title={
          <>
            {greeting(t)}
            {firstName ? `, ${firstName}` : ""}
          </>
        }
        description={
          pending.length > 0
            ? t(
                `${pending.length} ${plural(pending.length, "demande")} en attente, ${todays.length} ${plural(todays.length, "sortie")} aujourd'hui.`,
                `${pending.length} ${plural(pending.length, "request", undefined, "en")} pending, ${todays.length} ${plural(todays.length, "outing", undefined, "en")} today.`
              )
            : todays.length > 0
              ? t(
                  `${todays.length} ${plural(todays.length, "sortie")} aujourd'hui. Aucune demande en attente.`,
                  `${todays.length} ${plural(todays.length, "outing", undefined, "en")} today. No pending requests.`
                )
              : t("Aucune demande en attente, aucune sortie aujourd'hui.", "No pending requests, no outings today.")
        }
        actions={
          qrCodes.length > 0 && (
            <LinkButton href="/hotel/chambres/imprimer" icon={Printer}>
              {t("Imprimer les cartes", "Print the cards")}
            </LinkButton>
          )
        }
      />

      {loadFailed(failed, qrCodes, reservations) ? (
        <HotelLoadError onRetry={reload} />
      ) : (
        <>
          {qrCodes.length === 0 && <FirstSteps />}

          <PendingRequests pending={pending} today={today} />

          <KpiGrid items={kpis} />

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <OutingsCard todays={todays} upcoming={upcoming} today={today} hasQr={qrCodes.length > 0} />
            </div>
            <div className="space-y-4">
              <TopQrCard top={summary.topQr} byCommission={summary.rankedByCommission} hasQr={qrCodes.length > 0} />
              <MonthCard summary={summary} />
            </div>
          </div>

          {!profile.hotel_name && (
            <InfoNote tone="amber">
              {t(
                <>
                  Le nom et la ville de l&apos;hôtel ne sont pas renseignés : ils s&apos;affichent sur le menu client et
                  sur les cartes imprimées.{" "}
                  <Link href="/hotel/settings" className="font-bold text-link underline">
                    Compléter
                  </Link>
                </>,
                <>
                  The hotel&apos;s name and city are missing: they appear on the guest menu and on printed cards.{" "}
                  <Link href="/hotel/settings" className="font-bold text-link underline">
                    Add them
                  </Link>
                </>
              )}
            </InfoNote>
          )}
        </>
      )}
    </>
  );
}
