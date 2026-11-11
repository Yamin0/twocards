"use client";

import { Suspense } from "react";
import { CalendarDays, Clock, Coins, Download, Info, Link2, Receipt } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  InfoNote,
  KpiGrid,
  LinkButton,
  PageHeader,
  PageSkeleton,
  SearchInput,
  Segmented,
  Select,
  statusLabel,
} from "@/components/app/ui";
import { ReservationsTable, StageTracker } from "@/components/concierge/reservation-tracking";
import { ConciergeLoadError } from "@/components/concierge/states";
import { ReservationDrawer } from "@/components/hotel/reservation-drawer";
import { commissionRule, loadFailed } from "@/components/hotel/states";
import { useConciergeSpace } from "@/lib/concierge/space";
import { useConciergeReservationFilters } from "@/lib/concierge/use-reservation-filters";
import { commissionRates, hasCommission, isLive } from "@/lib/hotel/analytics";
import { exportReservationsCsv } from "@/lib/hotel/exports";
import { formatMad, formatNumber, plural } from "@/lib/hotel/format";
import type { Period, StatusFilter } from "@/lib/hotel/use-reservation-filters";
import { useLocale, useT } from "@/lib/i18n/client";

export default function ConciergeReservationsPage() {
  /* useSearchParams exige une frontière Suspense au prérendu. */
  return (
    <Suspense fallback={<PageSkeleton kpis={4} rows={8} />}>
      <ReservationsContent />
    </Suspense>
  );
}

const ALL_LINKS = "tous";

/* Réservations du concierge, suivies de la demande à la commission : le
   statut et l'addition sont renseignés par l'établissement, la commission
   en découle. Filtres, recherche et fiche ouverte vivent dans l'URL
   (?statut=, ?periode=, ?lien=, ?q=, ?id=). */
