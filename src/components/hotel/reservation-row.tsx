"use client";

import Link from "next/link";
import { NameAvatar, StatusPill } from "@/components/app/ui";
import { RatingStars } from "@/components/hotel/charts";
import { reservationCategoryLabel } from "@/lib/hotel/analytics";
import { formatDate, formatMad } from "@/lib/hotel/format";
import type { HotelReservation } from "@/lib/hotel/store";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";

const ROW =
  "flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-fill sm:gap-4 sm:px-6";

/* Une réservation en ligne de liste : l'heure, le client et sa sortie, la
   chambre d'origine, le statut. Sert à l'accueil (lien vers la fiche) et à
   la page Réservations (ouvre le tiroir). */
export function ReservationRow({
  r,
  href,
  onOpen,
  day,
  avatar = false,
  details = false,
}: {
  r: HotelReservation;
  href?: string;
  onOpen?: () => void;
  /** Affiche la date au-dessus de l'heure : « Auj. » pour le jour même. */
  day?: { today: string };
  avatar?: boolean;
  /** Avis, commission et heure d'arrivée, sur écran large. */
  details?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  const party = `${r.party_size} ${t("pers.", r.party_size === 1 ? "guest" : "guests")}`;

  const body = (
    <>
      <span className="num flex w-14 shrink-0 flex-col items-center rounded-lg border border-line bg-fill px-1 py-1.5">
        {day && (
          <span className="text-xs text-ink-3">
            {r.reservation_date === day.today
              ? t("Auj.", "Today")
              : formatDate(r.reservation_date, "short", locale)}
          </span>
        )}
        <span className="text-sm font-bold text-ink">{r.reservation_time ?? "—"}</span>
      </span>
      {avatar && <NameAvatar name={r.guest_name} size={36} className="hidden sm:inline-flex" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">
          {r.guest_name}
          <span className="font-normal text-ink-2"> · {r.venue_name}</span>
        </span>
        <span className="block truncate text-xs text-ink-3">
          {reservationCategoryLabel(r.category, locale)} · {party}
          {r.qr_label ? ` · ${r.qr_label}` : ""}
          {r.notes ? t(" · avec précisions", " · with notes") : ""}
        </span>
      </span>
      {details && r.rating !== null && (
        <RatingStars value={r.rating} size={12} className="hidden md:inline-flex" />
      )}
      {details && r.commission > 0 && (
        <span className="num hidden shrink-0 text-xs font-bold text-ok sm:inline">
          +{formatMad(r.commission, false, locale)}
        </span>
      )}
      {details && r.arrived_at && (
        <span className="num hidden shrink-0 rounded-md bg-ok-soft px-1.5 py-0.5 text-xs font-bold text-ok lg:inline">
          {t("Arrivé", "Arrived")}{" "}
          {new Date(r.arrived_at).toLocaleTimeString(intl, { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
      <StatusPill status={r.status} className="shrink-0" />
    </>
  );

  if (href)
    return (
      <Link href={href} className={ROW}>
        {body}
      </Link>
    );
  return (
    <button type="button" onClick={onOpen} className={ROW}>
      {body}
    </button>
  );
}
