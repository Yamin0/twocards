"use client";

import { useId } from "react";
import { Calendar, Clock, Users, type LucideIcon } from "lucide-react";
import { dayChip, isoDay, longDate, shortDate } from "@/lib/booking/dates";
import type { Portal } from "@/lib/booking/load";
import { slotDateTime } from "@/lib/booking/slots";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { PortalBooking } from "../_hooks/use-portal-booking";

/* Les couleurs viennent des variables posées par `portal-experience` :
   l'encre sur l'accent est calculée, jamais supposée blanche. */
const CHOSEN = "border-[var(--portal-accent)] bg-[var(--portal-accent)] text-[var(--portal-on-accent)]";
const CHOICE = "border-neutral-300 text-neutral-800 hover:border-neutral-500";

function Group({ icon: Icon, title, className, children }: { icon: LucideIcon; title: string; className?: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <section role="group" aria-labelledby={id} className={className}>
      <h2 id={id} className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-600">
        <Icon size={13} strokeWidth={2} aria-hidden /> {title}
      </h2>
      {children}
    </section>
  );
}

/* Étape 1 : personnes, date, créneau. */
export function PortalSlots({ booking, portal }: { booking: PortalBooking; portal: Portal }) {
  const t = useT();
  const intl = useIntlLocale();
  const { openSlots, slots, date, time } = booking;
  const now = new Date();
  /* Plus rien à proposer : tout est passé, ou complet. */
  const noSlotLeft = slots.length > 0 && (openSlots.length === 0 || openSlots.every((s) => slotDateTime(date, s) < now));

  return (
    <>
      <Group icon={Users} title={t("Nombre de personnes", "Number of guests")}>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: portal.party_max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => booking.setParty(n)}
              aria-label={t(`${n} personne${n > 1 ? "s" : ""}`, `${n} ${n === 1 ? "guest" : "guests"}`)}
              aria-pressed={booking.party === n}
              className={cn("h-11 w-11 rounded-full border text-base font-medium transition-colors", booking.party === n ? CHOSEN : CHOICE)}
            >
              {n}
            </button>
          ))}
        </div>
      </Group>

      <Group icon={Calendar} title={t("Date", "Date")} className="mt-7">
        <div className="portal-rail -mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 pt-0.5">
          {booking.days.map((d) => {
            const iso = isoDay(d);
            const selected = iso === date;
            const chip = dayChip(d, intl);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => booking.setDate(iso)}
                aria-pressed={selected}
                aria-label={longDate(d, intl)}
                className={cn(
                  "flex min-h-[4.25rem] w-14 shrink-0 flex-col items-center justify-center rounded-xl border py-2 transition-colors",
                  selected ? CHOSEN : CHOICE
                )}
              >
                <span className="text-[11px] uppercase">{chip.weekday}</span>
                <span className="text-lg font-semibold leading-6">{chip.day}</span>
                <span className="text-[11px]">{chip.month}</span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group icon={Clock} title={t("Heure", "Time")} className="mt-7">
        <div className="grid grid-cols-4 gap-2">
          {openSlots.map((s) => {
            const past = slotDateTime(date, s) < now;
            const selected = time === s.label;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => booking.setTime(s.label)}
                disabled={past}
                aria-pressed={selected}
                className={cn(
                  "h-11 rounded-lg border text-sm font-medium transition-colors disabled:cursor-not-allowed",
                  selected ? CHOSEN : past ? "border-neutral-100 text-neutral-400 line-through" : CHOICE
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        {noSlotLeft && (
          <p role="status" className="mt-3 text-center text-sm text-neutral-700">
            {openSlots.length === 0
              ? t("Complet pour cette date, choisissez un autre jour.", "Fully booked on this date, please choose another day.")
              : t(
                  "Plus de créneau disponible pour cette date, choisissez un autre jour.",
                  "No more times available on this date, please choose another day."
                )}
          </p>
        )}
      </Group>

      <button
        type="button"
        onClick={booking.toDetails}
        disabled={!time}
        className="mt-8 min-h-[3.25rem] w-full rounded-xl bg-[var(--portal-accent)] px-4 text-base font-bold text-[var(--portal-on-accent)] transition-opacity disabled:opacity-40"
      >
        {time
          ? t(`Continuer · ${shortDate(booking.selectedDate, intl)} · ${time}`, `Continue · ${shortDate(booking.selectedDate, intl)} · ${time}`)
          : t("Choisissez une heure", "Choose a time")}
      </button>
      <p className="mt-3 text-center text-xs leading-relaxed text-neutral-600">
        {t(
          "Sans prépaiement, l'établissement confirme par téléphone ou WhatsApp.",
          "No prepayment: the venue confirms by phone or WhatsApp."
        )}
      </p>
    </>
  );
}
