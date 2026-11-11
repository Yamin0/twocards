"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, EmptyState, StatusPill, Table, Td, Th, Tr } from "@/components/app/ui";
import { RatingStars } from "@/components/hotel/charts";
import { reservationCategoryLabel } from "@/lib/hotel/analytics";
import { formatDate, formatMad, plural, whatsappLink } from "@/lib/hotel/format";
import type { HotelReservation } from "@/lib/hotel/store";
import { useLocale, useT } from "@/lib/i18n/client";

/* Réservations passées par un QR : le nom ouvre la fiche, le téléphone
   ouvre WhatsApp. Sous 768 px, chaque ligne se replie en carte. */
export function QrReservationsTable({ rows, qrLabel }: { rows: HotelReservation[]; qrLabel: string }) {
  const t = useT();
  const locale = useLocale();
  return (
    <Card
      title={t("Réservations de cet emplacement", "Reservations for this location")}
      description={
        rows.length > 0
          ? t(
              `${rows.length} ${plural(rows.length, "demande")} depuis la création`,
              `${rows.length} ${plural(rows.length, "request", undefined, "en")} since it was created`
            )
          : undefined
      }
      padded={false}
    >
      {rows.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarDays}
          title={t("Aucune réservation via ce QR", "No reservations via this QR")}
          description={t(
            `Dès qu'un client scanne « ${qrLabel} » et demande une réservation, elle apparaît ici avec sa commission.`,
            `As soon as a guest scans “${qrLabel}” and requests a reservation, it appears here with its commission.`
          )}
        />
      ) : (
        <Table stack>
          <thead>
            <tr>
              <Th>{t("Client", "Guest")}</Th>
              <Th>{t("Sortie", "Outing")}</Th>
              <Th>{t("Date", "Date")}</Th>
              <Th align="right">{t("Personnes", "Guests")}</Th>
              <Th>{t("Statut", "Status")}</Th>
              <Th>{t("Avis", "Review")}</Th>
              <Th align="right">{t("Montant", "Amount")}</Th>
              <Th align="right">{t("Commission", "Commission")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td head>
                  <Link href={`/hotel/reservations?id=${r.id}`} className="font-bold text-ink hover:underline">
                    {r.guest_name}
                  </Link>
                  <p>
                    <a
                      href={whatsappLink(r.guest_phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="num text-xs text-ink-3 hover:text-link hover:underline"
                    >
                      {r.guest_phone}
                    </a>
                  </p>
                </Td>
                <Td label={t("Sortie", "Outing")}>
                  <div>
                    <p className="font-bold">{r.venue_name}</p>
                    <p className="text-xs text-ink-3">{reservationCategoryLabel(r.category, locale)}</p>
                  </div>
                </Td>
                <Td label={t("Date", "Date")} muted className="num whitespace-nowrap">
                  {formatDate(r.reservation_date, undefined, locale)}
                  {r.reservation_time ? ` · ${r.reservation_time}` : ""}
                </Td>
                <Td label={t("Personnes", "Guests")} align="right" muted className="num">
                  {r.party_size}
                </Td>
                <Td label={t("Statut", "Status")}>
                  <StatusPill status={r.status} />
                </Td>
                <Td label={t("Avis", "Review")} muted>
                  {r.rating !== null ? <RatingStars value={r.rating} size={12} /> : "—"}
                </Td>
                <Td label={t("Montant", "Amount")} align="right" muted className="num whitespace-nowrap">
                  {r.amount_spent !== null ? formatMad(r.amount_spent, false, locale) : "—"}
                </Td>
                <Td label={t("Commission", "Commission")} align="right" className="num whitespace-nowrap font-bold">
                  {r.commission > 0 ? formatMad(r.commission, false, locale) : "—"}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
