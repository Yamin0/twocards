"use client";

import { CalendarDays, Clock, Printer, QrCode } from "lucide-react";
import { Card, EmptyState, LinkButton } from "@/components/app/ui";
import { ReservationRow } from "@/components/hotel/reservation-row";
import { plural, relativeDay } from "@/lib/hotel/format";
import type { HotelReservation } from "@/lib/hotel/store";
import { useT } from "@/lib/i18n/client";

const UPCOMING_SHOWN = 5;

/* Les sorties du jour, puis les prochaines. Chaque ligne ouvre la fiche. */
export function OutingsCard({
  todays,
  upcoming,
  today,
  hasQr,
}: {
  todays: HotelReservation[];
  upcoming: HotelReservation[];
  today: string;
  hasQr: boolean;
}) {
  const t = useT();
  const next = upcoming[0];

  return (
    <Card
      padded={false}
      title={t("Sorties du jour", "Today's outings")}
      description={
        todays.length > 0
          ? t(
              `${todays.length} ${plural(todays.length, "réservation")} pour aujourd'hui`,
              `${todays.length} ${plural(todays.length, "reservation", undefined, "en")} for today`
            )
          : undefined
      }
      actions={
        todays.length > 0 && (
          <LinkButton href="/hotel/reservations?periode=aujourdhui" size="sm" variant="ghost">
            {t("Tout voir", "View all")}
          </LinkButton>
        )
      }
    >
      {todays.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState
            compact
            icon={Clock}
            title={t("Aucune sortie aujourd'hui", "No outings today")}
            description={
              next
                ? t(
                    `Prochaine sortie : ${relativeDay(next.reservation_date, undefined, "fr").toLowerCase()}${next.reservation_time ? ` à ${next.reservation_time}` : ""}, ${next.venue_name}.`,
                    `Next outing: ${relativeDay(next.reservation_date, undefined, "en").toLowerCase()}${next.reservation_time ? ` at ${next.reservation_time}` : ""}, ${next.venue_name}.`
                  )
                : hasQr
                  ? t(
                      "Les réservations arrivent quand les cartes sont en chambre et au lobby.",
                      "Reservations come in once the cards are in the rooms and the lobby."
                    )
                  : t(
                      "Créez un QR code par chambre : chaque scan ouvre votre menu de sorties.",
                      "Create one QR code per room: each scan opens your outings menu."
                    )
            }
            action={
              next ? undefined : hasQr ? (
                <LinkButton href="/hotel/chambres/imprimer" icon={Printer}>
                  {t("Imprimer les cartes", "Print the cards")}
                </LinkButton>
              ) : (
                <LinkButton href="/hotel/chambres?nouveau=1" icon={QrCode} variant="primary">
                  {t("Créer un QR code", "Create a QR code")}
                </LinkButton>
              )
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {todays.map((r) => (
            <li key={r.id}>
              <ReservationRow r={r} href={`/hotel/reservations?id=${r.id}`} />
            </li>
          ))}
        </ul>
      )}

      {upcoming.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3 border-t border-line bg-fill px-5 py-2.5 sm:px-6">
            <h3 className="flex items-center gap-2 text-[13px] font-bold text-ink-2">
              <CalendarDays size={15} strokeWidth={1.75} aria-hidden />
              {t(`À venir (${upcoming.length})`, `Upcoming (${upcoming.length})`)}
            </h3>
            <LinkButton href="/hotel/reservations?periode=avenir" size="sm" variant="ghost">
              {t("Tout voir", "View all")}
            </LinkButton>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {upcoming.slice(0, UPCOMING_SHOWN).map((r) => (
              <li key={r.id}>
                <ReservationRow r={r} href={`/hotel/reservations?id=${r.id}`} day={{ today }} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
