"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  Coins,
  Plus,
  Receipt,
  Star,
  Users,
} from "lucide-react";
import {
  CalendarCard,
  DonutCard,
  Script,
  SectionTitle,
  ServiceCard,
  TrendCard,
  dailySeries,
  greeting,
  monthlySeries,
} from "@/components/app/glass";
import {
  Card,
  EmptyState,
  ErrorState,
  KpiGrid,
  LinkButton,
  PageHeader,
  PageSkeleton,
  StatusPill,
  useNotify,
} from "@/components/app/ui";
import { ReservationRow } from "@/components/venue/reservations/reservation-row";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { useVenueReservations } from "@/hooks/use-venue-reservations";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import {
  byDateTime,
  commissionsOf,
  currentPeriod,
  isOut,
  isPending,
  needsAction,
  needsBill,
  todayIso,
  type Reservation,
} from "@/lib/venue/reservations";

/* Accueil de l'établissement : « Aujourd'hui ». Dans l'ordre où l'on se
   pose les questions en arrivant :
   1. qui attend ma réponse ? — les demandes à confirmer, en tête, avec
      Confirmer / Refuser sur place, puis les additions à saisir ;
   2. comment se présente le service ? — la carte du jour et l'agenda ;
   3. comment ça marche ? — les chiffres, puis les tendances.
   La navigation, elle, reste dans le rail. */

function UpcomingLine({ r }: { r: Reservation }) {
  const t = useT();
  const intl = useIntlLocale();
  return (
    <li className="flex items-center gap-3 px-5 py-3 sm:px-6">
      <p className="num w-24 shrink-0 text-[13px] text-ink-3">
        {new Date(`${r.reservation_date}T00:00:00`).toLocaleDateString(intl, {
          weekday: "short",
          day: "numeric",
          month: "short",
        })}
      </p>
      <p className="num w-12 shrink-0 text-sm font-bold text-ink">{r.reservation_time ?? "—"}</p>
      <p className="min-w-0 flex-1 truncate text-sm text-ink">
        {r.guest_name}
        <span className="text-ink-3">
          {" · "}
          {t(`${r.party_size} pers.`, `${r.party_size} ${r.party_size === 1 ? "guest" : "guests"}`)}
        </span>
      </p>
      <StatusPill status={r.status} />
    </li>
  );
}

