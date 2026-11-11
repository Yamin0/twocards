"use client";

import { Suspense } from "react";
import { CalendarDays, Clock, Coins, Download, Info, QrCode, Users } from "lucide-react";
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
import { ReservationDrawer } from "@/components/hotel/reservation-drawer";
import { ReservationRow } from "@/components/hotel/reservation-row";
import { HotelLoadError, commissionRule, loadFailed } from "@/components/hotel/states";
import { useAuthUser } from "@/hooks/use-auth-user";
import { CATEGORIES, commissionRates, isLive, reservationCategoryLabel } from "@/lib/hotel/analytics";
import { exportReservationsCsv } from "@/lib/hotel/exports";
import { formatDate, formatMad, formatNumber, plural, relativeDay } from "@/lib/hotel/format";
import { useHotelSpace } from "@/lib/hotel/store";
import {
  useReservationFilters,
  type CategoryFilter,
  type Period,
  type StatusFilter,
} from "@/lib/hotel/use-reservation-filters";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";

export default function HotelReservationsPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis={4} rows={8} />}>
      <ReservationsContent />
    </Suspense>
  );
}

function ReservationsContent() {
  const t = useT();
  const locale = useLocale();
  const { isLoading: authLoading } = useAuthUser();
  const { reservations, qrCodes, isLoading, failed, reload } = useHotelSpace();
  const f = useReservationFilters(reservations);

  if (authLoading || isLoading) return <PageSkeleton kpis={4} rows={8} />;

  const header = (
    <PageHeader
      title={t("Réservations", "Reservations")}
      description={t(
        "Chaque demande passée depuis un QR code, en temps réel. L'établissement confirme avec le client ; vous suivez le statut, le montant dépensé et votre commission.",
        "Every request made from a QR code, in real time. The venue confirms with the guest; you track the status, the amount spent and your commission."
      )}
      actions={
        <Button
          icon={Download}
          onClick={() => exportReservationsCsv(f.filtered, t, locale)}
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
        <HotelLoadError onRetry={reload} />
      </>
    );

  const count = (s: StatusFilter) =>
    s === "toutes" ? reservations.length : reservations.filter((r) => r.status === s).length;
  const todays = reservations.filter((r) => r.reservation_date === f.today && isLive(r)).length;
  const upcoming = reservations.filter((r) => r.reservation_date > f.today && isLive(r)).length;

  return (
    <>
      {header}

      <KpiGrid
        items={[
          {
            label: t("Aujourd'hui", "Today"),
            value: formatNumber(todays, locale),
            hint: t(`${upcoming} à venir`, `${upcoming} upcoming`),
            icon: Clock,
            tone: "sky",
          },
          {
            label: t("En attente", "Pending"),
            value: formatNumber(count("en attente"), locale),
            hint: t("de confirmation", "confirmation"),
            icon: CalendarDays,
            tone: "amber",
          },
          {
            label: t("Confirmées", "Confirmed"),
            value: formatNumber(count("confirmée"), locale),
            hint: t(`${reservations.length} au total`, `${reservations.length} in total`),
            icon: Users,
            tone: "emerald",
          },
          {
            label: t("Commissions", "Commissions"),
            value: formatMad(
              reservations.filter(isLive).reduce((s, r) => s + r.commission, 0),
              true,
              locale
            ),
            hint: t("cumulées", "all-time"),
            icon: Coins,
            tone: "violet",
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
              placeholder={t("Client, téléphone, sortie, chambre…", "Guest, phone, outing, room…")}
              className="w-full sm:w-64"
            />
            <Select<CategoryFilter>
              label={t("Catégorie", "Category")}
              value={f.category}
              onChange={f.setCategory}
              className="w-full sm:w-48"
              options={[
                { value: "toutes", label: t("Toutes catégories", "All categories") },
                ...CATEGORIES.map((c) => ({ value: c, label: reservationCategoryLabel(c, locale) })),
              ]}
            />
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

      {f.filtered.length === 0 ? (
        <Card padded={false}>
          {reservations.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title={t("Aucune réservation pour le moment", "No reservations yet")}
              description={t(
                "Dès qu'un client scanne un de vos QR codes et réserve, la demande apparaît ici avec sa chambre d'origine.",
                "As soon as a guest scans one of your QR codes and books, the request appears here with the room it came from."
              )}
              action={
                <LinkButton href="/hotel/chambres" variant="primary" icon={QrCode}>
                  {t("Mes QR codes", "My QR codes")}
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
      ) : (
        <div className="space-y-5">
          {f.groups.map((g) => (
            <section key={g.date}>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 px-1">
                <h2 className={cn("text-sm font-bold", g.date === f.today ? "text-link" : "text-ink")}>
                  {relativeDay(g.date, undefined, locale)}
                </h2>
                <span className="text-xs text-ink-3">
                  {g.date !== f.today && `${formatDate(g.date, "long", locale)} · `}
                  {g.rows.length}{" "}
                  {t(plural(g.rows.length, "réservation"), plural(g.rows.length, "reservation", undefined, "en"))}
                </span>
              </div>
              <Card padded={false} as="div">
                <ul className="divide-y divide-line">
                  {g.rows.map((r) => (
                    <li key={r.id}>
                      <ReservationRow r={r} onOpen={() => f.setOpenId(r.id)} avatar details />
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}

      <InfoNote icon={Info}>
        {t(
          "La confirmation se fait entre le client et l'établissement. Le statut et le montant dépensé sont renseignés par l'établissement (ou sa caisse). Votre commission se calcule dès que le montant est connu : ",
          "Confirmation happens between the guest and the venue. The status and amount spent are entered by the venue (or its till). Your commission is calculated as soon as the amount is known: "
        )}
        {commissionRule(commissionRates(reservations), locale)}.
      </InfoNote>

      <ReservationDrawer reservation={f.open} onClose={() => f.setOpenId(null)} />
    </>
  );
}
