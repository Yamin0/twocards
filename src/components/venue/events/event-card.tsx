"use client";

import { Clock, Copy, Eye, MapPin, Pencil, Trash2 } from "lucide-react";
import { Badge, Button, Card, IconButton, Tag } from "@/components/app/ui";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { EventCover } from "./event-cover";
import {
  STATUS_TONE,
  eventStatusLabel,
  fillBarClass,
  fillPercent,
  formatEventDate,
  type DisplayEvent,
} from "./event-lib";

export type EventActions = {
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
};

/** Barre de remplissage : part des places prises par les réservations du jour. */
export function FillBar({ event, className }: { event: DisplayEvent; className?: string }) {
  const t = useT();
  const percent = fillPercent(event);
  return (
    <div
      role="img"
      aria-label={t(`Remplissage : ${percent} %`, `Fill rate: ${percent}%`)}
      className={className}
    >
      <div className="h-1.5 overflow-hidden rounded-full bg-fill-2">
        <div className={`h-full rounded-full ${fillBarClass(percent)}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/* Carte de la vue grille. Les compteurs portent sur toutes les
   réservations du jour de l'événement : ils sont libellés ainsi. */
export function EventCard({ event, actions }: { event: DisplayEvent; actions: EventActions }) {
  const t = useT();
  const intl = useIntlLocale();
  const percent = fillPercent(event);
  const dated = Boolean(event.dateObj);
  const taken = event.totalSpots - event.spots;

  return (
    <Card as="article" padded={false} className="flex flex-col">
      <div className="cursor-pointer" onClick={() => actions.onView(event.id)}>
        <EventCover
          coverImage={event.coverImage}
          gradient={event.gradient}
          iconIdx={event.iconIdx}
          muted={event.closed}
          className="h-32"
        >
          <Badge tone={STATUS_TONE[event.status]} className="absolute right-3 top-3 shadow-sm">
            {eventStatusLabel(event.status, t)}
          </Badge>
          {event.genre.length > 0 && (
            <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
              {event.genre.map((g) => (
                <Tag key={g} className="bg-panel text-ink shadow-sm">
                  {g}
                </Tag>
              ))}
            </div>
          )}
        </EventCover>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink">
            <button
              type="button"
              onClick={() => actions.onView(event.id)}
              className="max-w-full truncate rounded-md text-left hover:text-link"
            >
              {event.title}
            </button>
          </h3>
          {event.venue && (
            <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-3">
              <MapPin size={13} strokeWidth={1.75} aria-hidden />
              <span className="truncate">{event.venue}</span>
            </p>
          )}
        </div>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-ink-2">
          <Clock size={13} strokeWidth={1.75} className="text-ink-3" aria-hidden />
          <span>{formatEventDate(event.dateObj, intl) || t("Date à fixer", "Date to be set")}</span>
          {event.time && (
            <>
              <span className="text-ink-4" aria-hidden>
                ·
              </span>
              <span className="num">{event.time}</span>
            </>
          )}
        </p>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-ink-3">
              {dated ? t("Places prises ce jour-là", "Spots taken that day") : t("Places prises", "Spots taken")}
            </span>
            <span className="num font-bold text-ink-2">
              {taken}/{event.totalSpots} · {t(`${percent} %`, `${percent}%`)}
            </span>
          </div>
          <FillBar event={event} />
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-fill px-3 py-2.5">
            <dt className="text-xs text-ink-3">
              {dated ? t("Réservations ce jour-là", "Bookings that day") : t("Réservations", "Bookings")}
            </dt>
            <dd className="num mt-0.5 text-sm font-bold text-ink">{event.reservations}</dd>
          </div>
          <div className="rounded-xl bg-fill px-3 py-2.5">
            <dt className="text-xs text-ink-3">
              {dated ? t("CA ce jour-là", "Revenue that day") : t("CA", "Revenue")}
            </dt>
            <dd className="num mt-0.5 truncate text-sm font-bold text-ink">{event.revenue}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button size="sm" icon={Eye} className="flex-1" onClick={() => actions.onView(event.id)}>
            {t("Voir", "View")}
          </Button>
          <Button size="sm" icon={Pencil} className="flex-1" onClick={() => actions.onEdit(event.id)}>
            {t("Modifier", "Edit")}
          </Button>
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
      </div>
    </Card>
  );
}
