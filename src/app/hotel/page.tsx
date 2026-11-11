"use client";

import Link from "next/link";
import { CalendarDays, Clock, Coins, Inbox, Plus } from "lucide-react";
import {
  CalendarCard,
  DonutCard,
  ServiceCard,
  Script,
  TrendCard,
  dailySeries,
  greeting,
  monthlySeries,
  thisWeek,
} from "@/components/app/glass";
import { InfoNote, KpiGrid, LinkButton, PageHeader, PageSkeleton, type Kpi } from "@/components/app/ui";
import { HotelLoadError, loadFailed } from "@/components/hotel/states";
import { MonthCard, TopQrCard } from "@/components/hotel/today/earnings";
import { FirstSteps } from "@/components/hotel/today/first-steps";
import { OutingsCard } from "@/components/hotel/today/outings-card";
import { PendingRequests } from "@/components/hotel/today/pending-requests";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatMad, formatNumber, plural } from "@/lib/hotel/format";
import { useHotelToday } from "@/lib/hotel/today";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";

const CATEGORY: Record<string, [string, string]> = {
  restaurant: ["Restaurants", "Restaurants"],
  restaurants: ["Restaurants", "Restaurants"],
  club: ["Clubs", "Clubs"],
  clubs: ["Clubs", "Clubs"],
  activite: ["Activités", "Activities"],
  activity: ["Activités", "Activities"],
  activities: ["Activités", "Activities"],
  spa: ["Spas", "Spas"],
};

