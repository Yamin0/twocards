"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Coins, Inbox, Plus, Receipt, SearchX } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InfoNote,
  KpiGrid,
  PageHeader,
  PageSkeleton,
  SearchInput,
  Segmented,
  useNotify,
} from "@/components/app/ui";
import { NewReservationModal, ReviewModal } from "@/components/venue/reservations/reservation-dialogs";
import { ReservationRow, type VenueTable } from "@/components/venue/reservations/reservation-row";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useVenueReservations } from "@/hooks/use-venue-reservations";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import {
  RESERVATION_VIEWS,
  byDateTime,
  commissionsOf,
  inView,
  isPending,
  matchesQuery,
  needsAction,
  needsBill,
  todayIso,
  type Reservation,
  type ReservationView,
} from "@/lib/venue/reservations";

/* Réservations de l'établissement : tous les canaux (QR d'hôtel, portail
   direct, prises au téléphone) dans une liste, avec les gestes du service
   sur chaque ligne. La vue et la recherche vivent dans l'URL
   (`?vue=aujourdhui&q=…`) : elles survivent au rechargement et se
   partagent entre deux postes. */

function ReservationsScreen() {
  const t = useT();
  const intl = useIntlLocale();
  const notify = useNotify();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { isLoading: authLoading, isActivityVenue } = useAuthUser();
  const { rows, isLoading, error, reload, busy, setStatus, checkIn, saveBill, assignTable, create } =
    useVenueReservations();
  const [tables, setTables] = useState<VenueTable[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [review, setReview] = useState<Reservation | null>(null);

  /* Tables du plan de salle (restaurants et clubs seulement). */
  useEffect(() => {
    if (authLoading || isActivityVenue) return;
    let cancelled = false;
    createClient()
      .from("venue_tables")
      .select("id, label, vip")
      .order("label", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setTables((data as VenueTable[] | null) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isActivityVenue]);

  const today = todayIso();
  const toTreat = useMemo(() => rows.filter((r) => needsAction(r, today)).length, [rows, today]);
  const rawView = params.get("vue");
  /* Sans choix explicite : ce qui attend une action, sinon la journée. */
  const view: ReservationView = RESERVATION_VIEWS.includes(rawView as ReservationView)
    ? (rawView as ReservationView)
    : toTreat > 0
      ? "a-traiter"
      : "aujourdhui";
  const query = params.get("q") ?? "";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const counts = useMemo(() => {
    const c = {} as Record<ReservationView, number>;
    for (const v of RESERVATION_VIEWS) c[v] = rows.filter((r) => inView(r, v, today)).length;
    return c;
  }, [rows, today]);

  const list = useMemo(() => {
    const out = rows.filter((r) => inView(r, view, today) && matchesQuery(r, query));
    out.sort(byDateTime);
    /* Le passé se lit du plus récent au plus ancien. */
    if (view === "passees" || view === "toutes") out.reverse();
    return out;
  }, [rows, view, query, today]);

  if (authLoading || isLoading) return <PageSkeleton kpis={4} rows={6} />;
  if (error)
    return (
      <Card padded={false}>
        <ErrorState onRetry={reload} />
      </Card>
    );

  const money = (n: number) => `${Math.round(n).toLocaleString(intl)} MAD`;
  const pending = rows.filter(isPending).length;
  const bills = rows.filter((r) => needsBill(r, today)).length;
  const todayRows = rows.filter((r) => r.reservation_date === today && r.status !== "annulée");
  const covers = todayRows.reduce((n, r) => n + r.party_size, 0);

  const viewLabels: Record<ReservationView, string> = {
    "a-traiter": t("À traiter", "To do"),
    aujourdhui: t("Aujourd'hui", "Today"),
    "a-venir": t("À venir", "Upcoming"),
    passees: t("Passées", "Past"),
    toutes: t("Toutes", "All"),
  };

  const copyReviewLink = async (r: Reservation) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/avis/${r.id}`);
      notify(t("Lien d'avis copié : envoyez-le au client.", "Review link copied: send it to the guest."));
    } catch {
      notify(t("Le lien n'a pas pu être copié.", "The link couldn't be copied."), "error");
    }
  };

  return (
    <>
      <PageHeader
        title={t("Réservations", "Reservations")}
        description={t(
          "QR des hôtels, portail direct et réservations prises par vous.",
          "Hotel QR codes, direct portal and bookings you took yourself."
        )}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowNew(true)}>
            {t("Nouvelle réservation", "New reservation")}
          </Button>
        }
      />

      <KpiGrid
        items={[
          {
            label: t("À confirmer", "To confirm"),
            value: pending,
            icon: Inbox,
            tone: pending > 0 ? "amber" : "default",
            href: `${pathname}?vue=a-traiter`,
          },
          {
            label: t("Aujourd'hui", "Today"),
            value: todayRows.length,
            icon: CalendarDays,
            hint: t(`${covers} pers.`, `${covers} ${covers === 1 ? "guest" : "guests"}`),
            href: `${pathname}?vue=aujourdhui`,
          },
          {
            label: t("Additions à saisir", "Bills to enter"),
            value: bills,
            icon: Receipt,
            tone: bills > 0 ? "amber" : "default",
            href: `${pathname}?vue=a-traiter`,
          },
          {
            label: t("Commissions du mois", "Commissions this month"),
            value: money(commissionsOf(rows)),
            icon: Coins,
            href: "/dashboard/commissions",
          },
        ]}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          label={t("Période", "Period")}
          value={view}
          onChange={(v) => setParam("vue", v)}
          options={RESERVATION_VIEWS.map((v) => ({ value: v, label: viewLabels[v], count: counts[v] }))}
        />
        <SearchInput
          value={query}
          onChange={(v) => setParam("q", v || null)}
          placeholder={t("Nom ou téléphone", "Name or phone")}
          className="lg:w-72"
        />
      </div>

      {view === "a-traiter" && bills > 0 && (
        <InfoNote tone="amber">
          {t(
            "L'addition saisie sert à calculer la commission de l'hôtel. Sans elle, la sortie reste ouverte.",
            "The bill you enter is used to work out the hotel's commission. Without it, the outing stays open."
          )}
        </InfoNote>
      )}

      {list.length === 0 ? (
        <Card padded={false}>
          {query ? (
            <EmptyState
              icon={SearchX}
              title={t("Aucun résultat", "No results")}
              description={t(`Rien ne correspond à « ${query} » dans cette vue.`, `Nothing matches “${query}” in this view.`)}
              action={<Button onClick={() => setParam("q", null)}>{t("Effacer la recherche", "Clear search")}</Button>}
            />
          ) : view === "a-traiter" ? (
            <EmptyState
              icon={Inbox}
              title={t("Rien à traiter", "Nothing to do")}
              description={t(
                "Aucune demande à confirmer, aucune addition à saisir.",
                "No request to confirm, no bill to enter."
              )}
              action={<Button onClick={() => setParam("vue", "aujourdhui")}>{t("Voir aujourd'hui", "See today")}</Button>}
            />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title={
                view === "aujourdhui"
                  ? t("Aucune réservation aujourd'hui", "No reservations today")
                  : t("Aucune réservation ici", "No reservations here")
              }
              description={t(
                "Les demandes des hôtels et du portail arrivent ici d'elles-mêmes.",
                "Requests from hotels and the portal land here on their own."
              )}
              action={
                <Button variant="primary" icon={Plus} onClick={() => setShowNew(true)}>
                  {t("Nouvelle réservation", "New reservation")}
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <ul className="space-y-3" aria-label={viewLabels[view]}>
          {list.map((r) => (
            <ReservationRow
              key={r.id}
              r={r}
              busy={Boolean(busy[r.id])}
              tables={tables}
              actions={{ setStatus, checkIn, saveBill, assignTable, copyReviewLink, openReview: setReview }}
            />
          ))}
        </ul>
      )}

      <NewReservationModal open={showNew} onClose={() => setShowNew(false)} tables={tables} onCreate={create} />
      <ReviewModal review={review} onClose={() => setReview(null)} />
    </>
  );
}

export default function VenueReservationsPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis={4} rows={6} />}>
      <ReservationsScreen />
    </Suspense>
  );
}