export default function VenueTodayPage() {
  const t = useT();
  const intl = useIntlLocale();
  const notify = useNotify();
  const { isLoading: authLoading, fullName } = useAuthUser();
  const unread = useUnreadMessages();
  const { rows, isLoading, error, reload, busy, setStatus, checkIn, saveBill, assignTable } =
    useVenueReservations();

  if (authLoading || isLoading) return <PageSkeleton kpis={4} rows={5} />;
  if (error)
    return (
      <Card padded={false}>
        <ErrorState onRetry={reload} />
      </Card>
    );

  const today = todayIso();
  const now = new Date();
  const money = (n: number) => `${Math.round(n).toLocaleString(intl)} MAD`;
  const short = (n: number) => (n >= 10000 ? `${Math.round(n / 100) / 10}k` : Math.round(n).toLocaleString(intl));
  const plural = (n: number, fr: string, en: string) => t(`${n} ${fr}${n > 1 ? "s" : ""}`, `${n} ${en}${n === 1 ? "" : "s"}`);

  const pending = rows.filter(isPending).sort(byDateTime);
  const bills = rows.filter((r) => needsBill(r, today)).sort(byDateTime);
  const todayRows = rows.filter((r) => r.reservation_date === today && r.status !== "annulée").sort(byDateTime);
  /* Déjà listées en tête (à confirmer, addition) : pas de doublon. */
  const todayRest = todayRows.filter((r) => !needsAction(r, today));
  const covers = todayRows.reduce((n, r) => n + r.party_size, 0);
  const arrived = todayRows.filter((r) => r.arrived_at).length;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextArrival = todayRows.find((r) => {
    if (!r.reservation_time || r.arrived_at || r.status === "no-show") return false;
    const [h, m] = r.reservation_time.split(":").map(Number);
    return h * 60 + m >= nowMinutes;
  });
  const upcoming = rows.filter((r) => r.reservation_date > today && r.status !== "annulée").sort(byDateTime);

  const live = rows.filter((r) => !isOut(r));
  const commissionMonth = commissionsOf(rows);
  const commissionPrev = commissionsOf(rows, currentPeriod(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
  /* Sept derniers jours contre les sept d'avant. */
  const dayIso = (offset: number) => todayIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset));
  const last7 = live.filter((r) => r.reservation_date > dayIso(-7) && r.reservation_date <= today).length;
  const prev7 = live.filter((r) => r.reservation_date > dayIso(-14) && r.reservation_date <= dayIso(-7)).length;
  const rated = rows.filter((r) => typeof r.rating === "number");
  const rating = rated.length ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : null;
  const months = monthlySeries(live, (r) => r.amount_spent ?? 0, (r) => r.commission, intl);
  const bills6 = months.slice(-6).reduce((s, m) => s + m.a, 0);
  const sources = [
    { label: t("Hôtels (QR)", "Hotels (QR)"), value: live.filter((r) => r.source === "qr").length },
    { label: t("Portail direct", "Direct portal"), value: live.filter((r) => r.source === "portal").length },
    { label: t("Sur place", "In-house"), value: live.filter((r) => r.source === "venue").length },
  ];

  const copyReviewLink = async (r: Reservation) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/avis/${r.id}`);
      notify(t("Lien d'avis copié : envoyez-le au client.", "Review link copied: send it to the guest."));
    } catch {
      notify(t("Le lien n'a pas pu être copié.", "The link couldn't be copied."), "error");
    }
  };
  const actions = { setStatus, checkIn, saveBill, assignTable, copyReviewLink, openReview: () => {} };

  const dateLabel = now.toLocaleDateString(intl, { weekday: "long", day: "numeric", month: "long" });
  const firstName = fullName?.split(" ")[0];

  /* Une phrase : ce qui attend, puis le service. */
  const summary = [
    pending.length > 0
      ? t(
          `${pending.length} demande${pending.length > 1 ? "s" : ""} à confirmer`,
          `${pending.length} request${pending.length === 1 ? "" : "s"} to confirm`
        )
      : t("aucune demande en attente", "no pending request"),
    covers > 0 ? t(`${covers} couverts aujourd'hui`, `${covers} guests today`) : t("aucune réservation aujourd'hui", "no booking today"),
    nextArrival ? t(`prochaine arrivée à ${nextArrival.reservation_time}`, `next arrival at ${nextArrival.reservation_time}`) : null,
    unread > 0 ? t(`${unread} message${unread > 1 ? "s" : ""} non lu${unread > 1 ? "s" : ""}`, `${unread} unread message${unread === 1 ? "" : "s"}`) : null,
  ]
    .filter(Boolean)
    .join(" · ");

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
        description={`${dateLabel.charAt(0).toUpperCase()}${dateLabel.slice(1)} · ${summary}.`}
        actions={
          <>
            <Link href="/dashboard/reservations" className="tc-link mr-3 text-[13px] font-medium text-ink">
              {t("Toutes les réservations", "All bookings")}
            </Link>
            <LinkButton href="/dashboard/reservations?nouvelle=1" icon={Plus} variant="primary" size="lg">
              {t("Nouvelle réservation", "New booking")}
            </LinkButton>
          </>
        }
      />

      {/* 1. Ce qui attend une réponse. */}
      <section aria-labelledby="a-confirmer" className="space-y-4">
        {pending.length > 0 ? (
          <>
            <SectionTitle
              id="a-confirmer"
              hint={t(
                "Le client attend votre réponse : confirmez ou refusez d'un geste.",
                "The guest is waiting for your answer: confirm or decline in one tap."
              )}
              more={
                pending.length > 4
                  ? { href: "/dashboard/reservations?vue=a-traiter", label: t(`Tout voir (${pending.length})`, `See all (${pending.length})`) }
                  : undefined
              }
            >
              {t(
                <>
                  {pending.length} demande{pending.length > 1 ? "s" : ""} <Script>à confirmer</Script>.
                </>,
                <>
                  {pending.length} request{pending.length === 1 ? "" : "s"} <Script>to confirm</Script>.
                </>
              )}
            </SectionTitle>
            <ul className="space-y-3">
              {pending.slice(0, 4).map((r) => (
                <ReservationRow key={r.id} r={r} busy={Boolean(busy[r.id])} tables={[]} actions={actions} />
              ))}
            </ul>
          </>
        ) : (
          <SectionTitle
            id="a-confirmer"
            hint={t("Les nouvelles demandes s'affichent ici dès qu'elles arrivent.", "New requests show up here as soon as they arrive.")}
          >
            {t(
              <>
                Aucune demande <Script>en attente</Script>.
              </>,
              <>
                No request <Script>pending</Script>.
              </>
            )}
          </SectionTitle>
        )}
      </section>

      {bills.length > 0 && (
        <section aria-labelledby="additions" className="space-y-4">
          <SectionTitle
            id="additions"
            hint={t(
              "Clients venus sans montant : saisissez l'addition pour calculer la commission.",
              "Guests who came without an amount: enter the bill to compute the commission."
            )}
            more={
              bills.length > 3
                ? { href: "/dashboard/reservations?vue=a-traiter", label: t(`Tout voir (${bills.length})`, `See all (${bills.length})`) }
                : undefined
            }
          >
            {t(
              <>
                {bills.length} addition{bills.length > 1 ? "s" : ""} <Script>à saisir</Script>.
              </>,
              <>
                {bills.length} bill{bills.length === 1 ? "" : "s"} <Script>to enter</Script>.
              </>
            )}
          </SectionTitle>
          <ul className="space-y-3">
            {bills.slice(0, 3).map((r) => (
              <ReservationRow key={r.id} r={r} busy={Boolean(busy[r.id])} tables={[]} actions={actions} />
            ))}
          </ul>
        </section>
      )}

      {/* 2. Le service du jour. */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ServiceCard
          title={
            covers > 0
              ? t(
                  <>
                    Aujourd&apos;hui, <Script>{covers} couverts</Script> attendus.
                  </>,
                  <>
                    Today, <Script>{covers} guests</Script> expected.
                  </>
                )
              : t(
                  <>
                    Aucun client <Script>attendu</Script> aujourd&apos;hui.
                  </>,
                  <>
                    No guests <Script>expected</Script> today.
                  </>
                )
          }
          text={
            nextArrival
              ? t(
                  `Prochaine arrivée à ${nextArrival.reservation_time} : ${nextArrival.guest_name}, ${nextArrival.party_size} pers.${nextArrival.referrer_name ? ` (${nextArrival.referrer_name})` : ""}.`,
                  `Next arrival at ${nextArrival.reservation_time}: ${nextArrival.guest_name}, party of ${nextArrival.party_size}${nextArrival.referrer_name ? ` (${nextArrival.referrer_name})` : ""}.`
                )
              : todayRows.length > 0
                ? t("Plus d'arrivée prévue pour le reste de la journée.", "No more arrivals planned today.")
                : t(
                    "Partagez votre portail : les réservations directes sont sans commission.",
                    "Share your portal: direct bookings are commission-free."
                  )
          }
          stats={[
            { value: todayRows.length, label: t("réservations", "bookings") },
            { value: covers, label: t("couverts", "guests") },
            { value: `${arrived}/${todayRows.length}`, label: t("arrivés", "arrived") },
          ]}
          primary={{ href: "/dashboard/reservations?vue=aujourdhui", label: t("Voir le service", "View the service") }}
        />
        <CalendarCard
          busyDays={new Set(live.map((r) => r.reservation_date))}
          countLabel={plural(todayRows.length, "réservation", "booking")}
          href="/dashboard/reservations?vue=a-venir"
          emptyLabel={t("Rien de prévu pour l'instant", "Nothing planned yet")}
          events={[...todayRows.filter((r) => !r.arrived_at && r.status !== "no-show"), ...upcoming]
            .slice(0, 3)
            .map((r, i) => ({
              id: r.id,
              time:
                r.reservation_date === today
                  ? (r.reservation_time ?? "—")
                  : new Date(`${r.reservation_date}T00:00:00`).toLocaleDateString(intl, { day: "numeric", month: "short" }),
              title: r.guest_name,
              sub: t(
                `${r.party_size} pers.${r.referrer_name ? ` · ${r.referrer_name}` : ""}`,
                `${r.party_size} guest${r.party_size === 1 ? "" : "s"}${r.referrer_name ? ` · ${r.referrer_name}` : ""}`
              ),
              tag: i === 0 ? t("Prochaine", "Next") : undefined,
              pending: r.status === "en attente",
            }))}
        />
      </div>

      {/* 3. Les chiffres. */}
      <KpiGrid
        items={[
          {
            label: t("Réservations · 7 j", "Bookings · 7 d"),
            value: last7,
            icon: CalendarDays,
            delta: prev7 > 0 ? (last7 - prev7) / prev7 : null,
            hint: prev7 > 0 ? t("vs 7 j précédents", "vs previous 7 d") : undefined,
            deltaLabel: t("première semaine", "first week"),
            href: "/dashboard/reservations",
            trend: dailySeries(live, () => 1),
          },
          {
            label: t("Couverts · 14 j", "Guests · 14 d"),
            value: dailySeries(live, (r) => r.party_size).reduce((a, b) => a + b, 0),
            icon: Users,
            hint: t(`${covers} aujourd'hui`, `${covers} today`),
            href: "/dashboard/guests",
            trend: dailySeries(live, (r) => r.party_size),
          },
          {
            label: t("Commissions du mois", "Commissions this month"),
            value: money(commissionMonth),
            icon: Coins,
            highlight: true,
            delta: commissionPrev > 0 ? (commissionMonth - commissionPrev) / commissionPrev : null,
            hint: commissionPrev > 0 ? t(`vs ${short(commissionPrev)} MAD`, `vs ${short(commissionPrev)} MAD`) : undefined,
            deltaLabel: t("premier mois", "first month"),
            href: "/dashboard/commissions",
            trend: dailySeries(live, (r) => r.commission),
          },
          rating !== null
            ? {
                label: t("Note des clients", "Guest rating"),
                value: rating.toLocaleString(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                icon: Star,
                tone: "amber",
                hint: t(`${rated.length} avis`, `${rated.length} review${rated.length === 1 ? "" : "s"}`),
                href: "/dashboard/guests",
              }
            : {
                label: t("Additions à saisir", "Bills to enter"),
                value: bills.length,
                icon: Receipt,
                tone: bills.length > 0 ? "amber" : "default",
                hint: bills.length > 0 ? t("montant manquant", "amount missing") : t("tout est saisi", "all entered"),
                href: "/dashboard/reservations?vue=a-traiter",
              },
        ]}
      />

      {/* Le reste de la journée. */}
      <section aria-labelledby="journee" className="space-y-4">
        <SectionTitle id="journee">
          {t(
            <>
              Le reste <Script>de la journée</Script>.
            </>,
            <>
              The rest <Script>of the day</Script>.
            </>
          )}
        </SectionTitle>
        {todayRest.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              compact
              icon={CalendarDays}
              title={
                todayRows.length === 0
                  ? t("Aucune réservation aujourd'hui", "No bookings today")
                  : t("Rien d'autre aujourd'hui", "Nothing else today")
              }
              description={t(
                "Les demandes des hôtels et du portail arrivent ici d'elles-mêmes.",
                "Requests from hotels and the portal land here on their own."
              )}
              action={<LinkButton href="/dashboard/portal">{t("Partager mon portail", "Share my portal")}</LinkButton>}
            />
          </Card>
        ) : (
          <ul className="space-y-2.5">
            {todayRest.map((r) => (
              <ReservationRow key={r.id} r={r} busy={Boolean(busy[r.id])} tables={[]} actions={actions} />
            ))}
          </ul>
        )}
      </section>

      {/* Les tendances. */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TrendCard
          title={t("Chiffre apporté", "Revenue brought in")}
          description={t(`${money(bills6)} d'additions sur les 6 derniers mois`, `${money(bills6)} in bills over the last 6 months`)}
          months={months}
          series={{ a: t("Additions", "Bills"), b: t("Commissions", "Commissions") }}
          format={money}
          action={
            <LinkButton href="/dashboard/analytics" variant="secondary" size="sm" icon={BarChart3}>
              {t("Analyses", "Analytics")}
            </LinkButton>
          }
        />
        <DonutCard
          title={t("D'où viennent vos clients", "Where guests come from")}
          description={t("Toutes les réservations", "All bookings")}
          total={live.length}
          totalLabel={t("réservations", "bookings")}
          segments={sources.map((s) => ({ ...s, display: String(s.value) }))}
        />
      </div>

      {upcoming.length > 0 && (
        <Card
          padded={false}
          title={t("À venir", "Coming up")}
          actions={
            <LinkButton href="/dashboard/reservations?vue=a-venir" size="sm" variant="ghost">
              {t(`Tout voir (${upcoming.length})`, `See all (${upcoming.length})`)}
            </LinkButton>
          }
        >
          <ul className="divide-y divide-line border-t border-line">
            {upcoming.slice(0, 5).map((r) => (
              <UpcomingLine key={r.id} r={r} />
            ))}
          </ul>
        </Card>
      )}

    </>
  );
}
