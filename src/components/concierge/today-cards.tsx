"use client";

import { ArrowRight, CalendarDays, Clock, Inbox } from "lucide-react";
import { Card, EmptyState, LinkButton } from "@/components/app/ui";
import { ReservationRow } from "@/components/hotel/reservation-row";
import { plural, relativeDay } from "@/lib/hotel/format";
import type { HotelReservation } from "@/lib/hotel/store";
import { useT } from "@/lib/i18n/client";

const PENDING_SHOWN = 4;
const UPCOMING_SHOWN = 5;
const detail = (id: string) => `/concierge/reservations?id=${id}`;

/* Les demandes que l'établissement n'a pas encore confirmées. Le concierge
   ne confirme pas lui-même : il peut appeler ou écrire à son client depuis
   la fiche. Rien ne s'affiche quand il n'y en a pas. */
export function PendingCard({ pending, today }: { pending: HotelReservation[]; today: string }) {
  const t = useT();
  if (pending.length === 0) return null;
  const n = pending.length;
  const more = n - PENDING_SHOWN;
  return (
    <Card
      className="border-warn/40"
      padded={false}
      title={
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warn-soft">
            <Inbox size={16} strokeWidth={1.75} className="text-warn" aria-hidden />
          </span>
          {t(
            `${n} ${plural(n, "demande")} en attente de confirmation`,
            `${n} ${plural(n, "request", undefined, "en")} awaiting confirmation`
          )}
        </span>
      }
      description={t(
        "L'établissement confirme directement avec votre client. Ouvrez une demande pour l'appeler ou lui écrire.",
        "The venue confirms directly with your guest. Open a request to call or message them."
      )}
      actions={
        <LinkButton href="/concierge/reservations?statut=attente" size="sm" variant="primary" icon={ArrowRight}>
          {t("Tout voir", "View all")}
        </LinkButton>
      }
    >
      <ul className="divide-y divide-line border-t border-line">
        {pending.slice(0, PENDING_SHOWN).map((r) => (
          <li key={r.id}>
            <ReservationRow r={r} href={detail(r.id)} day={{ today }} />
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p className="border-t border-line px-5 py-3 text-[13px] text-ink-3 sm:px-6">
          {t(
            `Et ${more} ${plural(more, "autre demande", "autres demandes")}.`,
            `And ${more} more ${plural(more, "request", undefined, "en")}.`
          )}
        </p>
      )}
    </Card>
  );
}

/* Les sorties du jour, puis les prochaines. Chaque ligne ouvre la fiche. */
export function OutingsCard({
  todays,
  upcoming,
  today,
}: {
  todays: HotelReservation[];
  upcoming: HotelReservation[];
  today: string;
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
          <LinkButton href="/concierge/reservations?periode=aujourdhui" size="sm" variant="ghost">
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
                : t(
                    "Les réservations passées par votre lien ou votre QR apparaissent ici.",
                    "Reservations made through your link or QR code appear here."
                  )
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {todays.map((r) => (
            <li key={r.id}>
              <ReservationRow r={r} href={detail(r.id)} />
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
            <LinkButton href="/concierge/reservations?periode=avenir" size="sm" variant="ghost">
              {t("Tout voir", "View all")}
            </LinkButton>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {upcoming.slice(0, UPCOMING_SHOWN).map((r) => (
              <li key={r.id}>
                <ReservationRow r={r} href={detail(r.id)} day={{ today }} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
