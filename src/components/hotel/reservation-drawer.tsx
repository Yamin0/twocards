"use client";

import type { ReactNode } from "react";
import { MessageCircle, Phone, QrCode, Star } from "lucide-react";
import { Badge, Drawer, LinkButton, StatusPill } from "@/components/app/ui";
import { RatingStars } from "@/components/hotel/charts";
import { isLive, reservationCategoryLabel } from "@/lib/hotel/analytics";
import {
  formatDate,
  formatMad,
  formatRate,
  formatTimestamp,
  relativeDay,
  todayIso,
  whatsappLink,
} from "@/lib/hotel/format";
import type { HotelReservation } from "@/lib/hotel/store";
import { useLocale, useT } from "@/lib/i18n/client";

/* Fiche d'une réservation, en lecture : l'hôtel suit, l'établissement
   confirme et saisit le montant. D'ici, on appelle ou on écrit au client.
   `qrHref`, `labels` et `extra` servent à l'espace concierge (où le QR est
   un « lien ») ; sans eux, la fiche est celle de l'hôtel, inchangée. */
export function ReservationDrawer({
  reservation: r,
  onClose,
  qrHref = (id) => `/hotel/chambres/${id}`,
  labels,
  extra,
}: {
  reservation: HotelReservation | null;
  onClose: () => void;
  /** Adresse de la page du QR d'origine. */
  qrHref?: (qrCodeId: string) => string;
  /** Libellés de l'origine (« Emplacement » par défaut). */
  labels?: { location?: string; viewLocation?: string; deleted?: string };
  /** Bloc inséré sous le statut (suivi d'étapes, par exemple). */
  extra?: ReactNode;
}) {
  const t = useT();
  const locale = useLocale();
  if (!r) return null;
  const rows: { label: string; value: ReactNode }[] = [
    ...(r.venue_name ? [{ label: t("Établissement", "Venue"), value: r.venue_name }] : []),
    {
      label: t("Date", "Date"),
      value: `${relativeDay(r.reservation_date, undefined, locale)}${
        r.reservation_time ? t(` à ${r.reservation_time}`, ` at ${r.reservation_time}`) : ""
      }`,
    },
    { label: t("Personnes", "Guests"), value: `${r.party_size}` },
    { label: t("Catégorie", "Category"), value: reservationCategoryLabel(r.category, locale) },
    {
      label: labels?.location ?? t("Emplacement", "Location"),
      value: r.qr_label ?? labels?.deleted ?? t("QR supprimé", "Deleted QR"),
    },
    { label: t("Reçue le", "Received"), value: formatTimestamp(r.created_at, locale) },
    ...(r.arrived_at
      ? [{ label: t("Arrivée", "Arrival"), value: formatTimestamp(r.arrived_at, locale) }]
      : []),
  ];
  return (
    <Drawer
      open
      onClose={onClose}
      title={r.guest_name}
      footer={
        <>
          <LinkButton href={whatsappLink(r.guest_phone)} external icon={MessageCircle} variant="primary">
            WhatsApp
          </LinkButton>
          <LinkButton href={`tel:${r.guest_phone.replace(/\s/g, "")}`} external icon={Phone}>
            {t("Appeler", "Call")}
          </LinkButton>
          {r.qr_code_id && (
            <LinkButton href={qrHref(r.qr_code_id)} icon={QrCode} variant="ghost" className="sm:ml-auto">
              {labels?.viewLocation ?? t("Voir l'emplacement", "View location")}
            </LinkButton>
          )}
        </>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <StatusPill status={r.status} />
        <span className="num text-sm text-ink-2">{r.guest_phone}</span>
      </div>

      {extra}

      <dl className="mt-5 divide-y divide-line rounded-xl border border-line bg-fill">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-[13px] text-ink-3">{row.label}</dt>
            <dd className="num text-right text-sm font-bold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      {r.notes && (
        <div className="mt-4">
          <h3 className="mb-1.5 text-[13px] font-bold text-ink-2">{t("Précisions du client", "Guest's notes")}</h3>
          <p className="rounded-xl border border-line bg-fill px-4 py-3 text-sm leading-relaxed text-ink">
            “{r.notes}”
          </p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-line bg-fill px-4 py-3">
        <h3 className="mb-2 text-[13px] font-bold text-ink-2">{t("Commission", "Commission")}</h3>
        {r.amount_spent !== null ? (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="num font-display text-2xl text-ink">{formatMad(r.commission, false, locale)}</p>
              <p className="num mt-1 text-xs text-ink-3">
                {t(
                  `${formatRate(r.commission_rate, "fr")} de ${formatMad(r.amount_spent)} dépensés`,
                  `${formatRate(r.commission_rate, "en")} of ${formatMad(r.amount_spent, false, "en")} spent`
                )}
                {r.amount_source === "pos"
                  ? t(" · montant remonté par la caisse", " · amount reported by the till")
                  : ""}
              </p>
            </div>
            <Badge tone={isLive(r) ? "ok" : "neutral"}>
              {isLive(r) ? t("Acquise", "Earned") : t("Annulée", "Cancelled")}
            </Badge>
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-ink-2">
            {isLive(r)
              ? t(
                  "Le montant dépensé n'est pas encore renseigné : la commission se calculera automatiquement après la sortie.",
                  "The amount spent hasn't been entered yet: the commission will be calculated automatically after the outing."
                )
              : t(
                  "Aucune commission : réservation annulée ou client absent.",
                  "No commission: reservation cancelled or guest didn't show."
                )}
          </p>
        )}
      </div>

      {r.rating !== null && (
        <div className="mt-4">
          <h3 className="mb-1.5 text-[13px] font-bold text-ink-2">{t("Avis du client", "Guest review")}</h3>
          <div className="rounded-xl border border-line bg-fill px-4 py-3">
            <div className="flex items-center gap-2">
              <RatingStars value={r.rating} size={14} />
              <span className="num text-sm font-bold text-ink">{r.rating}/5</span>
              {r.rated_at && (
                <span className="text-xs text-ink-3">
                  · {formatDate(r.rated_at.slice(0, 10), "medium", locale)}
                </span>
              )}
            </div>
            {r.rating_comment && (
              <p className="mt-2 text-sm leading-relaxed text-ink-2">“{r.rating_comment}”</p>
            )}
          </div>
        </div>
      )}
      {r.rating === null && isLive(r) && r.reservation_date < todayIso() && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-ink-3">
          <Star size={14} strokeWidth={1.5} aria-hidden />
          {t("Pas encore d'avis pour cette sortie.", "No review for this outing yet.")}
        </p>
      )}
    </Drawer>
  );
}
