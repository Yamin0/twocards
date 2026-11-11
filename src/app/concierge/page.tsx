"use client";

import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, Clock, Coins, Inbox, MessageSquare } from "lucide-react";
import { InfoNote, KpiGrid, LinkButton, PageHeader, PageSkeleton, type Kpi } from "@/components/app/ui";
import { CreateFirstLink, LinkHero } from "@/components/concierge/link-hero";
import { ConciergeLoadError } from "@/components/concierge/states";
import { OutingsCard, PendingCard } from "@/components/concierge/today-cards";
import { loadFailed } from "@/components/hotel/states";
import { MonthCard } from "@/components/hotel/today/earnings";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { useConciergeLinks } from "@/lib/concierge/use-links";
import { formatMad, formatNumber, plural } from "@/lib/hotel/format";
import { todaySummary } from "@/lib/hotel/today";
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

/* Accueil du concierge : « Aujourd'hui ». Son lien et son QR en tête, puis
   ce qui presse — les demandes en attente, les sorties du jour et à venir,
   les commissions du mois. Tout est lu en base ; rien n'est créé au
   chargement (le premier lien se crée au clic). */
export default function ConciergeTodayPage() {
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  const unread = useUnreadMessages();
  const space = useConciergeLinks();
  const { qrCodes, reservations, profile, isLoading, failed, reload } = space;

  if (isLoading) return <PageSkeleton kpis={4} rows={5} />;

  const summary = todaySummary(qrCodes, reservations);
  const { pending, todays, upcoming, today } = summary;
  const firstName = space.fullName?.split(" ")[0];
  const nextToday = todays.find((r) => r.reservation_time);
  const hasLink = qrCodes.length > 0;

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
      href: "/concierge/reservations?statut=attente",
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
      href: "/concierge/reservations?periode=aujourdhui",
    },
    {
      label: t("À venir", "Upcoming"),
      value: formatNumber(upcoming.length, locale),
      hint: t(`dont ${summary.upcomingWeek} sous 7 jours`, `${summary.upcomingWeek} within 7 days`),
      icon: CalendarDays,
      tone: "violet",
      href: "/concierge/reservations?periode=avenir",
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
      href: "/concierge/commissions",
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
          !hasLink
            ? t(
                "Créez votre lien pour commencer à recevoir des réservations.",
                "Create your link to start receiving reservations."
              )
            : pending.length > 0
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
          <>
            <LinkButton href="/concierge/venues" icon={Building2}>
              {t("Établissements", "Venues")}
            </LinkButton>
            <LinkButton href="/concierge/messages" icon={MessageSquare}>
              {t("Messages", "Messages")}
            </LinkButton>
          </>
        }
      />

      {loadFailed(failed, qrCodes, reservations) ? (
        <ConciergeLoadError onRetry={reload} />
      ) : (
        <>
          {hasLink ? (
            <LinkHero links={qrCodes} linkOf={space.linkOf} displayName={space.displayName} />
          ) : (
            <CreateFirstLink onCreate={space.createLink} />
          )}

          {unread > 0 && (
            <Link
              href="/concierge/messages"
              className="flex items-center gap-3 rounded-2xl border border-info/25 bg-info-soft px-5 py-3.5 text-sm text-ink transition-colors hover:border-info/50"
            >
              <MessageSquare size={18} strokeWidth={1.75} className="shrink-0 text-info" aria-hidden />
              <span className="flex-1 font-bold">
                {t(
                  `${unread} ${plural(unread, "message non lu", "messages non lus")}`,
                  `${unread} unread ${plural(unread, "message", undefined, "en")}`
                )}
              </span>
              <ArrowRight size={16} strokeWidth={2} className="text-info" aria-hidden />
            </Link>
          )}

          {hasLink && !profile.hotel_name && (
            <InfoNote tone="amber">
              {t(
                <>
                  Le nom affiché en tête de votre menu client n&apos;est pas encore réglé.{" "}
                  <Link href="/concierge/settings" className="font-bold text-link underline">
                    Régler mon menu
                  </Link>
                </>,
                <>
                  The name shown at the top of your guest menu isn&apos;t set yet.{" "}
                  <Link href="/concierge/settings" className="font-bold text-link underline">
                    Set up my menu
                  </Link>
                </>
              )}
            </InfoNote>
          )}

          {/* Sans lien et sans réservation, les compteurs ne diraient que
              des zéros : on ne les montre qu'à partir du premier lien. */}
          {(hasLink || reservations.length > 0) && (
            <>
              <PendingCard pending={pending} today={today} />
              <KpiGrid items={kpis} />
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <OutingsCard todays={todays} upcoming={upcoming} today={today} />
                </div>
                <MonthCard summary={summary} statementHref="/concierge/commissions" />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
