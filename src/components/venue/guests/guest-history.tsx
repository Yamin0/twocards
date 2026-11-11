"use client";

import { Clock, Users } from "lucide-react";
import type { VenueQrReservation } from "@/hooks/use-venue-qr-reservations";
import { Card, StatusPill, Table, Tag, Td, Th, Tr } from "@/components/app/ui";
import { RatingStars } from "@/components/shared/mini-charts";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";
import { fmtGuestDate, fmtGuestTime, sourceLabel } from "@/lib/venue/guests";

/* Les trois blocs de la fiche client : visites passées, réservations à
   venir, notes laissées avec les réservations. */

export function VisitHistory({ history }: { history: VenueQrReservation[] }) {
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  return (
    <Card title={t("Historique des visites", "Visit history")} padded={false} className="xl:col-span-2">
      {history.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-ink-3 sm:px-6">
          {t(
            "Pas encore de visite : la première réservation de ce client est à venir.",
            "No past visits yet: this guest's first reservation is still to come."
          )}
        </p>
      ) : (
        <Table stack>
          <thead>
            <tr>
              <Th>{t("Date", "Date")}</Th>
              <Th>{t("Heure", "Time")}</Th>
              <Th align="right">{t("Couverts", "Covers")}</Th>
              <Th align="right">{t("Montant", "Amount")}</Th>
              <Th>{t("Statut", "Status")}</Th>
              <Th>{t("Canal", "Channel")}</Th>
              <Th>{t("Avis", "Review")}</Th>
            </tr>
          </thead>
          <tbody>
            {history.map((r) => (
              <Tr key={r.id}>
                <Td head className="whitespace-nowrap">
                  {fmtGuestDate(r.reservation_date, locale)}
                </Td>
                <Td label={t("Heure", "Time")} muted className="num whitespace-nowrap">
                  {fmtGuestTime(r.reservation_time, locale)}
                </Td>
                <Td label={t("Couverts", "Covers")} align="right" muted className="num">
                  {r.party_size}
                </Td>
                <Td label={t("Montant", "Amount")} align="right" className="num whitespace-nowrap">
                  {r.amount_spent !== null ? `${r.amount_spent.toLocaleString(intl)} MAD` : "—"}
                </Td>
                <Td label={t("Statut", "Status")}>
                  <StatusPill status={r.status} />
                </Td>
                <Td label={t("Canal", "Channel")}>
                  <Tag className="whitespace-nowrap">{sourceLabel(r.source, t)}</Tag>
                </Td>
                <Td label={t("Avis", "Review")} className="md:min-w-[9rem]">
                  {r.rating !== null ? (
                    <div>
                      <RatingStars value={r.rating} size={12} />
                      <span className="sr-only">{t(`${r.rating} sur 5`, `${r.rating} out of 5`)}</span>
                      {r.rating_comment && (
                        <p className="mt-1 max-w-[16rem] text-xs leading-snug text-ink-3">
                          {t(`« ${r.rating_comment} »`, `“${r.rating_comment}”`)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-ink-3">—</span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

export function UpcomingReservations({ upcoming }: { upcoming: VenueQrReservation[] }) {
  const t = useT();
  const locale = useLocale();
  return (
    <Card title={t("Réservations à venir", "Upcoming reservations")}>
      {upcoming.length === 0 ? (
        <p className="text-sm text-ink-3">
          {t("Aucune réservation à venir.", "No upcoming reservations.")}
        </p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-fill p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{fmtGuestDate(r.reservation_date, locale)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-3">
                  <span className="num inline-flex items-center gap-1">
                    <Clock size={12} strokeWidth={1.75} aria-hidden />
                    {fmtGuestTime(r.reservation_time, locale)}
                  </span>
                  <span className="num inline-flex items-center gap-1">
                    <Users size={12} strokeWidth={1.75} aria-hidden />
                    {r.party_size} {t("pers.", "guests")}
                  </span>
                  <span>{sourceLabel(r.source, t)}</span>
                </div>
              </div>
              <StatusPill status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function GuestNotes({ notes }: { notes: VenueQrReservation[] }) {
  const t = useT();
  const locale = useLocale();
  return (
    <Card title={t("Notes du client", "Guest notes")}>
      {notes.length === 0 ? (
        <p className="text-sm text-ink-3">
          {t(
            "Ce client n'a laissé aucune note avec ses réservations.",
            "This guest hasn't left any notes with their reservations."
          )}
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((r) => (
            <li key={r.id} className="rounded-xl bg-fill p-3">
              <p className="mb-1 text-xs text-ink-3">{fmtGuestDate(r.reservation_date, locale)}</p>
              <p className="text-sm leading-relaxed text-ink-2">{r.notes}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