function ReservationsContent() {
  const t = useT();
  const locale = useLocale();
  const { reservations, qrCodes, isLoading, failed, reload } = useConciergeSpace();
  const f = useConciergeReservationFilters(reservations);

  if (isLoading) return <PageSkeleton kpis={4} rows={8} />;

  const linkLabel = t("Lien", "Link");
  const header = (
    <PageHeader
      title={t("Réservations", "Reservations")}
      description={t(
        "Chaque demande passée par vos liens, en temps réel. L'établissement confirme avec votre client puis saisit l'addition ; votre commission en découle.",
        "Every request made through your links, in real time. The venue confirms with your guest, then enters the bill; your commission follows from it."
      )}
      actions={
        <Button
          icon={Download}
          onClick={() => exportReservationsCsv(f.filtered, t, locale, linkLabel)}
          disabled={f.filtered.length === 0}
        >
          {t("Exporter", "Export")} ({f.filtered.length})
        </Button>
      }
    />
  );

  if (loadFailed(failed, reservations, qrCodes))
    return (
      <>
        {header}
        <ConciergeLoadError onRetry={reload} />
      </>
    );

  const count = (s: StatusFilter) =>
    s === "toutes" ? reservations.length : reservations.filter((r) => r.status === s).length;
  const live = reservations.filter(isLive);
  const todays = live.filter((r) => r.reservation_date === f.today).length;
  const upcoming = live.filter((r) => r.reservation_date > f.today).length;
  const awaitingBill = live.filter((r) => r.amount_spent === null && r.reservation_date < f.today).length;
  const earned = reservations.filter(hasCommission);

  return (
    <>
      {header}

      <KpiGrid
        items={[
          {
            label: t("En attente", "Pending"),
            value: formatNumber(count("en attente"), locale),
            hint: t("de confirmation par l'établissement", "confirmation by the venue"),
            icon: CalendarDays,
            tone: "amber",
          },
          {
            label: t("Aujourd'hui", "Today"),
            value: formatNumber(todays, locale),
            hint: t(`${upcoming} à venir`, `${upcoming} upcoming`),
            icon: Clock,
            tone: "sky",
          },
          {
            label: t("Addition attendue", "Bill awaited"),
            value: formatNumber(awaitingBill, locale),
            hint: t(
              `${plural(awaitingBill, "sortie passée", "sorties passées")} sans montant saisi`,
              `past ${plural(awaitingBill, "outing", undefined, "en")} with no amount entered`
            ),
            icon: Receipt,
            tone: "violet",
          },
          {
            label: t("Commissions", "Commissions"),
            value: formatMad(
              earned.reduce((s, r) => s + r.commission, 0),
              true,
              locale
            ),
            hint: t(
              `sur ${earned.length} ${plural(earned.length, "addition saisie", "additions saisies")}`,
              `from ${earned.length} ${plural(earned.length, "bill", undefined, "en")} entered`
            ),
            icon: Coins,
            tone: "emerald",
          },
        ]}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented<StatusFilter>
            label={t("Statut", "Status")}
            value={f.status}
            onChange={f.setStatus}
            options={[
              { value: "toutes", label: t("Toutes", "All"), count: count("toutes") },
              { value: "en attente", label: t("En attente", "Pending"), count: count("en attente") },
              { value: "confirmée", label: t("Confirmées", "Confirmed"), count: count("confirmée") },
              { value: "annulée", label: t("Annulées", "Cancelled"), count: count("annulée") },
              { value: "no-show", label: statusLabel("no-show", locale), count: count("no-show") },
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              value={f.search}
              onChange={f.setSearch}
              placeholder={t("Client, téléphone, établissement…", "Guest, phone, venue…")}
              className="w-full sm:w-64"
            />
            {qrCodes.length > 1 && (
              <Select
                label={linkLabel}
                value={f.linkId && qrCodes.some((q) => q.id === f.linkId) ? f.linkId : ALL_LINKS}
                onChange={(v) => f.setLinkId(v === ALL_LINKS ? null : v)}
                className="w-full sm:w-48"
                options={[
                  { value: ALL_LINKS, label: t("Tous les liens", "All links") },
                  ...qrCodes.map((q) => ({ value: q.id, label: q.label })),
                ]}
              />
            )}
          </div>
        </div>
        <Segmented<Period>
          size="sm"
          label={t("Période", "Period")}
          value={f.period}
          onChange={f.setPeriod}
          className="self-start"
          options={[
            { value: "aujourdhui", label: t("Aujourd'hui", "Today") },
            { value: "avenir", label: t("À venir", "Upcoming") },
            { value: "7j", label: t("± 7 jours", "± 7 days") },
            { value: "30j", label: t("± 30 jours", "± 30 days") },
            { value: "tout", label: t("Tout l'historique", "Full history") },
          ]}
        />
      </div>

      <Card padded={false} as="div">
        {f.filtered.length > 0 ? (
          <ReservationsTable
            rows={f.filtered}
            today={f.today}
            showLink={qrCodes.length > 1}
            onOpen={f.setOpenId}
          />
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={Link2}
            title={t("Aucune réservation pour le moment", "No reservations yet")}
            description={t(
              "Dès qu'un client réserve depuis l'un de vos liens ou de vos QR, la demande apparaît ici.",
              "As soon as a guest books through one of your links or QR codes, the request appears here."
            )}
            action={
              <LinkButton href={qrCodes.length > 0 ? "/concierge/liens" : "/concierge"} variant="primary" icon={Link2}>
                {qrCodes.length > 0 ? t("Mes liens", "My links") : t("Créer mon lien", "Create my link")}
              </LinkButton>
            }
          />
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={t("Aucune réservation ne correspond", "No reservations match")}
            description={t(
              "Essayez un autre statut, une autre période ou une autre recherche.",
              "Try another status, period or search."
            )}
            action={<Button onClick={f.reset}>{t("Réinitialiser les filtres", "Reset filters")}</Button>}
          />
        )}
      </Card>

      <InfoNote icon={Info}>
        {t(
          "La confirmation se fait entre votre client et l'établissement. Le statut et l'addition sont renseignés par l'établissement (ou sa caisse). Votre commission se calcule dès que l'addition est connue : ",
          "Confirmation happens between your guest and the venue. The status and the bill are entered by the venue (or its till). Your commission is calculated as soon as the bill is known: "
        )}
        {commissionRule(commissionRates(reservations), locale)}.
      </InfoNote>

      <ReservationDrawer
        reservation={f.open}
        onClose={() => f.setOpenId(null)}
        qrHref={() => "/concierge/liens"}
        labels={{
          location: linkLabel,
          viewLocation: t("Voir mes liens", "View my links"),
          deleted: t("Lien supprimé", "Deleted link"),
        }}
        extra={f.open ? <StageTracker r={f.open} /> : null}
      />
    </>
  );
}