/* Accueil de l'espace hôtel : « Aujourd'hui », en verre. Dans l'ordre de
   ce qui presse — la semaine en un coup d'œil (carte corail et agenda),
   les chiffres du jour, les demandes en attente, les sorties, puis les
   tendances. */
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
  const live = reservations.filter((r) => r.status !== "annulée" && r.status !== "no-show");
  const week = thisWeek(reservations).filter((r) => r.status !== "annulée");
  const percent = week.length > 0 ? (week.filter((r) => r.status === "confirmée").length / week.length) * 100 : 0;
  const agenda = [...todays, ...upcoming].slice(0, 3);
  const money = (n: number) => formatMad(n, true, locale);
  /* Commissions et additions des clients, en dirhams : même échelle. */
  const monthsBills = monthlySeries(live, (r) => r.commission, (r) => r.amount_spent ?? 0, intl);
  const byCategory = new Map<string, number>();
  for (const r of live) byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
  const segments = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, v]) => {
      const pair = CATEGORY[k.toLowerCase()];
      return {
        label: pair ? (locale === "en" ? pair[1] : pair[0]) : k.charAt(0).toUpperCase() + k.slice(1),
        value: v,
        display: String(v),
      };
    });
  const commission6 = monthsBills.slice(-6).reduce((s, m) => s + m.a, 0);

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
      trend: dailySeries(reservations, () => 1),
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
      trend: dailySeries(live, (r) => r.party_size),
    },
    {
      label: t("Commissions du mois", "Commissions this month"),
      value: money(summary.commissionMonth),
      highlight: true,
      delta:
        summary.commissionPrev > 0
          ? (summary.commissionMonth - summary.commissionPrev) / summary.commissionPrev
          : null,
      deltaLabel: t("pas de mois précédent", "no previous month"),
      hint: summary.commissionPrev > 0 ? t("vs mois précédent", "vs last month") : undefined,
      icon: Coins,
      href: "/hotel/commissions",
      trend: dailySeries(live, (r) => r.commission),
    },
    {
      label: t("À venir", "Upcoming"),
      value: formatNumber(upcoming.length, locale),
      hint: t(`dont ${summary.upcomingWeek} sous 7 jours`, `${summary.upcomingWeek} within 7 days`),
      icon: CalendarDays,
      tone: "violet",
      href: "/hotel/reservations?periode=avenir",
      trend: dailySeries(live, () => 1),
    },
  ];

  const attention = pending.length + summary.awaitingAmount;

  return (
    <>
      <PageHeader
        title={
          firstName ? (
            <>
              {greeting(t)}, <Script>{firstName}</Script>.
            </>
          ) : (
            <>{greeting(t)}.</>
          )
        }
        description={
          pending.length > 0
            ? t(
                `${pending.length} ${plural(pending.length, "demande")} en attente de l'établissement, ${todays.length} ${plural(todays.length, "sortie")} aujourd'hui.`,
                `${pending.length} ${plural(pending.length, "request", undefined, "en")} awaiting the venue, ${todays.length} ${plural(todays.length, "outing", undefined, "en")} today.`
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
            {qrCodes.length > 0 && (
              <Link href="/hotel/chambres/imprimer" className="tc-link mr-3 text-[13px] font-medium text-ink">
                {t("Imprimer les cartes", "Print the cards")}
              </Link>
            )}
            <LinkButton href="/hotel/chambres?nouveau=1" icon={Plus} variant="primary" size="lg">
              {t("Nouveau QR code", "New QR code")}
            </LinkButton>
          </>
        }
      />

      {loadFailed(failed, qrCodes, reservations) ? (
        <HotelLoadError onRetry={reload} />
      ) : (
        <>
          {qrCodes.length === 0 && <FirstSteps />}

          <PendingRequests pending={pending} today={today} />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <ServiceCard
              title={
                week.length > 0
                  ? t(
                      <>
                        Cette semaine, <Script>{week.length} sorties</Script> réservées.
                      </>,
                      <>
                        This week, <Script>{week.length} outings</Script> booked.
                      </>
                    )
                  : t(
                      <>
                        Votre semaine reste <Script>à écrire</Script>.
                      </>,
                      <>
                        Your week is <Script>still unwritten</Script>.
                      </>
                    )
              }
              text={t(
                `${Math.round(percent)} % des sorties de la semaine sont confirmées${attention > 0 ? `, ${attention} à suivre` : ""}.`,
                `${Math.round(percent)}% of this week's outings are confirmed${attention > 0 ? `, ${attention} to follow up` : ""}.`
              )}
              stats={[
                { value: week.length, label: t("sorties / semaine", "outings / week") },
                { value: summary.paidOutingsMonth, label: t("payées ce mois", "paid this month") },
                { value: formatMad(summary.commissionMonth, true, locale), label: t("commissions", "commissions") },
              ]}
              primary={{ href: "/hotel/reservations", label: t("Voir les sorties", "View outings") }}
            />
            <CalendarCard
              busyDays={new Set(live.map((r) => r.reservation_date))}
              countLabel={t(
                `${todays.length} ${plural(todays.length, "sortie")}`,
                `${todays.length} ${plural(todays.length, "outing", undefined, "en")}`
              )}
              href="/hotel/reservations?periode=avenir"
              emptyLabel={t("Aucune sortie prévue", "No outing planned")}
              events={agenda.map((r, i) => ({
                id: r.id,
                time:
                  r.reservation_date === today
                    ? (r.reservation_time ?? "—")
                    : new Date(`${r.reservation_date}T00:00:00`).toLocaleDateString(intl, {
                        day: "numeric",
                        month: "short",
                      }),
                title: r.guest_name,
                sub: r.venue_name + (r.qr_label ? ` · ${r.qr_label}` : ""),
                tag: i === 0 ? t("Prochaine", "Next") : undefined,
                pending: r.status === "en attente",
              }))}
            />
          </div>

          <KpiGrid items={kpis} />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <TrendCard
              title={t("Commissions", "Commissions")}
              description={t(
                `${money(commission6)} gagnés sur les 6 derniers mois`,
                `${money(commission6)} earned over the last 6 months`
              )}
              months={monthsBills}
              series={{ a: t("Commissions", "Commissions"), b: t("Additions des clients", "Guests' bills") }}
              format={money}
              action={
                <LinkButton href="/hotel/commissions" variant="primary" size="sm" icon={Coins}>
                  {t("Détail", "Details")}
                </LinkButton>
              }
            />
            <DonutCard
              title={t("Où sortent vos clients", "Where guests go")}
              description={t("Toutes les sorties", "All outings")}
              total={live.length}
              totalLabel={t("sorties", "outings")}
              segments={segments}
            />
          </div>

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
