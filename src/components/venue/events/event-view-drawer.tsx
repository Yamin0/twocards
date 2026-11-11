"use client";

import type { ReactNode } from "react";
import { BarChart3, Clock, Coins, Pencil, Ticket, Users, type LucideIcon } from "lucide-react";
import { Badge, Button, Drawer, InfoNote, Tag } from "@/components/app/ui";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { EventCover } from "./event-cover";
import { FillBar } from "./event-card";
import {
  STATUS_TONE,
  eventStatusLabel,
  fillPercent,
  formatEventDate,
  type DisplayEvent,
} from "./event-lib";

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-fill p-3.5">
      <dt className="mb-1 flex items-center gap-2 text-xs text-ink-3">
        <Icon size={13} strokeWidth={1.75} aria-hidden />
        {label}
      </dt>
      <dd className="text-sm font-bold text-ink">{children}</dd>
    </div>
  );
}

/* Fiche d'un événement, en lecture. Les compteurs portent sur toutes les
   réservations non annulées du jour : la note du bas le dit. */
export function EventViewDrawer({
  event,
  onClose,
  onEdit,
}: {
  event: DisplayEvent;
  onClose: () => void;
  onEdit: (id: number) => void;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const percent = fillPercent(event);
  const dated = Boolean(event.dateObj);

  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow={t("Événement", "Event")}
      title={event.title}
      footer={
        <Button variant="primary" icon={Pencil} onClick={() => onEdit(event.id)}>
          {t("Modifier", "Edit")}
        </Button>
      }
    >
      <div className="space-y-5">
        <EventCover
          coverImage={event.coverImage}
          gradient={event.gradient}
          iconIdx={event.iconIdx}
          muted={event.closed}
          iconSize={100}
          sizes="460px"
          title={event.title}
          subtitle={event.venue || undefined}
          className="h-40 rounded-2xl"
        >
          <Badge tone={STATUS_TONE[event.status]} className="absolute right-3 top-3 shadow-sm">
            {eventStatusLabel(event.status, t)}
          </Badge>
        </EventCover>

        {event.description && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{event.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-3">
          <Fact icon={Clock} label={t("Date et heure", "Date and time")}>
            {formatEventDate(event.dateObj, intl) || t("Date à fixer", "Date to be set")}
            {event.time && <span className="num block text-xs font-normal text-ink-3">{event.time}</span>}
          </Fact>
          <Fact icon={Users} label={t("Capacité", "Capacity")}>
            <span className="num">{t(`${event.totalSpots} places`, `${event.totalSpots} spots`)}</span>
            <span className="num block text-xs font-normal text-ink-3">
              {dated
                ? t(`${event.spots} libres ce jour-là`, `${event.spots} free that day`)
                : t(`${event.spots} libres`, `${event.spots} free`)}
            </span>
          </Fact>
          <Fact
            icon={Ticket}
            label={dated ? t("Réservations ce jour-là", "Bookings that day") : t("Réservations", "Bookings")}
          >
            <span className="num">{event.reservations}</span>
          </Fact>
          <Fact icon={Coins} label={dated ? t("CA ce jour-là", "Revenue that day") : t("CA", "Revenue")}>
            <span className="num">{event.revenue}</span>
          </Fact>
        </dl>

        <div className="rounded-xl border border-line bg-fill p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs text-ink-3">
              <BarChart3 size={13} strokeWidth={1.75} aria-hidden />
              {dated ? t("Places prises ce jour-là", "Spots taken that day") : t("Places prises", "Spots taken")}
            </span>
            <span className="num text-sm font-bold text-ink">{t(`${percent} %`, `${percent}%`)}</span>
          </div>
          <FillBar event={event} />
          <p className="num mt-1.5 text-xs text-ink-3">
            {t(
              `${event.totalSpots - event.spots} places prises sur ${event.totalSpots}`,
              `${event.totalSpots - event.spots} of ${event.totalSpots} spots taken`
            )}
          </p>
        </div>

        {dated && (
          <InfoNote>
            {t(
              "Ces chiffres comptent toutes les réservations non annulées de ce jour-là : une réservation n'est pas rattachée à un événement précis.",
              "These figures count every non-cancelled reservation that day: a reservation isn't tied to a specific event."
            )}
          </InfoNote>
        )}

        {event.genre.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-ink-3">{t("Genres", "Genres")}</p>
            <div className="flex flex-wrap gap-2">
              {event.genre.map((g) => (
                <Tag key={g}>{g}</Tag>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
