"use client";

import { Check } from "lucide-react";
import { Badge, StatusPill, Table, Td, Th, Tr } from "@/components/app/ui";
import { STAGES, stageOf, type Stage } from "@/lib/concierge/space";
import { isLive, reservationCategoryLabel } from "@/lib/hotel/analytics";
import { formatMad, formatRate, relativeDay } from "@/lib/hotel/format";
import type { HotelReservation } from "@/lib/hotel/store";
import { cn } from "@/lib/utils";
import type { Translate } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

const stageLabel = (s: Stage, t: Translate) =>
  s === "demande"
    ? t("Demande", "Request")
    : s === "confirmee"
      ? t("Confirmée", "Confirmed")
      : s === "addition"
        ? t("Addition saisie", "Bill entered")
        : t("Commission", "Commission");

/* Où en est une réservation, de la demande à la commission. Chaque étape
   est lue en base : statut posé par l'établissement, addition saisie par
   lui (ou sa caisse), commission calculée par la base. */
export function StageTracker({ r }: { r: HotelReservation }) {
  const t = useT();
  const reached = stageOf(r);
  if (reached === null)
    return (
      <p className="mt-4 rounded-xl border border-line bg-fill px-4 py-3 text-[13px] leading-relaxed text-ink-2">
        {r.status === "no-show"
          ? t(
              "L'établissement a signalé que le client ne s'est pas présenté : pas de commission.",
              "The venue reported that the guest didn't show up: no commission."
            )
          : t("Réservation annulée : pas de commission.", "Reservation cancelled: no commission.")}
      </p>
    );
  const index = STAGES.indexOf(reached);
  return (
    <ol
      className="mt-4 grid grid-cols-4 gap-1.5"
      aria-label={t("Suivi de la réservation", "Reservation progress")}
    >
      {STAGES.map((s, i) => {
        const done = i <= index;
        return (
          <li
            key={s}
            aria-current={i === index ? "step" : undefined}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2.5 text-center",
              done ? "border-ok/25 bg-ok-soft" : "border-line bg-fill"
            )}
          >
            <span
              className={cn(
                "num flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                done ? "bg-ok text-white" : "bg-fill-3 text-ink-3"
              )}
            >
              {done ? <Check size={13} strokeWidth={2.5} aria-hidden /> : i + 1}
            </span>
            <span className={cn("text-xs leading-tight", done ? "font-bold text-ink" : "text-ink-3")}>
              {stageLabel(s, t)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* Les réservations en tableau : une ligne par demande, avec ce que
   l'établissement a renseigné (statut, addition) et la commission qui en
   découle. Sous 768 px, chaque ligne se replie en carte. Le nom du client
   ouvre la fiche. */
export function ReservationsTable({
  rows,
  today,
  showLink,
  onOpen,
}: {
  rows: HotelReservation[];
  today: string;
  /** Colonne « Lien » : utile dès qu'il y en a plusieurs. */
  showLink: boolean;
  onOpen: (id: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  return (
    <Table stack>
      <thead>
        <tr>
          <Th>{t("Client", "Guest")}</Th>
          <Th>{t("Sortie", "Outing")}</Th>
          <Th>{t("Date", "Date")}</Th>
          {showLink && <Th>{t("Lien", "Link")}</Th>}
          <Th>{t("Statut", "Status")}</Th>
          <Th align="right">{t("Addition", "Bill")}</Th>
          <Th align="right">{t("Commission", "Commission")}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const live = isLive(r);
          return (
            <Tr key={r.id}>
              <Td head>
                <button
                  type="button"
                  onClick={() => onOpen(r.id)}
                  className="text-left font-bold text-ink underline-offset-2 hover:underline"
                >
                  {r.guest_name}
                </button>
                <p className="num text-xs text-ink-3">
                  {r.party_size} {t("pers.", r.party_size === 1 ? "guest" : "guests")}
                </p>
              </Td>
              <Td label={t("Sortie", "Outing")}>
                <p className="font-bold">{r.venue_name}</p>
                <p className="text-xs text-ink-3">{reservationCategoryLabel(r.category, locale)}</p>
              </Td>
              <Td label={t("Date", "Date")} muted className="num whitespace-nowrap first-letter:uppercase">
                {relativeDay(r.reservation_date, undefined, locale)}
                {r.reservation_time ? ` · ${r.reservation_time}` : ""}
              </Td>
              {showLink && (
                <Td label={t("Lien", "Link")} muted>
                  {r.qr_label ?? t("Lien supprimé", "Deleted link")}
                </Td>
              )}
              <Td label={t("Statut", "Status")}>
                <StatusPill status={r.status} />
              </Td>
              <Td label={t("Addition", "Bill")} align="right" className="num whitespace-nowrap" muted>
                {r.amount_spent !== null ? (
                  formatMad(r.amount_spent, false, locale)
                ) : live && r.reservation_date < today ? (
                  <Badge tone="warn">{t("Attendue", "Awaited")}</Badge>
                ) : (
                  "—"
                )}
              </Td>
              <Td label={t("Commission", "Commission")} align="right" className="num whitespace-nowrap">
                {r.amount_spent !== null && live ? (
                  <>
                    <span className="font-bold text-ok">{formatMad(r.commission, false, locale)}</span>
                    <span className="ml-1.5 text-xs text-ink-3">{formatRate(r.commission_rate, locale)}</span>
                  </>
                ) : (
                  "—"
                )}
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
