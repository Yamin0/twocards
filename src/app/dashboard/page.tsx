"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Coins, Inbox, MessageSquare, Receipt } from "lucide-react";
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
  isPending,
  needsAction,
  needsBill,
  todayIso,
  type Reservation,
} from "@/lib/venue/reservations";

/* Accueil de l'établissement : « Aujourd'hui ». Trois questions, dans
   l'ordre où on se les pose en arrivant : qu'est-ce qui m'attend (à
   confirmer, additions à saisir, messages), qui vient aujourd'hui, et où en
   sont les commissions du mois. Les gestes se font ici, sans changer de
   page. */

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
  const { isLoading: authLoading, venueName, isActivityVenue } = useAuthUser();
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
  const money = (n: number) => `${Math.round(n).toLocaleString(intl)} MAD`;
  const pending = rows.filter(isPending);
  const bills = rows.filter((r) => needsBill(r, today));
  const todo = [...pending.sort(byDateTime), ...bills.sort(byDateTime)];
  const todayRows = rows
    .filter((r) => r.reservation_date === today && r.status !== "annulée")
    .sort(byDateTime);
  /* Déjà listées dans « À faire » : pas de doublon dans la journée. */
  const todayRest = todayRows.filter((r) => !needsAction(r, today));
  const covers = todayRows.reduce((n, r) => n + r.party_size, 0);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextArrival = todayRows.find((r) => {
    if (!r.reservation_time || r.arrived_at || r.status === "no-show") return false;
    const [h, m] = r.reservation_time.split(":").map(Number);
    return h * 60 + m >= nowMinutes;
  });
  const upcoming = rows
    .filter((r) => r.reservation_date > today && r.status !== "annulée")
    .sort(byDateTime);

  const copyReviewLink = async (r: Reservation) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/avis/${r.id}`);
      notify(t("Lien d'avis copié : envoyez-le au client.", "Review link copied: send it to the guest."));
    } catch {
      notify(t("Le lien n'a pas pu être copié.", "The link couldn't be copied."), "error");
    }
  };
  const actions = {
    setStatus,
    checkIn,
    saveBill,
    assignTable,
    copyReviewLink,
    openReview: () => {},
  };

  const dateLabel = now.toLocaleDateString(intl, { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader
        eyebrow={venueName ?? undefined}
        title={t("Aujourd'hui", "Today")}
        description={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
        actions={
          <LinkButton href="/dashboard/reservations" icon={CalendarDays}>
            {t("Toutes les réservations", "All reservations")}
          </LinkButton>
        }
      />

      <KpiGrid
        items={[
          {
            label: t("À confirmer", "To confirm"),
            value: pending.length,
            icon: Inbox,
            tone: pending.length > 0 ? "amber" : "default",
            href: "/dashboard/reservations?vue=a-traiter",
          },
          {
            label: isActivityVenue ? t("Réservations du jour", "Today's bookings") : t("Ce jour", "Today"),
            value: todayRows.length,
            icon: CalendarDays,
            hint:
              t(`${covers} pers.`, `${covers} ${covers === 1 ? "guest" : "guests"}`) +
              (nextArrival
                ? t(` · prochaine à ${nextArrival.reservation_time}`, ` · next at ${nextArrival.reservation_time}`)
                : ""),
            href: "/dashboard/reservations?vue=aujourdhui",
          },
          {
            label: t("Additions à saisir", "Bills to enter"),
            value: bills.length,
            icon: Receipt,
            tone: bills.length > 0 ? "amber" : "default",
            href: "/dashboard/reservations?vue=a-traiter",
          },
          {
            label: t("Commissions du mois", "Commissions this month"),
            value: money(commissionsOf(rows)),
            icon: Coins,
            href: "/dashboard/commissions",
          },
        ]}
      />

      {unread > 0 && (
        <Link
          href="/dashboard/messages"
          className="flex items-center gap-3 rounded-2xl border border-info/25 bg-info-soft px-5 py-3.5 text-sm text-ink transition-colors hover:border-info/50"
        >
          <MessageSquare size={18} strokeWidth={1.75} className="shrink-0 text-info" aria-hidden />
          <span className="flex-1 font-bold">
            {t(
              `${unread} message${unread > 1 ? "s" : ""} non lu${unread > 1 ? "s" : ""}`,
              `${unread} unread message${unread === 1 ? "" : "s"}`
            )}
          </span>
          <ArrowRight size={16} strokeWidth={2} className="text-info" aria-hidden />
        </Link>
      )}

      <section aria-labelledby="a-faire" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="a-faire" className="text-lg font-bold text-ink">
            {t("À faire maintenant", "To do now")}
          </h2>
          {todo.length > 6 && (
            <Link href="/dashboard/reservations?vue=a-traiter" className="text-[13px] font-bold text-link hover:underline">
              {t(`Tout voir (${todo.length})`, `See all (${todo.length})`)}
            </Link>
          )}
        </div>
        {todo.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              compact
              icon={CheckCircle2}
              title={t("Tout est à jour", "All caught up")}
              description={t(
                "Aucune demande à confirmer, aucune addition à saisir.",
                "No request to confirm, no bill to enter."
              )}
            />
          </Card>
        ) : (
          <ul className="space-y-3">
            {todo.slice(0, 6).map((r) => (
              <ReservationRow key={r.id} r={r} busy={Boolean(busy[r.id])} tables={[]} actions={actions} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="journee" className="space-y-3">
        <h2 id="journee" className="text-lg font-bold text-ink">
          {t("Le reste de la journée", "The rest of the day")}
        </h2>
        {todayRest.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              compact
              icon={CalendarDays}
              title={
                todayRows.length === 0
                  ? t("Aucune réservation aujourd'hui", "No reservations today")
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
          <ul className="space-y-3">
            {todayRest.map((r) => (
              <ReservationRow key={r.id} r={r} busy={Boolean(busy[r.id])} tables={[]} actions={actions} />
            ))}
          </ul>
        )}
      </section>

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
