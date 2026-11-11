"use client";

import { use, useMemo } from "react";
import { MessageCircle, Phone, UserX } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useVenueQrReservations } from "@/hooks/use-venue-qr-reservations";
import {
  Card,
  EmptyState,
  ErrorState,
  KpiGrid,
  LinkButton,
  NameAvatar,
  PageHeader,
  PageSkeleton,
} from "@/components/app/ui";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import {
  computeSegments,
  isCancelled,
  isUpcoming,
  isVisit,
  localToday,
  normalizePhone,
} from "@/lib/venue/guests";
import { SegmentBadges } from "@/components/venue/guests/segment-badges";
import {
  GuestNotes,
  UpcomingReservations,
  VisitHistory,
} from "@/components/venue/guests/guest-history";

/* Fiche client dérivée des réservations : l'identifiant de la route est le
   téléphone normalisé (encodeURIComponent), la fiche agrège toutes les
   réservations de ce numéro — la RLS limite déjà aux réservations de
   l'établissement connecté. Mêmes règles que la liste (lib/venue/guests). */

export default function GuestProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const phone = normalizePhone(decodeURIComponent(id));
  const t = useT();
  const intl = useIntlLocale();

  const { isLoading: authLoading } = useAuthUser();
  const { reservations, isLoading, error, reload } = useVenueQrReservations();

  const rows = useMemo(
    () => (reservations ?? []).filter((r) => normalizePhone(r.guest_phone ?? "") === phone),
    [reservations, phone]
  );
  const segments = useMemo(() => computeSegments(reservations ?? [], phone), [reservations, phone]);

  const back = { href: "/dashboard/guests", label: t("Clients", "Guests") };

  if (error)
    return (
      <div className="space-y-6">
        <PageHeader back={back} title={t("Fiche client", "Guest profile")} />
        <Card padded={false}>
          <ErrorState onRetry={reload} />
        </Card>
      </div>
    );
  if (authLoading || isLoading || reservations === null) return <PageSkeleton />;

  /* Client introuvable : aucune réservation ne porte ce numéro. */
  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader back={back} title={t("Client introuvable", "Guest not found")} />
        <Card padded={false}>
          <EmptyState
            icon={UserX}
            title={t("Aucune réservation à ce numéro", "No reservation under this number")}
            description={t(
              "La fiche a peut-être été ouverte depuis un ancien lien.",
              "The profile may have been opened from an old link."
            )}
            action={
              <LinkButton href="/dashboard/guests">{t("Voir les clients", "View guests")}</LinkButton>
            }
          />
        </Card>
      </div>
    );
  }

  const today = localToday();
  const name = rows.reduce((a, b) => (a.created_at >= b.created_at ? a : b)).guest_name;
  const visits = rows.filter((r) => isVisit(r, today));
  const spentRows = rows.filter((r) => !isCancelled(r) && r.amount_spent !== null);
  const totalSpent = spentRows.reduce((s, r) => s + (r.amount_spent ?? 0), 0);
  const rated = rows.filter((r) => r.rating !== null);
  const avgRating =
    rated.length > 0 ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : null;

  const upcoming = rows
    .filter((r) => isUpcoming(r, today))
    .sort((a, b) => (a.reservation_date < b.reservation_date ? -1 : 1));
  const history = rows
    .filter((r) => !isUpcoming(r, today))
    .sort((a, b) =>
      a.reservation_date === b.reservation_date
        ? a.created_at < b.created_at
          ? 1
          : -1
        : a.reservation_date < b.reservation_date
          ? 1
          : -1
    );
  const notes = rows
    .filter((r) => r.notes && r.notes.trim().length > 0)
    .sort((a, b) => (a.reservation_date < b.reservation_date ? 1 : -1));

  return (
    <div className="space-y-6">
      <PageHeader
        back={back}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <NameAvatar name={name} size={44} />
            {name}
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="num inline-flex items-center gap-1.5">
              <Phone size={13} strokeWidth={1.75} aria-hidden />
              {phone}
            </span>
            {segments.length > 0 && <SegmentBadges segments={segments} />}
          </span>
        }
        actions={
          <LinkButton
            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
            external
            variant="success"
            icon={MessageCircle}
          >
            {t("Écrire sur WhatsApp", "Message on WhatsApp")}
          </LinkButton>
        }
      />

      <KpiGrid
        items={[
          { label: t("Visites", "Visits"), value: visits.length },
          {
            label: t("Total dépensé", "Total spent"),
            value: totalSpent > 0 ? `${totalSpent.toLocaleString(intl)} MAD` : "—",
          },
          {
            label: t("Panier moyen", "Average spend"),
            value:
              spentRows.length > 0
                ? `${Math.round(totalSpent / spentRows.length).toLocaleString(intl)} MAD`
                : "—",
          },
          {
            label: t("Note moyenne", "Average rating"),
            value:
              avgRating !== null
                ? avgRating.toLocaleString(intl, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })
                : "—",
            hint:
              rated.length > 0
                ? t(`${rated.length} avis`, `${rated.length} review${rated.length === 1 ? "" : "s"}`)
                : t("aucun avis", "no reviews"),
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <VisitHistory history={history} />
        <div className="space-y-6">
          <UpcomingReservations upcoming={upcoming} />
          <GuestNotes notes={notes} />
        </div>
      </div>
    </div>
  );
}
