"use client";

import { Copy, Eye, MapPin, Pencil, Trash2 } from "lucide-react";
import { Badge, Card, IconButton, Table, Td, Th, Tr } from "@/components/app/ui";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { EventCover } from "./event-cover";
import { FillBar, type EventActions } from "./event-card";
import {
  STATUS_TONE,
  eventStatusLabel,
  fillPercent,
  formatEventDate,
  type DisplayEvent,
} from "./event-lib";

/* Vue liste. Sous 768 px, chaque ligne se replie en carte. Les colonnes
   de chiffres disent ce qu'elles comptent : toutes les réservations du
   jour de l'événement. */
export function EventsList({ events, actions }: { events: DisplayEvent[]; actions: EventActions }) {
  const t = useT();
  const intl = useIntlLocale();
  const labels = {
    when: t("Date et heure", "Date and time"),
    fill: t("Places prises ce jour-là", "Spots taken that day"),
    bookings: t("Réservations ce jour-là", "Bookings that day"),
    revenue: t("CA ce jour-là", "Revenue that day"),
    status: t("Statut", "Status"),
  };

  return (
    <Card padded={false}>
      <Table stack>
        <thead>
          <tr>
            <Th>{t("Événement", "Event")}</Th>
            <Th>{labels.when}</Th>
            <Th>{labels.fill}</Th>
            <Th align="right">{labels.bookings}</Th>
            <Th align="right">{labels.revenue}</Th>
            <Th>{labels.status}</Th>
            <Th align="right">{t("Actions", "Actions")}</Th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const percent = fillPercent(event);
            return (
              <Tr key={event.id}>
                <Td head>
                  <div className="flex min-w-0 items-center gap-3">
                    <EventCover
                      coverImage={event.coverImage}
                      gradient={event.gradient}
                      iconIdx={event.iconIdx}
                      muted={event.closed}
                      iconSize={20}
                      compact
                      sizes="40px"
                      className="h-10 w-10 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => actions.onView(event.id)}
                        className="block max-w-full truncate rounded-md text-left text-sm font-bold text-ink hover:text-link"
                      >
                        {event.title}
                      </button>
                      {event.venue && (
                        <p className="flex items-center gap-1 text-xs text-ink-3">
                          <MapPin size={11} strokeWidth={1.75} aria-hidden />
                          <span className="truncate">{event.venue}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td label={labels.when} muted className="whitespace-nowrap">
                  <span className="block">
                    {formatEventDate(event.dateObj, intl) || t("Date à fixer", "Date to be set")}
                  </span>
                  {event.time && <span className="num block text-xs text-ink-3">{event.time}</span>}
                </Td>
                <Td label={labels.fill}>
                  <div className="flex items-center gap-2 md:min-w-[9rem]">
                    <FillBar event={event} className="min-w-[4rem] flex-1" />
                    <span className="num whitespace-nowrap text-xs text-ink-2">
                      {event.totalSpots - event.spots}/{event.totalSpots} · {t(`${percent} %`, `${percent}%`)}
                    </span>
                  </div>
                </Td>
                <Td label={labels.bookings} align="right" className="num">
                  {event.reservations}
                </Td>
                <Td label={labels.revenue} align="right" className="num whitespace-nowrap">
                  {event.revenue}
                </Td>
                <Td label={labels.status}>
                  <Badge tone={STATUS_TONE[event.status]}>{eventStatusLabel(event.status, t)}</Badge>
                </Td>
                <Td actions align="right">
                  <div className="flex items-center justify-end gap-0.5">
                    <IconButton
                      icon={Eye}
                      label={t(`Voir « ${event.title} »`, `View “${event.title}”`)}
                      onClick={() => actions.onView(event.id)}
                    />
                    <IconButton
                      icon={Pencil}
                      label={t(`Modifier « ${event.title} »`, `Edit “${event.title}”`)}
                      onClick={() => actions.onEdit(event.id)}
                    />
                    <IconButton
                      icon={Copy}
                      label={t(`Dupliquer « ${event.title} »`, `Duplicate “${event.title}”`)}
                      onClick={() => actions.onDuplicate(event.id)}
                    />
                    <IconButton
                      icon={Trash2}
                      tone="danger"
                      label={t(`Supprimer « ${event.title} »`, `Delete “${event.title}”`)}
                      onClick={() => actions.onDelete(event.id)}
                    />
                  </div>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
}
