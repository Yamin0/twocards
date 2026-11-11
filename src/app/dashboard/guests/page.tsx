"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarPlus, Download, SearchX, Users } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useVenueQrReservations } from "@/hooks/use-venue-qr-reservations";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  KpiGrid,
  LinkButton,
  PageHeader,
  PageSkeleton,
  SearchInput,
  Segmented,
} from "@/components/app/ui";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";
import { SEGMENTS, buildGuests, normalizePhone, segmentLabel } from "@/lib/venue/guests";
import { GuestsTable } from "@/components/venue/guests/guests-table";
import { exportGuestsCsv } from "@/components/venue/guests/export-guests";

/* Clients de l'établissement, recalculés à partir des réservations
   réelles (règles dans lib/venue/guests) : aucune donnée de démonstration. */

type SortField = "derniereVisite" | "visites" | "depense";
type SegmentFilter = "tous" | (typeof SEGMENTS)[number];

export default function GuestsPage() {
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  const { isLoading: authLoading } = useAuthUser();
  const { reservations, isLoading, error, reload } = useVenueQrReservations();
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>("tous");
  const [sortField, setSortField] = useState<SortField>("derniereVisite");
  const [sortAsc, setSortAsc] = useState(false);

  const guests = useMemo(() => buildGuests(reservations ?? []), [reservations]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const qPhone = normalizePhone(searchQuery.trim());
    const result = guests.filter((g) => {
      if (segmentFilter !== "tous" && !g.segments.includes(segmentFilter)) return false;
      if (!q) return true;
      return g.name.toLowerCase().includes(q) || (qPhone.length > 0 && g.phone.includes(qPhone));
    });
    const dir = sortAsc ? 1 : -1;
    return [...result].sort((a, b) => {
      if (sortField === "visites") return (a.visits - b.visits) * dir;
      if (sortField === "depense") return (a.totalSpent - b.totalSpent) * dir;
      /* Dernière visite : les clients sans visite passent toujours en fin. */
      if (a.lastVisit === null && b.lastVisit === null) return 0;
      if (a.lastVisit === null) return 1;
      if (b.lastVisit === null) return -1;
      return a.lastVisit < b.lastVisit ? -dir : a.lastVisit > b.lastVisit ? dir : 0;
    });
  }, [guests, searchQuery, segmentFilter, sortField, sortAsc]);

  const header = (
    <PageHeader
      title={t("Clients", "Guests")}
      description={t(
        "Votre fichier clients se construit tout seul : chaque réservation crée ou complète une fiche.",
        "Your guest list builds itself: every reservation creates or updates a profile."
      )}
      actions={
        <>
          <LinkButton href="/dashboard/reservations" icon={CalendarPlus}>
            {t("Réservations", "Reservations")}
          </LinkButton>
          {filtered.length > 0 && (
            <Button
              variant="primary"
              icon={Download}
              onClick={() => exportGuestsCsv(filtered, locale)}
            >
              {t("Exporter en CSV", "Export CSV")}
            </Button>
          )}
        </>
      }
    />
  );

  if (error)
    return (
      <div className="space-y-6">
        {header}
        <Card padded={false}>
          <ErrorState onRetry={reload} />
        </Card>
      </div>
    );
  if (authLoading || isLoading || reservations === null) return <PageSkeleton />;

  /* Indicateurs calculés sur les réservations réelles. */
  const now = new Date();
  const newThisMonth = guests.filter((g) => {
    const d = new Date(g.firstSeen);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const allRated = reservations.filter((r) => r.rating !== null);
  const globalRating =
    allRated.length > 0
      ? allRated.reduce((s, r) => s + (r.rating ?? 0), 0) / allRated.length
      : null;
  const visited = guests.filter((g) => g.visits >= 1);
  const returning = guests.filter((g) => g.visits >= 2);
  const returnRate =
    visited.length > 0 ? Math.round((returning.length / visited.length) * 100) : null;

  const sortLabel = (field: SortField, label: string) =>
    sortField === field ? (
      <>
        {label}
        {sortAsc ? (
          <ArrowUp size={14} strokeWidth={2} aria-hidden />
        ) : (
          <ArrowDown size={14} strokeWidth={2} aria-hidden />
        )}
        <span className="sr-only">{sortAsc ? t("croissant", "ascending") : t("décroissant", "descending")}</span>
      </>
    ) : (
      label
    );

  return (
    <div className="space-y-6">
      {header}

      <KpiGrid
        items={[
          { label: t("Clients uniques", "Unique guests"), value: guests.length },
          { label: t("Nouveaux ce mois", "New this month"), value: newThisMonth },
          {
            label: t("Note moyenne", "Average rating"),
            value:
              globalRating !== null
                ? globalRating.toLocaleString(intl, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })
                : "—",
            hint:
              allRated.length > 0
                ? t(
                    `${allRated.length} avis`,
                    `${allRated.length} review${allRated.length === 1 ? "" : "s"}`
                  )
                : t("aucun avis pour le moment", "no reviews yet"),
          },
          {
            label: t("Clients qui reviennent", "Returning guests"),
            value: returnRate !== null ? t(`${returnRate} %`, `${returnRate}%`) : "—",
            hint:
              visited.length > 0
                ? t(
                    `${returning.length} sur ${visited.length} clients venus`,
                    `${returning.length} of ${visited.length} guests who visited`
                  )
                : undefined,
          },
        ]}
      />

      {guests.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={Users}
            title={t("Aucun client pour le moment", "No guests yet")}
            description={t(
              "Dès qu'une réservation arrive, par un QR du réseau ou par votre portail, le client apparaît ici avec ses visites, ses dépenses et ses avis.",
              "As soon as a reservation comes in, through a network QR or your portal, the guest appears here with their visits, spend and reviews."
            )}
            action={
              <LinkButton href="/dashboard/reservations" icon={CalendarPlus}>
                {t("Voir les réservations", "View reservations")}
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("Nom ou téléphone", "Name or phone")}
            label={t("Rechercher un client", "Search guests")}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented<SegmentFilter>
              label={t("Segment", "Segment")}
              value={segmentFilter}
              /* Un second clic sur le segment actif revient à « Tous ». */
              onChange={(v) => setSegmentFilter(v === segmentFilter ? "tous" : v)}
              options={[
                { value: "tous", label: t("Tous", "All"), count: guests.length },
                ...SEGMENTS.map((s) => ({
                  value: s,
                  label: segmentLabel(s, t),
                  count: guests.filter((g) => g.segments.includes(s)).length,
                })),
              ]}
            />
            <Segmented<SortField>
              label={t("Trier par", "Sort by")}
              size="sm"
              value={sortField}
              /* Un second clic sur le tri actif inverse le sens. */
              onChange={(v) => {
                if (v === sortField) setSortAsc((asc) => !asc);
                else {
                  setSortField(v);
                  setSortAsc(false);
                }
              }}
              options={[
                {
                  value: "derniereVisite",
                  label: sortLabel("derniereVisite", t("Dernière visite", "Last visit")),
                },
                { value: "visites", label: sortLabel("visites", t("Visites", "Visits")) },
                { value: "depense", label: sortLabel("depense", t("Dépense", "Spend")) },
              ]}
            />
          </div>

          <Card padded={false}>
            {filtered.length === 0 ? (
              <EmptyState
                compact
                icon={SearchX}
                title={t("Aucun client ne correspond", "No guests match")}
                action={
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setSegmentFilter("tous");
                    }}
                  >
                    {t("Effacer les filtres", "Clear filters")}
                  </Button>
                }
              />
            ) : (
              <GuestsTable guests={filtered} />
            )}
          </Card>

          <p className="max-w-3xl text-xs leading-relaxed text-ink-3">
            {t(
              "Segments calculés sur vos réservations : « Nouveau » = 1 visite, « Habitué » = 3 visites ou plus, « À risque » = habitué sans visite depuis 60 jours, « VIP » = les 10 % qui ont le plus dépensé.",
              "Segments are based on your reservations: “New” = 1 visit, “Regular” = 3 or more visits, “At risk” = a regular with no visit in 60 days, “VIP” = top 10% by total spend."
            )}
          </p>
        </>
      )}
    </div>
  );
}
